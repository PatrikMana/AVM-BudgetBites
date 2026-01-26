"""
BudgetBites KupiAPI Bridge
REST API pro scraping slev z českých obchodů pomocí kupiapi knihovny.

Funkce:
- Stahování slev z obchodů (Albert, Lidl, Kaufland, Billa, Penny, Globus)
- Správné kategorie přímo z kupi.cz (fetchování podle kategorií)
- ETL endpoint pro pravidelné ukládání do databáze
- Filtrování pouze potravinových kategorií

DŮLEŽITÉ: kupiapi neposkytuje původní ceny ani procenta slevy!
Tyto hodnoty nejsou na kupi.cz dostupné, proto jsou v odpovědích None.
"""

from __future__ import annotations
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo
from typing import Optional, List, Dict, Any
import re
import logging

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import kupiapi.scraper
import json

# =============================================================================
# Logging
# =============================================================================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('kupiapi-bridge')

# =============================================================================
# App konfigurace
# =============================================================================

app = FastAPI(
    title="BudgetBites KupiAPI Bridge",
    version="3.0.0",
    description="""
REST API bridge pro kupiapi scraper - stahování slev z českých obchodů.

## Podporované obchody
Albert, Lidl, Kaufland, Billa, Penny, Globus

## Potravinové kategorie (nativní z kupi.cz)
- **alkohol** - Alkoholické nápoje
- **konzervy** - Konzervované potraviny
- **lahudky** - Lahůdky a delikatesy
- **maso-drubez-a-ryby** - Maso, drůbež a ryby
- **mlecne-vyrobky-a-vejce** - Mléčné výrobky a vejce
- **mrazene-a-instantni-potraviny** - Mražené a instantní potraviny
- **nealko-napoje** - Nealkoholické nápoje
- **ovoce-a-zelenina** - Ovoce a zelenina
- **pecivo** - Pečivo
- **sladkosti-a-slane-snacky** - Sladkosti a slané snacky
- **vareni-a-peceni** - Vaření a pečení

**Poznámka:** kupi.cz neposkytuje původní ceny ani procenta slevy, proto tyto hodnoty nejsou dostupné.

## ETL Endpoint
`/v1/discounts/etl` - endpoint pro ETL službu s produkty ze VŠECH potravinových kategorií
""",
    contact={"name": "BudgetBites", "email": "support@budgetbites.cz"},
    license_info={"name": "MIT"}
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # V produkci omezit!
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

TZ = ZoneInfo("Europe/Prague")
scraper = kupiapi.scraper.KupiScraper()

# =============================================================================
# Konstanty - Kategorie
# =============================================================================

# Potravinové kategorie - pouze tyto budeme fetchovat pro ETL
FOOD_CATEGORIES = {
    "alkohol": "Alkoholické nápoje",
    "konzervy": "Konzervy",
    "lahudky": "Lahůdky",
    "maso-drubez-a-ryby": "Maso, drůbež a ryby",
    "mlecne-vyrobky-a-vejce": "Mléčné výrobky a vejce",
    "mrazene-a-instantni-potraviny": "Mražené a instant potraviny",
    "nealko-napoje": "Nealkoholické nápoje",
    "ovoce-a-zelenina": "Ovoce a zelenina",
    "pecivo": "Pečivo",
    "sladkosti-a-slane-snacky": "Sladkosti a slané snacky",
    "vareni-a-peceni": "Vaření a pečení"
}

# Nepotravinové kategorie - tyto ignorujeme
NON_FOOD_CATEGORIES = {
    "auto-moto": "Auto a moto",
    "bydleni-a-zahrada": "Bydlení a zahrada",
    "domacnost": "Domácnost",
    "drogerie": "Drogerie a hygiena",
    "elektro": "Elektronika",
    "hracky-2": "Hračky",
    "kancelarske-potreby-a-knihy-2": "Kancelář a knihy",
    "krasa": "Krása a péče",
    "lekarna": "Lékárna",
    "mazlicci": "Mazlíčci",
    "nabytek-2": "Nábytek",
    "obleceni-a-obuv": "Oblečení a obuv",
    "pro-deti": "Pro děti",
    "sport-2": "Sport",
    "zdrava-vyziva": "Zdravá výživa"  # Obsahuje i nefood položky, ignorujeme
}

VALID_SHOPS = ["albert", "lidl", "kaufland", "billa", "penny", "globus"]

# =============================================================================
# Pydantic modely
# =============================================================================

class Product(BaseModel):
    """Produkt ze scraperu."""
    name: str = Field(..., description="Název produktu")
    shops: List[str] = Field(default_factory=list, description="Seznam obchodů")
    prices: List[str] = Field(default_factory=list, description="Ceny")
    amounts: List[str] = Field(default_factory=list, description="Množství")
    validities: List[str] = Field(default_factory=list, description="Platnost")
    category: str = Field(..., description="Kategorie produktu (nativní z kupi.cz)")
    category_display: str = Field(..., description="Zobrazovaný název kategorie")
    is_food: bool = Field(True, description="Zda jde o potravinu")


class ETLProduct(BaseModel):
    """Produkt připravený pro ETL - rozšířená data."""
    name: str
    price: Optional[float] = None
    original_price: Optional[float] = None  # Není dostupné z kupi.cz
    discount_percentage: Optional[float] = None  # Není dostupné z kupi.cz
    shop_name: str
    category: str
    category_display: str
    unit: Optional[str] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    is_food: bool = True
    image_url: Optional[str] = None


class DiscountsResponse(BaseModel):
    """Odpověď s produkty."""
    products: List[Product]
    total_count: int
    category_counts: Dict[str, int] = Field(default_factory=dict)
    shop_counts: Dict[str, int] = Field(default_factory=dict)


class ETLResponse(BaseModel):
    """Odpověď pro ETL endpoint."""
    products: List[ETLProduct]
    total_count: int
    categories_fetched: List[str]
    shops_fetched: List[str]
    fetched_at: str


class CategoryETLResponse(BaseModel):
    """Odpověď pro ETL endpoint - konkrétní kategorie."""
    products: List[ETLProduct]
    total_count: int
    category: str
    category_display: str
    fetched_at: str


# =============================================================================
# Pomocné funkce - Parsování
# =============================================================================

def parse_price(price_str: str) -> Optional[float]:
    """Parsuje cenu z textového formátu."""
    if not price_str:
        return None
    try:
        # Odstranění měny a formátování
        cleaned = re.sub(r'[^\d,.]', '', price_str)
        cleaned = cleaned.replace(',', '.')
        return float(cleaned) if cleaned else None
    except:
        return None


def parse_validity(validity_str: str) -> tuple[Optional[str], Optional[str]]:
    """
    Parsuje platnost slevy z textu.
    Vrací: (valid_from, valid_until) ve formátu YYYY-MM-DD
    """
    if not validity_str:
        today = date.today()
        return today.isoformat(), (today + timedelta(days=7)).isoformat()
    
    try:
        # Formáty: "od 20.1. do 26.1.", "čt 29. 1. – ne 1. 2.", "platí do 26.1."
        date_pattern = r'(\d{1,2})\.\s*(\d{1,2})\.?\s*(\d{4})?'
        matches = re.findall(date_pattern, validity_str)
        
        current_year = date.today().year
        
        if len(matches) >= 2:
            # Máme od-do
            day1, month1, year1 = matches[0]
            day2, month2, year2 = matches[1]
            
            year1 = int(year1) if year1 else current_year
            year2 = int(year2) if year2 else current_year
            
            # Pokud je měsíc "do" menší než měsíc "od", jsme přes rok
            if int(month2) < int(month1):
                year2 = year1 + 1
            
            valid_from = date(year1, int(month1), int(day1))
            valid_until = date(year2, int(month2), int(day2))
            
            return valid_from.isoformat(), valid_until.isoformat()
            
        elif len(matches) == 1:
            # Jen jedno datum - předpokládáme konec
            day, month, year = matches[0]
            year = int(year) if year else current_year
            valid_until = date(year, int(month), int(day))
            valid_from = date.today()
            
            return valid_from.isoformat(), valid_until.isoformat()
            
    except Exception as e:
        logger.debug(f"Chyba při parsování platnosti '{validity_str}': {e}")
    
    # Fallback
    today = date.today()
    return today.isoformat(), (today + timedelta(days=7)).isoformat()


# =============================================================================
# Scraper funkce - NOVÝ PŘÍSTUP: fetchování podle kategorií
# =============================================================================

def get_products_by_category(category: str, max_pages: int = 0) -> List[Dict]:
    """
    Získá produkty z kupiapi pro danou kategorii.
    
    Args:
        category: ID kategorie z kupi.cz (např. "maso-drubez-a-ryby")
        max_pages: Počet stránek (0 = všechny)
    """
    try:
        products_json = scraper.get_discounts_by_category(category, max_pages=max_pages)
        return json.loads(products_json)
    except Exception as e:
        logger.error(f"Chyba při získávání produktů z kategorie {category}: {e}")
        return []


def get_products_by_category_and_shop(category: str, shop: str, max_pages: int = 0) -> List[Dict]:
    """
    Získá produkty z kupiapi pro danou kategorii a obchod.
    
    Args:
        category: ID kategorie z kupi.cz
        shop: Název obchodu (lidl, albert, ...)
        max_pages: Počet stránek (0 = všechny)
    """
    try:
        products_json = scraper.get_discounts_by_category_shop(category, shop, max_pages=max_pages)
        return json.loads(products_json)
    except Exception as e:
        logger.error(f"Chyba při získávání produktů z {category}/{shop}: {e}")
        return []


def get_products_by_shop(shop: str, max_pages: int = 1) -> List[Dict]:
    """Získá produkty z kupiapi pro daný obchod (starý způsob)."""
    try:
        products_json = scraper.get_discounts_by_shop(shop, max_pages=max_pages)
        return json.loads(products_json)
    except Exception as e:
        logger.error(f"Chyba při získávání produktů z {shop}: {e}")
        return []


def enrich_product(product_data: Dict, category: str, category_display: str) -> Product:
    """Obohatí produkt o kategorii."""
    name = product_data.get("name", "")
    
    def safe_list(data, key):
        val = data.get(key, [])
        if val is None:
            return []
        return [str(v) if v is not None else "" for v in val]
    
    return Product(
        name=name,
        shops=safe_list(product_data, "shops"),
        prices=safe_list(product_data, "prices"),
        amounts=safe_list(product_data, "amounts"),
        validities=safe_list(product_data, "validities"),
        category=category,
        category_display=category_display,
        is_food=True  # Pouze food kategorie
    )


def convert_to_etl_product(product_data: Dict, category: str, category_display: str) -> List[ETLProduct]:
    """
    Konvertuje raw produkt na seznam ETLProduct (jeden pro každý obchod/cenu).
    
    Kupiapi vrací produkt s více cenami/obchody - musíme je rozdělit.
    """
    try:
        name = product_data.get("name", "").strip()
        if not name:
            return []
        
        shops = product_data.get("shops", [])
        prices = product_data.get("prices", [])
        amounts = product_data.get("amounts", [])
        validities = product_data.get("validities", [])
        
        if not shops or not prices:
            return []
        
        results = []
        
        # Iterujeme přes všechny obchody/ceny
        for i, shop in enumerate(shops):
            if not shop:
                continue
                
            # Získáme odpovídající data
            price_str = prices[i] if i < len(prices) else prices[0] if prices else None
            amount_str = amounts[i] if i < len(amounts) else amounts[0] if amounts else None
            validity_str = validities[i] if i < len(validities) else validities[0] if validities else None
            
            price = parse_price(price_str) if price_str else None
            if not price or price <= 0:
                continue
            
            # Platnost
            valid_from, valid_until = parse_validity(validity_str)
            
            # Normalizace názvu obchodu
            shop_normalized = shop.lower().strip()
            if shop_normalized not in VALID_SHOPS:
                # Zkusíme najít shodu
                for valid_shop in VALID_SHOPS:
                    if valid_shop in shop_normalized or shop_normalized in valid_shop:
                        shop_normalized = valid_shop
                        break
                else:
                    # Neznámý obchod - přeskočíme
                    continue
            
            results.append(ETLProduct(
                name=name,
                price=price,
                original_price=None,  # Není dostupné z kupi.cz
                discount_percentage=None,  # Není dostupné z kupi.cz
                shop_name=shop_normalized,
                category=category,
                category_display=category_display,
                unit=amount_str,
                valid_from=valid_from,
                valid_until=valid_until,
                is_food=True,
                image_url=None
            ))
        
        return results
        
    except Exception as e:
        logger.debug(f"Chyba při konverzi produktu: {e}")
        return []


# =============================================================================
# API Endpoints
# =============================================================================

@app.get("/", summary="Root endpoint")
async def root():
    """Root endpoint s informacemi o API."""
    return {
        "service": "BudgetBites KupiAPI Bridge",
        "version": "3.0.0",
        "status": "running",
        "note": "V3 používá nativní kategorie z kupi.cz místo heuristiky",
        "endpoints": {
            "health": "/health",
            "categories": "/categories",
            "discounts_by_category": "/discounts/category/{category}",
            "discounts_by_shop": "/discounts/shop/{shop}",
            "etl": "/v1/discounts/etl",
            "etl_by_category": "/v1/discounts/category/{category}/etl"
        }
    }


@app.get("/health", summary="Health check")
async def health_check():
    """Health check endpoint pro Docker healthcheck."""
    return {"status": "healthy", "timestamp": datetime.now(TZ).isoformat()}


@app.get("/categories", summary="Seznam kategorií")
async def get_categories():
    """Vrátí seznam všech dostupných kategorií."""
    food_cats = [{"id": k, "name": v, "is_food": True} for k, v in FOOD_CATEGORIES.items()]
    non_food_cats = [{"id": k, "name": v, "is_food": False} for k, v in NON_FOOD_CATEGORIES.items()]
    
    return {
        "categories": sorted(food_cats + non_food_cats, key=lambda x: x["id"]),
        "food_categories": sorted(list(FOOD_CATEGORIES.keys())),
        "non_food_categories": sorted(list(NON_FOOD_CATEGORIES.keys())),
        "shops": VALID_SHOPS
    }


@app.get("/discounts/category/{category}", response_model=DiscountsResponse, summary="Slevy podle kategorie")
async def get_discounts_by_category(
    category: str,
    max_pages: int = Query(1, ge=1, le=5, description="Počet stránek (1-5)")
):
    """
    Získá aktuální slevy pro konkrétní kategorii.
    
    **Toto je preferovaný způsob** - kategorie je nativní z kupi.cz.
    """
    all_categories = {**FOOD_CATEGORIES, **NON_FOOD_CATEGORIES}
    if category not in all_categories:
        raise HTTPException(status_code=400, detail=f"Neplatná kategorie. Povolené: {list(all_categories.keys())}")
    
    try:
        raw_products = get_products_by_category(category, max_pages)
        
        products = []
        shop_counts: Dict[str, int] = {}
        category_display = all_categories[category]
        is_food = category in FOOD_CATEGORIES
        
        for product_data in raw_products:
            product = Product(
                name=product_data.get("name", ""),
                shops=[s for s in product_data.get("shops", []) if s],
                prices=[p for p in product_data.get("prices", []) if p],
                amounts=[a for a in product_data.get("amounts", []) if a],
                validities=[v for v in product_data.get("validities", []) if v],
                category=category,
                category_display=category_display,
                is_food=is_food
            )
            products.append(product)
            
            for shop in product.shops:
                shop_lower = shop.lower()
                shop_counts[shop_lower] = shop_counts.get(shop_lower, 0) + 1
        
        return DiscountsResponse(
            products=products,
            total_count=len(products),
            category_counts={category: len(products)},
            shop_counts=shop_counts
        )
        
    except Exception as e:
        logger.error(f"Chyba při získávání slev z kategorie {category}: {e}")
        raise HTTPException(status_code=500, detail=f"Chyba: {str(e)}")


@app.get("/discounts/shop/{shop}", response_model=DiscountsResponse, summary="Slevy z obchodu (starý způsob)")
async def get_discounts_by_shop_endpoint(
    shop: str,
    max_pages: int = Query(1, ge=1, le=5, description="Počet stránek (1-5)")
):
    """
    Získá aktuální slevy pro konkrétní obchod.
    
    **POZOR:** Tento endpoint NEMÁ správné kategorie - produkty nemají nativní kategorii z kupi.cz.
    Pro správné kategorie použijte `/discounts/category/{category}`.
    """
    if shop not in VALID_SHOPS:
        raise HTTPException(status_code=400, detail=f"Neplatný obchod. Povolené: {VALID_SHOPS}")
    
    try:
        raw_products = get_products_by_shop(shop, max_pages)
        
        products = []
        
        for product_data in raw_products:
            product = Product(
                name=product_data.get("name", ""),
                shops=[s for s in product_data.get("shops", []) if s],
                prices=[p for p in product_data.get("prices", []) if p],
                amounts=[a for a in product_data.get("amounts", []) if a],
                validities=[v for v in product_data.get("validities", []) if v],
                category="unknown",  # Nemáme kategorii při fetchování podle obchodu!
                category_display="Neznámá kategorie",
                is_food=True  # Předpokládáme potravinu
            )
            products.append(product)
        
        return DiscountsResponse(
            products=products,
            total_count=len(products),
            category_counts={"unknown": len(products)},
            shop_counts={shop: len(products)}
        )
        
    except Exception as e:
        logger.error(f"Chyba při získávání slev z {shop}: {e}")
        raise HTTPException(status_code=500, detail=f"Chyba: {str(e)}")


# =============================================================================
# ETL Endpoints - pro ETL službu
# =============================================================================

@app.get("/v1/discounts/etl", response_model=ETLResponse, summary="ETL endpoint - všechny potravinové kategorie")
async def get_all_food_discounts_for_etl(
    max_pages_per_category: int = Query(3, ge=1, le=10, description="Stránek na kategorii")
):
    """
    Hlavní ETL endpoint - vrací produkty ze VŠECH potravinových kategorií.
    
    Tento endpoint je preferovaný pro ETL službu, protože:
    - Fetchuje podle nativních kategorií z kupi.cz
    - Automaticky přiřazuje správnou kategorii každému produktu
    - Filtruje pouze potravinové kategorie
    
    **Poznámka:** original_price a discount_percentage nejsou dostupné z kupi.cz
    """
    all_products: List[ETLProduct] = []
    categories_fetched: List[str] = []
    shops_found: set = set()
    
    for category_id, category_name in FOOD_CATEGORIES.items():
        try:
            logger.info(f"Fetchuji kategorii: {category_id}")
            raw_products = get_products_by_category(category_id, max_pages=max_pages_per_category)
            
            for product_data in raw_products:
                etl_products = convert_to_etl_product(product_data, category_id, category_name)
                all_products.extend(etl_products)
                
                for p in etl_products:
                    shops_found.add(p.shop_name)
            
            categories_fetched.append(category_id)
            logger.info(f"Kategorie {category_id}: {len(raw_products)} raw produktů")
            
        except Exception as e:
            logger.error(f"Chyba při fetchování kategorie {category_id}: {e}")
    
    logger.info(f"ETL celkem: {len(all_products)} produktů z {len(categories_fetched)} kategorií")
    
    return ETLResponse(
        products=all_products,
        total_count=len(all_products),
        categories_fetched=categories_fetched,
        shops_fetched=sorted(list(shops_found)),
        fetched_at=datetime.now(TZ).isoformat()
    )


@app.get("/v1/discounts/category/{category}/etl", response_model=CategoryETLResponse, summary="ETL endpoint - konkrétní kategorie")
async def get_category_discounts_for_etl(
    category: str,
    max_pages: int = Query(0, ge=0, le=10, description="Počet stránek (0 = všechny)")
):
    """
    ETL endpoint pro konkrétní kategorii.
    
    Vhodné pro inkrementální ETL nebo testování.
    """
    if category not in FOOD_CATEGORIES:
        raise HTTPException(
            status_code=400, 
            detail=f"Neplatná potravinová kategorie. Povolené: {list(FOOD_CATEGORIES.keys())}"
        )
    
    try:
        category_name = FOOD_CATEGORIES[category]
        raw_products = get_products_by_category(category, max_pages=max_pages if max_pages > 0 else 5)
        
        etl_products = []
        for product_data in raw_products:
            products = convert_to_etl_product(product_data, category, category_name)
            etl_products.extend(products)
        
        logger.info(f"ETL {category}: {len(etl_products)} produktů připraveno")
        
        return CategoryETLResponse(
            products=etl_products,
            total_count=len(etl_products),
            category=category,
            category_display=category_name,
            fetched_at=datetime.now(TZ).isoformat()
        )
        
    except Exception as e:
        logger.error(f"ETL chyba pro kategorii {category}: {e}")
        raise HTTPException(status_code=500, detail=f"ETL chyba: {str(e)}")


# Zachováme starý endpoint pro zpětnou kompatibilitu (deprecated)
@app.get("/v1/discounts/store/{shop}/etl", deprecated=True, summary="[DEPRECATED] ETL endpoint podle obchodu")
async def get_shop_discounts_for_etl_deprecated(
    shop: str,
    food_only: bool = Query(True),
    max_pages: int = Query(0, ge=0, le=10)
):
    """
    **DEPRECATED:** Tento endpoint nemá správné kategorie!
    
    Použijte místo něj `/v1/discounts/etl` pro správné kategorie z kupi.cz.
    """
    return {
        "error": "deprecated",
        "message": "Tento endpoint je zastaralý. Použijte /v1/discounts/etl pro správné kategorie z kupi.cz",
        "new_endpoint": "/v1/discounts/etl"
    }


# =============================================================================
# Main
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
