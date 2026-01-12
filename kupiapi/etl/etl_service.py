"""
BudgetBites ETL Service
Služba pro automatické stahování a ukládání slev potravinových produktů
"""

import asyncio
import logging
import os
import sys
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional
import json
import time
import traceback

import asyncpg
import aiohttp
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import psutil

# Logging konfigurace
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('/app/logs/etl.log')
    ]
)
logger = logging.getLogger('budgetbites-etl')

# Konfigurace
DB_HOST = os.getenv('DB_HOST', 'postgres-avm-budgetbites')
DB_PORT = int(os.getenv('DB_PORT', 5432))
DB_NAME = os.getenv('DB_NAME', 'budgetbites')
DB_USER = os.getenv('DB_USER', 'admin')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'password')

FASTAPI_URL = os.getenv('FASTAPI_URL', 'http://kupiapi-bridge:8000')
MAX_RETRIES = int(os.getenv('MAX_RETRIES', 3))
RETRY_DELAY = int(os.getenv('RETRY_DELAY', 60))  # sekund

# Podporované potravinové kategorie (pro referenci)
FOOD_CATEGORIES = [
    'maso',     # Maso, uzeniny a ryby
    'mlecne',   # Mléčné výrobky  
    'ovoce',    # Ovoce
    'zelenina', # Zelenina
    'napoje',   # Nápoje
    'alkohol',  # Alkohol
    'pecivo',   # Pečivo
    'sladkosti',# Sladkosti
    'mrazene'   # Mražené produkty
]

# Podporované obchody
SHOPS = ['lidl', 'kaufland', 'albert', 'billa', 'penny', 'globus']

class ETLService:
    def __init__(self):
        self.db_pool = None
        self.session = None
        
    async def init_db(self):
        """Inicializace databázového připojení"""
        try:
            self.db_pool = await asyncpg.create_pool(
                host=DB_HOST,
                port=DB_PORT,
                database=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD,
                min_size=2,
                max_size=10
            )
            logger.info("✅ Databázové připojení inicializováno")
        except Exception as e:
            logger.error(f"❌ Chyba při inicializaci databáze: {e}")
            raise

    async def init_http(self):
        """Inicializace HTTP session"""
        timeout = aiohttp.ClientTimeout(total=300)  # 5 minut timeout
        self.session = aiohttp.ClientSession(timeout=timeout)
        logger.info("✅ HTTP session inicializována")

    async def close(self):
        """Uzavření připojení"""
        if self.session:
            await self.session.close()
        if self.db_pool:
            await self.db_pool.close()
        logger.info("✅ Připojení uzavřena")

    async def log_etl_process(self, shop: str, category: str, status: str, 
                            message: str = "", products_processed: int = 0,
                            products_added: int = 0, products_updated: int = 0,
                            products_skipped: int = 0, error_details: Dict = None,
                            duration: int = 0, process_start: datetime = None,
                            process_end: datetime = None):
        """Logování ETL procesu do databáze"""
        try:
            async with self.db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO etl_logs 
                    (process_start, process_end, shop_name, category, status, message, 
                     products_processed, products_added, products_updated, products_skipped,
                     error_details, duration_seconds)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                """, process_start or datetime.now(), process_end, shop, category, status, 
                message, products_processed, products_added, products_updated, 
                products_skipped, json.dumps(error_details) if error_details else None, duration)
        except Exception as e:
            logger.error(f"❌ Chyba při logování do DB: {e}")

    async def fetch_shop_discounts(self, shop: str, retries: int = 0) -> List[Dict]:
        """Stažení slev pro obchod s automatickou kategorizací"""
        url = f"{FASTAPI_URL}/v1/discounts/store/{shop}/etl"
        params = {
            'max_pages': 0  # stáhnout vše
        }
        
        try:
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    products = data.get('products', [])
                    logger.info(f"📦 {shop}: Staženo {len(products)} kategorizovaných produktů")
                    return products
                else:
                    error_msg = f"HTTP {response.status}: {await response.text()}"
                    raise Exception(error_msg)
                    
        except Exception as e:
            if retries < MAX_RETRIES:
                logger.warning(f"⚠️ {shop}: Pokus {retries + 1}/{MAX_RETRIES + 1} selhal: {e}")
                await asyncio.sleep(RETRY_DELAY)
                return await self.fetch_shop_discounts(shop, retries + 1)
            else:
                logger.error(f"❌ {shop}: Všechny pokusy selhaly: {e}")
                await self.log_etl_process(shop, "all", 'error', 
                                         f"Fetch failed after {MAX_RETRIES + 1} attempts: {str(e)}",
                                         error_details={'error': str(e), 'traceback': traceback.format_exc()})
                return []

    def calculate_week_number(self, date_obj: date) -> tuple:
        """Vypočítá číslo týdne a rok"""
        isocalendar = date_obj.isocalendar()
        return isocalendar[1], isocalendar[0]  # week, year

    def parse_date(self, date_str: Optional[str]) -> Optional[date]:
        """Parsování data z různých formátů"""
        if not date_str:
            return None
        try:
            return datetime.strptime(date_str, '%Y-%m-%d').date()
        except:
            try:
                return datetime.fromisoformat(date_str).date()
            except:
                return None

    async def save_discounts(self, shop: str, products: List[Dict]) -> tuple:
        """Uložení slev do databáze s deduplicí"""
        added = updated = skipped = 0
        
        try:
            async with self.db_pool.acquire() as conn:
                for product in products:
                    try:
                        # Parsování dat z produktu
                        name = product.get('name', '').strip()
                        if not name:
                            skipped += 1
                            continue
                            
                        price = product.get('price')
                        original_price = product.get('original_price')
                        discount_pct = product.get('discount_percentage')
                        category = product.get('category', 'napoje')  # kategorie z FastAPI
                        unit = product.get('unit', '')
                        valid_from_str = product.get('valid_from')
                        valid_until_str = product.get('valid_until')
                        
                        # Výpočet platnosti
                        valid_from = self.parse_date(valid_from_str)
                        if not valid_from:
                            valid_from = date.today()
                            
                        valid_until = self.parse_date(valid_until_str)
                        if not valid_until:
                            # Fallback - týden od dneška
                            valid_until = date.today() + timedelta(days=7)
                        
                        week_number, year = self.calculate_week_number(valid_from)
                        
                        # Kontrola, zda už existuje lepší nabídka
                        existing = await conn.fetchrow("""
                            SELECT id, price, shop_name FROM discounts 
                            WHERE product_name = $1 AND valid_from <= $2 AND valid_until >= $2
                            ORDER BY price ASC LIMIT 1
                        """, name, valid_from)
                        
                        if existing:
                            existing_price = float(existing['price'])
                            if price and price < existing_price:
                                # Nová cena je lepší - aktualizuj
                                await conn.execute("""
                                    UPDATE discounts SET 
                                        price = $1, original_price = $2, discount_percentage = $3,
                                        shop_name = $4, unit = $5, updated_at = CURRENT_TIMESTAMP
                                    WHERE id = $6
                                """, price, original_price, discount_pct, shop, unit, existing['id'])
                                updated += 1
                                logger.debug(f"🔄 Aktualizován: {name} ({existing_price} → {price})")
                            elif price and price == existing_price and existing['shop_name'] != shop:
                                # Stejná cena, jiný obchod - přidej jako nový záznam
                                await conn.execute("""
                                    INSERT INTO discounts 
                                    (product_name, price, original_price, discount_percentage, 
                                     shop_name, category, unit, valid_from, valid_until, week_number, year)
                                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                                    ON CONFLICT DO NOTHING
                                """, name, price, original_price, discount_pct, shop, category, 
                                unit, valid_from, valid_until, week_number, year)
                                added += 1
                                logger.debug(f"➕ Přidán alternativní obchod: {name} - {shop}")
                            else:
                                skipped += 1
                        else:
                            # Nový produkt
                            await conn.execute("""
                                INSERT INTO discounts 
                                (product_name, price, original_price, discount_percentage, 
                                 shop_name, category, unit, valid_from, valid_until, week_number, year)
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                                ON CONFLICT DO NOTHING
                            """, name, price, original_price, discount_pct, shop, category, 
                            unit, valid_from, valid_until, week_number, year)
                            added += 1
                            logger.debug(f"➕ Nový produkt: {name} - {price}Kč")
                            
                    except Exception as e:
                        logger.error(f"❌ Chyba při ukládání produktu {product.get('name', 'unknown')}: {e}")
                        skipped += 1
                        
        except Exception as e:
            logger.error(f"❌ Chyba při ukládání slev {shop}: {e}")
            raise
            
        return added, updated, skipped

    async def cleanup_old_discounts(self) -> int:
        """Smazání zastaralých slev"""
        try:
            async with self.db_pool.acquire() as conn:
                result = await conn.execute("""
                    DELETE FROM discounts WHERE valid_until < CURRENT_DATE
                """)
                deleted_count = int(result.split()[-1]) if result else 0
                logger.info(f"🗑️ Smazáno {deleted_count} zastaralých slev")
                return deleted_count
        except Exception as e:
            logger.error(f"❌ Chyba při mazání zastaralých slev: {e}")
            return 0

    async def process_shop(self, shop: str) -> Dict[str, int]:
        """Zpracování jednoho obchodu s automatickou kategorizací"""
        start_time = datetime.now()
        
        try:
            # Stažení dat s automatickou kategorizací
            products = await self.fetch_shop_discounts(shop)
            if not products:
                await self.log_etl_process(shop, "all", 'error', 
                                         "No products fetched", 0, 0, 0, 0)
                return {'processed': 0, 'added': 0, 'updated': 0, 'skipped': 0}
            
            # Uložení do databáze
            added, updated, skipped = await self.save_discounts(shop, products)
            processed = len(products)
            
            # Logování úspěchu
            duration = int((datetime.now() - start_time).total_seconds())
            await self.log_etl_process(shop, "all", 'success', 
                                     f"Successfully processed {processed} products",
                                     processed, added, updated, skipped, 
                                     duration=duration, process_start=start_time, 
                                     process_end=datetime.now())
            
            logger.info(f"✅ {shop}: {processed} produktů, +{added} nových, ~{updated} aktualizací, -{skipped} přeskočeno")
            return {'processed': processed, 'added': added, 'updated': updated, 'skipped': skipped}
            
        except Exception as e:
            duration = int((datetime.now() - start_time).total_seconds())
            await self.log_etl_process(shop, "all", 'error', str(e), 
                                     error_details={'error': str(e), 'traceback': traceback.format_exc()},
                                     duration=duration, process_start=start_time, 
                                     process_end=datetime.now())
            logger.error(f"❌ {shop}: {e}")
            return {'processed': 0, 'added': 0, 'updated': 0, 'skipped': 0}

    async def run_full_etl(self):
        """Spuštění kompletního ETL procesu"""
        start_time = datetime.now()
        logger.info("🚀 Spouštím kompletní ETL proces...")
        
        # Statistiky
        total_stats = {'processed': 0, 'added': 0, 'updated': 0, 'skipped': 0}
        
        # Cleanup starých dat
        await self.cleanup_old_discounts()
        
        # Zpracování všech obchodů (s automatickou kategorizací)
        tasks = []
        for shop in SHOPS:
            task = self.process_shop(shop)
            tasks.append(task)
                
        # Spuštění paralelně s omezením
        semaphore = asyncio.Semaphore(3)  # max 3 současné requesty
        
        async def bounded_task(task):
            async with semaphore:
                return await task
        
        results = await asyncio.gather(*[bounded_task(task) for task in tasks], 
                                     return_exceptions=True)
        
        # Sečtení statistik
        for result in results:
            if isinstance(result, dict):
                for key in total_stats:
                    total_stats[key] += result.get(key, 0)
        
        # Finální log
        duration = int((datetime.now() - start_time).total_seconds())
        await self.log_etl_process('ALL', 'ALL', 'success', 
                                 f"Full ETL completed: {total_stats}", 
                                 total_stats['processed'], total_stats['added'], 
                                 total_stats['updated'], total_stats['skipped'],
                                 duration=duration, process_start=start_time, 
                                 process_end=datetime.now())
        
        logger.info(f"✅ ETL dokončen za {duration}s: {total_stats}")
        
        # Zobrazení memory usage
        memory_usage = psutil.Process().memory_info().rss / 1024 / 1024
        logger.info(f"💾 Využití paměti: {memory_usage:.1f} MB")

async def main():
    """Hlavní funkce - spuštění ETL service"""
    etl = ETLService()
    
    try:
        # Inicializace
        await etl.init_db()
        await etl.init_http()
        
        # Scheduler
        scheduler = AsyncIOScheduler()
        
        # Každých 12 hodin (00:00 a 12:00)
        scheduler.add_job(
            etl.run_full_etl,
            CronTrigger(hour='0,12', minute=0),
            id='etl_job',
            name='BudgetBites ETL Job',
            max_instances=1,
            coalesce=True
        )
        
        # Spuštění ihned při startu (pro testování)
        scheduler.add_job(
            etl.run_full_etl,
            'date',
            run_date=datetime.now() + timedelta(seconds=30),  # 30s po startu
            id='initial_run'
        )
        
        scheduler.start()
        logger.info("📅 Scheduler spuštěn - ETL každých 12 hodin (00:00, 12:00)")
        logger.info("🔄 První spuštění za 30 sekund...")
        
        # Udržení procesu naživu
        while True:
            await asyncio.sleep(60)
            # Health check každou minutu
            logger.debug("💓 ETL service běží...")
            
    except KeyboardInterrupt:
        logger.info("⏹️ Zastavování ETL service...")
    except Exception as e:
        logger.error(f"💥 Kritická chyba: {e}")
        raise
    finally:
        await etl.close()

if __name__ == "__main__":
    # Vytvoření logs adresáře
    os.makedirs("/app/logs", exist_ok=True)
    
    # Spuštění
    asyncio.run(main())