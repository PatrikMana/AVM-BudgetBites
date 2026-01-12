# BudgetBites - Databázová dokumentace

## Přehled
Databáze `budgetbites` je navržena pro ukládání slev potravinových produktů z různých obchodů. Cílem je umožnit sestavování levných jídelníčků na základě aktuálních slev.

## Připojení k databázi
```
Host: localhost
Port: 5332
Database: budgetbites  
User: admin
Password: password
```

## Struktura tabulek

### 1. `discounts` - Hlavní tabulka slev

Ukládá všechny aktuální a budoucí slevy potravinových produktů.

| Sloupec | Typ | Popis |
|---------|-----|-------|
| `id` | SERIAL PRIMARY KEY | Unikátní ID slevy |
| `product_name` | VARCHAR(255) NOT NULL | Název produktu |
| `price` | DECIMAL(10,2) NOT NULL | Aktuální cena po slevě |
| `original_price` | DECIMAL(10,2) | Původní cena (může být NULL) |
| `discount_percentage` | DECIMAL(5,2) | Procentuální sleva |
| `shop_name` | VARCHAR(50) NOT NULL | Název obchodu |
| `category` | VARCHAR(20) NOT NULL | Kategorie produktu |
| `unit` | VARCHAR(50) | Jednotka (kg, l, ks, atd.) |
| `valid_from` | DATE NOT NULL | Platnost od |
| `valid_until` | DATE NOT NULL | Platnost do |
| `week_number` | INTEGER NOT NULL | Číslo týdne v roce |
| `year` | INTEGER NOT NULL | Rok |
| `created_at` | TIMESTAMP | Datum vytvoření záznamu |
| `updated_at` | TIMESTAMP | Datum poslední aktualizace |

#### Indexy pro rychlé vyhledávání:
- `idx_discounts_valid_dates` - pro filtrování podle platnosti
- `idx_discounts_shop_category` - pro filtrování podle obchodu a kategorie
- `idx_discounts_product_search` - fulltext vyhledávání v názvu produktu (česky)
- `idx_discounts_week` - pro týdenní statistiky
- `idx_discounts_price` - pro řazení podle ceny
- `idx_discounts_unique` - prevence duplikátů

#### Kategorie produktů:
- `maso` - Maso, uzeniny a ryby
- `mlecne` - Mléčné výrobky
- `ovoce` - Ovoce  
- `zelenina` - Zelenina
- `napoje` - Nápoje
- `alkohol` - Alkohol
- `pecivo` - Pečivo
- `sladkosti` - Sladkosti
- `mrazene` - Mražené produkty

#### Obchody:
- `lidl`, `kaufland`, `albert`, `billa`, `penny`, `globus`

### 2. `etl_logs` - Logy ETL procesu

Sleduje průběh a výsledky ETL procesů.

| Sloupec | Typ | Popis |
|---------|-----|-------|
| `id` | SERIAL PRIMARY KEY | Unikátní ID logu |
| `process_start` | TIMESTAMP | Začátek procesu |
| `process_end` | TIMESTAMP | Konec procesu |
| `shop_name` | VARCHAR(50) | Zpracovávaný obchod |
| `category` | VARCHAR(20) | Zpracovávaná kategorie |
| `status` | VARCHAR(20) | Status: success/error/retry/running |
| `message` | TEXT | Zpráva o průběhu |
| `products_processed` | INTEGER | Počet zpracovaných produktů |
| `products_added` | INTEGER | Počet nově přidaných |
| `products_updated` | INTEGER | Počet aktualizovaných |
| `products_skipped` | INTEGER | Počet přeskočených |
| `error_details` | JSONB | Detaily chyb (JSON) |
| `duration_seconds` | INTEGER | Doba trvání v sekundách |

## Užitečné Views

### `active_discounts` - Pouze platné slevy
```sql
SELECT * FROM active_discounts 
WHERE category = 'maso' 
ORDER BY discount_percentage DESC;
```

### `best_discounts_by_category` - Nejlepší slevy podle kategorií
```sql
SELECT * FROM best_discounts_by_category 
WHERE category = 'mlecne';
```

### `weekly_stats` - Týdenní statistiky
```sql
SELECT * FROM weekly_stats 
WHERE year = 2025 AND week_number = 42;
```

## Příklady dotazů

### 1. Nejlevnější mléčné výrobky tento týden
```sql
SELECT product_name, price, shop_name, unit, discount_percentage
FROM active_discounts 
WHERE category = 'mlecne' 
  AND EXTRACT(WEEK FROM valid_from) = EXTRACT(WEEK FROM CURRENT_DATE)
ORDER BY price ASC 
LIMIT 10;
```

### 2. Všechny slevy nad 30% z Lidlu
```sql
SELECT product_name, price, original_price, discount_percentage, valid_until
FROM active_discounts
WHERE shop_name = 'lidl' 
  AND discount_percentage > 30
ORDER BY discount_percentage DESC;
```

### 3. Porovnání cen stejného produktu napříč obchody
```sql
SELECT product_name, shop_name, price, discount_percentage
FROM active_discounts
WHERE product_name ILIKE '%máslo%'
ORDER BY product_name, price ASC;
```

### 4. Týdenní přehled kategorií
```sql
SELECT 
  category,
  COUNT(*) as total_discounts,
  AVG(discount_percentage) as avg_discount,
  MIN(price) as cheapest_price,
  COUNT(DISTINCT shop_name) as shops_count
FROM active_discounts
GROUP BY category
ORDER BY avg_discount DESC;
```

### 5. ETL proces statistiky za poslední týden
```sql
SELECT 
  DATE(process_start) as date,
  COUNT(*) as total_processes,
  SUM(products_added) as total_added,
  SUM(products_updated) as total_updated,
  AVG(duration_seconds) as avg_duration
FROM etl_logs 
WHERE process_start > CURRENT_DATE - INTERVAL '7 days'
  AND status = 'success'
GROUP BY DATE(process_start)
ORDER BY date DESC;
```

## Údržba databáze

### Automatické čištění
ETL proces automaticky maže zastaralé slevy (válid_until < CURRENT_DATE).

### Ručno čištění starých logů
```sql
DELETE FROM etl_logs 
WHERE process_start < CURRENT_DATE - INTERVAL '30 days';
```

### Reindexace (měsíčně)
```sql
REINDEX TABLE discounts;
REINDEX TABLE etl_logs;
```

### Statistiky velikosti
```sql
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE schemaname = 'public' 
  AND tablename IN ('discounts', 'etl_logs');
```

## 📚 TUTORIAL - Jak používat BudgetBites databázi

### Krok 1: První připojení k databázi

**1.1 Připojení přes psql**
```bash
# Připojit se k běžící databázi
docker exec -it postgres-avm-budgetbites psql -U admin -d budgetbites

# Nebo z lokálního psql klienta
psql -h localhost -p 5332 -U admin -d budgetbites
```

**1.2 Ověření struktury**
```sql
-- Zobrazit všechny tabulky
\dt

-- Zobrazit strukturu tabulky discounts
\d discounts

-- Zobrazit všechny views
\dv

-- Spočítat počet záznamů
SELECT COUNT(*) FROM discounts;
```

### Krok 2: Nasazení schématu do nové databáze

**2.1 Vytvoření databáze a uživatele**
```sql
-- Připojit se jako postgres superuser
docker exec -it postgres-avm-budgetbites psql -U postgres

-- Vytvořit databázi a uživatele
CREATE DATABASE budgetbites;
CREATE USER admin WITH ENCRYPTED PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE budgetbites TO admin;
```

**2.2 Nasazení schématu**
```bash
# Kopírovat schema.sql do kontejneru
docker cp database/schema.sql postgres-avm-budgetbites:/tmp/

# Spustit schéma
docker exec postgres-avm-budgetbites psql -U admin -d budgetbites -f /tmp/schema.sql
```

**2.3 Ověření nasazení**
```sql
-- Připojit se k nové databázi
docker exec -it postgres-avm-budgetbites psql -U admin -d budgetbites

-- Ověřit tabulky a indexy
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
SELECT indexname FROM pg_indexes WHERE schemaname = 'public';
```

### Krok 3: Základní vyhledávání a filtry

**3.1 Vyhledávání podle obchodu a kategorie**
```sql
-- Všechny slevy masa z Lidlu
SELECT product_name, price, discount_percentage, valid_until
FROM active_discounts 
WHERE shop_name = 'lidl' AND category = 'maso'
ORDER BY discount_percentage DESC;

-- Nejlevnější mléčné výrobky ze všech obchodů
SELECT product_name, shop_name, price, unit
FROM active_discounts 
WHERE category = 'mlecne'
ORDER BY price ASC 
LIMIT 20;
```

**3.2 Fulltext vyhledávání produktů**
```sql
-- Hledat produkty obsahující slovo "sýr"
SELECT product_name, shop_name, price, discount_percentage
FROM active_discounts 
WHERE product_name_search @@ plainto_tsquery('czech', 'sýr')
ORDER BY discount_percentage DESC;

-- Hledat více slov najednou
SELECT product_name, shop_name, price
FROM active_discounts 
WHERE product_name_search @@ plainto_tsquery('czech', 'kuře filet')
ORDER BY price ASC;
```

**3.3 Cenové filtry a rozsahy**
```sql
-- Produkty v cenovém rozsahu 50-200 Kč
SELECT product_name, shop_name, price, category
FROM active_discounts 
WHERE price BETWEEN 50 AND 200
ORDER BY discount_percentage DESC;

-- Slevy vyšší než 40%
SELECT product_name, shop_name, original_price, price, discount_percentage
FROM active_discounts 
WHERE discount_percentage > 40
ORDER BY discount_percentage DESC;
```

### Krok 4: Pokročilé dotazy a analýzy

**4.1 Porovnání cen napříč obchody**
```sql
-- Najít stejný produkt v různých obchodech
WITH product_comparison AS (
    SELECT 
        product_name,
        shop_name,
        price,
        discount_percentage,
        RANK() OVER (PARTITION BY product_name ORDER BY price) as price_rank
    FROM active_discounts 
    WHERE product_name ILIKE '%kuřecí prsa%'
)
SELECT * FROM product_comparison ORDER BY product_name, price_rank;
```

**4.2 Týdenní trendy a statistiky**
```sql
-- Průměrné slevy podle kategorií tento týden
SELECT 
    category,
    COUNT(*) as pocet_produktu,
    AVG(discount_percentage) as prumerna_sleva,
    MIN(price) as nejlevnejsi,
    MAX(discount_percentage) as nejvyssi_sleva
FROM active_discounts 
WHERE EXTRACT(WEEK FROM valid_from) = EXTRACT(WEEK FROM CURRENT_DATE)
GROUP BY category 
ORDER BY prumerna_sleva DESC;
```

**4.3 Sestavení levného nákupu**
```sql
-- Nejlevnější produkty z každé kategorie pro týdenní nákup
WITH cheapest_by_category AS (
    SELECT DISTINCT ON (category)
        category,
        product_name,
        shop_name,
        price,
        unit,
        discount_percentage
    FROM active_discounts 
    ORDER BY category, price ASC
)
SELECT 
    category,
    product_name,
    shop_name,
    price,
    unit,
    '1' as doporucene_mnozstvi
FROM cheapest_by_category
ORDER BY category;
```

### Krok 5: Monitorování ETL procesu

**5.1 Kontrola posledních ETL běhů**
```sql
-- Posledních 10 ETL procesů
SELECT 
    process_start,
    shop_name,
    category,
    status,
    products_added,
    duration_seconds
FROM etl_logs 
ORDER BY process_start DESC 
LIMIT 10;

-- Chyby za poslední den
SELECT process_start, shop_name, status, message, error_details
FROM etl_logs 
WHERE process_start > CURRENT_DATE - INTERVAL '1 day'
  AND status = 'error'
ORDER BY process_start DESC;
```

**5.2 Výkonnostní metriky**
```sql
-- Průměrná doba ETL procesů podle obchodů
SELECT 
    shop_name,
    COUNT(*) as pocet_behu,
    AVG(duration_seconds) as prumerna_doba_s,
    AVG(products_added) as prumerne_pridano
FROM etl_logs 
WHERE status = 'success' 
  AND process_start > CURRENT_DATE - INTERVAL '7 days'
GROUP BY shop_name
ORDER BY prumerna_doba_s DESC;
```

### Krok 6: Užitečné skripty pro správu

**6.1 Vymazání starých dat**
```sql
-- Smazat slevy starší než 30 dní
DELETE FROM discounts 
WHERE valid_until < CURRENT_DATE - INTERVAL '30 days';

-- Archivovat staré ETL logy
CREATE TABLE etl_logs_archive AS 
SELECT * FROM etl_logs 
WHERE process_start < CURRENT_DATE - INTERVAL '90 days';

DELETE FROM etl_logs 
WHERE process_start < CURRENT_DATE - INTERVAL '90 days';
```

**6.2 Optimalizace výkonu**
```sql
-- Aktualizovat statistiky tabulek
ANALYZE discounts;
ANALYZE etl_logs;

-- Zjistit velikost tabulek
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as velikost
FROM pg_tables 
WHERE schemaname = 'public';
```

### Krok 7: Připojení z aplikací

**7.1 Python (asyncpg)**
```python
import asyncpg

async def connect_db():
    conn = await asyncpg.connect(
        host='localhost',
        port=5332,
        user='admin',
        password='password',
        database='budgetbites'
    )
    
    # Příklad dotazu
    rows = await conn.fetch("""
        SELECT product_name, price, shop_name 
        FROM active_discounts 
        WHERE category = $1 
        ORDER BY price LIMIT $2
    """, 'maso', 10)
    
    await conn.close()
    return rows
```

**7.2 Node.js (pg)**
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5332,
  user: 'admin',
  password: 'password',
  database: 'budgetbites'
});

async function getCheapestMeat() {
  const result = await pool.query(`
    SELECT product_name, price, shop_name 
    FROM active_discounts 
    WHERE category = $1 
    ORDER BY price LIMIT $2
  `, ['maso', 10]);
  
  return result.rows;
}
```

### Krok 8: Manuální spuštění ETL procesu

**8.1 Spuštění celého ETL procesu**
```bash
# Pomocí PowerShell skriptu (Windows)
.\trigger_etl.ps1

# Nebo přímo v kontejneru
docker exec budgetbites-etl python /app/manual_etl_trigger.py --action etl
```

**8.2 Částečný ETL pro konkrétní obchody/kategorie**
```bash
# Jen Lidl a kategorie maso
docker exec budgetbites-etl python /app/manual_etl_trigger.py --action etl --shops lidl --categories maso

# Více obchodů a kategorií
docker exec budgetbites-etl python /app/manual_etl_trigger.py --action etl --shops lidl kaufland --categories maso mlecne ovoce
```

**8.3 Testování a kontrola stavu**
```bash
# Test připojení k databázi
docker exec budgetbites-etl python /app/manual_etl_trigger.py --action test

# Zobrazení posledních slev
docker exec budgetbites-etl python /app/manual_etl_trigger.py --action discounts
```

**8.4 Monitorování ETL procesu**
```sql
-- Kontrola průběhu za poslední hodinu
SELECT 
  process_start,
  shop_name,
  category,
  status,
  products_added,
  duration_seconds
FROM etl_logs 
WHERE process_start > NOW() - INTERVAL '1 hour'
ORDER BY process_start DESC;

-- Statistiky dnešních slev podle obchodů
SELECT 
  shop_name,
  COUNT(*) as pocet_slev,
  AVG(discount_percentage)::DECIMAL(5,1) as prumerna_sleva,
  MIN(price) as nejlevnejsi
FROM discounts 
WHERE created_at::date = CURRENT_DATE
GROUP BY shop_name 
ORDER BY pocet_slev DESC;
```

### Krok 9: Troubleshooting

**9.1 Časté problémy**
```sql
-- Kontrola duplicitních záznamů
SELECT product_name, shop_name, valid_from, COUNT(*)
FROM discounts 
GROUP BY product_name, shop_name, valid_from
HAVING COUNT(*) > 1;

-- Kontrola integrity dat
SELECT COUNT(*) as celkem,
       COUNT(CASE WHEN price <= 0 THEN 1 END) as zaporne_ceny,
       COUNT(CASE WHEN valid_until < valid_from THEN 1 END) as spatne_datumy
FROM discounts;
```

**9.2 Monitoring připojení**
```sql
-- Aktivní připojení k databázi
SELECT pid, usename, application_name, client_addr, state
FROM pg_stat_activity 
WHERE datname = 'budgetbites';

-- ETL chyby za posledních 24 hodin
SELECT 
  process_start,
  shop_name,
  category,
  message,
  error_details
FROM etl_logs 
WHERE status = 'error' 
  AND process_start > NOW() - INTERVAL '24 hours'
ORDER BY process_start DESC;
```

## Backup doporučení

### Denní backup
```bash
docker exec postgres-avm-budgetbites pg_dump -U admin budgetbites > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
docker exec -i postgres-avm-budgetbites psql -U admin budgetbites < backup_20251020.sql
```