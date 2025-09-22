Projekt přeuspořádán

Struktura po přesunu:

- backend/   -> Java Spring Boot projekt (původní obsah přesunut sem)
- frontend/  -> Vite + React aplikace (beze změn)

Jak spustit lokálně:

1) Backend (Java Spring Boot)

cd backend
# build bez testů
./mvnw -DskipTests package
# nebo spustit přímo (spustí aplikaci)
./mvnw spring-boot:run

2) Frontend (Vite + React)

cd frontend/my-app
npm install
npm run dev

Poznámky:
- Příkazy předpokládají Node.js a npm na systémové PATH.
- Projekt byl přesunut pomocí Git (přesun je commitnutý). Pokud chcete jiný layout, dejte vědět.

