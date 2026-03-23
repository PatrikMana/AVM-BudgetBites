#!/usr/bin/env python3
"""
Scraper for TheCocktailDB API
Stahuje všechny koktejly, ingredience a metadata do JSON souborů.
"""

import json
import time
import string
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional, Dict, Any, List
from urllib.parse import quote

BASE_URL = "https://www.thecocktaildb.com/api/json/v1/1"
IMAGE_BASE_URL = "https://www.thecocktaildb.com/images"

MAX_WORKERS = 3  # Sníženo kvůli rate limitingu
REQUEST_DELAY = 0.5  # Delay mezi requesty v sekundách
MAX_RETRIES = 3


def api_get(endpoint: str, retries: int = MAX_RETRIES) -> Optional[Dict[str, Any]]:
    """Provede GET request na API s retry logikou."""
    for attempt in range(retries):
        try:
            url = f"{BASE_URL}/{endpoint}"
            response = requests.get(url, timeout=15)

            if response.status_code == 429:
                wait_time = (attempt + 1) * 2  # Exponential backoff
                time.sleep(wait_time)
                continue

            response.raise_for_status()
            time.sleep(REQUEST_DELAY)  # Rate limiting
            return response.json()
        except requests.exceptions.HTTPError as e:
            if "429" in str(e) and attempt < retries - 1:
                wait_time = (attempt + 1) * 2
                time.sleep(wait_time)
                continue
            return None
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1)
                continue
            return None
    return None


# =============================================================================
# OBRÁZKY - URL generátory
# =============================================================================

def get_ingredient_image_urls(ingredient_name: str) -> Dict[str, str]:
    """Vrátí URL obrázků ingredience ve všech velikostech."""
    encoded_name = quote(ingredient_name)
    return {
        "small": f"{IMAGE_BASE_URL}/ingredients/{encoded_name}-Small.png",      # 100x100
        "medium": f"{IMAGE_BASE_URL}/ingredients/{encoded_name}-Medium.png",    # 350x350
        "large": f"{IMAGE_BASE_URL}/ingredients/{encoded_name}.png"             # 700x700
    }


def get_cocktail_image_urls(image_url: str) -> Dict[str, str]:
    """Vrátí URL obrázků koktejlu ve všech velikostech."""
    if not image_url:
        return {"small": None, "medium": None, "large": None, "original": None}

    # Původní URL je ve formátu: .../drink/xxxxx.jpg
    # Varianty: /preview (small), bez suffixu (original)
    base = image_url.replace("/preview", "")
    return {
        "small": f"{base}/preview",    # 200x200 (nebo přidá /preview)
        "medium": base,                 # Originál je medium/large
        "large": base,                  #
        "original": base
    }


# =============================================================================
# SEZNAMY (metadata)
# =============================================================================

def fetch_categories() -> List[str]:
    """Stáhne seznam všech kategorií."""
    print("📂 Stahuji kategorie...")
    data = api_get("list.php?c=list")
    if data and data.get("drinks"):
        categories = [d["strCategory"] for d in data["drinks"]]
        print(f"   ✅ Nalezeno {len(categories)} kategorií")
        return categories
    return []


def fetch_glasses() -> List[str]:
    """Stáhne seznam všech sklenic."""
    print("🥃 Stahuji typy sklenic...")
    data = api_get("list.php?g=list")
    if data and data.get("drinks"):
        glasses = [d["strGlass"] for d in data["drinks"]]
        print(f"   ✅ Nalezeno {len(glasses)} typů sklenic")
        return glasses
    return []


def fetch_alcoholic_filters() -> List[str]:
    """Stáhne seznam alkoholických filtrů."""
    print("🍺 Stahuji alkoholické filtry...")
    data = api_get("list.php?a=list")
    if data and data.get("drinks"):
        filters = [d["strAlcoholic"] for d in data["drinks"]]
        print(f"   ✅ Nalezeno {len(filters)} filtrů")
        return filters
    return []


def fetch_ingredient_names() -> List[str]:
    """Stáhne seznam všech názvů ingrediencí."""
    print("📋 Stahuji seznam ingrediencí...")
    data = api_get("list.php?i=list")
    if data and data.get("drinks"):
        ingredients = [d["strIngredient1"] for d in data["drinks"]]
        print(f"   ✅ Nalezeno {len(ingredients)} ingrediencí")
        return ingredients
    return []


# =============================================================================
# KOKTEJLY
# =============================================================================

def fetch_cocktails_by_letter(letter: str) -> List[Dict[str, Any]]:
    """Stáhne všechny koktejly začínající na dané písmeno."""
    data = api_get(f"search.php?f={letter}")
    if data and data.get("drinks"):
        return data["drinks"]
    return []


def fetch_all_cocktails() -> List[Dict[str, Any]]:
    """Stáhne všechny koktejly přes abecední vyhledávání - sekvenčně."""
    print("🍹 Stahuji všechny koktejly...")
    all_cocktails = []
    letters = list(string.ascii_lowercase) + list(string.digits)

    for letter in letters:
        cocktails = fetch_cocktails_by_letter(letter)
        if cocktails:
            # Přidáme URL obrázků
            for cocktail in cocktails:
                cocktail["images"] = get_cocktail_image_urls(cocktail.get("strDrinkThumb"))
            all_cocktails.extend(cocktails)
            print(f"   Písmeno '{letter}': {len(cocktails)} koktejlů")

    # Odstranit duplicity podle ID
    seen_ids = set()
    unique_cocktails = []
    for cocktail in all_cocktails:
        if cocktail["idDrink"] not in seen_ids:
            seen_ids.add(cocktail["idDrink"])
            unique_cocktails.append(cocktail)

    print(f"   ✅ Celkem nalezeno {len(unique_cocktails)} unikátních koktejlů")
    return unique_cocktails


# =============================================================================
# INGREDIENCE
# =============================================================================

def fetch_ingredient_detail(ingredient_name: str) -> Optional[Dict[str, Any]]:
    """Stáhne detail ingredience podle názvu."""
    data = api_get(f"search.php?i={quote(ingredient_name)}")
    if data and data.get("ingredients"):
        ingredient = data["ingredients"][0]
        # Přidáme URL obrázků
        ingredient["images"] = get_ingredient_image_urls(ingredient_name)
        return ingredient
    return None


def fetch_all_ingredients(ingredient_names: List[str]) -> List[Dict[str, Any]]:
    """Stáhne detaily všech ingrediencí - sekvenčně kvůli rate limitingu."""
    print("🧂 Stahuji detaily ingrediencí...")
    ingredients = []

    for i, name in enumerate(ingredient_names):
        if (i + 1) % 20 == 0:
            print(f"   Zpracováno {i + 1}/{len(ingredient_names)}...")

        result = fetch_ingredient_detail(name)
        if result:
            ingredients.append(result)

    print(f"   ✅ Staženo {len(ingredients)} ingrediencí s detaily")
    return ingredients


# =============================================================================
# KOKTEJLY PODLE FILTRU
# =============================================================================

def fetch_cocktails_by_filter(filter_type: str, filter_value: str) -> List[Dict[str, Any]]:
    """Stáhne koktejly podle filtru (kategorie, sklenice, ingredience, alkohol)."""
    encoded_value = quote(filter_value.replace(" ", "_"))
    data = api_get(f"filter.php?{filter_type}={encoded_value}")
    if data and data.get("drinks"):
        return data["drinks"]
    return []


def build_filter_mapping(categories: List[str], glasses: List[str],
                         alcoholic: List[str], ingredients: List[str]) -> Dict[str, Any]:
    """Vytvoří mapování koktejlů podle různých filtrů - sekvenčně."""
    print("\n📊 Vytvářím mapování filtrů...")

    mapping = {
        "by_category": {},
        "by_glass": {},
        "by_alcoholic": {},
        "by_ingredient": {}
    }

    # Kategorie
    print("   Mapuji kategorie...")
    for category in categories:
        cocktails = fetch_cocktails_by_filter("c", category)
        if cocktails:
            mapping["by_category"][category] = [c["idDrink"] for c in cocktails]
        time.sleep(0.3)

    # Sklenice
    print("   Mapuji sklenice...")
    for glass in glasses:
        cocktails = fetch_cocktails_by_filter("g", glass)
        if cocktails:
            mapping["by_glass"][glass] = [c["idDrink"] for c in cocktails]
        time.sleep(0.3)

    # Alkoholický filtr
    print("   Mapuji alkoholické filtry...")
    for alc in alcoholic:
        cocktails = fetch_cocktails_by_filter("a", alc)
        if cocktails:
            mapping["by_alcoholic"][alc] = [c["idDrink"] for c in cocktails]
        time.sleep(0.3)

    # Top 50 ingrediencí
    print("   Mapuji top ingredience...")
    top_ingredients = ingredients[:50]
    for i, ing in enumerate(top_ingredients):
        if (i + 1) % 10 == 0:
            print(f"      {i + 1}/{len(top_ingredients)} ingrediencí...")
        cocktails = fetch_cocktails_by_filter("i", ing)
        if cocktails:
            mapping["by_ingredient"][ing] = [c["idDrink"] for c in cocktails]
        time.sleep(0.3)

    return mapping


# =============================================================================
# UKLÁDÁNÍ
# =============================================================================

def save_to_json(data: Any, filename: str):
    """Uloží data do JSON souboru."""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"💾 Uloženo: {filename}")


# =============================================================================
# MAIN
# =============================================================================

def main():
    print("=" * 60)
    print("🍸 TheCocktailDB Scraper")
    print("=" * 60)
    print()

    start_time = time.time()

    # 1. Stáhnout metadata (seznamy)
    print("📚 FÁZE 1: Metadata")
    print("-" * 40)
    categories = fetch_categories()
    glasses = fetch_glasses()
    alcoholic_filters = fetch_alcoholic_filters()
    ingredient_names = fetch_ingredient_names()
    print()

    # 2. Stáhnout všechny koktejly
    print("🍹 FÁZE 2: Koktejly")
    print("-" * 40)
    cocktails = fetch_all_cocktails()
    print()

    # 3. Stáhnout detaily ingrediencí
    print("🧂 FÁZE 3: Ingredience")
    print("-" * 40)
    ingredients = fetch_all_ingredients(ingredient_names)
    print()

    # 4. Vytvořit mapování filtrů
    print("📊 FÁZE 4: Mapování filtrů")
    print("-" * 40)
    filter_mapping = build_filter_mapping(categories, glasses, alcoholic_filters, ingredient_names)
    print()

    # 5. Uložit vše
    print("💾 FÁZE 5: Ukládání")
    print("-" * 40)

    # Hlavní data
    save_to_json(cocktails, "cocktails.json")
    save_to_json(ingredients, "ingredients.json")

    # Metadata
    metadata = {
        "categories": categories,
        "glasses": glasses,
        "alcoholic_filters": alcoholic_filters,
        "ingredient_names": ingredient_names,
        "filter_mapping": filter_mapping,
        "stats": {
            "total_cocktails": len(cocktails),
            "total_ingredients": len(ingredients),
            "total_categories": len(categories),
            "total_glasses": len(glasses)
        },
        "image_url_patterns": {
            "ingredient": {
                "small": "https://www.thecocktaildb.com/images/ingredients/{name}-Small.png",
                "medium": "https://www.thecocktaildb.com/images/ingredients/{name}-Medium.png",
                "large": "https://www.thecocktaildb.com/images/ingredients/{name}.png"
            },
            "cocktail": {
                "preview": "{strDrinkThumb}/preview",
                "original": "{strDrinkThumb}"
            }
        }
    }
    save_to_json(metadata, "metadata.json")

    print()
    elapsed = time.time() - start_time
    print("=" * 60)
    print(f"🎉 Hotovo za {elapsed:.1f} sekund!")
    print(f"   📊 Koktejly:    {len(cocktails)}")
    print(f"   🧂 Ingredience: {len(ingredients)}")
    print(f"   📂 Kategorie:   {len(categories)}")
    print(f"   🥃 Sklenice:    {len(glasses)}")
    print("=" * 60)


if __name__ == "__main__":
    main()
