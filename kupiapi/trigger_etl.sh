#!/bin/bash
# Trigger manual ETL process

set -e

CONTAINER_NAME="budgetbites-etl"

echo "🚀 Spouštím manuální ETL proces..."

# Zkontrolovat, zda kontejner běží
if ! docker ps --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Kontejner ${CONTAINER_NAME} neběží!"
    echo "Spusťte nejdříve: docker-compose up -d"
    exit 1
fi

# Spustit manuální ETL
echo "📦 Spouštím ETL proces v kontejneru..."
docker exec -it ${CONTAINER_NAME} python /app/manual_etl_trigger.py --action etl

echo ""
echo "✅ ETL dokončen! Kontrola výsledků:"
echo ""

# Zobrazit posledně přidané slevy
echo "🛒 Posledně přidané slevy:"
docker exec -it ${CONTAINER_NAME} python /app/manual_etl_trigger.py --action discounts

echo ""
echo "📊 Test databáze:"
docker exec -it ${CONTAINER_NAME} python /app/manual_etl_trigger.py --action test

echo ""
echo "🎉 Manuální ETL proces dokončen!"