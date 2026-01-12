#!/usr/bin/env python3
"""
Manuální spuštění ETL procesu
Umožňuje vynutit ETL bez čekání na scheduled čas
"""

import asyncio
import argparse
import logging
import sys
from etl_service import ETLService

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('manual-etl')

async def run_manual_etl(shops: list = None, categories: list = None):
    """
    Spustí ETL manuálně pro zadané obchody a kategorie
    
    Args:
        shops: Seznam obchodů (default: všechny)
        categories: Seznam kategorií (default: všechny potravinové)
    """
    etl = ETLService()
    
    try:
        logger.info("🚀 Spouštím manuální ETL proces...")
        
        # Inicializace
        await etl.init_db()
        await etl.init_http()
        
        if shops or categories:
            # Částečný ETL pro vybrané obchody/kategorie
            if not shops:
                shops = ['lidl', 'kaufland', 'albert', 'billa', 'penny', 'globus']
            if not categories:
                categories = ['maso', 'mlecne', 'ovoce', 'zelenina', 'napoje', 'alkohol', 'pecivo', 'sladkosti', 'mrazene']
                
            logger.info(f"📋 Zpracovávám obchody: {', '.join(shops)}")
            logger.info(f"📋 Zpracovávám kategorie: {', '.join(categories)}")
            
            total_added = 0
            total_updated = 0
            
            for shop in shops:
                for category in categories:
                    logger.info(f"🏪 Zpracovávám {shop} - {category}")
                    result = await etl.process_shop_category(shop, category)
                    if result:
                        total_added += result.get('added', 0)
                        total_updated += result.get('updated', 0)
                        
            logger.info(f"✅ Částečný ETL dokončen: {total_added} přidáno, {total_updated} aktualizováno")
        else:
            # Plný ETL
            logger.info("📦 Spouštím plný ETL proces...")
            await etl.run_full_etl()
            
    except Exception as e:
        logger.error(f"💥 Chyba při manuálním ETL: {e}")
        raise
    finally:
        await etl.close()

async def test_database_connection():
    """Otestuje připojení k databázi"""
    etl = ETLService()
    
    try:
        await etl.init_db()
        
        # Test dotaz
        async with etl.db_pool.acquire() as conn:
            result = await conn.fetch("SELECT COUNT(*) as count FROM discounts")
            count = result[0]['count'] if result else 0
            
            logger.info(f"✅ Databáze OK - {count} slev v databázi")
            
            # Posledních 5 ETL logů
            logs = await conn.fetch("""
                SELECT process_start, shop_name, category, status, products_added, duration_seconds
                FROM etl_logs 
                ORDER BY process_start DESC 
                LIMIT 5
            """)
        
        if logs:
            logger.info("📊 Posledních 5 ETL procesů:")
            for log in logs:
                logger.info(f"  {log['process_start']}: {log['shop_name']}/{log['category']} - {log['status']} ({log['products_added']} přidáno, {log['duration_seconds']}s)")
        else:
            logger.info("📊 Žádné ETL logy nenalezeny")
            
    except Exception as e:
        logger.error(f"💥 Chyba při testování databáze: {e}")
        raise
    finally:
        await etl.close()

async def show_recent_discounts():
    """Zobrazí posledně přidané slevy"""
    etl = ETLService()
    
    try:
        await etl.init_db()
        
        # Posledních 10 slev
        async with etl.db_pool.acquire() as conn:
            discounts = await conn.fetch("""
                SELECT product_name, shop_name, category, price, discount_percentage, created_at
                FROM discounts 
                ORDER BY created_at DESC 
                LIMIT 10
            """)
        
        if discounts:
            logger.info("🛒 Posledních 10 přidaných slev:")
            for discount in discounts:
                logger.info(f"  {discount['shop_name']}: {discount['product_name']} - {discount['price']} Kč ({discount['discount_percentage']:.1f}%) [{discount['category']}]")
        else:
            logger.info("🛒 Žádné slevy nenalezeny")
            
    except Exception as e:
        logger.error(f"💥 Chyba při načítání slev: {e}")
        raise
    finally:
        await etl.close()

def main():
    parser = argparse.ArgumentParser(description='Manuální spuštění ETL procesu')
    parser.add_argument('--action', choices=['etl', 'test', 'discounts'], default='etl',
                       help='Akce: etl=spustit ETL, test=test databáze, discounts=zobrazit slevy')
    parser.add_argument('--shops', nargs='+', 
                       choices=['lidl', 'kaufland', 'albert', 'billa', 'penny', 'globus'],
                       help='Konkrétní obchody (default: všechny)')
    parser.add_argument('--categories', nargs='+',
                       choices=['maso', 'mlecne', 'ovoce', 'zelenina', 'napoje', 'alkohol', 'pecivo', 'sladkosti', 'mrazene'],
                       help='Konkrétní kategorie (default: všechny)')
    
    args = parser.parse_args()
    
    try:
        if args.action == 'etl':
            asyncio.run(run_manual_etl(args.shops, args.categories))
        elif args.action == 'test':
            asyncio.run(test_database_connection())
        elif args.action == 'discounts':
            asyncio.run(show_recent_discounts())
    except KeyboardInterrupt:
        logger.info("⏹️ Přerušeno uživatelem")
    except Exception as e:
        logger.error(f"💥 Chyba: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()