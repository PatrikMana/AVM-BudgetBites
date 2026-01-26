# BudgetBites ETL Service Docker Image
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=Europe/Prague

WORKDIR /app

# Systémové závislosti
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    tzdata \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python závislosti
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ETL aplikace
COPY etl_service.py .

# Vytvoření logs adresáře
RUN mkdir -p /app/logs

# Expose port pro HTTP API (manuální trigger)
EXPOSE 8080

# Health check - kontroluje HTTP API
HEALTHCHECK --interval=60s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Spuštění ETL service
CMD ["python", "etl_service.py"]