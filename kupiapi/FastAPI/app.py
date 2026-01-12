from __future__ import annotations
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo
from typing import Optional, List, Dict, Any
import re

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from enum import Enum

import kupiapi.scraper
import json

# -----------------------------------------------------------------------------
# App
# -----------------------------------------------------------------------------
app = FastAPI(
    title="KupiAPI Bridge",
    version="2.0.0", 
    description="""
    REST API bridge pro kupiapi scraper s nativními kategoriemi.
    
    ## Podporované kategorie
    
    ### 🍎 Potravinářské kategorie:
    - **alkohol** - Alkoholické nápoje (víno, pivo, lihoviny)
    - **konzervy** - Konzervované potraviny
    - **lahudky** - Lahůdky a delikatesy
    - **maso-drubez-a-ryby** - Maso, drůbež a ryby
    - **mlecne-vyrobky-a-vejce** - Mléčné výrobky a vejce
    - **mrazene-a-instantni-potraviny** - Mražené a instantní potraviny
    - **nealko-napoje** - Nealkoholické nápoje
    - **ovoce-a-zelenina** - Ovoce a zelenina
    - **pecivo** - Pečivo a chléb
    - **sladkosti-a-slane-snacky** - Sladkosti a slané snacky
    - **vareni-a-peceni** - Vaření a pečení (koření, omáčky, ingredience)
    - **zdrava-vyziva** - Zdravá výživa a bio produkty
    
    ### 🏠 Nepotravinářské kategorie:
    - **auto-moto** - Auto a moto produkty
    - **domacnost** - Domácnost a čisticí prostředky
    - **drogerie** - Drogerie a hygiena
    - **elektro** - Elektronika a technika
    - **hracky-2** - Hračky
    - **kancelarske-potreby-a-knihy-2** - Kancelářské potřeby a knihy
    - **krasa** - Krása a péče
    - **lekarna** - Lékárenské produkty
    - **mazlicci** - Produkty pro mazlíčky
    - **nabytek-2** - Nábytek
    - **obleceni-a-obuv** - Oblečení a obuv
    - **pro-deti** - Produkty pro děti (pleny, kojenecké potřeby)
    - **sport-2** - Sportovní potřeby
    - **bydleni-a-zahrada** - Bydlení a zahrada
    
    ## Podporované obchody
    Albert, Lidl, Kaufland, Billa, Penny, Globus
    """,
    contact={
        "name": "BudgetBites Support",
        "email": "support@budgetbites.cz"
    },
    license_info={
        "name": "MIT",
    }
)

# CORS (uprav podle svého FE)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # v produkci omez!
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

TZ = ZoneInfo("Europe/Prague")
scraper = kupiapi.scraper.KupiScraper()

# -----------------------------------------------------------------------------
# Nativní kupiapi kategorie
# -----------------------------------------------------------------------------
# Získáme dostupné kategorie přímo z kupiapi
KUPIAPI_CATEGORIES = [
    "alkohol", "auto-moto", "domacnost", "drogerie", "elektro", "hracky-2",
    "kancelarske-potreby-a-knihy-2", "konzervy", "krasa", "lahudky", "lekarna",
    "maso-drubez-a-ryby", "mazlicci", "mlecne-vyrobky-a-vejce", 
    "mrazene-a-instantni-potraviny", "nabytek-2", "nealko-napoje",
    "obleceni-a-obuv", "ovoce-a-zelenina", "pecivo", "pro-deti",
    "sladkosti-a-slane-snacky", "sport-2", "vareni-a-peceni",
    "bydleni-a-zahrada", "zdrava-vyziva"
]

# Mapování kupiapi kategorií na přátelské názvy pro UI
CATEGORY_DISPLAY_NAMES = {
    "alkohol": "Alkoholické nápoje",
    "auto-moto": "Auto a moto",
    "domacnost": "Domácnost", 
    "drogerie": "Drogerie a hygiena",
    "elektro": "Elektronika",
    "hracky-2": "Hračky",
    "kancelarske-potreby-a-knihy-2": "Kancelář a knihy",
    "konzervy": "Konzervy",
    "krasa": "Krása a péče",
    "lahudky": "Lahůdky",
    "lekarna": "Lékárna",
    "maso-drubez-a-ryby": "Maso, drůbež a ryby", 
    "mazlicci": "Mazlíčci",
    "mlecne-vyrobky-a-vejce": "Mléčné výrobky a vejce",
    "mrazene-a-instantni-potraviny": "Mražené a instant potraviny",
    "nabytek-2": "Nábytek",
    "nealko-napoje": "Nealkoholické nápoje",
    "obleceni-a-obuv": "Oblečení a obuv", 
    "ovoce-a-zelenina": "Ovoce a zelenina",
    "pecivo": "Pečivo",
    "pro-deti": "Pro děti",
    "sladkosti-a-slane-snacky": "Sladkosti a slané snacky",
    "sport-2": "Sport",
    "vareni-a-peceni": "Vaření a pečení",
    "bydleni-a-zahrada": "Bydlení a zahrada", 
    "zdrava-vyziva": "Zdravá výživa"
}

# Kategorizace podle typu (potraviny vs nepotravinářské zboží)
FOOD_CATEGORIES = {
    "alkohol", "konzervy", "lahudky", "maso-drubez-a-ryby", 
    "mlecne-vyrobky-a-vejce", "mrazene-a-instantni-potraviny",
    "nealko-napoje", "ovoce-a-zelenina", "pecivo", 
    "sladkosti-a-slane-snacky", "vareni-a-peceni", "zdrava-vyziva"
}

NON_FOOD_CATEGORIES = {
    "auto-moto", "domacnost", "drogerie", "elektro", "hracky-2",
    "kancelarske-potreby-a-knihy-2", "krasa", "lekarna", "mazlicci",
    "nabytek-2", "obleceni-a-obuv", "pro-deti", "sport-2", "bydleni-a-zahrada"
}

# -----------------------------------------------------------------------------
# Models
# -----------------------------------------------------------------------------
class Product(BaseModel):
    name: str = Field(..., description="Název produktu")
    shops: List[str] = Field(..., description="Seznam obchodů")
    prices: List[str] = Field(..., description="Ceny")
    amounts: List[str] = Field(..., description="Množství")
    validities: List[str] = Field(..., description="Platnost")
    category: Optional[str] = Field(None, description="Kupiapi kategorie")
    category_display: Optional[str] = Field(None, description="Zobrazovaný název kategorie")
    is_food: bool = Field(True, description="Zda jde o potravinu")

class DiscountsResponse(BaseModel):
    products: List[Product]
    total_count: int
    category_counts: Dict[str, int] = Field(default_factory=dict)
    shop_counts: Dict[str, int] = Field(default_factory=dict)

# -----------------------------------------------------------------------------
# Helper functions
# -----------------------------------------------------------------------------

def get_products_by_shop_and_category(shop: str, category: Optional[str] = None, max_pages: int = 1) -> List[Dict]:
    """
    Získá produkty z kupiapi pro daný obchod a volitelně kategorii.
    Používá workaround pro bug v get_discounts_by_category.
    """
    try:
        if category and category in KUPIAPI_CATEGORIES:
            # Pokusíme se použít kategorii - pokud selže, použijeme všechny produkty
            try:
                # Workaround pro bug - používáme get_discounts_by_shop a filtrujeme
                products_json = scraper.get_discounts_by_shop(shop, max_pages=max_pages)
                products = json.loads(products_json)
                # Pro teď vrátíme všechny produkty - ideálně bychom filtrovali podle kategorie
                return products
            except Exception as e:
                print(f"Error getting products by category {category}: {e}")
                # Fallback na všechny produkty
                products_json = scraper.get_discounts_by_shop(shop, max_pages=max_pages)
                return json.loads(products_json)
        else:
            # Získáme všechny produkty
            products_json = scraper.get_discounts_by_shop(shop, max_pages=max_pages)
            return json.loads(products_json)
    except Exception as e:
        print(f"Error getting products for shop {shop}: {e}")
        return []

def categorize_product_by_name(product_name: str) -> Optional[str]:
    """
    Vylepšená klasifikace produktu podle názvu do kupiapi kategorií.
    Používá prioritní pořadí pro lepší rozpoznávání nepotravinářských produktů.
    """
    name_lower = product_name.lower()
    
    # PRIORITA 1: Nepotravinářské kategorie (musí být první!)
    
    # Dětské produkty (pleny, atd.)
    if any(word in name_lower for word in ["pleny", "pleničky", "pampers", "huggies", "kojenecká", "dětská", "baby"]):
        return "pro-deti"
    
    # Drogerie a hygiena  
    if any(word in name_lower for word in ["šampon", "mýdlo", "pasta", "kartáček", "čistič", "prací", "aviváž", "toaletní", "hygien", "sprchový gel", "deodorant", "parfém", "krém"]):
        return "drogerie"
        
    # Domácnost a čisticí prostředky
    if any(word in name_lower for word in ["prostředek na", "jar", "fairy", "saponát", "prachovka", "hadřík", "sáček", "folie", "papír", "utěrka", "domácnost", "cif", "domestos", "wc gel"]):
        return "domacnost"
        
    # Elektronika a technika
    if any(word in name_lower for word in ["led světlo", "led řetez", "led světelný", "kabel", "baterie", "elektronik", "náhradní díl", "žárovka", "svítidlo"]):
        return "elektro"
    
    # Auto-moto
    if any(word in name_lower for word in ["motorový olej", "antifreeze", "autokosmetika", "pneumatiky", "auto"]):
        return "auto-moto"
        
    # Oblečení
    if any(word in name_lower for word in ["tričko", "kalhoty", "ponožky", "boty", "oblečení", "textil"]):
        return "obleceni-a-obuv"
    
    # Hračky
    if any(word in name_lower for word in ["hračka", "lego", "panenka", "autíčko", "hra", "puzzle"]):
        return "hracky-2"
        
    # PRIORITA 2: Alkohol (před ostatními nápoji!)
    if any(word in name_lower for word in ["víno", "pivo", "vodka", "rum", "whisky", "gin", "brandy", "koňak", "liqueur", "likér", "vermut", "prosecco", "champagne", "šampus", "jägermeister"]):
        return "alkohol"
    
    # PRIORITA 3: Potraviny
    
    # Maso, drůbež, ryby
    if any(word in name_lower for word in ["maso", "hovězí", "vepřové", "kuřecí", "krůtí", "ryba", "losos", "tuňák", "sardinka", "uzené", "šunka", "salám", "párek", "klobása", "uzenina"]):
        return "maso-drubez-a-ryby"
        
    # Mléčné výrobky
    if any(word in name_lower for word in ["mléko", "sýr", "jogurt", "tvaroh", "máslo", "smetana", "kefír", "eidam", "gouda", "mozzarella", "parmezan", "sýrová", "mléčný"]):
        return "mlecne-vyrobky-a-vejce"
        
    # Ovoce a zelenina
    if any(word in name_lower for word in ["jablko", "banán", "pomeranč", "citron", "jahoda", "brambory", "mrkev", "cibule", "paprika", "rajče", "okurka", "salát", "zelenina", "ovoce"]):
        return "ovoce-a-zelenina"
        
    # Pečivo
    if any(word in name_lower for word in ["chléb", "rohlík", "bageta", "houska", "croissant", "toustový", "pečivo"]):
        return "pecivo"
        
    # Sladkosti
    if any(word in name_lower for word in ["čokoláda", "bonbon", "sušenka", "dort", "zmrzlina", "pudink", "sladkosti", "milka", "orion", "granko"]):
        return "sladkosti-a-slane-snacky"
        
    # Nealkoholické nápoje (káva, čaj, nealkohol)
    if any(word in name_lower for word in ["cola", "pepsi", "sprite", "fanta", "limonáda", "džus", "voda", "čaj", "káva", "kofola", "magnesia", "kapsle", "nescafé", "dolce gusto"]):
        return "nealko-napoje"
        
    # Mražené
    if any(word in name_lower for word in ["mražen", "zmražen", "deep", "iglo", "bonduelle mražen"]):
        return "mrazene-a-instantni-potraviny"
        
    # Konzervy
    if any(word in name_lower for word in ["konzerva", "konzervovaný", "sterilovaný"]):
        return "konzervy"
    
    # Varení a pečení (koření, omáčky, atd.)
    if any(word in name_lower for word in ["omáčka", "koření", "sůl", "cukr", "mouka", "olej", "ocet", "hellmann", "tatarská", "kečup", "hořčice"]):
        return "vareni-a-peceni"
        
    # Zdravá výživa (fallback pro nerozpoznané potraviny)
    return "zdrava-vyziva"

def enrich_product_with_category(product_data: Dict) -> Product:
    """
    Obohatí produkt o informace o kategorii.
    """
    # Zkusíme klasifikovat podle názvu
    category = categorize_product_by_name(product_data["name"])
    
    # Určíme display název
    category_display = CATEGORY_DISPLAY_NAMES.get(category, category) if category else "Neznámá kategorie"
    
    # Určíme zda je to potravina
    is_food = category in FOOD_CATEGORIES if category else True
    
    # Ošetříme None hodnoty v datech
    safe_amounts = product_data.get("amounts", [])
    if safe_amounts is None:
        safe_amounts = []
    # Převedeme None hodnoty na prázdné stringy
    safe_amounts = [str(amount) if amount is not None else "" for amount in safe_amounts]
    
    safe_validities = product_data.get("validities", [])
    if safe_validities is None:
        safe_validities = []
    safe_validities = [str(validity) if validity is not None else "" for validity in safe_validities]
    
    safe_prices = product_data.get("prices", [])
    if safe_prices is None:
        safe_prices = []
    safe_prices = [str(price) if price is not None else "" for price in safe_prices]
    
    safe_shops = product_data.get("shops", [])
    if safe_shops is None:
        safe_shops = []
    safe_shops = [str(shop) if shop is not None else "" for shop in safe_shops]
    
    return Product(
        name=product_data.get("name", ""),
        shops=safe_shops,
        prices=safe_prices, 
        amounts=safe_amounts,
        validities=safe_validities,
        category=category,
        category_display=category_display,
        is_food=is_food
    )

# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------

@app.get("/", summary="Health check")
async def root():
    return {"status": "KupiAPI Bridge v2.0 - Using native kupiapi categories"}

@app.get("/categories", summary="Získat dostupné kategorie")
async def get_categories():
    """
    Vrátí seznam všech dostupných kupiapi kategorií.
    
    Vrací:
    - **categories**: Seznam kategorií s ID, přátelským názvem a označením food/non-food
    - **food_categories**: Seznam pouze potravinářských kategorií 
    - **non_food_categories**: Seznam pouze nepotravinářských kategorií
    
    Každá kategorie obsahuje:
    - `id`: Originální kupiapi kategorie (např. "maso-drubez-a-ryby")
    - `name`: Přátelský název v češtině (např. "Maso, drůbež a ryby")
    - `is_food`: Boolean označující zda jde o potravinu
    """
    categories = []
    for category in KUPIAPI_CATEGORIES:
        categories.append({
            "id": category,
            "name": CATEGORY_DISPLAY_NAMES.get(category, category),
            "is_food": category in FOOD_CATEGORIES
        })
    
    return {
        "categories": categories,
        "food_categories": list(FOOD_CATEGORIES),
        "non_food_categories": list(NON_FOOD_CATEGORIES)
    }

@app.get("/discounts/{shop}", response_model=DiscountsResponse, summary="Získat slevy pro obchod")
async def get_discounts_by_shop(
    shop: str,
    category: Optional[str] = Query(None, description="Filtr podle kupiapi kategorie (např. 'maso-drubez-a-ryby')"),
    food_only: bool = Query(False, description="Zobrazit pouze potravinářské produkty (is_food=true)"),
    max_pages: int = Query(1, ge=1, le=5, description="Počet stránek ke stažení (1-5)")
):
    """
    Získá aktuální slevy pro konkrétní obchod s pokročilými filtry.
    
    **Podporované obchody:** albert, lidl, kaufland, billa, penny, globus
    
    **Parametry:**
    - `shop`: Název obchodu (povinné)
    - `category`: Kupiapi kategorie pro filtraci (volitelné, např. "alkohol", "drogerie")
    - `food_only`: Pouze potravinářské produkty (volitelné, default false)
    - `max_pages`: Počet stránek dat k načtení (1-5, default 1)
    
    **Vrací:**
    - Seznam produktů s názvy, cenami, obchody, platností
    - Každý produkt má automaticky přiřazenou kategorii a označení food/non-food
    - Statistiky počtu produktů podle kategorií a obchodů
    
    **Příklady použití:**
    - `/discounts/albert` - všechny slevy z Alberta
    - `/discounts/albert?food_only=true` - pouze potraviny z Alberta  
    - `/discounts/albert?category=alkohol` - pouze alkohol z Alberta
    """
    
    # Validace obchodu
    valid_shops = ["albert", "lidl", "kaufland", "billa", "penny", "globus"]
    if shop not in valid_shops:
        raise HTTPException(status_code=400, detail=f"Neplatný obchod. Povolené: {valid_shops}")
    
    # Validace kategorie
    if category and category not in KUPIAPI_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Neplatná kategorie. Povolené: {KUPIAPI_CATEGORIES}")
    
    try:
        # Získáme produkty
        raw_products = get_products_by_shop_and_category(shop, category, max_pages)
        
        # Obohatíme o kategorie
        enriched_products = []
        category_counts = {}
        shop_counts = {}
        
        for product_data in raw_products:
            product = enrich_product_with_category(product_data)
            
            # Aplikujeme filtry
            if food_only and not product.is_food:
                continue
                
            if category and product.category != category:
                continue
            
            enriched_products.append(product)
            
            # Počítáme statistiky
            if product.category:
                category_counts[product.category] = category_counts.get(product.category, 0) + 1
            
            for shop_name in product.shops:
                shop_counts[shop_name] = shop_counts.get(shop_name, 0) + 1
        
        return DiscountsResponse(
            products=enriched_products,
            total_count=len(enriched_products),
            category_counts=category_counts,
            shop_counts=shop_counts
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba při získávání slev: {str(e)}")

@app.get("/discounts", response_model=DiscountsResponse, summary="Získat slevy ze všech obchodů")
async def get_all_discounts(
    category: Optional[str] = Query(None, description="Filtr kategorie"),
    food_only: bool = Query(False, description="Pouze potraviny"),
    max_pages: int = Query(1, ge=1, le=3, description="Maximální počet stránek na obchod")
):
    """
    Získá slevy ze všech podporovaných obchodů.
    """
    shops = ["albert", "lidl", "kaufland", "billa", "penny", "globus"]
    all_products = []
    category_counts = {}
    shop_counts = {}
    
    for shop in shops:
        try:
            raw_products = get_products_by_shop_and_category(shop, category, max_pages)
            
            for product_data in raw_products:
                product = enrich_product_with_category(product_data)
                
                # Aplikujeme filtry
                if food_only and not product.is_food:
                    continue
                    
                if category and product.category != category:
                    continue
                
                all_products.append(product)
                
                # Počítáme statistiky
                if product.category:
                    category_counts[product.category] = category_counts.get(product.category, 0) + 1
                
                for shop_name in product.shops:
                    shop_counts[shop_name] = shop_counts.get(shop_name, 0) + 1
                    
        except Exception as e:
            print(f"Chyba při načítání z obchodu {shop}: {e}")
            continue
    
    return DiscountsResponse(
        products=all_products,
        total_count=len(all_products),
        category_counts=category_counts,
        shop_counts=shop_counts
    )

# Endpoint pro ETL proces
@app.get("/etl", summary="ETL endpoint pro pravidelné stahování")
async def etl_endpoint():
    """
    Endpoint pro ETL proces - získá slevy ze všech obchodů pro uložení do databáze.
    """
    return await get_all_discounts(max_pages=2)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)