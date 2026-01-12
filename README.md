# BudgetBites

Full-stack aplikace pro správu jídelníčku s automatickým sledováním slev potravin - Spring Boot backend + React frontend + KupiAPI scraper.

## Struktura projektu

```
AVM-BudgetBites/
├── .gitignore          # Společný gitignore pro celý projekt
├── README.md           # Tento soubor
├── docker-compose.yml  # Všechny služby (PostgreSQL, KupiAPI, PgAdmin, MailDev)
├── backend/            # Spring Boot aplikace
│   ├── src/
│   ├── pom.xml
│   ├── mvnw, mvnw.cmd
│   └── target/
├── frontend/           # React aplikace
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── node_modules/
└── kupiapi/            # Automatické sledování slev
    ├── FastAPI/        # REST API bridge nad kupiapi scraperем
    ├── etl/            # ETL služba pro ukládání slev do DB
    ├── database/       # Databázové schéma
    └── logs/           # Logy služeb
```

## 🚀 Spuštění celého systému

### 1. Spuštění všech služeb pomocí Docker Compose

**Doporučený způsob - spustí všechny služby najednou:**

```bash
# Spuštění všech služeb (PostgreSQL, KupiAPI, PgAdmin, MailDev)
docker-compose up -d

# Kontrola stavu všech služeb
docker-compose ps

# Sledování logů
docker-compose logs -f kupiapi        # FastAPI logy
docker-compose logs -f kupiapi-etl    # ETL logy
```

### 2. Backend (Spring Boot)
```bash
cd backend
./mvnw spring-boot:run
```
Aplikace běží na: http://localhost:8080

### 3. Frontend (React)
```bash
cd frontend
npm install  # pouze první spuštění
npm run dev
```
Aplikace běží na: http://localhost:5173

## 📊 Dostupné služby po spuštění

| Služba | URL | Popis |
|--------|-----|-------|
| **Spring Boot Backend** | http://localhost:8080 | Hlavní API aplikace |
| **React Frontend** | http://localhost:5173 | Uživatelské rozhraní |
| **KupiAPI FastAPI** | http://localhost:8000 | API pro slevy z obchodů |
| **PostgreSQL** | localhost:5332 | Databáze (user: admin, password: password) |
| **PgAdmin** | http://localhost:5050 | Databázová administrace |
| **MailDev** | http://localhost:1080 | Testovací email server |

## 🛒 KupiAPI - Automatické sledování slev

KupiAPI automaticky sleduje slevy v těchto obchodech:
- **Lidl, Kaufland, Albert, Billa, Penny, Globus**

### Funkce:
- ⏰ **Automatické stahování** slev každých 12 hodin
- 🏷️ **Kategorizace produktů** (maso, mléčné výrobky, ovoce, zelenina, nápoje)
- 💾 **Ukládání do PostgreSQL** s indexy pro rychlé vyhledávání
- 🔍 **REST API** pro přístup k aktuálním slevám
- 📊 **ETL logy** pro monitoring procesu

### API Endpointy KupiAPI:
```bash
# Zdraví API
GET http://localhost:8000/health

# Seznam podporovaných obchodů
GET http://localhost:8000/v1/shops

# Slevy pro konkrétní obchod (tento týden)
GET http://localhost:8000/v1/discounts/store/lidl/simple?category=maso&offset=0

# Fulltext vyhledávání
GET http://localhost:8000/v1/discounts/store/kaufland/simple?q=sýr&offset=0
```

## 🔧 Užitečné příkazy

### Kontrola databáze
```bash
# Připojení k PostgreSQL
docker exec -it budgetbites-postgres psql -U admin -d budgetbites

# Kontrola slev v databázi
SELECT COUNT(*) as total_discounts, 
       COUNT(DISTINCT shop_name) as shops 
FROM active_discounts;

# Poslední ETL běhy
SELECT process_start, status, products_added, message 
FROM etl_logs 
ORDER BY process_start DESC LIMIT 5;
```

### Manuální spuštění ETL
```bash
# Vynutit okamžité stažení slev
docker-compose restart kupiapi-etl
```

### Sledování logů
```bash
# Všechny logy
docker-compose logs -f

# Konkrétní služba
docker-compose logs -f kupiapi-etl
```

## API Endpointy hlavní aplikace

- `GET /api/hello` - Test endpoint

## 💡 Tip pro vývoj

Pro vývoj doporučujem spustit služby v tomto pořadí:
1. `docker-compose up -d` - spustí všechny podporné služby
2. Backend Spring Boot aplikaci
3. Frontend React aplikaci

Databáze se automaticky naplní slevami během prvních 12 hodin, nebo můžete vynutit okamžité stažení pomocí `docker-compose restart kupiapi-etl`.
