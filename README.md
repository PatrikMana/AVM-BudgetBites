# BudgetBites

Full-stack aplikace pro správu rozpočtu - Spring Boot backend + React frontend.

## Struktura projektu

```
AVM-BudgetBites/
├── .gitignore          # Společný gitignore pro celý projekt
├── README.md           # Tento soubor
├── docker-compose.yml  # PostgreSQL databáze
├── backend/            # Spring Boot aplikace
│   ├── src/
│   ├── pom.xml
│   ├── mvnw, mvnw.cmd
│   └── target/
└── frontend/           # React aplikace
    ├── src/
    ├── package.json
    ├── vite.config.js
    └── node_modules/
```

## Spuštění aplikace

### Backend (Spring Boot)
```bash
cd backend
./mvnw spring-boot:run
```
Aplikace běží na: http://localhost:8080

### Frontend (React)
```bash
cd frontend
npm install  # pouze první spuštění
npm run dev
```
Aplikace běží na: http://localhost:5173

### Databáze (PostgreSQL)
```bash
docker-compose up -d
```

## API Endpointy

- `GET /api/hello` - Test endpoint
