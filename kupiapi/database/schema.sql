-- BudgetBites Database Schema
-- Databáze pro ukládání slev potravinových produktů

-- Vytvoření hlavní tabulky pro slevy
CREATE TABLE IF NOT EXISTS discounts (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    discount_percentage DECIMAL(5,2),
    shop_name VARCHAR(50) NOT NULL,
    category VARCHAR(20) NOT NULL,
    unit VARCHAR(50),
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
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

-- Unique constraint pro zamezení duplikátů (stejný produkt, obchod, platnost)
CREATE UNIQUE INDEX IF NOT EXISTS idx_discounts_unique 
ON discounts(product_name, shop_name, valid_from, valid_until);

-- Tabulka pro ETL logy
CREATE TABLE IF NOT EXISTS etl_logs (
    id SERIAL PRIMARY KEY,
    process_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    process_end TIMESTAMP,
    shop_name VARCHAR(50),
    category VARCHAR(20),
    status VARCHAR(20) NOT NULL, -- success, error, retry, running
    message TEXT,
    products_processed INTEGER DEFAULT 0,
    products_added INTEGER DEFAULT 0,
    products_updated INTEGER DEFAULT 0,
    products_skipped INTEGER DEFAULT 0,
    error_details JSONB,
    duration_seconds INTEGER
);

-- Index pro ETL logy
CREATE INDEX IF NOT EXISTS idx_etl_logs_status ON etl_logs(status);
CREATE INDEX IF NOT EXISTS idx_etl_logs_start ON etl_logs(process_start);
CREATE INDEX IF NOT EXISTS idx_etl_logs_shop ON etl_logs(shop_name);

-- Trigger pro automatické updatování updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

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
    unit,
    valid_from,
    valid_until,
    week_number,
    year,
    created_at
FROM discounts 
WHERE valid_until >= CURRENT_DATE
ORDER BY discount_percentage DESC, price ASC;

-- View pro nejlepší slevy podle kategorie
CREATE OR REPLACE VIEW best_discounts_by_category AS
SELECT DISTINCT ON (category, product_name)
    category,
    product_name,
    price,
    original_price,
    discount_percentage,
    shop_name,
    unit,
    valid_from,
    valid_until
FROM active_discounts
ORDER BY category, product_name, discount_percentage DESC, price ASC;

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
FROM active_discounts
GROUP BY year, week_number, category, shop_name
ORDER BY year DESC, week_number DESC;