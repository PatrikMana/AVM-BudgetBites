Přehled úkolu a stručný plán

Cíl: Napsat jednoduché zadání pro frontend developera — udělat Login a Register (UI + integrace s backendem) a pracovat s JWT tokenem, který platí přesně 5 minut po registraci/přihlášení. Součástí zadání je krok-za-krokem "IQ brambory" setup (Docker PostgreSQL + spuštění backendu).

Checklist (co musí frontend developer udělat)
- [ ] Nastavit lokální PostgreSQL v Dockeru přes přiložené příkazy.
- [ ] Spustit backend (instrukce níže). Backend poskytne endpointy pro registraci a přihlášení.
- [ ] Implementovat stránky/komponenty Register a Login.
- [ ] Po registraci/přihlášení dostat JWT (platnost 5 minut) a uložit ho bezpečně (pro dev: localStorage; pro produkci: domluvit HttpOnly cookie s backendem).
- [ ] Implementovat automatické odhlášení, když token vyprší (po 5 minutách).
- [ ] Po úspěšném přihlášení zavolat endpoint `/auth/users` a zobrazit seznam uživatelů (příklad API volání).

Poznámka: backend v tomto repozitáři má endpointy `/auth/register`, `/auth/login` a `/auth/users`. Aktuálně vrací jen plain text ("Registrace úspěšná" / "Přihlášení úspěšné") — pro JWT fungování potřebuje backend vracet JWT v odpovědi (doporučený JSON tvar dole). Zajistěte s backend devem, že endpointy budou vracet JSON s tokenem a datem expirace (příklad níže). Pokud backend ještě nepodporuje JWT, můžete frontend buildovat tak, aby počítal s následujícím formátem odpovědi a případně si token zastrčit tímto způsobem: { "token": "<JWT>", "expiresAt": 167... }.

1) Jak si nastavit databázi (IQ brambory)
- Co děláme: spouštíme PostgreSQL v Dockeru. Backend v `application.properties` očekává DB na `localhost:5332`, uživatel `admin`, heslo `password`, databáze `budgetbites`.
- Spusť tohle do terminálu (macOS, zsh):

```bash
# stáhne a spustí Postgres na port 5332
docker run --name budgetbites-db \
  -e POSTGRES_DB=budgetbites \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=password \
  -p 5332:5432 \
  -d postgres:15

# zkontroluj logy (volitelné)
docker logs -f budgetbites-db
```

- Ověření (po pár vteřinách, pokud je kontejner up):
```bash
# přihlásí se do db
docker exec -it budgetbites-db psql -U admin -d budgetbites
# v psql pak napiš: \dt   (ukonči: \q)
```

2) Jak spustit backend (IQ brambory)
- Požadavky: JDK 17+ (nebo verze kompatibilní s projektem), příkazový řádek, přístup k internetu pro Maven závislosti.
- Přesun do projektu a spuštění (v kořeni projektu, tam kde je `mvnw`):

```bash
# dej se do adresáře backend (pokud už nejsi) a spusť backend
cd /Users/jakubpluhacek/IdeaProjects/AVM-BudgetBites/backend
./mvnw spring-boot:run

# nebo build + jar
./mvnw package
java -jar target/*.jar
```

- Co očekávat: backend se připojí na PostgreSQL na `jdbc:postgresql://localhost:5332/budgetbites`. Pokud jsi spustil Docker příkaz z předchozího kroku, mělo by to fungovat.

3) API — co frontend očekává (shrnutí z kódu a doporučení)
- Endpointy (aktuální kód):
  - POST /auth/register  — tělo JSON { "username": "...", "password": "..." }
  - POST /auth/login     — tělo JSON { "username": "...", "password": "..." }
  - GET /auth/users      — vrátí list uživatelů (UserResponse: { id, username })

- Současné chování backendu (zkontrolováno v repu):
  - `AuthController.register` a `login` vrací plain text odpovědi. Nevrací JWT.
  - `AuthService` ukládá hesla pomocí BCrypt a `UserRepository` je JPA na Postgres.
  - `SecurityConfig` otevírá `/auth/**` (permitAll) a používá BCrypt PasswordEncoder.

- Požadovaný behavior pro JWT (co požadujeme od backendu):
  - Po úspěšné registraci i přihlášení backend vrátí HTTP 200 s JSON odpovědí:

```json
{
  "token": "<JWT_TU>",
  "expiresAt": "2025-10-20T12:34:56Z"
}
```

  - JWT musí mít nastavené `exp` na 5 minut od vydání.
  - Frontend pak posílá Authorization header u chráněných endpointů:
    Authorization: Bearer <JWT>

- Pokud backend není upravený hned: domluv s backend vývojářem, aby endpointy vracely token; případně si token na frontendu můžeš nasimulovat (jen pro UI development) — ale pro integrované testování je lepší backend upravit.

4) Doporučený minimální backend contract (požadavek, který musí backend splnit pro frontend)
- POST /auth/register
  - Request JSON: { username, password }
  - Response 200 JSON: { token, expiresAt }
  - Status 409 pokud uživatel existuje
- POST /auth/login
  - Request JSON: { username, password }
  - Response 200 JSON: { token, expiresAt }
  - Status 401 pokud špatné údaje
- GET /auth/users
  - Response 200 JSON: [ { id, username }, ... ]
  - Preferované: tento endpoint by měl vyžadovat Authorization header — pokud backend zatím nevyžaduje, frontend i tak posílej header pro budoucí kompatibilitu.

5) Frontend: jednoduché příklady (fetch + React/vanilla) — IQ brambory
- Funkce: register a login

Vanilla JS (fetch):
```javascript
async function register(username, password) {
  const res = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json(); // očekáváme { token, expiresAt }
  saveToken(data.token, data.expiresAt);
}

function saveToken(token, expiresAt) {
  // DEV: localStorage (jednoduché). PROD: HttpOnly cookie (domluvit s backendem)
  localStorage.setItem('bb_token', token);
  localStorage.setItem('bb_token_expires', expiresAt);
  scheduleAutoLogout(new Date(expiresAt));
}

function scheduleAutoLogout(expireDate) {
  const ms = expireDate - new Date();
  if (ms <= 0) {
    logout();
    return;
  }
  setTimeout(() => logout(), ms);
}

function logout() {
  localStorage.removeItem('bb_token');
  localStorage.removeItem('bb_token_expires');
  // redirect to login page
  window.location.href = '/login';
}
```

- Jak získat seznam uživatelů (po přihlášení):
```javascript
async function fetchUsers() {
  const token = localStorage.getItem('bb_token');
  const res = await fetch('/auth/users', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Nepodařilo se načíst uživatele');
  return await res.json();
}
```

- Jak dekódovat exp přímo z JWT (pokud backend nepošle expiresAt):
```javascript
function parseJwt(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch(e) { return null; }
}
// pak: const exp = parseJwt(token)?.exp; // exp je v sekundách od epochy
```

6) Testování (curl) — jak to má fungovat po úpravě backendu
```bash
# registrace
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test1","password":"heslo"}'

# přihlášení
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test1","password":"heslo"}'

# získání uživatelů (po přihlášení, pokud vyžaduje header)
curl http://localhost:8080/auth/users -H "Authorization: Bearer <JWT>"
```

7) Bezpečnostní doporučení (stručně)
- Pro vývoj je OK localStorage. Pro produkci žádej backend, aby token posílal jako HttpOnly Secure cookie (klient nemůže tento cookie číst skriptem, odpadá XSS riziko). Pokud budete používat cookie, frontend s fetch musí mít credentials: 'include'.
- Nikdy neukládejte heslo na frontend.

8) Co očekávám od tebe (frontend dev) v doručení
- Simple UI: dvě stránky/formy (Register, Login), jednoduchá ochrana rout (pokud token chybí, přesměruj na login).
- Po přihlášení zobrazit seznam uživatelů získaný z `/auth/users`.
- Token-handling: uložení, automatický logout po vypršení (5 minut), jednoduché UI pro chybové stavy (409, 401 apod.).
- Krátký README v repo (nebo commit message) jak spustit frontend pro review.

9) Pokud backend ještě nevydává JWT — návrh pro backend vývojáře (rychle)
- Změnit `AuthController.register` a `AuthController.login`, aby místo ResponseEntity<String> vracely ResponseEntity s JSON objektem obsahující `token` a `expiresAt`.
- Vytvořit utilitu pro podepisování JWT (např. jjwt nebo com.auth0:java-jwt), nastavit expiration na 5 minut (300 sekund).

Závěr
- Soubor pro tebe vytvořen — můžeš začít frontend práce podle tohoto zadání. Pokud chceš, mohu také:
  - a) upravit backend tak, aby vracel JWT (mohu to udělat rovnou),
  - b) připravit vzorový malý React app s implementací login/register a token handlingem.

Dej vědět, kterou z těchto dvou věcí chceš, a já to dopíšu/naprogramuju dál.

