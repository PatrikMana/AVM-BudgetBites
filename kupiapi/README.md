# BudgetBites KupiAPI Scraper

Systém pro automatické stahování a ukládání slev potravin z českých obchodů.

## 🏗️ Architektura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   KupiAPI       │────▶│   ETL Service   │────▶│   PostgreSQL    │
│   Bridge        │     │   (scheduler)   │     │   Database      │
│   (FastAPI)     │     │                 │     │                 │
│   port 8000     │     │   port 8080     │     │   port 5432     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       │
        ▼                       ▼
   kupiapi lib            HTTP API pro
   (scraping)             manuální trigger
```

### Komponenty

1. **KupiAPI Bridge** (FastAPI) - REST API pro scraping slev pomocí kupiapi knihovny
2. **ETL Service** - Automatické stahování a ukládání slev do databáze
3. **PostgreSQL** - Databáze pro ukládání slev

## 🚀 Spuštění

### Spuštění všech služeb

```bash
# Z root adresáře projektu
docker-compose up -d
```

### Kontrola stavu

```bash
docker-compose ps
docker-compose logs -f etl  # Logy ETL služby
```

## 📡 API Endpoints

### KupiAPI Bridge (port 8000)

| Endpoint | Popis |
|----------|-------|
| `GET /health` | Health check |
| `GET /categories` | Seznam kategorií |
| `GET /discounts/{shop}` | Slevy z obchodu |
| `GET /discounts` | Slevy ze všech obchodů |
| `GET /v1/discounts/store/{shop}/etl` | ETL endpoint |

**Podporované obchody:** `albert`, `lidl`, `kaufland`, `billa`, `penny`, `globus`

### ETL Service (port 8080)

| Endpoint | Metoda | Popis |
|----------|--------|-------|
| `/health` | GET | Health check |
| `/status` | GET | Stav ETL služby a statistiky |
| `/trigger` | POST | **Manuální spuštění ETL** |
| `/cleanup` | POST | Smazání expirovaných slev |

## 🔄 Manuální spuštění ETL

ETL lze spustit ručně přes HTTP API (místo starých .sh/.ps1 scriptů):

```bash
# PowerShell
Invoke-RestMethod -Method POST -Uri "http://localhost:8080/trigger"

# curl
curl -X POST http://localhost:8080/trigger

# Kontrola stavu
curl http://localhost:8080/status
```

## ⏰ Automatické spouštění

ETL se automaticky spouští:
- **Při startu** - 60 sekund po spuštění kontejneru
- **Pravidelně** - každých 12 hodin (00:00 a 12:00)

Interval lze změnit přes environment variable `ETL_INTERVAL_HOURS`.

## 🗄️ Databázové schéma

### Tabulka `discounts`

| Sloupec | Typ | Popis |
|---------|-----|-------|
| `id` | SERIAL | Primary key |
| `product_name` | VARCHAR(500) | Název produktu |
| `price` | DECIMAL(10,2) | Aktuální cena |
| `original_price` | DECIMAL(10,2) | Původní cena |
| `discount_percentage` | DECIMAL(5,2) | Procento slevy |
| `shop_name` | VARCHAR(50) | Název obchodu |
| `category` | VARCHAR(100) | Kategorie (kupiapi) |
| `category_display` | VARCHAR(100) | Český název kategorie |
| `unit` | VARCHAR(100) | Jednotka/množství |
| `valid_from` | DATE | Platnost od |
| `valid_until` | DATE | Platnost do |
| `is_food` | BOOLEAN | Zda jde o potravinu |
| `created_at` | TIMESTAMP | Datum vytvoření |
| `updated_at` | TIMESTAMP | Datum aktualizace |

### Užitečné views

- `active_discounts` - Všechny platné slevy
- `active_food_discounts` - Platné slevy potravin
- `best_discounts_by_category` - Nejlepší slevy podle kategorie
- `weekly_stats` - Týdenní statistiky
- `etl_stats` - Statistiky ETL běhů

## 🍎 Potravinové kategorie

- `alkohol` - Alkoholické nápoje
- `konzervy` - Konzervované potraviny
- `lahudky` - Lahůdky
- `maso-drubez-a-ryby` - Maso, drůbež a ryby
- `mlecne-vyrobky-a-vejce` - Mléčné výrobky
- `mrazene-a-instantni-potraviny` - Mražené potraviny
- `nealko-napoje` - Nealkoholické nápoje
- `ovoce-a-zelenina` - Ovoce a zelenina
- `pecivo` - Pečivo
- `sladkosti-a-slane-snacky` - Sladkosti a snacky
- `vareni-a-peceni` - Koření, omáčky, atd.
- `zdrava-vyziva` - Zdravá výživa

## 🔧 Konfigurace (Environment Variables)

### ETL Service

| Variable | Default | Popis |
|----------|---------|-------|
| `DB_HOST` | budgetbites-postgres | Hostname databáze |
| `DB_PORT` | 5432 | Port databáze |
| `DB_NAME` | budgetbites | Název databáze |
| `DB_USER` | admin | Uživatel databáze |
| `DB_PASSWORD` | password | Heslo databáze |
| `FASTAPI_URL` | http://kupiapi-bridge:8000 | URL FastAPI bridge |
| `MAX_RETRIES` | 3 | Počet opakování při chybě |
| `RETRY_DELAY` | 30 | Prodleva mezi pokusy (s) |
| `ETL_INTERVAL_HOURS` | 12 | Interval ETL (hodiny) |
| `INITIAL_DELAY_SECONDS` | 60 | Zpoždění prvního běhu |

## 📊 Příklady dotazů

```sql
-- Aktivní slevy potravin seřazené podle slevy
SELECT * FROM active_food_discounts LIMIT 20;

-- Nejlevnější maso
SELECT * FROM active_discounts 
WHERE category = 'maso-drubez-a-ryby' 
ORDER BY price ASC LIMIT 10;

-- Statistiky databáze
SELECT * FROM get_database_stats();

-- Poslední ETL běhy
SELECT * FROM etl_logs ORDER BY process_start DESC LIMIT 5;
```

## 🐛 Troubleshooting

### ETL se nespouští

1. Zkontroluj logy: `docker-compose logs etl`
2. Zkontroluj health: `curl http://localhost:8080/health`
3. Zkontroluj připojení k DB a FastAPI

### Žádné produkty v databázi

1. Zkontroluj FastAPI: `curl http://localhost:8000/health`
2. Zkontroluj ETL status: `curl http://localhost:8080/status`
3. Spusť ETL manuálně: `curl -X POST http://localhost:8080/trigger`

### Databáze není dostupná

1. Zkontroluj PostgreSQL: `docker-compose logs postgres`
2. Zkontroluj health: `docker-compose ps`
