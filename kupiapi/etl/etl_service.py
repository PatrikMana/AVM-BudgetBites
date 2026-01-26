"""
BudgetBites ETL Service v3
Služba pro automatické stahování a ukládání slev potravinových produktů z českých obchodů.

Funkce:
- Automatické stahování slev každých 12 hodin (00:00 a 12:00)
- Ukládání pouze potravinových produktů do PostgreSQL (nativní kategorie z kupi.cz)
- Automatické mazání expirovaných slev
- HTTP API pro manuální spuštění ETL

ZMĚNA V3: Nový endpoint /v1/discounts/etl fetchuje podle KATEGORIÍ, ne podle obchodů.
Tím získáme správné nativní kategorie z kupi.cz.
"""

import asyncio
import logging
import os
import sys
from datetime import datetime, timedelta, date
from typing import List, Dict, Optional
import json
import traceback

import asyncpg
import aiohttp
from aiohttp import web
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import psutil

# =============================================================================
# Konfigurace
# =============================================================================

LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_DIR = '/app/logs'

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(f'{LOG_DIR}/etl.log')
    ]
)
logger = logging.getLogger('budgetbites-etl')

# Database config
DB_HOST = os.getenv('DB_HOST', 'budgetbites-postgres')
DB_PORT = int(os.getenv('DB_PORT', 5432))
DB_NAME = os.getenv('DB_NAME', 'budgetbites')
DB_USER = os.getenv('DB_USER', 'admin')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'password')

# FastAPI bridge URL
FASTAPI_URL = os.getenv('FASTAPI_URL', 'http://kupiapi-bridge:8000')

# ETL config
MAX_RETRIES = int(os.getenv('MAX_RETRIES', 3))
RETRY_DELAY = int(os.getenv('RETRY_DELAY', 30))
ETL_INTERVAL_HOURS = int(os.getenv('ETL_INTERVAL_HOURS', 12))
INITIAL_DELAY_SECONDS = int(os.getenv('INITIAL_DELAY_SECONDS', 60))
HTTP_TIMEOUT = int(os.getenv('HTTP_TIMEOUT', 600))  # 10 minut - více kategorií trvá déle
MAX_PAGES_PER_CATEGORY = int(os.getenv('MAX_PAGES_PER_CATEGORY', 3))

# =============================================================================
# ETL Service
# =============================================================================

class ETLService:
    """Hlavní ETL služba pro stahování a ukládání slev."""
    
    def __init__(self):
        self.db_pool: Optional[asyncpg.Pool] = None
        self.session: Optional[aiohttp.ClientSession] = None
        self.is_running = False
        self.last_run: Optional[datetime] = None
        self.stats = {
            'total_runs': 0,
            'successful_runs': 0,
            'failed_runs': 0,
            'total_products_added': 0
        }
        
    async def init(self):
        """Inicializace databáze a HTTP session."""
        await self._init_db()
        await self._init_http()
        
    async def _init_db(self):
        """Inicializace databázového connection poolu."""
        try:
            self.db_pool = await asyncpg.create_pool(
                host=DB_HOST,
                port=DB_PORT,
                database=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD,
                min_size=2,
                max_size=10,
                command_timeout=60
            )
            logger.info("✅ Databázové připojení inicializováno")
        except Exception as e:
            logger.error(f"❌ Chyba při připojení k databázi: {e}")
            raise

    async def _init_http(self):
        """Inicializace HTTP session."""
        timeout = aiohttp.ClientTimeout(total=HTTP_TIMEOUT)
        self.session = aiohttp.ClientSession(timeout=timeout)
        logger.info("✅ HTTP session inicializována")

    async def close(self):
        """Uzavření všech připojení."""
        if self.session:
            await self.session.close()
        if self.db_pool:
            await self.db_pool.close()
        logger.info("✅ Připojení uzavřena")

    # -------------------------------------------------------------------------
    # Logging do databáze
    # -------------------------------------------------------------------------
    
    async def _log_etl(
        self,
        shop: str,
        status: str,
        message: str = "",
        products_processed: int = 0,
        products_added: int = 0,
        products_updated: int = 0,
        products_skipped: int = 0,
        products_deleted: int = 0,
        error_details: Optional[Dict] = None,
        duration: int = 0,
        process_start: Optional[datetime] = None,
        trigger_type: str = 'scheduled'
    ):
        """Zápis ETL logu do databáze."""
        try:
            async with self.db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO etl_logs 
                    (process_start, process_end, shop_name, status, message, 
                     products_processed, products_added, products_updated, 
                     products_skipped, products_deleted, error_details, 
                     duration_seconds, trigger_type)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                """, 
                process_start or datetime.now(),
                datetime.now(),
                shop, 
                status, 
                message,
                products_processed, 
                products_added, 
                products_updated, 
                products_skipped,
                products_deleted,
                json.dumps(error_details) if error_details else None,
                duration,
                trigger_type
                )
        except Exception as e:
            logger.error(f"❌ Chyba při zápisu ETL logu: {e}")

    # -------------------------------------------------------------------------
    # Stahování dat z FastAPI bridge - NOVÝ ZPŮSOB
    # -------------------------------------------------------------------------
    
    async def _fetch_all_discounts(self, retry: int = 0) -> Dict:
        """
        Stáhne slevy z nového endpointu /v1/discounts/etl.
        Tento endpoint fetchuje podle KATEGORIÍ a vrací správné nativní kategorie.
        """
        url = f"{FASTAPI_URL}/v1/discounts/etl"
        params = {'max_pages_per_category': MAX_PAGES_PER_CATEGORY}
        
        try:
            logger.info(f"📥 Stahuji data z {url}...")
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    products = data.get('products', [])
                    categories = data.get('categories_fetched', [])
                    shops = data.get('shops_fetched', [])
                    
                    logger.info(f"📦 Staženo {len(products)} produktů z {len(categories)} kategorií")
                    logger.info(f"🏪 Obchody: {', '.join(shops)}")
                    
                    return {
                        'products': products,
                        'categories_fetched': categories,
                        'shops_fetched': shops
                    }
                else:
                    error = await response.text()
                    raise Exception(f"HTTP {response.status}: {error}")
                    
        except Exception as e:
            if retry < MAX_RETRIES:
                logger.warning(f"⚠️ Pokus {retry + 1}/{MAX_RETRIES} selhal: {e}")
                await asyncio.sleep(RETRY_DELAY)
                return await self._fetch_all_discounts(retry + 1)
            else:
                logger.error(f"❌ Všechny pokusy selhaly: {e}")
                return {'products': [], 'categories_fetched': [], 'shops_fetched': []}

    # -------------------------------------------------------------------------
    # Parsování a validace dat
    # -------------------------------------------------------------------------
    
    @staticmethod
    def _parse_date(date_str: Optional[str]) -> Optional[date]:
        """Parsuje datum z různých formátů."""
        if not date_str:
            return None
        for fmt in ['%Y-%m-%d', '%d.%m.%Y', '%d/%m/%Y']:
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00')).date()
        except:
            return None

    @staticmethod
    def _parse_price(price_val) -> Optional[float]:
        """Parsuje cenu z různých formátů."""
        if price_val is None:
            return None
        if isinstance(price_val, (int, float)):
            return float(price_val)
        if isinstance(price_val, str):
            # Odstranění měny a formátování
            cleaned = price_val.replace('Kč', '').replace(',', '.').strip()
            try:
                return float(cleaned)
            except:
                return None
        return None

    @staticmethod
    def _calculate_week(date_obj: date) -> tuple:
        """Vrátí (week_number, year) pro dané datum."""
        iso = date_obj.isocalendar()
        return iso[1], iso[0]

    # -------------------------------------------------------------------------
    # Ukládání do databáze
    # -------------------------------------------------------------------------
    
    async def _save_discounts(self, products: List[Dict]) -> Dict[str, int]:
        """
        Uloží slevy do databáze s deduplikací.
        Vrací statistiky: added, updated, skipped
        """
        added = updated = skipped = 0
        
        async with self.db_pool.acquire() as conn:
            for product in products:
                try:
                    # Parsování dat
                    name = product.get('name', '').strip()
                    if not name or len(name) < 2:
                        skipped += 1
                        continue
                    
                    price = self._parse_price(product.get('price'))
                    if not price or price <= 0:
                        skipped += 1
                        continue
                    
                    # Obchod
                    shop = product.get('shop_name', '').lower().strip()
                    if not shop:
                        skipped += 1
                        continue
                        
                    # Kategorie z FastAPI (nativní z kupi.cz!)
                    category = product.get('category', 'unknown')
                    category_display = product.get('category_display', category)
                    is_food = product.get('is_food', True)
                    
                    # Původní cena a sleva (nejsou dostupné z kupi.cz)
                    original_price = self._parse_price(product.get('original_price'))
                    discount_pct = product.get('discount_percentage')
                    
                    unit = product.get('unit', '')
                    image_url = product.get('image_url')
                    
                    # Platnost
                    valid_from = self._parse_date(product.get('valid_from'))
                    valid_until = self._parse_date(product.get('valid_until'))
                    
                    if not valid_from:
                        valid_from = date.today()
                    if not valid_until:
                        valid_until = date.today() + timedelta(days=7)
                    
                    # Přeskočit expirované
                    if valid_until < date.today():
                        skipped += 1
                        continue
                    
                    week_number, year = self._calculate_week(valid_from)
                    
                    # UPSERT - vložení nebo aktualizace
                    result = await conn.execute("""
                        INSERT INTO discounts 
                        (product_name, price, original_price, discount_percentage, 
                         shop_name, category, category_display, unit, valid_from, 
                         valid_until, week_number, year, is_food, image_url)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                        ON CONFLICT (product_name, shop_name, valid_from, valid_until) 
                        DO UPDATE SET 
                            price = EXCLUDED.price,
                            original_price = EXCLUDED.original_price,
                            discount_percentage = EXCLUDED.discount_percentage,
                            category = EXCLUDED.category,
                            category_display = EXCLUDED.category_display,
                            unit = EXCLUDED.unit,
                            is_food = EXCLUDED.is_food,
                            image_url = EXCLUDED.image_url,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE discounts.price != EXCLUDED.price 
                           OR discounts.category != EXCLUDED.category
                    """, name, price, original_price, discount_pct, shop, 
                    category, category_display, unit, valid_from, valid_until, 
                    week_number, year, is_food, image_url)
                    
                    # Zjisti, zda byl INSERT nebo UPDATE
                    if 'INSERT' in result:
                        added += 1
                    elif 'UPDATE' in result:
                        updated += 1
                    else:
                        skipped += 1
                        
                except Exception as e:
                    logger.debug(f"Chyba při ukládání produktu: {e}")
                    skipped += 1
                    
        return {'added': added, 'updated': updated, 'skipped': skipped}

    # -------------------------------------------------------------------------
    # Cleanup starých slev
    # -------------------------------------------------------------------------
    
    async def cleanup_expired_discounts(self) -> int:
        """Smaže expirované slevy (valid_until < dnes)."""
        try:
            async with self.db_pool.acquire() as conn:
                result = await conn.execute("""
                    DELETE FROM discounts WHERE valid_until < CURRENT_DATE
                """)
                # Extrahujeme počet smazaných řádků
                deleted = int(result.split()[-1]) if result and 'DELETE' in result else 0
                if deleted > 0:
                    logger.info(f"🗑️ Smazáno {deleted} expirovaných slev")
                return deleted
        except Exception as e:
            logger.error(f"❌ Chyba při mazání expirovaných slev: {e}")
            return 0

    # -------------------------------------------------------------------------
    # Hlavní ETL proces - NOVÝ ZPŮSOB
    # -------------------------------------------------------------------------
    
    async def run_full_etl(self, trigger_type: str = 'scheduled') -> Dict:
        """
        Spustí kompletní ETL proces.
        
        NOVÝ ZPŮSOB: Volá /v1/discounts/etl, který fetchuje podle kategorií.
        Tím získáme správné nativní kategorie z kupi.cz.
        
        Args:
            trigger_type: 'scheduled', 'manual', nebo 'startup'
            
        Returns:
            Slovník se statistikami běhu
        """
        if self.is_running:
            logger.warning("⚠️ ETL již běží, přeskakuji...")
            return {'status': 'skipped', 'reason': 'already_running'}
        
        self.is_running = True
        start_time = datetime.now()
        self.stats['total_runs'] += 1
        
        logger.info(f"🚀 Spouštím ETL proces ({trigger_type})...")
        
        total_stats = {
            'processed': 0, 
            'added': 0, 
            'updated': 0, 
            'skipped': 0,
            'deleted': 0
        }
        
        try:
            # 1. Cleanup expirovaných slev
            deleted = await self.cleanup_expired_discounts()
            total_stats['deleted'] = deleted
            
            # 2. Stažení všech slev z FastAPI (nový endpoint podle kategorií)
            data = await self._fetch_all_discounts()
            products = data.get('products', [])
            categories_fetched = data.get('categories_fetched', [])
            shops_fetched = data.get('shops_fetched', [])
            
            if not products:
                await self._log_etl('ALL', 'error', "Žádné produkty staženy", 
                                   trigger_type=trigger_type, process_start=start_time)
                self.is_running = False
                return {'status': 'error', 'message': 'Žádné produkty staženy'}
            
            logger.info(f"📊 Kategorie: {', '.join(categories_fetched)}")
            
            # 3. Uložení do databáze
            stats = await self._save_discounts(products)
            total_stats['processed'] = len(products)
            total_stats['added'] = stats['added']
            total_stats['updated'] = stats['updated']
            total_stats['skipped'] = stats['skipped']
            
            # 4. Finální log
            duration = int((datetime.now() - start_time).total_seconds())
            await self._log_etl(
                'ALL', 'success',
                f"ETL dokončen: {len(categories_fetched)} kategorií, {len(shops_fetched)} obchodů",
                products_processed=total_stats['processed'],
                products_added=total_stats['added'],
                products_updated=total_stats['updated'],
                products_skipped=total_stats['skipped'],
                products_deleted=total_stats['deleted'],
                duration=duration,
                process_start=start_time,
                trigger_type=trigger_type
            )
            
            self.stats['successful_runs'] += 1
            self.stats['total_products_added'] += total_stats['added']
            self.last_run = datetime.now()
            
            logger.info(f"✅ ETL dokončen za {duration}s:")
            logger.info(f"   📦 Zpracováno: {total_stats['processed']}")
            logger.info(f"   ➕ Nových: {total_stats['added']}")
            logger.info(f"   🔄 Aktualizovaných: {total_stats['updated']}")
            logger.info(f"   ⏭️ Přeskočených: {total_stats['skipped']}")
            logger.info(f"   🗑️ Smazaných (expired): {total_stats['deleted']}")
            
            # Memory info
            mem = psutil.Process().memory_info().rss / 1024 / 1024
            logger.info(f"💾 Využití paměti: {mem:.1f} MB")
            
            return {
                'status': 'success',
                'duration_seconds': duration,
                'stats': total_stats,
                'categories_fetched': categories_fetched,
                'shops_fetched': shops_fetched,
                'trigger_type': trigger_type
            }
            
        except Exception as e:
            self.stats['failed_runs'] += 1
            logger.error(f"💥 ETL selhal: {e}")
            traceback.print_exc()
            
            await self._log_etl(
                'ALL', 'error', str(e),
                error_details={'error': str(e), 'traceback': traceback.format_exc()},
                duration=int((datetime.now() - start_time).total_seconds()),
                process_start=start_time,
                trigger_type=trigger_type
            )
            
            return {
                'status': 'error',
                'error': str(e),
                'trigger_type': trigger_type
            }
        finally:
            self.is_running = False

    # -------------------------------------------------------------------------
    # Status a statistiky
    # -------------------------------------------------------------------------
    
    async def get_status(self) -> Dict:
        """Vrátí aktuální stav ETL služby."""
        db_stats = {}
        category_stats = {}
        
        try:
            async with self.db_pool.acquire() as conn:
                # Počet slev
                row = await conn.fetchrow("""
                    SELECT 
                        COUNT(*) as total,
                        COUNT(*) FILTER (WHERE valid_until >= CURRENT_DATE) as active,
                        COUNT(*) FILTER (WHERE is_food = true AND valid_until >= CURRENT_DATE) as food
                    FROM discounts
                """)
                db_stats = dict(row) if row else {}
                
                # Statistiky podle kategorií
                cat_rows = await conn.fetch("""
                    SELECT category, category_display, COUNT(*) as count
                    FROM discounts 
                    WHERE valid_until >= CURRENT_DATE
                    GROUP BY category, category_display
                    ORDER BY count DESC
                """)
                category_stats = {row['category']: {
                    'name': row['category_display'],
                    'count': row['count']
                } for row in cat_rows}
                
                # Statistiky podle obchodů
                shop_rows = await conn.fetch("""
                    SELECT shop_name, COUNT(*) as count
                    FROM discounts 
                    WHERE valid_until >= CURRENT_DATE
                    GROUP BY shop_name
                    ORDER BY count DESC
                """)
                shop_stats = {row['shop_name']: row['count'] for row in shop_rows}
                
                # Poslední úspěšný ETL
                last_etl = await conn.fetchrow("""
                    SELECT process_end, products_added, message
                    FROM etl_logs 
                    WHERE status = 'success' 
                    ORDER BY process_end DESC 
                    LIMIT 1
                """)
                if last_etl:
                    db_stats['last_successful_etl'] = last_etl['process_end'].isoformat()
                    db_stats['last_etl_added'] = last_etl['products_added']
                    
        except Exception as e:
            logger.error(f"Chyba při získávání statistik: {e}")
            
        return {
            'service': 'budgetbites-etl',
            'version': '3.0.0',
            'status': 'running' if self.is_running else 'idle',
            'last_run': self.last_run.isoformat() if self.last_run else None,
            'stats': self.stats,
            'database': db_stats,
            'categories': category_stats,
            'shops': shop_stats if 'shop_stats' in dir() else {},
            'config': {
                'interval_hours': ETL_INTERVAL_HOURS,
                'max_pages_per_category': MAX_PAGES_PER_CATEGORY,
                'fastapi_url': FASTAPI_URL
            }
        }


# =============================================================================
# HTTP API pro manuální trigger
# =============================================================================

etl_service: Optional[ETLService] = None

async def handle_health(request: web.Request) -> web.Response:
    """Health check endpoint."""
    return web.json_response({'status': 'healthy', 'version': '3.0.0'})

async def handle_status(request: web.Request) -> web.Response:
    """Vrátí status ETL služby."""
    status = await etl_service.get_status()
    return web.json_response(status)

async def handle_trigger(request: web.Request) -> web.Response:
    """Manuální spuštění ETL."""
    if etl_service.is_running:
        return web.json_response(
            {'status': 'error', 'message': 'ETL již běží'},
            status=409
        )
    
    # Spustit ETL na pozadí
    asyncio.create_task(etl_service.run_full_etl(trigger_type='manual'))
    
    return web.json_response({
        'status': 'started',
        'message': 'ETL proces spuštěn na pozadí (V3 - fetchování podle kategorií)'
    })

async def handle_cleanup(request: web.Request) -> web.Response:
    """Manuální cleanup expirovaných slev."""
    deleted = await etl_service.cleanup_expired_discounts()
    return web.json_response({
        'status': 'success',
        'deleted_count': deleted
    })

def create_app() -> web.Application:
    """Vytvoří aiohttp aplikaci pro HTTP API."""
    app = web.Application()
    app.router.add_get('/health', handle_health)
    app.router.add_get('/status', handle_status)
    app.router.add_post('/trigger', handle_trigger)
    app.router.add_post('/cleanup', handle_cleanup)
    return app


# =============================================================================
# Main
# =============================================================================

async def main():
    """Hlavní funkce - spuštění ETL služby se schedulerem a HTTP API."""
    global etl_service
    
    # Vytvoření logs adresáře
    os.makedirs(LOG_DIR, exist_ok=True)
    
    etl_service = ETLService()
    
    try:
        # Inicializace
        await etl_service.init()
        
        # Scheduler
        scheduler = AsyncIOScheduler(timezone='Europe/Prague')
        
        # Pravidelné spouštění (každých 12 hodin - 00:00 a 12:00)
        scheduler.add_job(
            etl_service.run_full_etl,
            CronTrigger(hour='0,12', minute=0),
            id='scheduled_etl',
            name='Scheduled ETL Job',
            max_instances=1,
            coalesce=True,
            kwargs={'trigger_type': 'scheduled'}
        )
        
        # Iniciální spuštění po startu
        scheduler.add_job(
            etl_service.run_full_etl,
            'date',
            run_date=datetime.now() + timedelta(seconds=INITIAL_DELAY_SECONDS),
            id='startup_etl',
            kwargs={'trigger_type': 'startup'}
        )
        
        scheduler.start()
        logger.info(f"📅 Scheduler spuštěn - ETL každých {ETL_INTERVAL_HOURS} hodin (00:00 a 12:00)")
        logger.info(f"🔄 První spuštění za {INITIAL_DELAY_SECONDS} sekund...")
        logger.info(f"📊 Verze 3.0 - fetchování podle KATEGORIÍ z kupi.cz")
        
        # HTTP server pro manuální trigger (port 8080)
        app = create_app()
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, '0.0.0.0', 8080)
        await site.start()
        logger.info("🌐 HTTP API běží na portu 8080")
        logger.info("   POST /trigger - spustit ETL manuálně")
        logger.info("   GET /status - stav služby")
        logger.info("   POST /cleanup - smazat expirované slevy")
        
        # Udržení procesu
        while True:
            await asyncio.sleep(60)
            
    except KeyboardInterrupt:
        logger.info("⏹️ Zastavování ETL služby...")
    except Exception as e:
        logger.error(f"💥 Kritická chyba: {e}")
        raise
    finally:
        await etl_service.close()


if __name__ == "__main__":
    asyncio.run(main())
