# BudgetBites

Full-stack aplikace pro správu jídelníčku s automatickým sledováním slev potravin - Spring Boot backend + React frontend + KupiAPI scraper.

## Struktura projektu

```
AWM-MealBuilder/
├── .gitignore          # Společný gitignore pro celý projekt
├── README.md           # Tento soubor
├── docker-compose.yml  # Všechny služby (PostgreSQL, KupiAPI, PgAdmin, MailDev)
│
├── backend/            # Spring Boot aplikace (Java 21)
│   ├── src/main/java/com/example/budgetbites/
│   │   ├── BudgetBitesApplication.java   # Vstupní bod
│   │   ├── config/                       # Konfigurace (Security, Email)
│   │   ├── controller/                   # REST API endpointy
│   │   ├── domain/                       # Entity a Repository
│   │   │   ├── entity/                   # JPA entity (User, ...)
│   │   │   └── repository/               # Spring Data JPA repositories
│   │   ├── dto/                          # Data Transfer Objects
│   │   │   ├── request/                  # Vstupní DTOs
│   │   │   └── response/                 # Výstupní DTOs
│   │   ├── exception/                    # Globální zpracování chyb
│   │   ├── security/                     # JWT autentizace
│   │   └── service/                      # Business logika
│   ├── pom.xml
│   └── mvnw, mvnw.cmd
│
├── frontend/           # React aplikace
│   ├── src/
│   │   ├── components/                   # UI komponenty
│   │   ├── pages/                        # Stránky aplikace
│   │   ├── hooks/                        # Custom React hooks
│   │   └── lib/                          # Utility funkce
│   ├── package.json
│   └── vite.config.js
│
├── kupiapi/            # Automatické sledování slev
│   ├── FastAPI/        # REST API pro slevy
│   ├── etl/            # ETL služba (Python)
│   ├── database/       # Databázové schéma
│   └── logs/           # Logy služeb
│
└── ios/                # iOS aplikace (Swift)
    └── BugetBites/
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

### Autentizace (`/auth`)

| Metoda | Endpoint | Popis | Auth |
|--------|----------|-------|------|
| `POST` | `/auth/register` | Registrace s emailovou verifikací | ❌ |
| `POST` | `/auth/verify-email` | Ověření emailu kódem | ❌ |
| `POST` | `/auth/login` | Přihlášení (vrací JWT) | ❌ |
| `POST` | `/auth/register-simple` | Jednoduchá registrace bez verifikace | ❌ |
| `POST` | `/auth/resend-verification` | Znovu zaslat verifikační kód | ❌ |
| `GET` | `/auth/verification-status` | Stav verifikace emailu | ❌ |
| `GET` | `/auth/users` | Seznam ověřených uživatelů | ✅ |

### Ostatní

| Metoda | Endpoint | Popis | Auth |
|--------|----------|-------|------|
| `GET` | `/api/hello` | Test endpoint | ❌ |
| `POST` | `/test/email` | Testovací email | ❌ |

## 🏗️ Backend architektura

Backend používá **vrstvovou architekturu**:

```
┌─────────────────────────────────────────────────────────┐
│                    CONTROLLER LAYER                      │
│         (REST API endpoints, request handling)           │
├─────────────────────────────────────────────────────────┤
│                     SERVICE LAYER                        │
│              (Business logic, validation)                │
├─────────────────────────────────────────────────────────┤
│                    DOMAIN LAYER                          │
│            (Entities, Repositories, DTOs)                │
├─────────────────────────────────────────────────────────┤
│                  INFRASTRUCTURE LAYER                    │
│         (Security, Config, External services)            │
└─────────────────────────────────────────────────────────┘
```

| Balíček | Odpovědnost |
|---------|-------------|
| `config` | Konfigurace Spring beans (Security, Mail) |
| `controller` | REST endpointy, validace vstupů |
| `domain.entity` | JPA entity mapované na DB tabulky |
| `domain.repository` | Data Access Layer (Spring Data JPA) |
| `dto.request` | Vstupní objekty z API požadavků |
| `dto.response` | Výstupní objekty pro API odpovědi |
| `exception` | Globální zpracování chyb |
| `security` | JWT autentizace, filtry, UserDetails |
| `service` | Business logika aplikace |

## 💡 Tip pro vývoj

Pro vývoj doporučujem spustit služby v tomto pořadí:
1. `docker-compose up -d` - spustí všechny podporné služby
2. Backend Spring Boot aplikaci
3. Frontend React aplikaci

Databáze se automaticky naplní slevami během prvních 12 hodin, nebo můžete vynutit okamžité stažení pomocí `docker-compose restart kupiapi-etl`.
