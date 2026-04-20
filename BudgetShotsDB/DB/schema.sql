-- ============================================================================
-- BudgetShots Database Schema
-- PostgreSQL DDL for discount tracking and product normalization
-- ============================================================================

-- ============================================================================
-- EXTENSIONS (must be created first)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- 1. STORES
-- ----------------------------------------------------------------------------
-- Purpose: Master list of retail stores (Kaufland, Lidl, Albert, etc.)
-- Used for: Tracking which store has which offer, filtering by store
-- ============================================================================
CREATE TABLE IF NOT EXISTS stores (
    id              SERIAL PRIMARY KEY,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stores_slug ON stores(slug);
CREATE INDEX idx_stores_is_active ON stores(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE stores IS 'Master list of retail stores';
COMMENT ON COLUMN stores.slug IS 'URL-friendly unique identifier, e.g. "kaufland"';

-- ============================================================================
-- 2. PRODUCT_TYPES
-- ----------------------------------------------------------------------------
-- Purpose: Normalized product categories for matching recipes to discounts
-- Examples: vodka, gin, white_rum, dark_rum, tequila, beer, sparkling_wine
-- Used for: Product classification, recommendation engine matching
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_types (
    id              SERIAL PRIMARY KEY,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    is_alcoholic    BOOLEAN NOT NULL DEFAULT TRUE,
    parent_slug     VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_types_slug ON product_types(slug);
CREATE INDEX idx_product_types_parent_slug ON product_types(parent_slug);
CREATE INDEX idx_product_types_is_alcoholic ON product_types(is_alcoholic);

COMMENT ON TABLE product_types IS 'Normalized product categories for recipe matching';
COMMENT ON COLUMN product_types.parent_slug IS 'Optional parent type for hierarchy (e.g. white_rum -> rum)';

-- ============================================================================
-- 3. PRODUCTS
-- ----------------------------------------------------------------------------
-- Purpose: Catalog of specific products that can be purchased
-- Examples: "Finlandia Vodka 0.7l", "Pilsner Urquell 15x0.5l"
-- Used for: Product master data, volume calculations, price per liter
-- Note: product_type_id is nullable to allow products that haven't been
--       classified yet. Unclassified products can still be stored and
--       matched later as alias rules improve.
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
    id                          SERIAL PRIMARY KEY,
    name                        VARCHAR(500) NOT NULL,
    normalized_name             VARCHAR(500),
    brand                       VARCHAR(255),
    product_type_id             INTEGER REFERENCES product_types(id) ON DELETE SET NULL,
    category_raw                VARCHAR(255),
    category_display_raw        VARCHAR(255),
    unit_raw                    VARCHAR(100),
    pack_count                  INTEGER,
    volume_per_unit_ml          INTEGER,
    total_volume_ml             INTEGER,
    abv                         DECIMAL(5,2),
    is_multipack                BOOLEAN NOT NULL DEFAULT FALSE,
    normalization_confidence    DECIMAL(3,2),
    is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_pack_count_positive CHECK (pack_count IS NULL OR pack_count > 0),
    CONSTRAINT chk_volume_per_unit_positive CHECK (volume_per_unit_ml IS NULL OR volume_per_unit_ml > 0),
    CONSTRAINT chk_total_volume_positive CHECK (total_volume_ml IS NULL OR total_volume_ml > 0),
    CONSTRAINT chk_abv_range CHECK (abv IS NULL OR (abv >= 0 AND abv <= 100)),
    CONSTRAINT chk_confidence_range CHECK (normalization_confidence IS NULL OR (normalization_confidence >= 0 AND normalization_confidence <= 1))
);

CREATE INDEX idx_products_product_type_id ON products(product_type_id);
CREATE INDEX idx_products_is_active ON products(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_normalized_name ON products(normalized_name);
CREATE INDEX idx_products_brand ON products(brand) WHERE brand IS NOT NULL;
CREATE INDEX idx_products_total_volume_ml ON products(total_volume_ml) WHERE total_volume_ml IS NOT NULL;

COMMENT ON TABLE products IS 'Catalog of specific purchasable products';
COMMENT ON COLUMN products.normalized_name IS 'Lowercased name without unit suffixes for deduplication';
COMMENT ON COLUMN products.unit_raw IS 'Raw unit string, e.g. "15x 0.5 l" or "0.7 l"';
COMMENT ON COLUMN products.pack_count IS 'Number of units in pack (parsed from unit_raw)';
COMMENT ON COLUMN products.volume_per_unit_ml IS 'Volume per single unit in ml (parsed from unit_raw)';
COMMENT ON COLUMN products.total_volume_ml IS 'Total volume = pack_count * volume_per_unit_ml';
COMMENT ON COLUMN products.normalization_confidence IS 'Confidence score 0-1 for product type classification';
COMMENT ON COLUMN products.product_type_id IS 'Nullable - unclassified products can be matched later';

-- ============================================================================
-- 4. OFFERS
-- ----------------------------------------------------------------------------
-- Purpose: Specific discount offers for products at stores within time ranges
-- Used for: Current deals, price comparison, recommendation engine
-- ============================================================================
CREATE TABLE IF NOT EXISTS offers (
    id                      SERIAL PRIMARY KEY,
    product_id              INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id                INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    price_discounted        DECIMAL(10,2) NOT NULL,
    price_regular           DECIMAL(10,2),
    discount_percentage     DECIMAL(5,2),
    valid_from              DATE NOT NULL,
    valid_until             DATE NOT NULL,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    price_per_l_discounted  DECIMAL(10,2),
    price_per_l_regular     DECIMAL(10,2),
    source_type             VARCHAR(50),
    source_reference        VARCHAR(255),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_price_discounted_positive CHECK (price_discounted > 0),
    CONSTRAINT chk_price_regular_positive CHECK (price_regular IS NULL OR price_regular > 0),
    CONSTRAINT chk_discount_percentage_range CHECK (discount_percentage IS NULL OR (discount_percentage >= 0 AND discount_percentage <= 100)),
    CONSTRAINT chk_valid_dates CHECK (valid_from <= valid_until),
    CONSTRAINT chk_price_per_l_positive CHECK (price_per_l_discounted IS NULL OR price_per_l_discounted > 0)
);

CREATE INDEX idx_offers_product_id ON offers(product_id);
CREATE INDEX idx_offers_store_id ON offers(store_id);
CREATE INDEX idx_offers_is_active ON offers(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_offers_valid_dates ON offers(valid_from, valid_until);
CREATE INDEX idx_offers_valid_until ON offers(valid_until);
CREATE INDEX idx_offers_price_per_l_discounted ON offers(price_per_l_discounted) WHERE price_per_l_discounted IS NOT NULL;
CREATE INDEX idx_offers_composite ON offers(product_id, store_id, valid_from, valid_until);

COMMENT ON TABLE offers IS 'Discount offers for products at specific stores';
COMMENT ON COLUMN offers.price_per_l_discounted IS 'Denormalized: discounted price per liter for fast queries';
COMMENT ON COLUMN offers.price_per_l_regular IS 'Denormalized: regular price per liter';
COMMENT ON COLUMN offers.source_type IS 'Source of data, e.g. "kupiapi", "manual"';

-- ============================================================================
-- 5. OFFERS_RAW
-- ----------------------------------------------------------------------------
-- Purpose: Raw imported data for debugging, reprocessing, and audit trail
-- Used for: Import history, data quality checks, reprocessing pipeline
-- ============================================================================
CREATE TABLE IF NOT EXISTS offers_raw (
    id                      SERIAL PRIMARY KEY,
    external_id             VARCHAR(255),
    product_name            VARCHAR(500) NOT NULL,
    price                   DECIMAL(10,2),
    original_price          DECIMAL(10,2),
    discount_percentage     DECIMAL(5,2),
    shop_name               VARCHAR(255) NOT NULL,
    category                VARCHAR(255),
    category_display        VARCHAR(255),
    unit                    VARCHAR(100),
    valid_from              DATE,
    valid_until             DATE,
    raw_payload             JSONB,
    import_batch_id         VARCHAR(100),
    normalized_product_id   INTEGER REFERENCES products(id) ON DELETE SET NULL,
    normalized_offer_id     INTEGER REFERENCES offers(id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_offers_raw_import_batch_id ON offers_raw(import_batch_id);
CREATE INDEX idx_offers_raw_shop_name ON offers_raw(shop_name);
CREATE INDEX idx_offers_raw_created_at ON offers_raw(created_at);
CREATE INDEX idx_offers_raw_normalized_product_id ON offers_raw(normalized_product_id);
CREATE INDEX idx_offers_raw_normalized_offer_id ON offers_raw(normalized_offer_id);
CREATE INDEX idx_offers_raw_product_name_trgm ON offers_raw USING gin(product_name gin_trgm_ops);

COMMENT ON TABLE offers_raw IS 'Raw imported data for audit and reprocessing';
COMMENT ON COLUMN offers_raw.raw_payload IS 'Complete original JSON from source';
COMMENT ON COLUMN offers_raw.import_batch_id IS 'Identifies which import run created this record';
COMMENT ON COLUMN offers_raw.normalized_product_id IS 'FK to product created from this raw data';
COMMENT ON COLUMN offers_raw.normalized_offer_id IS 'FK to offer created from this raw data';

-- ============================================================================
-- 6. PRODUCT_ALIASES
-- ----------------------------------------------------------------------------
-- Purpose: Pattern matching rules for product classification
-- Examples: "vodka" -> vodka, "jagermeister" -> herbal_liqueur
-- Used for: Automated product type detection during normalization
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_aliases (
    id              SERIAL PRIMARY KEY,
    match_value     VARCHAR(255) NOT NULL,
    match_type      VARCHAR(20) NOT NULL DEFAULT 'contains',
    product_type_id INTEGER NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
    brand           VARCHAR(255),
    priority        INTEGER NOT NULL DEFAULT 100,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_match_type CHECK (match_type IN ('exact', 'contains', 'regex', 'starts_with', 'ends_with'))
);

CREATE INDEX idx_product_aliases_product_type_id ON product_aliases(product_type_id);
CREATE INDEX idx_product_aliases_match_value ON product_aliases(match_value);
CREATE INDEX idx_product_aliases_priority ON product_aliases(priority);
CREATE INDEX idx_product_aliases_match_type ON product_aliases(match_type);

COMMENT ON TABLE product_aliases IS 'Pattern matching rules for product classification';
COMMENT ON COLUMN product_aliases.match_value IS 'Pattern to match against product name';
COMMENT ON COLUMN product_aliases.match_type IS 'How to match: exact, contains, regex, starts_with, ends_with';
COMMENT ON COLUMN product_aliases.priority IS 'Higher priority aliases are checked first (default 100)';

-- ============================================================================
-- HELPER FUNCTION: Update timestamp trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTION: Calculate price per liter
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_price_per_liter(price DECIMAL, volume_ml INTEGER)
RETURNS DECIMAL AS $$
BEGIN
    IF volume_ml IS NULL OR volume_ml = 0 THEN
        RETURN NULL;
    END IF;
    RETURN ROUND((price * 1000.0) / volume_ml, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- VIEW: Active offers with product details
-- ============================================================================
CREATE OR REPLACE VIEW v_active_offers AS
SELECT
    o.id AS offer_id,
    o.price_discounted,
    o.price_regular,
    o.discount_percentage,
    o.valid_from,
    o.valid_until,
    o.price_per_l_discounted,
    o.price_per_l_regular,
    p.id AS product_id,
    p.name AS product_name,
    p.brand,
    p.total_volume_ml,
    p.pack_count,
    p.volume_per_unit_ml,
    pt.id AS product_type_id,
    pt.slug AS product_type_slug,
    pt.name AS product_type_name,
    s.id AS store_id,
    s.slug AS store_slug,
    s.name AS store_name
FROM offers o
JOIN products p ON o.product_id = p.id
JOIN stores s ON o.store_id = s.id
LEFT JOIN product_types pt ON p.product_type_id = pt.id
WHERE o.is_active = TRUE
  AND p.is_active = TRUE
  AND s.is_active = TRUE
  AND CURRENT_DATE BETWEEN o.valid_from AND o.valid_until;

COMMENT ON VIEW v_active_offers IS 'Currently valid offers with full product and store details';
