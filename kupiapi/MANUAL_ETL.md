# BudgetBites - Manuální spuštění ETL

## 🚀 Jak spustit manuální ETL proces

### Možnost 1: Pomocí PowerShell skriptu (doporučeno pro Windows)
```powershell
# Spustit plný ETL proces
.\trigger_etl.ps1
```

### Možnost 2: Přímé spuštění v kontejneru

**Plný ETL proces (všechny obchody a kategorie):**
```bash
docker exec budgetbites-etl python /app/manual_etl_trigger.py --action etl
```

**Částečný ETL pro konkrétní obchody:**
```bash
# Jen Lidl
docker exec budgetbites-etl python /app/manual_etl_trigger.py --action etl --shops lidl

# Lidl a Kaufland
docker exec budgetbites-etl python /app/manual_etl_trigger.py --action etl --shops lidl kaufland
```

**Částečný ETL pro konkrétní kategorie:**
```bash
# Jen maso a mléčné výrobky
docker exec budgetbites-etl python /app/manual_etl_trigger.py --action etl --categories maso mlecne

# Konkrétní kombinace
docker exec budgetbites-etl python /app/manual_etl_trigger.py --action etl --shops lidl billa --categories maso ovoce zelenina
```

## 🔍 Kontrola výsledků

**Test připojení k databázi:**
```bash
docker exec budgetbites-etl python /app/manual_etl_trigger.py --action test
```

**Zobrazení posledních slev:**
```bash
docker exec budgetbites-etl python /app/manual_etl_trigger.py --action discounts
```

**Statistiky ETL logů:**
```bash
docker exec postgres-avm-budgetbites psql -U admin -d budgetbites -c "
SELECT 
  process_start::date as datum,
  COUNT(*) as pocet_behu,
  SUM(products_added) as celkem_pridano
FROM etl_logs 
WHERE process_start > CURRENT_DATE - INTERVAL '7 days'
GROUP BY process_start::date 
ORDER BY datum DESC;
"
```

**Nejnovější slevy za dnes:**
```bash
docker exec postgres-avm-budgetbites psql -U admin -d budgetbites -c "
SELECT 
  shop_name,
  category,
  COUNT(*) as pocet_slev,
  AVG(discount_percentage)::DECIMAL(5,1) as prumerna_sleva,
  MIN(price) as nejlevnejsi
FROM discounts 
WHERE created_at::date = CURRENT_DATE
GROUP BY shop_name, category 
ORDER BY shop_name, pocet_slev DESC;
"
```

## 📋 Dostupné možnosti

### Obchody:
- `lidl` - Lidl
- `kaufland` - Kaufland  
- `albert` - Albert
- `billa` - Billa
- `penny` - Penny Market
- `globus` - Globus

### Kategorie:
- `maso` - Maso, uzeniny a ryby
- `mlecne` - Mléčné výrobky
- `ovoce` - Ovoce
- `zelenina` - Zelenina
- `napoje` - Nápoje
- `alkohol` - Alkohol
- `pecivo` - Pečivo
- `sladkosti` - Sladkosti
- `mrazene` - Mražené produkty

## 📈 Příklady výsledků

Po úspěšném spuštění ETL procesu byste měli vidět:
- Počet stažených produktů pro každý obchod/kategorii
- Počet nových, aktualizovaných a přeskočených produktů
- Celkový čas trvání procesu

Příklad výstupu:
```
✅ lidl/maso: 42 produktů, +3 nových, ~0 aktualizací, -39 přeskočeno
✅ lidl/mlecne: 42 produktů, +5 nových, ~1 aktualizace, -36 přeskočeno
```