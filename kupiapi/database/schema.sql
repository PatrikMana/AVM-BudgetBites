-- BudgetBites Database Schema
-- Databáze pro ukládání slev potravinových produktů

-- Vytvoření hlavní tabulky pro slevy
CREATE TABLE IF NOT EXISTS discounts (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(500) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    discount_percentage DECIMAL(5,2),
    shop_name VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,  -- kupiapi kategorie (např. maso-drubez-a-ryby)
    category_display VARCHAR(100),    -- lidsky čitelný název kategorie
    unit VARCHAR(100),
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    is_food BOOLEAN DEFAULT TRUE,    -- zda jde o potravinu
    image_url VARCHAR(500),          -- URL obrázku produktu (pokud dostupné)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexy pro rychlé vyhledávání
CREATE INDEX IF NOT EXISTS idx_discounts_valid_dates ON discounts(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_discounts_shop_category ON discounts(shop_name, category);
CREATE INDEX IF NOT EXISTS idx_discounts_product_search ON discounts USING gin(to_tsvector('czech', product_name));
CREATE INDEX IF NOT EXISTS idx_discounts_week ON discounts(year, week_number);
CREATE INDEX IF NOT EXISTS idx_discounts_price ON discounts(price);
CREATE INDEX IF NOT EXISTS idx_discounts_created ON discounts(created_at);
CREATE INDEX IF NOT EXISTS idx_discounts_is_food ON discounts(is_food);
CREATE INDEX IF NOT EXISTS idx_discounts_discount_pct ON discounts(discount_percentage DESC);

-- Unique constraint pro zamezení duplikátů (stejný produkt, obchod, platnost)
CREATE UNIQUE INDEX IF NOT EXISTS idx_discounts_unique 
ON discounts(product_name, shop_name, valid_from, valid_until);

-- Tabulka pro ETL logy
CREATE TABLE IF NOT EXISTS etl_logs (
    id SERIAL PRIMARY KEY,
    process_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    process_end TIMESTAMP,
    shop_name VARCHAR(50),
    status VARCHAR(20) NOT NULL, -- success, error, running
    message TEXT,
    products_processed INTEGER DEFAULT 0,
    products_added INTEGER DEFAULT 0,
    products_updated INTEGER DEFAULT 0,
    products_skipped INTEGER DEFAULT 0,
    products_deleted INTEGER DEFAULT 0,
    error_details JSONB,
    duration_seconds INTEGER,
    trigger_type VARCHAR(20) DEFAULT 'scheduled' -- scheduled, manual, startup
);

-- Index pro ETL logy
CREATE INDEX IF NOT EXISTS idx_etl_logs_status ON etl_logs(status);
CREATE INDEX IF NOT EXISTS idx_etl_logs_start ON etl_logs(process_start DESC);
CREATE INDEX IF NOT EXISTS idx_etl_logs_shop ON etl_logs(shop_name);

-- Trigger pro automatické updatování updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_discounts_updated_at ON discounts;
CREATE TRIGGER update_discounts_updated_at 
    BEFORE UPDATE ON discounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vytvoření užitečných views
CREATE OR REPLACE VIEW active_discounts AS
SELECT 
    id,
    product_name,
    price,
    original_price,
    discount_percentage,
    shop_name,
    category,
    category_display,
    unit,
    valid_from,
    valid_until,
    week_number,
    year,
    is_food,
    image_url,
    created_at
FROM discounts 
WHERE valid_until >= CURRENT_DATE
ORDER BY discount_percentage DESC NULLS LAST, price ASC;

-- View pro aktivní POTRAVINOVÉ slevy (hlavní use case)
CREATE OR REPLACE VIEW active_food_discounts AS
SELECT 
    id,
    product_name,
    price,
    original_price,
    discount_percentage,
    shop_name,
    category,
    category_display,
    unit,
    valid_from,
    valid_until
FROM discounts 
WHERE valid_until >= CURRENT_DATE 
  AND is_food = TRUE
ORDER BY discount_percentage DESC NULLS LAST, price ASC;

-- View pro nejlepší slevy podle kategorie
CREATE OR REPLACE VIEW best_discounts_by_category AS
SELECT DISTINCT ON (category, product_name)
    category,
    category_display,
    product_name,
    price,
    original_price,
    discount_percentage,
    shop_name,
    unit,
    valid_from,
    valid_until
FROM discounts
WHERE valid_until >= CURRENT_DATE AND is_food = TRUE
ORDER BY category, product_name, discount_percentage DESC NULLS LAST, price ASC;

-- View pro týdenní statistiky
CREATE OR REPLACE VIEW weekly_stats AS
SELECT 
    year,
    week_number,
    category,
    shop_name,
    COUNT(*) as total_discounts,
    AVG(discount_percentage) as avg_discount,
    MIN(price) as min_price,
    MAX(price) as max_price,
    COUNT(DISTINCT product_name) as unique_products
FROM discounts
WHERE valid_until >= CURRENT_DATE
GROUP BY year, week_number, category, shop_name
ORDER BY year DESC, week_number DESC;

-- View pro ETL statistiky
CREATE OR REPLACE VIEW etl_stats AS
SELECT 
    DATE(process_start) as date,
    COUNT(*) as total_runs,
    SUM(products_added) as total_added,
    SUM(products_updated) as total_updated,
    SUM(products_deleted) as total_deleted,
    AVG(duration_seconds) as avg_duration_seconds,
    COUNT(*) FILTER (WHERE status = 'success') as successful_runs,
    COUNT(*) FILTER (WHERE status = 'error') as failed_runs
FROM etl_logs
GROUP BY DATE(process_start)
ORDER BY date DESC;

-- Funkce pro cleanup starých slev (mazání expirovaných)
CREATE OR REPLACE FUNCTION cleanup_expired_discounts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM discounts WHERE valid_until < CURRENT_DATE;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Funkce pro získání statistik databáze
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE(
    total_discounts BIGINT,
    active_discounts BIGINT,
    food_discounts BIGINT,
    unique_shops BIGINT,
    unique_categories BIGINT,
    avg_discount NUMERIC,
    last_etl_run TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM discounts)::BIGINT,
        (SELECT COUNT(*) FROM discounts WHERE valid_until >= CURRENT_DATE)::BIGINT,
        (SELECT COUNT(*) FROM discounts WHERE valid_until >= CURRENT_DATE AND is_food = TRUE)::BIGINT,
        (SELECT COUNT(DISTINCT shop_name) FROM discounts WHERE valid_until >= CURRENT_DATE)::BIGINT,
        (SELECT COUNT(DISTINCT category) FROM discounts WHERE valid_until >= CURRENT_DATE)::BIGINT,
        (SELECT AVG(discount_percentage) FROM discounts WHERE valid_until >= CURRENT_DATE AND discount_percentage IS NOT NULL),
        (SELECT MAX(process_end) FROM etl_logs WHERE status = 'success');
END;
$$ LANGUAGE plpgsql;