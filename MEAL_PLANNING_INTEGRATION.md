# BudgetBites - Integrace Edamam API pro Meal Planning

## Přehled projektu

BudgetBites je webová aplikace, která uživatelům na základě jejich preferencí (kalorie, počet jídel, alergie, diety) plánuje jídelníčky na vybraný týden. Klíčovou funkcí je využití potravin aktuálně ve slevě v českých obchodech (Kaufland, Lidl, Billa, Albert, Penny, Globus) pro vytvoření co nejlevnějšího jídelníčku.

**Heslo:** *Hodně chuti za málo peněz*

---

## Současný stav

### ✅ Hotové komponenty

| Komponenta | Popis | Umístění |
|------------|-------|----------|
| **Backend (Spring Boot)** | Autentizace, JWT, email verifikace | `backend/` |
| **User Entity** | Registrace, login, reset hesla | `backend/.../domain/entity/User.java` |
| **KupiAPI Bridge** | FastAPI scraper pro stahování slev | `kupiapi/FastAPI/` |
| **ETL Service** | Automatické ukládání slev do DB | `kupiapi/etl/` |
| **PostgreSQL** | Tabulka `discounts` se slevami | `kupiapi/database/schema.sql` |
| **Docker Compose** | Orchestrace všech služeb | `docker-compose.yml` |

### 📦 Databáze slev

Tabulka `discounts` obsahuje:
- `product_name` - Název produktu
- `price` / `original_price` - Ceny
- `discount_percentage` - Procento slevy
- `shop_name` - Obchod (lidl, kaufland, billa, albert, penny, globus)
- `category` - Kategorie (maso-drubez-a-ryby, mlecne-vyrobky-a-vejce, ovoce-a-zelenina, atd.)
- `valid_from` / `valid_until` - Platnost slevy
- `is_food` - Pouze potravinové produkty

---

## Edamam API

### Dostupné API služby

| API | Popis | Tier |
|-----|-------|------|
| **Recipe Search API** | Vyhledávání receptů podle ingrediencí, diet, alergií | Free (10k req/měsíc) |
| **Nutrition Analysis API** | Analýza nutričních hodnot | Free (100 req/den) |
| **Meal Planner API** | Automatické plánování jídelníčků | Premium |
| **Food Database API** | Databáze potravin a nutričních hodnot | Free (200 req/den) |

### Dokumentace

- **Recipe Search API:** https://developer.edamam.com/edamam-docs-recipe-api
- **Meal Planner API:** https://developer.edamam.com/edamam-docs-meal-planner-api
- **Nutrition Analysis:** https://developer.edamam.com/edamam-docs-nutrition-api

### Doporučená strategie

**Primární:** Recipe Search API (free tier) s vlastní logikou pro meal planning
**Alternativa:** Meal Planner API (pokud máme premium přístup)

---

## Implementační plán

### Fáze 1: Příprava backendu

#### 1.1 Flow generování jídelníčku

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    GENERÁTOR JÍDELNÍČKU                              │   │
│  │                                                                       │   │
│  │  1. Výběr týdne (datum od-do)                                        │   │
│  │  2. Počet jídel denně (3-5)                                          │   │
│  │  3. Cílové kalorie (slider 1200-3500)                                │   │
│  │  4. Alergie (checkboxy: lepek, laktóza, ořechy, vejce, ...)         │   │
│  │  5. Dieta (radio: balanced, high-protein, low-carb, vegan, ...)     │   │
│  │  6. Preferované obchody (checkboxy: Lidl, Kaufland, Billa, ...)     │   │
│  │  7. Týdenní rozpočet (volitelné)                                     │   │
│  │                                                                       │   │
│  │  [Generovat jídelníček]                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ POST /api/meal-plan/generate
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                         │
│                                                                              │
│  1. Přijmout request s preferencemi (NE uloženými, ale aktuálními)         │
│  2. Získat slevy z DB pro vybraný týden                                     │
│  3. Zavolat Edamam API s preferencemi + ingrediencemi ze slev              │
│  4. Sestavit jídelníček (recepty kde zlevněná potravina = hlavní složka)   │
│  5. Vygenerovat NÁKUPNÍ SEZNAM:                                             │
│     - Zlevněné položky (seskupené podle obchodů)                           │
│     - Běžné položky (co není ve slevě, ale je potřeba dokoupit)            │
│  6. ULOŽIT jídelníček + nákupní seznam do DB (vazba na uživatele)          │
│  7. Vrátit jídelníček + nákupní seznam klientovi                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABÁZE                                        │
│                                                                              │
│  meal_plans (uložené jídelníčky)                                            │
│  meal_plan_days (dny v jídelníčku)                                          │
│  meal_plan_meals (jednotlivá jídla)                                         │
│  shopping_list_items (položky nákupního seznamu)                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 1.1.1 Logika výběru receptů

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VÝBĚR RECEPTŮ - PRIORITIZACE SLEV                        │
│                                                                              │
│  Zlevněné produkty z DB:                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • Kuřecí prsa (Lidl, -30%)  ──────────► HLAVNÍ INGREDIENCE        │   │
│  │  • Mleté maso (Kaufland, -25%)                                       │   │
│  │  • Losos (Billa, -20%)                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│  Edamam vyhledá recepty kde tyto produkty jsou HLAVNÍ složkou:              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Recept: "Kuřecí prsa na paprice"                                    │   │
│  │  ├── Kuřecí prsa (500g)     ◄─── ZLEVNĚNO (Lidl, 89 Kč)             │   │
│  │  ├── Paprika (2ks)          ◄─── ZLEVNĚNO (Lidl, 15 Kč) nebo běžné  │   │
│  │  ├── Cibule (1ks)               ─── BĚŽNÉ (předpoklad: doma/levné)  │   │
│  │  ├── Smetana (200ml)            ─── BĚŽNÉ                           │   │
│  │  ├── Mouka (1 lžíce)            ─── ZÁKLADNÍ (předpoklad: doma)     │   │
│  │  ├── Sůl, pepř                  ─── ZÁKLADNÍ (předpoklad: doma)     │   │
│  │  └── Olej                       ─── ZÁKLADNÍ (předpoklad: doma)     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Kategorizace ingrediencí:                                                   │
│  • ZLEVNĚNO    - nalezeno v DB slev, přidáno do nákupního seznamu          │
│  • BĚŽNÉ       - není ve slevě, ale potřeba koupit → nákupní seznam        │
│  • ZÁKLADNÍ    - běžné suroviny (mouka, sůl, olej) → volitelně zobrazit    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 1.1.2 Struktura nákupního seznamu

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NÁKUPNÍ SEZNAM - TÝDEN 24.2. - 2.3.                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🏷️ VE SLEVĚ (ušetříte 247 Kč)                                             │
│  ├── LIDL                                                                   │
│  │   ├── Kuřecí prsa 1kg           89 Kč  (původně 129 Kč, -31%)           │
│  │   ├── Paprika mix 500g          29 Kč  (původně 45 Kč, -36%)            │
│  │   └── Jogurt bílý 400g          15 Kč  (původně 22 Kč, -32%)            │
│  │                                 ─────                                    │
│  │                          Celkem: 133 Kč                                  │
│  │                                                                          │
│  ├── KAUFLAND                                                               │
│  │   ├── Mleté maso 500g           79 Kč  (původně 109 Kč, -28%)           │
│  │   └── Rajčata 1kg               35 Kč  (původně 49 Kč, -29%)            │
│  │                                 ─────                                    │
│  │                          Celkem: 114 Kč                                  │
│  │                                                                          │
│  └── BILLA                                                                  │
│      └── Losos 200g               119 Kč  (původně 159 Kč, -25%)           │
│                                                                              │
│  📦 OSTATNÍ (běžné ceny)                                                    │
│  ├── Smetana na vaření 200ml       ~25 Kč                                  │
│  ├── Cibule 3ks                    ~15 Kč                                  │
│  ├── Česnek 1 hlávka               ~12 Kč                                  │
│  ├── Těstoviny 500g                ~35 Kč                                  │
│  └── Rýže 1kg                      ~45 Kč                                  │
│                                    ─────                                    │
│                             Celkem: ~132 Kč                                 │
│                                                                              │
│  🏠 ZÁKLADNÍ SUROVINY (předpoklad: máte doma)                              │
│  ├── Mouka, Sůl, Pepř, Olej, Máslo, Koření                                 │
│  └── (Pokud nemáte, přidejte do běžného nákupu)                            │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  💰 CELKOVÁ ODHADOVANÁ CENA: 498 Kč                                        │
│  💸 UŠETŘENO DÍKY SLEVÁM: 247 Kč                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 1.2 Request DTO pro generování

Preference přicházejí přímo v requestu (uživatel je naklíká ve frontendu):

**Soubor:** `backend/src/main/java/com/example/budgetbites/dto/request/GenerateMealPlanRequest.java`

```java
public class GenerateMealPlanRequest {
    
    // Období jídelníčku
    @NotNull
    private LocalDate weekStart;
    
    @NotNull
    private LocalDate weekEnd;
    
    // Nutriční cíle
    @Min(1000) @Max(5000)
    private Integer dailyCalories;          // Cílové kalorie/den (např. 2000)
    
    @Min(2) @Max(6)
    private Integer mealsPerDay;            // Počet jídel/den (např. 3-5)
    
    // Alergie (Edamam Health Labels)
    private Set<String> allergies;          // dairy-free, gluten-free, peanut-free, etc.
    
    // Dieta (Edamam Diet Labels)
    private String diet;                    // balanced, high-protein, low-carb, vegan, etc.
    
    // Preferované obchody
    private Set<String> preferredShops;     // lidl, kaufland, billa, etc.
    
    // Rozpočet (volitelné)
    private BigDecimal weeklyBudget;        // Týdenní rozpočet v Kč
}
```

#### 1.3 Entita `MealPlan` (uložený jídelníček)

Vygenerovaný jídelníček se uloží do databáze pod účet uživatele.

**Soubor:** `backend/src/main/java/com/example/budgetbites/domain/entity/MealPlan.java`

```java
@Entity
@Table(name = "meal_plans")
public class MealPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Období
    private LocalDate weekStart;
    private LocalDate weekEnd;
    
    // Preference použité při generování (pro historii)
    private Integer dailyCalories;
    private Integer mealsPerDay;
    private String diet;
    
    @ElementCollection
    private Set<String> allergies;
    
    @ElementCollection
    private Set<String> preferredShops;
    
    private BigDecimal weeklyBudget;
    
    // Vypočtené hodnoty
    private BigDecimal totalEstimatedCost;
    private Integer totalCalories;
    
    // Dny jídelníčku
    @OneToMany(mappedBy = "mealPlan", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MealPlanDay> days = new ArrayList<>();
    
    // Metadata
    private LocalDateTime generatedAt;
    private LocalDateTime updatedAt;
    
    @Enumerated(EnumType.STRING)
    private MealPlanStatus status;  // ACTIVE, ARCHIVED, DELETED
}

public enum MealPlanStatus {
    ACTIVE,      // Aktuální aktivní jídelníček
    ARCHIVED,    // Starý jídelníček (historie)
    DELETED      // Smazaný uživatelem
}
```

#### 1.4 Entita `MealPlanDay` (den v jídelníčku)

**Soubor:** `backend/src/main/java/com/example/budgetbites/domain/entity/MealPlanDay.java`

```java
@Entity
@Table(name = "meal_plan_days")
public class MealPlanDay {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_plan_id", nullable = false)
    private MealPlan mealPlan;

    private LocalDate date;
    private Integer dayIndex;  // 0-6 (pondělí-neděle)
    
    private Integer totalCalories;
    private BigDecimal estimatedCost;
    
    @OneToMany(mappedBy = "mealPlanDay", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MealPlanMeal> meals = new ArrayList<>();
}
```

#### 1.5 Entita `MealPlanMeal` (jednotlivé jídlo)

**Soubor:** `backend/src/main/java/com/example/budgetbites/domain/entity/MealPlanMeal.java`

```java
@Entity
@Table(name = "meal_plan_meals")
public class MealPlanMeal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_plan_day_id", nullable = false)
    private MealPlanDay mealPlanDay;

    @Enumerated(EnumType.STRING)
    private MealType mealType;  // BREAKFAST, LUNCH, DINNER, SNACK
    
    // Data z Edamam
    private String recipeUri;           // Edamam recipe URI pro případné znovunačtení
    private String recipeName;
    private String recipeImageUrl;
    private String recipeSourceUrl;     // Odkaz na originální recept
    
    private Integer calories;
    private Integer servings;
    
    // Nutriční hodnoty (z Edamam)
    private Double protein;
    private Double carbs;
    private Double fat;
    private Double fiber;
    
    // Ingredience jako JSON (pro zobrazení)
    @Column(columnDefinition = "TEXT")
    private String ingredientsJson;
    
    // Zlevněné ingredience jako JSON
    @Column(columnDefinition = "TEXT")
    private String discountedIngredientsJson;
    
    private BigDecimal estimatedCost;
}

public enum MealType {
    BREAKFAST("Snídaně"),
    MORNING_SNACK("Dopolední svačina"),
    LUNCH("Oběd"),
    AFTERNOON_SNACK("Odpolední svačina"),
    DINNER("Večeře");
    
    private final String displayName;
    
    MealType(String displayName) {
        this.displayName = displayName;
    }
}
```

#### 1.6 Entita `ShoppingListItem` (položka nákupního seznamu)

**Soubor:** `backend/src/main/java/com/example/budgetbites/domain/entity/ShoppingListItem.java`

```java
@Entity
@Table(name = "shopping_list_items")
public class ShoppingListItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_plan_id", nullable = false)
    private MealPlan mealPlan;

    // Název ingredience
    private String ingredientName;
    private String ingredientNameCz;  // Český název pro zobrazení
    
    // Množství
    private Double quantity;
    private String unit;              // kg, g, ks, l, ml, etc.
    
    // Typ položky
    @Enumerated(EnumType.STRING)
    private ShoppingItemType itemType;  // DISCOUNTED, REGULAR, BASIC
    
    // Pro zlevněné položky - info o slevě
    private String shopName;          // Kde koupit (lidl, kaufland, etc.)
    private BigDecimal price;         // Aktuální cena
    private BigDecimal originalPrice; // Původní cena
    private Integer discountPercentage;
    
    // Pro běžné položky - odhadovaná cena
    private BigDecimal estimatedPrice;
    
    // Kategorie pro seskupení
    private String category;          // maso, mléčné, zelenina, etc.
    
    // Které recepty tuto ingredienci potřebují
    @ElementCollection
    private List<String> usedInRecipes;
    
    // Zda už uživatel položku "odškrtl"
    private boolean checked = false;
}

public enum ShoppingItemType {
    DISCOUNTED("Ve slevě"),      // Nalezeno v DB slev
    REGULAR("Běžná cena"),        // Potřeba koupit, není ve slevě
    BASIC("Základní surovina");   // Mouka, sůl, olej - předpoklad že má doma
    
    private final String displayName;
    
    ShoppingItemType(String displayName) {
        this.displayName = displayName;
    }
}
```

#### 1.7 Aktualizace entity `MealPlan` - vazba na nákupní seznam

```java
@Entity
@Table(name = "meal_plans")
public class MealPlan {
    // ... existující kód ...
    
    // Nákupní seznam
    @OneToMany(mappedBy = "mealPlan", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ShoppingListItem> shoppingList = new ArrayList<>();
    
    // Vypočtené hodnoty pro nákupní seznam
    private BigDecimal totalDiscountedCost;   // Cena zlevněných položek
    private BigDecimal totalRegularCost;      // Cena běžných položek
    private BigDecimal totalSavings;          // Kolik uživatel ušetří
}
```
```

#### 1.6 Edamam konfigurace

**Soubor:** `backend/src/main/resources/application.properties`

```properties
# Edamam API Configuration
edamam.recipe.app-id=${EDAMAM_RECIPE_APP_ID}
edamam.recipe.app-key=${EDAMAM_RECIPE_APP_KEY}
edamam.recipe.base-url=https://api.edamam.com/api/recipes/v2
```

**Soubor:** `backend/src/main/java/com/example/budgetbites/config/EdamamConfig.java`

```java
@Configuration
public class EdamamConfig {
    
    @Value("${edamam.recipe.app-id}")
    private String recipeAppId;
    
    @Value("${edamam.recipe.app-key}")
    private String recipeAppKey;
    
    @Value("${edamam.recipe.base-url}")
    private String recipeBaseUrl;
    
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
    
    // Gettery
    public String getRecipeAppId() { return recipeAppId; }
    public String getRecipeAppKey() { return recipeAppKey; }
    public String getRecipeBaseUrl() { return recipeBaseUrl; }
}
```

#### 1.8 Databázové schéma

```sql
-- Hlavní tabulka jídelníčků
CREATE TABLE IF NOT EXISTS meal_plans (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    
    -- Preference použité při generování
    daily_calories INTEGER,
    meals_per_day INTEGER,
    diet VARCHAR(50),
    weekly_budget DECIMAL(10,2),
    
    -- Vypočtené hodnoty - jídelníček
    total_estimated_cost DECIMAL(10,2),
    total_calories INTEGER,
    
    -- Vypočtené hodnoty - nákupní seznam
    total_discounted_cost DECIMAL(10,2),
    total_regular_cost DECIMAL(10,2),
    total_savings DECIMAL(10,2),
    
    -- Status a metadata
    status VARCHAR(20) DEFAULT 'ACTIVE',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alergie pro jídelníček (ElementCollection)
CREATE TABLE IF NOT EXISTS meal_plan_allergies (
    meal_plan_id BIGINT REFERENCES meal_plans(id) ON DELETE CASCADE,
    allergy VARCHAR(50)
);

-- Preferované obchody (ElementCollection)
CREATE TABLE IF NOT EXISTS meal_plan_shops (
    meal_plan_id BIGINT REFERENCES meal_plans(id) ON DELETE CASCADE,
    shop VARCHAR(50)
);

-- Dny v jídelníčku
CREATE TABLE IF NOT EXISTS meal_plan_days (
    id SERIAL PRIMARY KEY,
    meal_plan_id BIGINT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
    
    date DATE NOT NULL,
    day_index INTEGER NOT NULL,  -- 0-6
    
    total_calories INTEGER,
    estimated_cost DECIMAL(10,2)
);

-- Jednotlivá jídla
CREATE TABLE IF NOT EXISTS meal_plan_meals (
    id SERIAL PRIMARY KEY,
    meal_plan_day_id BIGINT NOT NULL REFERENCES meal_plan_days(id) ON DELETE CASCADE,
    
    meal_type VARCHAR(20) NOT NULL,  -- BREAKFAST, LUNCH, DINNER, SNACK
    
    -- Edamam data
    recipe_uri VARCHAR(500),
    recipe_name VARCHAR(300),
    recipe_image_url VARCHAR(500),
    recipe_source_url VARCHAR(500),
    
    calories INTEGER,
    servings INTEGER,
    
    -- Nutriční hodnoty
    protein DECIMAL(8,2),
    carbs DECIMAL(8,2),
    fat DECIMAL(8,2),
    fiber DECIMAL(8,2),
    
    -- JSON data
    ingredients_json TEXT,
    discounted_ingredients_json TEXT,
    
    estimated_cost DECIMAL(10,2)
);

-- Nákupní seznam
CREATE TABLE IF NOT EXISTS shopping_list_items (
    id SERIAL PRIMARY KEY,
    meal_plan_id BIGINT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
    
    -- Ingredience
    ingredient_name VARCHAR(200) NOT NULL,
    ingredient_name_cz VARCHAR(200),
    
    -- Množství
    quantity DECIMAL(10,2),
    unit VARCHAR(20),
    
    -- Typ položky: DISCOUNTED, REGULAR, BASIC
    item_type VARCHAR(20) NOT NULL,
    
    -- Pro zlevněné položky
    shop_name VARCHAR(50),
    price DECIMAL(10,2),
    original_price DECIMAL(10,2),
    discount_percentage INTEGER,
    
    -- Pro běžné položky
    estimated_price DECIMAL(10,2),
    
    -- Kategorie
    category VARCHAR(50),
    
    -- Stav
    checked BOOLEAN DEFAULT FALSE
);

-- Které recepty používají danou ingredienci
CREATE TABLE IF NOT EXISTS shopping_item_recipes (
    shopping_list_item_id BIGINT REFERENCES shopping_list_items(id) ON DELETE CASCADE,
    recipe_name VARCHAR(300)
);

-- Indexy
CREATE INDEX idx_meal_plans_user ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_status ON meal_plans(status);
CREATE INDEX idx_meal_plans_week ON meal_plans(week_start, week_end);
CREATE INDEX idx_meal_plan_days_plan ON meal_plan_days(meal_plan_id);
CREATE INDEX idx_meal_plan_meals_day ON meal_plan_meals(meal_plan_day_id);
CREATE INDEX idx_shopping_list_plan ON shopping_list_items(meal_plan_id);
CREATE INDEX idx_shopping_list_type ON shopping_list_items(item_type);
CREATE INDEX idx_shopping_list_shop ON shopping_list_items(shop_name);
```

---

### Fáze 2: Služby pro slevy a recepty

#### 2.1 `DiscountService`

Služba pro získávání aktuálních slev z databáze.

**Soubor:** `backend/src/main/java/com/example/budgetbites/service/DiscountService.java`

```java
@Service
public class DiscountService {
    
    @Autowired
    private DiscountRepository discountRepository;
    
    /**
     * Získá nejlepší slevy pro daný týden a obchody.
     */
    public List<Discount> getDiscountsForWeek(LocalDate weekStart, Set<String> shops) {
        return discountRepository.findActiveDiscounts(weekStart, shops);
    }
    
    /**
     * Seskupí slevy podle kategorií pro meal planning.
     */
    public Map<String, List<Discount>> getDiscountsByCategory(LocalDate weekStart) {
        // maso-drubez-a-ryby, mlecne-vyrobky-a-vejce, ovoce-a-zelenina, etc.
    }
    
    /**
     * Vrátí top N produktů s nejvyšší slevou.
     */
    public List<Discount> getTopDiscounts(int limit, Set<String> categories) {
        // Produkty seřazené podle discount_percentage DESC
    }
}
```

#### 2.2 `EdamamService`

Služba pro komunikaci s Edamam API.

**Soubor:** `backend/src/main/java/com/example/budgetbites/service/EdamamService.java`

```java
@Service
public class EdamamService {
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    private EdamamConfig edamamConfig;
    
    /**
     * Vyhledá recepty podle ingrediencí a preferencí.
     * 
     * Edamam Recipe Search API endpoint:
     * GET /api/recipes/v2?type=public&q={query}&app_id={id}&app_key={key}
     *     &health={allergy}&diet={diet}&calories={min}-{max}
     */
    public List<Recipe> searchRecipes(
        List<String> ingredients,    // Zlevněné produkty jako ingredience
        Set<String> healthLabels,    // dairy-free, gluten-free, etc.
        Set<String> dietLabels,      // balanced, high-protein, etc.
        int minCalories,
        int maxCalories
    ) {
        // Sestavení URL s query parametry
        // Volání Edamam API
        // Parsování odpovědi
    }
    
    /**
     * Získá detail receptu podle URI.
     */
    public Recipe getRecipeByUri(String recipeUri) {
        // GET /api/recipes/v2/by-uri?uri={uri}
    }
}
```

---

### Fáze 3: Meal Planning logika

#### 3.1 `ShoppingListService`

Služba pro generování nákupního seznamu z receptů.

**Soubor:** `backend/src/main/java/com/example/budgetbites/service/ShoppingListService.java`

```java
@Service
public class ShoppingListService {
    
    @Autowired
    private DiscountService discountService;
    
    // Základní suroviny které se předpokládá že uživatel má doma
    private static final Set<String> BASIC_INGREDIENTS = Set.of(
        "salt", "pepper", "oil", "olive oil", "vegetable oil",
        "flour", "sugar", "butter", "garlic", "onion",
        "herbs", "spices", "vinegar", "soy sauce"
    );
    
    /**
     * Generuje nákupní seznam ze všech receptů v jídelníčku.
     * 
     * Algoritmus:
     * 1. Extrahuje všechny ingredience ze všech receptů
     * 2. Agreguje množství stejných ingrediencí
     * 3. Pro každou ingredienci zjistí zda je ve slevě
     * 4. Kategorizuje: DISCOUNTED / REGULAR / BASIC
     * 5. Seskupí zlevněné položky podle obchodů
     */
    public List<ShoppingListItem> generateShoppingList(
        MealPlan mealPlan,
        List<EdamamRecipe> recipes,
        List<Discount> availableDiscounts
    ) {
        // 1. Extrakce a agregace ingrediencí
        Map<String, AggregatedIngredient> aggregated = new HashMap<>();
        
        for (EdamamRecipe recipe : recipes) {
            for (EdamamIngredient ing : recipe.getIngredients()) {
                String key = normalizeIngredientName(ing.getFood());
                aggregated.merge(key, 
                    new AggregatedIngredient(ing),
                    (existing, newIng) -> existing.addQuantity(newIng)
                );
                aggregated.get(key).addRecipe(recipe.getLabel());
            }
        }
        
        // 2. Kategorizace a přiřazení slev
        List<ShoppingListItem> items = new ArrayList<>();
        
        for (AggregatedIngredient agg : aggregated.values()) {
            ShoppingListItem item = new ShoppingListItem();
            item.setMealPlan(mealPlan);
            item.setIngredientName(agg.getName());
            item.setIngredientNameCz(translateToCzech(agg.getName()));
            item.setQuantity(agg.getTotalQuantity());
            item.setUnit(agg.getUnit());
            item.setUsedInRecipes(agg.getRecipes());
            
            // Zjistit typ položky
            if (isBasicIngredient(agg.getName())) {
                item.setItemType(ShoppingItemType.BASIC);
                item.setEstimatedPrice(BigDecimal.ZERO);
            } else {
                // Hledat ve slevách
                Optional<Discount> discount = findMatchingDiscount(
                    agg.getName(), availableDiscounts
                );
                
                if (discount.isPresent()) {
                    Discount d = discount.get();
                    item.setItemType(ShoppingItemType.DISCOUNTED);
                    item.setShopName(d.getShopName());
                    item.setPrice(d.getPrice());
                    item.setOriginalPrice(d.getOriginalPrice());
                    item.setDiscountPercentage(d.getDiscountPercentage());
                } else {
                    item.setItemType(ShoppingItemType.REGULAR);
                    item.setEstimatedPrice(estimatePrice(agg.getName()));
                }
            }
            
            item.setCategory(categorizeIngredient(agg.getName()));
            items.add(item);
        }
        
        return items;
    }
    
    /**
     * Hledá odpovídající slevu pro ingredienci.
     * Používá fuzzy matching pro české názvy produktů.
     */
    private Optional<Discount> findMatchingDiscount(
        String ingredientName, 
        List<Discount> discounts
    ) {
        // "chicken breast" -> hledá "kuřecí prsa" v discounts
        String czechName = translateToCzech(ingredientName);
        
        return discounts.stream()
            .filter(d -> matchesIngredient(d.getProductName(), ingredientName, czechName))
            .max(Comparator.comparing(Discount::getDiscountPercentage));
    }
    
    /**
     * Kontroluje zda je ingredience základní (předpoklad: doma).
     */
    private boolean isBasicIngredient(String name) {
        return BASIC_INGREDIENTS.stream()
            .anyMatch(basic -> name.toLowerCase().contains(basic));
    }
}
```

#### 3.2 `MealPlanService`

Hlavní služba pro generování jídelníčků.

**Soubor:** `backend/src/main/java/com/example/budgetbites/service/MealPlanService.java`

```java
@Service
@Transactional
public class MealPlanService {
    
    @Autowired
    private DiscountService discountService;
    
    @Autowired
    private EdamamService edamamService;
    
    @Autowired
    private ShoppingListService shoppingListService;
    
    @Autowired
    private MealPlanRepository mealPlanRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Generuje týdenní jídelníček pro uživatele.
     * Preference přicházejí přímo v requestu z frontendu.
     * Vygenerovaný jídelníček + nákupní seznam se uloží do DB.
     * 
     * Algoritmus:
     * 1. Validace requestu a načtení uživatele
     * 2. Získá aktuální slevy pro vybraný týden a obchody
     * 3. Mapuje zlevněné produkty na Edamam ingredience
     * 4. Volá Edamam Recipe Search API s ingrediencemi a preferencemi
     *    - Hledá recepty kde ZLEVNĚNÝ produkt je HLAVNÍ ingredience
     * 5. Sestaví denní plány s respektováním nutričních cílů
     * 6. GENERUJE NÁKUPNÍ SEZNAM:
     *    - Zlevněné položky (seskupené podle obchodů)
     *    - Běžné položky (potřeba dokoupit)
     *    - Základní suroviny (předpoklad: doma)
     * 7. Kalkuluje celkovou cenu a úspory
     * 8. ULOŽÍ jídelníček + nákupní seznam do databáze
     * 9. Vrátí strukturovaný jídelníček s nákupním seznamem
     */
    public MealPlan generateMealPlan(Long userId, GenerateMealPlanRequest request) {
        
        // 1. Načtení uživatele
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // 2. Získání slev pro vybraný týden a obchody
        List<Discount> discounts = discountService.getDiscountsForWeek(
            request.getWeekStart(),
            request.getWeekEnd(),
            request.getPreferredShops()
        );
        
        // 3. Mapování na ingredience (CZ -> EN)
        // Prioritně vybíráme produkty s nejvyšší slevou
        List<String> priorityIngredients = mapDiscountsToIngredients(
            discounts.stream()
                .sorted(Comparator.comparing(Discount::getDiscountPercentage).reversed())
                .limit(20)  // Top 20 nejlepších slev
                .collect(Collectors.toList())
        );
        
        // 4. Vyhledání receptů pro každý typ jídla
        // Hledáme recepty kde zlevněná potravina je HLAVNÍ složkou
        int caloriesPerMeal = request.getDailyCalories() / request.getMealsPerDay();
        
        List<EdamamRecipe> allRecipes = new ArrayList<>();
        Map<MealType, List<EdamamRecipe>> recipesByMealType = new HashMap<>();
        
        for (MealType mealType : getMealTypesForCount(request.getMealsPerDay())) {
            List<EdamamRecipe> recipes = edamamService.searchRecipes(
                priorityIngredients,
                request.getAllergies(),
                request.getDiet(),
                caloriesPerMeal - 150,
                caloriesPerMeal + 150,
                mealType
            );
            recipesByMealType.put(mealType, recipes);
            allRecipes.addAll(recipes);
        }
        
        // 5. Sestavení jídelníčku (7 dní)
        MealPlan mealPlan = new MealPlan();
        mealPlan.setUser(user);
        mealPlan.setWeekStart(request.getWeekStart());
        mealPlan.setWeekEnd(request.getWeekEnd());
        mealPlan.setDailyCalories(request.getDailyCalories());
        mealPlan.setMealsPerDay(request.getMealsPerDay());
        mealPlan.setDiet(request.getDiet());
        mealPlan.setAllergies(request.getAllergies());
        mealPlan.setPreferredShops(request.getPreferredShops());
        mealPlan.setWeeklyBudget(request.getWeeklyBudget());
        mealPlan.setGeneratedAt(LocalDateTime.now());
        mealPlan.setStatus(MealPlanStatus.ACTIVE);
        
        // Archivovat předchozí aktivní jídelníčky uživatele
        mealPlanRepository.archiveUserActivePlans(userId);
        
        // Sestavit dny a jídla
        List<MealPlanDay> days = buildDays(
            mealPlan, 
            request, 
            recipesByMealType, 
            discounts
        );
        mealPlan.setDays(days);
        
        // 6. GENEROVÁNÍ NÁKUPNÍHO SEZNAMU
        List<ShoppingListItem> shoppingList = shoppingListService.generateShoppingList(
            mealPlan,
            allRecipes,
            discounts
        );
        mealPlan.setShoppingList(shoppingList);
        
        // 7. Vypočítat celkové hodnoty
        mealPlan.setTotalCalories(calculateTotalCalories(days));
        
        // Kalkulace cen
        BigDecimal discountedCost = shoppingList.stream()
            .filter(i -> i.getItemType() == ShoppingItemType.DISCOUNTED)
            .map(ShoppingListItem::getPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal regularCost = shoppingList.stream()
            .filter(i -> i.getItemType() == ShoppingItemType.REGULAR)
            .map(ShoppingListItem::getEstimatedPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal savings = shoppingList.stream()
            .filter(i -> i.getItemType() == ShoppingItemType.DISCOUNTED && i.getOriginalPrice() != null)
            .map(i -> i.getOriginalPrice().subtract(i.getPrice()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        mealPlan.setTotalDiscountedCost(discountedCost);
        mealPlan.setTotalRegularCost(regularCost);
        mealPlan.setTotalEstimatedCost(discountedCost.add(regularCost));
        mealPlan.setTotalSavings(savings);
        
        // 8. Uložit do databáze
        mealPlan = mealPlanRepository.save(mealPlan);
        
        return mealPlan;
    }
    
    /**
     * Vrátí aktivní jídelníček uživatele (nebo null pokud nemá).
     */
    public Optional<MealPlan> getActiveMealPlan(Long userId) {
        return mealPlanRepository.findByUserIdAndStatus(userId, MealPlanStatus.ACTIVE);
    }
    
    /**
     * Vrátí historii jídelníčků uživatele.
     */
    public List<MealPlan> getMealPlanHistory(Long userId) {
        return mealPlanRepository.findByUserIdOrderByGeneratedAtDesc(userId);
    }
    
    /**
     * Regeneruje konkrétní den v jídelníčku.
     */
    public MealPlanDay regenerateDay(Long mealPlanId, int dayIndex, Long userId) {
        // Načíst existující jídelníček
        // Znovu zavolat Edamam pro daný den
        // Aktualizovat v DB
    }
    
    /**
     * Mapuje české názvy produktů na anglické ingredience pro Edamam.
     */
    private List<String> mapDiscountsToIngredients(List<Discount> discounts) {
        // "Kuřecí prsa" -> "chicken breast"
        // "Mléko polotučné" -> "milk"
        // Použití CategoryMapper
    }
    
    /**
     * Vrátí typy jídel podle počtu jídel denně.
     */
    private List<MealType> getMealTypesForCount(int mealsPerDay) {
        return switch (mealsPerDay) {
            case 3 -> List.of(MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER);
            case 4 -> List.of(MealType.BREAKFAST, MealType.LUNCH, MealType.AFTERNOON_SNACK, MealType.DINNER);
            case 5 -> List.of(MealType.BREAKFAST, MealType.MORNING_SNACK, MealType.LUNCH, MealType.AFTERNOON_SNACK, MealType.DINNER);
            default -> List.of(MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER);
        };
    }
}
```

#### 3.2 Mapování kategorií

Slovník pro mapování českých kategorií/produktů na Edamam query:

```java
public class CategoryMapper {
    
    private static final Map<String, List<String>> CATEGORY_TO_INGREDIENTS = Map.of(
        "maso-drubez-a-ryby", List.of("chicken", "beef", "pork", "fish", "turkey"),
        "mlecne-vyrobky-a-vejce", List.of("milk", "cheese", "yogurt", "eggs", "butter"),
        "ovoce-a-zelenina", List.of("apple", "banana", "carrot", "tomato", "potato"),
        "pecivo", List.of("bread", "rolls", "pastry"),
        "mrazene-a-instantni-potraviny", List.of("frozen vegetables", "pizza", "ice cream")
    );
    
    // Rozšířený slovník pro konkrétní produkty
    private static final Map<String, String> PRODUCT_TO_INGREDIENT = Map.of(
        "kuřecí prsa", "chicken breast",
        "vepřová kýta", "pork leg",
        "hovězí mleté", "ground beef",
        "mléko polotučné", "milk",
        "sýr eidam", "edam cheese"
        // ... další mapování
    );
}
```

---

### Fáze 4: REST API endpointy

#### 4.1 `MealPlanController`

**Soubor:** `backend/src/main/java/com/example/budgetbites/controller/MealPlanController.java`

```java
@RestController
@RequestMapping("/api/meal-plan")
public class MealPlanController {
    
    @Autowired
    private MealPlanService mealPlanService;
    
    /**
     * POST /api/meal-plan/generate
     * 
     * Generuje nový jídelníček pro uživatele.
     * Preference přicházejí v request body (uživatel je naklíká ve frontendu).
     * Vygenerovaný jídelníček se automaticky uloží do databáze.
     */
    @PostMapping("/generate")
    public ResponseEntity<MealPlanResponse> generateMealPlan(
        @Valid @RequestBody GenerateMealPlanRequest request,
        @AuthenticationPrincipal User user
    ) {
        MealPlan plan = mealPlanService.generateMealPlan(user.getId(), request);
        return ResponseEntity.ok(MealPlanResponse.fromEntity(plan));
    }
    
    /**
     * GET /api/meal-plan/active
     * 
     * Vrátí aktuální aktivní jídelníček uživatele (pokud existuje).
     */
    @GetMapping("/active")
    public ResponseEntity<MealPlanResponse> getActiveMealPlan(
        @AuthenticationPrincipal User user
    ) {
        return mealPlanService.getActiveMealPlan(user.getId())
            .map(plan -> ResponseEntity.ok(MealPlanResponse.fromEntity(plan)))
            .orElse(ResponseEntity.noContent().build());
    }
    
    /**
     * GET /api/meal-plan/history
     * 
     * Vrátí historii všech jídelníčků uživatele.
     */
    @GetMapping("/history")
    public ResponseEntity<List<MealPlanSummaryResponse>> getMealPlanHistory(
        @AuthenticationPrincipal User user
    ) {
        List<MealPlan> plans = mealPlanService.getMealPlanHistory(user.getId());
        List<MealPlanSummaryResponse> summaries = plans.stream()
            .map(MealPlanSummaryResponse::fromEntity)
            .collect(Collectors.toList());
        return ResponseEntity.ok(summaries);
    }
    
    /**
     * GET /api/meal-plan/{id}
     * 
     * Vrátí detail konkrétního jídelníčku.
     */
    @GetMapping("/{id}")
    public ResponseEntity<MealPlanResponse> getMealPlanById(
        @PathVariable Long id,
        @AuthenticationPrincipal User user
    ) {
        MealPlan plan = mealPlanService.getMealPlanById(id, user.getId());
        return ResponseEntity.ok(MealPlanResponse.fromEntity(plan));
    }
    
    /**
     * PUT /api/meal-plan/{id}/regenerate-day/{dayIndex}
     * 
     * Regeneruje jídelníček pro konkrétní den (0-6).
     */
    @PutMapping("/{id}/regenerate-day/{dayIndex}")
    public ResponseEntity<MealPlanDayResponse> regenerateDay(
        @PathVariable Long id,
        @PathVariable int dayIndex,
        @AuthenticationPrincipal User user
    ) {
        MealPlanDay day = mealPlanService.regenerateDay(id, dayIndex, user.getId());
        return ResponseEntity.ok(MealPlanDayResponse.fromEntity(day));
    }
    
    /**
     * DELETE /api/meal-plan/{id}
     * 
     * Smaže (archivuje) jídelníček.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMealPlan(
        @PathVariable Long id,
        @AuthenticationPrincipal User user
    ) {
        mealPlanService.deleteMealPlan(id, user.getId());
        return ResponseEntity.noContent().build();
    }
    
    /**
     * GET /api/meal-plan/{id}/shopping-list
     * 
     * Vrátí nákupní seznam pro daný jídelníček.
     */
    @GetMapping("/{id}/shopping-list")
    public ResponseEntity<ShoppingListResponse> getShoppingList(
        @PathVariable Long id,
        @AuthenticationPrincipal User user
    ) {
        ShoppingListResponse list = mealPlanService.getShoppingList(id, user.getId());
        return ResponseEntity.ok(list);
    }
    
    /**
     * PATCH /api/meal-plan/{mealPlanId}/shopping-list/{itemId}/check
     * 
     * Označí/odznačí položku nákupního seznamu jako koupenou.
     */
    @PatchMapping("/{mealPlanId}/shopping-list/{itemId}/check")
    public ResponseEntity<ShoppingItemResponse> toggleShoppingItem(
        @PathVariable Long mealPlanId,
        @PathVariable Long itemId,
        @RequestParam boolean checked,
        @AuthenticationPrincipal User user
    ) {
        ShoppingListItem item = mealPlanService.toggleShoppingItem(
            mealPlanId, itemId, checked, user.getId()
        );
        return ResponseEntity.ok(ShoppingItemResponse.fromEntity(item));
    }
}
```

---

### Fáze 5: DTO a Response modely

#### 5.1 Request DTO

```java
// Request pro generování jídelníčku (přicházejí z frontendu)
public class GenerateMealPlanRequest {
    @NotNull
    private LocalDate weekStart;
    
    @NotNull  
    private LocalDate weekEnd;
    
    @Min(1000) @Max(5000)
    private Integer dailyCalories;
    
    @Min(2) @Max(6)
    private Integer mealsPerDay;
    
    private Set<String> allergies;      // dairy-free, gluten-free, etc.
    private String diet;                 // balanced, high-protein, etc.
    private Set<String> preferredShops; // lidl, kaufland, billa, etc.
    private BigDecimal weeklyBudget;
}
```

#### 5.2 Response DTO

```java
// Kompletní jídelníček
public class MealPlanResponse {
    private Long id;
    private LocalDate weekStart;
    private LocalDate weekEnd;
    
    // Použité preference
    private Integer dailyCalories;
    private Integer mealsPerDay;
    private String diet;
    private Set<String> allergies;
    private Set<String> preferredShops;
    private BigDecimal weeklyBudget;
    
    // Dny
    private List<MealPlanDayResponse> days;
    
    // NÁKUPNÍ SEZNAM
    private ShoppingListResponse shoppingList;
    
    // Vypočtené hodnoty
    private BigDecimal totalEstimatedCost;
    private BigDecimal totalDiscountedCost;
    private BigDecimal totalRegularCost;
    private BigDecimal totalSavings;
    private Integer totalCalories;
    private BigDecimal averageDailyCost;
    
    private LocalDateTime generatedAt;
    private String status;
    
    public static MealPlanResponse fromEntity(MealPlan entity) { ... }
}

// NÁKUPNÍ SEZNAM
public class ShoppingListResponse {
    // Položky seskupené podle typu
    private List<ShopGroupResponse> discountedByShop;  // Zlevněné, podle obchodů
    private List<ShoppingItemResponse> regularItems;   // Běžné položky
    private List<ShoppingItemResponse> basicItems;     // Základní suroviny
    
    // Souhrn
    private BigDecimal totalDiscountedCost;
    private BigDecimal totalRegularCost;
    private BigDecimal totalSavings;
    private Integer totalItemsCount;
    
    public static ShoppingListResponse fromItems(List<ShoppingListItem> items) {
        ShoppingListResponse response = new ShoppingListResponse();
        
        // Seskupit zlevněné podle obchodu
        Map<String, List<ShoppingListItem>> byShop = items.stream()
            .filter(i -> i.getItemType() == ShoppingItemType.DISCOUNTED)
            .collect(Collectors.groupingBy(ShoppingListItem::getShopName));
        
        response.setDiscountedByShop(
            byShop.entrySet().stream()
                .map(e -> new ShopGroupResponse(e.getKey(), e.getValue()))
                .collect(Collectors.toList())
        );
        
        // Běžné položky
        response.setRegularItems(
            items.stream()
                .filter(i -> i.getItemType() == ShoppingItemType.REGULAR)
                .map(ShoppingItemResponse::fromEntity)
                .collect(Collectors.toList())
        );
        
        // Základní suroviny
        response.setBasicItems(
            items.stream()
                .filter(i -> i.getItemType() == ShoppingItemType.BASIC)
                .map(ShoppingItemResponse::fromEntity)
                .collect(Collectors.toList())
        );
        
        // Kalkulace
        // ...
        
        return response;
    }
}

// Skupina položek z jednoho obchodu
public class ShopGroupResponse {
    private String shopName;
    private String shopDisplayName;  // "Lidl", "Kaufland", etc.
    private List<ShoppingItemResponse> items;
    private BigDecimal subtotal;
    private BigDecimal savings;
    
    public ShopGroupResponse(String shopName, List<ShoppingListItem> items) {
        this.shopName = shopName;
        this.shopDisplayName = formatShopName(shopName);
        this.items = items.stream()
            .map(ShoppingItemResponse::fromEntity)
            .collect(Collectors.toList());
        this.subtotal = items.stream()
            .map(ShoppingListItem::getPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        this.savings = items.stream()
            .filter(i -> i.getOriginalPrice() != null)
            .map(i -> i.getOriginalPrice().subtract(i.getPrice()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}

// Jednotlivá položka nákupního seznamu
public class ShoppingItemResponse {
    private Long id;
    private String ingredientName;
    private String ingredientNameCz;
    
    private Double quantity;
    private String unit;
    private String formattedQuantity;  // "500g", "2 ks", "1 l"
    
    private String itemType;           // DISCOUNTED, REGULAR, BASIC
    private String itemTypeDisplay;    // "Ve slevě", "Běžná cena", "Základní"
    
    // Pro zlevněné
    private String shopName;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private Integer discountPercentage;
    private String formattedDiscount;  // "-30%"
    
    // Pro běžné
    private BigDecimal estimatedPrice;
    
    private String category;
    private List<String> usedInRecipes;
    private boolean checked;
    
    public static ShoppingItemResponse fromEntity(ShoppingListItem entity) { ... }
}

// Shrnutí jídelníčku (pro historii)
public class MealPlanSummaryResponse {
    private Long id;
    private LocalDate weekStart;
    private LocalDate weekEnd;
    private BigDecimal totalEstimatedCost;
    private Integer totalCalories;
    private LocalDateTime generatedAt;
    private String status;
    
    public static MealPlanSummaryResponse fromEntity(MealPlan entity) { ... }
}

// Denní jídelníček
public class MealPlanDayResponse {
    private Long id;
    private LocalDate date;
    private int dayIndex;
    private String dayName;  // "Pondělí", "Úterý", etc.
    private List<MealResponse> meals;
    private Integer totalCalories;
    private BigDecimal estimatedCost;
    
    public static MealPlanDayResponse fromEntity(MealPlanDay entity) { ... }
}

// Jednotlivé jídlo
public class MealResponse {
    private Long id;
    private String mealType;            // BREAKFAST, LUNCH, DINNER, SNACK
    private String mealTypeDisplay;     // "Snídaně", "Oběd", etc.
    
    // Recept
    private String recipeName;
    private String recipeImageUrl;
    private String recipeSourceUrl;
    
    // Nutriční hodnoty
    private Integer calories;
    private Integer servings;
    private NutrientsResponse nutrients;
    
    // Ingredience
    private List<String> ingredients;
    private List<DiscountedIngredientResponse> discountedIngredients;
    
    private BigDecimal estimatedCost;
    
    public static MealResponse fromEntity(MealPlanMeal entity) { ... }
}

// Nutriční hodnoty
public class NutrientsResponse {
    private Double protein;
    private Double carbs;
    private Double fat;
    private Double fiber;
}

// Ingredience se slevou
public class DiscountedIngredientResponse {
    private String name;
    private String shopName;
    private BigDecimal originalPrice;
    private BigDecimal discountedPrice;
    private Integer discountPercentage;
    private String unit;
}
```

---

## Další úvahy

### 1. Cachování receptů

Pro snížení počtu API volání na Edamam:

```sql
CREATE TABLE IF NOT EXISTS recipe_cache (
    id SERIAL PRIMARY KEY,
    edamam_uri VARCHAR(500) UNIQUE,
    recipe_data JSONB,
    calories INTEGER,
    health_labels TEXT[],
    diet_labels TEXT[],
    ingredients TEXT[],
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX idx_recipe_cache_labels ON recipe_cache USING gin(health_labels);
CREATE INDEX idx_recipe_cache_ingredients ON recipe_cache USING gin(ingredients);
```

### 2. Rate Limiting

- Free tier: 10,000 requests/měsíc
- Implementovat queue pro API volání
- Cachovat výsledky minimálně 24 hodin

### 3. Fallback strategie

Pokud Edamam API není dostupné:
1. Použít cachované recepty
2. Nabídnout obecné recepty bez personalizace
3. Zobrazit chybovou zprávu s možností zkusit později

### 4. Rozšíření mapování produktů

Pro lepší mapování českých produktů na ingredience:
- Využít OpenAI/Claude API pro překlad názvů
- Vytvořit crowdsourcovanou databázi mapování
- Použít fuzzy matching pro podobné názvy

---

## Otevřené otázky

1. **Edamam API přístup:** Máte již App ID a App Key pro Edamam? Free nebo Premium tier?

2. **Meal Planner vs Recipe Search:** Preferujete automatické plánování (Meal Planner API - premium) nebo vlastní logiku nad Recipe Search (free)?

3. **Překlad produktů:** Jak řešit mapování českých názvů produktů na anglické ingredience? Manuální slovník, AI překlad, nebo kombinace?

---

## Časový odhad

| Fáze | Popis | Odhad |
|------|-------|-------|
| 1 | Příprava backendu (entity, konfigurace) | 4-6 hodin |
| 2 | DiscountService + EdamamService | 8-12 hodin |
| 3 | MealPlanService + algoritmus | 16-24 hodin |
| 4 | REST API endpointy | 4-6 hodin |
| 5 | Testování a ladění | 8-12 hodin |
| **Celkem** | | **40-60 hodin** |

---

## Další kroky

1. ✅ Prostudovat dokumentaci Edamam API
2. ⬜ Získat API credentials (App ID + Key)
3. ⬜ Vytvořit databázové schéma pro `meal_plans`, `meal_plan_days`, `meal_plan_meals`, `shopping_list_items`
4. ⬜ Implementovat entity `MealPlan`, `MealPlanDay`, `MealPlanMeal`, `ShoppingListItem`
5. ⬜ Vytvořit `DiscountRepository` pro dotazování slev
6. ⬜ Implementovat `EdamamService` pro komunikaci s API
7. ⬜ Vytvořit mapovací slovník produktů (CZ -> EN a EN -> CZ)
8. ⬜ Implementovat `ShoppingListService` pro generování nákupního seznamu
9. ⬜ Implementovat `MealPlanService` s generováním a ukládáním
10. ⬜ Vytvořit REST API endpointy (`MealPlanController`)
11. ⬜ Implementovat Response DTO včetně `ShoppingListResponse`
12. ⬜ Frontend - generátor jídelníčku
13. ⬜ Frontend - zobrazení nákupního seznamu s odškrtáváním

