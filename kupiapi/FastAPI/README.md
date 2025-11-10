# KupiAPI Bridge v2.0

REST API bridge pro kupiapi scraper používající **nativní kategorie** pro správnou klasifikaci produktů.

## ✨ Hlavní funkce

- 🏪 **Podpora 6 obchodů**: Albert, Lidl, Kaufland, Billa, Penny, Globus
- 🏷️ **26 nativních kategorií** přímo z kupiapi scraperu
- 🍎 **Automatické rozlišení** potravinářských a nepotravinářských produktů
- 🔍 **Pokročilé filtrování** podle kategorií a typu produktů
- 📊 **Statistiky** počtu produktů podle kategorií a obchodů
- 🌐 **Kompletní dokumentace** v SwaggerUI

## 📋 Kategorie

### 🍎 Potravinářské (12 kategorií):
- `alkohol` - Alkoholické nápoje
- `konzervy` - Konzervované potraviny  
- `lahudky` - Lahůdky a delikatesy
- `maso-drubez-a-ryby` - Maso, drůbež a ryby
- `mlecne-vyrobky-a-vejce` - Mléčné výrobky a vejce
- `mrazene-a-instantni-potraviny` - Mražené a instant potraviny
- `nealko-napoje` - Nealkoholické nápoje
- `ovoce-a-zelenina` - Ovoce a zelenina
- `pecivo` - Pečivo a chléb
- `sladkosti-a-slane-snacky` - Sladkosti a slané snacky
- `vareni-a-peceni` - Vaření a pečení
- `zdrava-vyziva` - Zdravá výživa a bio produkty

### 🏠 Nepotravinářské (14 kategorií):
- `auto-moto` - Auto a moto produkty
- `domacnost` - Domácnost a čisticí prostředky
- `drogerie` - Drogerie a hygiena
- `elektro` - Elektronika a technika
- `hracky-2` - Hračky
- `kancelarske-potreby-a-knihy-2` - Kancelářské potřeby
- `krasa` - Krása a péče
- `lekarna` - Lékárenské produkty
- `mazlicci` - Produkty pro mazlíčky
- `nabytek-2` - Nábytek
- `obleceni-a-obuv` - Oblečení a obuv
- `pro-deti` - Produkty pro děti
- `sport-2` - Sportovní potřeby
- `bydleni-a-zahrada` - Bydlení a zahrada

## 🔌 API Endpointy

### Základní endpointy:
- `GET /` - Health check
- `GET /docs` - SwaggerUI dokumentace
- `GET /categories` - Seznam všech kategorií s přátelskými názvy

### Hlavní funkcionalita:
- `GET /discounts/{shop}` - Slevy pro konkrétní obchod
- `GET /discounts` - Slevy ze všech obchodů  
- `GET /etl` - ETL endpoint pro pravidelné stahování

### Parametry filtrování:
- `category` - Kupiapi kategorie (např. `alkohol`, `drogerie`)
- `food_only=true` - Pouze potravinářské produkty
- `max_pages=1-5` - Počet stránek ke stažení

## 🚀 Lokální spuštění

### Docker (doporučeno):
```bash
docker-compose up -d
```

### Nativně:
```bash
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

## 📖 Použití

### Získání kategorií:
```bash
curl http://localhost:8000/categories
```

### Slevy z Alberta:
```bash
curl "http://localhost:8000/discounts/albert"
```

### Pouze potraviny z Alberta:
```bash
curl "http://localhost:8000/discounts/albert?food_only=true"
```

### Pouze alkohol ze všech obchodů:
```bash
curl "http://localhost:8000/discounts?category=alkohol"
```

## 📊 Příklad odpovědi

```json
{
  "products": [
    {
      "name": "Limonáda Coca Cola",
      "shops": ["Albert"],
      "prices": ["26,90 Kč"],
      "amounts": ["1.5 l"],
      "validities": ["zítra končí"],
      "category": "nealko-napoje",
      "category_display": "Nealkoholické nápoje",
      "is_food": true
    }
  ],
  "total_count": 18,
  "category_counts": {
    "nealko-napoje": 5,
    "alkohol": 8,
    "drogerie": 2
  },
  "shop_counts": {
    "Albert": 18
  }
}
```

## 🔧 Vylepšení oproti v1.0

- ✅ **Nativní kupiapi kategorie** místo custom klasifikace
- ✅ **Správná kategorizace** nepotravinářských produktů
- ✅ **Eliminace chyb** typu "čisticí prostředky → nápoje"
- ✅ **Lepší pokrytí** 26 kategorií místo 12
- ✅ **Rozšířená dokumentace** v SwaggerUI

## 🐛 Známé problémy

- Kupiapi knihovna má bug v `get_discounts_by_category()` - používáme workaround
- Klasifikace podle názvu produktu - může být někdy nepřesná
- Ideální by bylo použít kategorie přímo ze scraperů obchodů

## 📝 Licence

MIT License