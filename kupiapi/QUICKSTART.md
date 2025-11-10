# BudgetBites - Quick Start Guide

## Přehled systému

BudgetBites je systém pro automatické sledování slev potravinových produktů, který se skládá ze 3 hlavních komponentů:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   PostgreSQL    │◄───│   ETL Service    │◄───│   FastAPI       │
│  (port 5332)    │    │  (scheduler)     │    │  (port 8000)    │
│  budgetbites    │    │  každých 12h     │    │  + kategorie    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Rychlé spuštění

### Předpoklady
1. **Docker & Docker Compose** nainstalované
2. **Běžící PostgreSQL databáze** (podle vašeho docker-compose.yml)

### Krok 1: Připravte databázi
```bash
# Připojte se k vaší PostgreSQL databázi
docker exec -it postgres-avm-budgetbites psql -U admin -d budgetbites

# Spusťte SQL skripty pro vytvoření tabulek
\i /path/to/database/schema.sql
```

### Krok 2: Spusťte služby
```bash
# V adresáři s docker-compose.yml
docker-compose up -d

# Zkontrolujte běžící kontejnery
docker-compose ps
```

### Krok 3: Ověřte funkčnost
```bash
# FastAPI zdraví
curl http://localhost:8000/health

# ETL logy
docker logs budgetbites-etl

# Databáze
docker exec -it postgres-avm-budgetbites psql -U admin -d budgetbites -c "SELECT COUNT(*) FROM discounts;"
```

## 📊 Sledování systému

### Logy služeb
```bash
# FastAPI logy
docker logs -f kupiapi-bridge

# ETL logy
docker logs -f budgetbites-etl

# Logy uložené na disku
tail -f logs/etl/etl.log
```

### Databázové monitoring
```bash
# Připojení k databázi
docker exec -it postgres-avm-budgetbites psql -U admin -d budgetbites

# Kontrola počtu slev
SELECT COUNT(*) as total_discounts, 
       COUNT(DISTINCT shop_name) as shops,
       COUNT(DISTINCT category) as categories
FROM active_discounts;

# Poslední ETL run
SELECT process_start, status, products_added, products_updated, message 
FROM etl_logs 
ORDER BY process_start DESC LIMIT 5;
```

## 🛠️ Běžné úkoly

### Manuální spuštění ETL
```bash
# Restartujte ETL kontejner (vynutí okamžité spuštění)
docker-compose restart etl
```

### Výměna harmonogramu ETL
```bash
# Upravte proměnnou prostředí v docker-compose.yml
environment:
  - CRON_SCHEDULE=0 */6 * * *  # Každých 6 hodin místo 12
```

### Přidání nového obchodu/kategorie
1. Upravte `SHOPS` nebo `FOOD_CATEGORIES` v `etl/etl_service.py`
2. Rebuilte kontejner: `docker-compose build etl`
3. Restartujte: `docker-compose restart etl`

### Čištění starých dat
```sql
-- Připojte se k databázi a spusťte:
DELETE FROM etl_logs WHERE process_start < CURRENT_DATE - INTERVAL '30 days';
DELETE FROM discounts WHERE valid_until < CURRENT_DATE - INTERVAL '7 days';
```

## 🔧 Troubleshooting

### ETL se nespouští
```bash
# Zkontrolujte logy
docker logs budgetbites-etl

# Ověřte síťové připojení
docker exec budgetbites-etl ping kupiapi-bridge
docker exec budgetbites-etl ping postgres-avm-budgetbites

# Restartujte službu
docker-compose restart etl
```

### FastAPI není dostupné
```bash
# Zkontrolujte port
netstat -tulpn | grep 8000

# Zkontrolujte zdraví
curl -v http://localhost:8000/health

# Restartujte službu
docker-compose restart kupiapi
```

### Databáze je pomalá
```sql
-- Zkontrolujte velikost tabulek
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Reindexace
REINDEX TABLE discounts;
```

### ETL selže kvůli síti
ETL automaticky opakuje pokusy. Zkontrolujte logy:
```bash
docker logs budgetbites-etl | grep "ERROR\|RETRY"
```

## 📈 Užitečné dotazy

### Nejlepší slevy dnes
```sql
SELECT product_name, price, discount_percentage, shop_name, category
FROM active_discounts
WHERE valid_from <= CURRENT_DATE AND valid_until >= CURRENT_DATE
ORDER BY discount_percentage DESC
LIMIT 20;
```

### Porovnání obchodů podle kategorie
```sql
SELECT 
  category,
  shop_name,
  COUNT(*) as products_count,
  AVG(discount_percentage) as avg_discount,
  MIN(price) as cheapest_price
FROM active_discounts
GROUP BY category, shop_name
ORDER BY category, avg_discount DESC;
```

### ETL výkonnostní statistiky
```sql
SELECT 
  shop_name,
  category,
  AVG(duration_seconds) as avg_duration,
  SUM(products_added) as total_added,
  COUNT(*) as runs_count
FROM etl_logs 
WHERE status = 'success' 
  AND process_start > CURRENT_DATE - INTERVAL '7 days'
GROUP BY shop_name, category
ORDER BY avg_duration DESC;
```

## 🔄 Aktualizace systému

### Aktualizace ETL logiky
1. Upravte `etl/etl_service.py`
2. Rebuilte: `docker-compose build etl`
3. Restartujte: `docker-compose restart etl`

### Aktualizace FastAPI
1. Upravte `app.py`
2. Rebuilte: `docker-compose build kupiapi`
3. Restartujte: `docker-compose restart kupiapi`

### Aktualizace databázového schématu
1. Připravte SQL migrační skripty
2. Spusťte je ručně v databázi
3. Restartujte ETL pro podporu nových sloupců

## 📞 Kontakty a podpora

- **Dokumentace databáze:** `DATABASE.md`
- **API dokumentace:** http://localhost:8000/docs
- **Logy:** `./logs/` adresář
- **Health checks:** 
  - FastAPI: http://localhost:8000/health
  - ETL: `docker logs budgetbites-etl`