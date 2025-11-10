# Trigger manual ETL process (PowerShell version)

$ContainerName = "budgetbites-etl"

Write-Host "Spoustim manualni ETL proces..." -ForegroundColor Green

# Zkontrolovat, zda kontejner bezi
$RunningContainers = docker ps --format "table {{.Names}}" | Select-String -Pattern "^$ContainerName$"
if (-not $RunningContainers) {
    Write-Host "Kontejner $ContainerName nebezi!" -ForegroundColor Red
    Write-Host "Spustte nejdriv: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

try {
    # Zkopirovat trigger script do kontejneru (pokud neexistuje)
    Write-Host "Kopiruji trigger script..." -ForegroundColor Blue
    docker cp "etl/manual_etl_trigger.py" "${ContainerName}:/app/manual_etl_trigger.py"
    
    # Spustit manualni ETL
    Write-Host "Spoustim ETL proces v kontejneru..." -ForegroundColor Blue
    docker exec -it $ContainerName python /app/manual_etl_trigger.py --action etl

    Write-Host ""
    Write-Host "ETL dokoncen! Kontrola vysledku:" -ForegroundColor Green
    Write-Host ""

    # Zobrazit posledne pridane slevy
    Write-Host "Posledne pridane slevy:" -ForegroundColor Cyan
    docker exec -it $ContainerName python /app/manual_etl_trigger.py --action discounts

    Write-Host ""
    Write-Host "Test databaze:" -ForegroundColor Cyan
    docker exec -it $ContainerName python /app/manual_etl_trigger.py --action test

    Write-Host ""
    Write-Host "Manualni ETL proces dokoncen!" -ForegroundColor Green
    
} catch {
    Write-Host "ERROR pri spousteni ETL: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}