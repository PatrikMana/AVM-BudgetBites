-- ============================================================================
-- Migration: Add normalized_name column to products
-- Run this manually if you have existing data and don't want to recreate DB
-- ============================================================================

-- Add column if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS normalized_name VARCHAR(500);

-- Create index
CREATE INDEX IF NOT EXISTS idx_products_normalized_name ON products(normalized_name);

-- Add comment
COMMENT ON COLUMN products.normalized_name IS 'Lowercased name without unit suffixes for deduplication';
COMMENT ON COLUMN products.product_type_id IS 'Nullable - unclassified products can be matched later';

-- Backfill normalized_name for existing products
-- This uses a simple lowercase + trim approach
-- The Python normalizer does more, but this is a reasonable approximation
UPDATE products
SET normalized_name = LOWER(TRIM(
    REGEXP_REPLACE(
        REGEXP_REPLACE(name, '\s*\d+\s*x\s*[\d.,]+\s*(l|ml|cl)\s*$', '', 'i'),
        '\s*[\d.,]+\s*(l|ml|cl)\s*$', '', 'i'
    )
))
WHERE normalized_name IS NULL;
