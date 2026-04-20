-- ============================================================================
-- BudgetShots Example INSERTs and Queries
-- ============================================================================

-- ============================================================================
-- EXAMPLE INSERTs
-- ============================================================================

-- 1. Insert a store
INSERT INTO stores (slug, name)
VALUES ('kaufland', 'Kaufland')
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert a product type
INSERT INTO product_types (slug, name, is_alcoholic, parent_slug)
VALUES ('vodka', 'Vodka', TRUE, NULL)
ON CONFLICT (slug) DO NOTHING;

-- 3. Insert a product
INSERT INTO products (
    name, brand, product_type_id, category_raw, unit_raw,
    pack_count, volume_per_unit_ml, total_volume_ml,
    is_multipack, normalization_confidence
)
VALUES (
    'Finlandia Vodka 0.7l',
    'Finlandia',
    (SELECT id FROM product_types WHERE slug = 'vodka'),
    'alkohol',
    '0.7 l',
    1,
    700,
    700,
    FALSE,
    0.85
);

-- 4. Insert an offer
INSERT INTO offers (
    product_id, store_id, price_discounted, price_regular,
    discount_percentage, valid_from, valid_until,
    price_per_l_discounted, price_per_l_regular,
    source_type, source_reference
)
VALUES (
    (SELECT id FROM products WHERE name = 'Finlandia Vodka 0.7l' LIMIT 1),
    (SELECT id FROM stores WHERE slug = 'kaufland'),
    299.00,
    379.00,
    21.11,
    '2024-03-20',
    '2024-03-26',
    427.14,  -- 299 * 1000 / 700
    541.43,  -- 379 * 1000 / 700
    'kupiapi',
    'batch-001'
);

-- 5. Insert a raw offer record
INSERT INTO offers_raw (
    product_name, shop_name, price, original_price,
    discount_percentage, category, unit,
    valid_from, valid_until, raw_payload, import_batch_id
)
VALUES (
    'Finlandia Vodka 0.7l',
    'Kaufland',
    299.00,
    379.00,
    21.11,
    'alkohol',
    '0.7 l',
    '2024-03-20',
    '2024-03-26',
    '{"name": "Finlandia Vodka 0.7l", "shops": ["Kaufland"], "prices": ["299,00 Kč"]}',
    'batch-001'
);


-- ============================================================================
-- TYPICAL QUERIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. All active offers for product_type = vodka
-- ----------------------------------------------------------------------------
SELECT
    o.id AS offer_id,
    p.name AS product_name,
    p.brand,
    s.name AS store_name,
    o.price_discounted,
    o.price_regular,
    o.discount_percentage,
    o.price_per_l_discounted,
    o.valid_from,
    o.valid_until
FROM offers o
JOIN products p ON o.product_id = p.id
JOIN stores s ON o.store_id = s.id
JOIN product_types pt ON p.product_type_id = pt.id
WHERE pt.slug = 'vodka'
  AND o.is_active = TRUE
  AND CURRENT_DATE BETWEEN o.valid_from AND o.valid_until
ORDER BY o.price_per_l_discounted ASC NULLS LAST;


-- ----------------------------------------------------------------------------
-- 2. Cheapest active offer for product_type = beer
-- ----------------------------------------------------------------------------
SELECT
    o.id AS offer_id,
    p.name AS product_name,
    p.brand,
    p.total_volume_ml,
    s.name AS store_name,
    o.price_discounted,
    o.price_per_l_discounted,
    o.valid_from,
    o.valid_until
FROM offers o
JOIN products p ON o.product_id = p.id
JOIN stores s ON o.store_id = s.id
JOIN product_types pt ON p.product_type_id = pt.id
WHERE pt.slug = 'beer'
  AND o.is_active = TRUE
  AND CURRENT_DATE BETWEEN o.valid_from AND o.valid_until
  AND o.price_per_l_discounted IS NOT NULL
ORDER BY o.price_per_l_discounted ASC
LIMIT 1;


-- ----------------------------------------------------------------------------
-- 3. All offers valid today
-- ----------------------------------------------------------------------------
SELECT
    o.id AS offer_id,
    p.name AS product_name,
    pt.name AS product_type,
    s.name AS store_name,
    o.price_discounted,
    o.price_per_l_discounted,
    o.valid_from,
    o.valid_until
FROM offers o
JOIN products p ON o.product_id = p.id
JOIN stores s ON o.store_id = s.id
LEFT JOIN product_types pt ON p.product_type_id = pt.id
WHERE o.is_active = TRUE
  AND CURRENT_DATE BETWEEN o.valid_from AND o.valid_until
ORDER BY pt.slug, o.price_per_l_discounted ASC NULLS LAST;


-- ----------------------------------------------------------------------------
-- 4. Products sorted by price per liter (cheapest first)
-- ----------------------------------------------------------------------------
SELECT
    p.name AS product_name,
    p.brand,
    pt.name AS product_type,
    p.total_volume_ml,
    s.name AS store_name,
    o.price_discounted,
    o.price_per_l_discounted
FROM offers o
JOIN products p ON o.product_id = p.id
JOIN stores s ON o.store_id = s.id
LEFT JOIN product_types pt ON p.product_type_id = pt.id
WHERE o.is_active = TRUE
  AND CURRENT_DATE BETWEEN o.valid_from AND o.valid_until
  AND o.price_per_l_discounted IS NOT NULL
ORDER BY o.price_per_l_discounted ASC
LIMIT 50;


-- ----------------------------------------------------------------------------
-- 5. Compare prices for same product type across stores
-- ----------------------------------------------------------------------------
SELECT
    pt.name AS product_type,
    s.name AS store_name,
    COUNT(*) AS offer_count,
    MIN(o.price_per_l_discounted) AS min_price_per_l,
    AVG(o.price_per_l_discounted) AS avg_price_per_l,
    MAX(o.price_per_l_discounted) AS max_price_per_l
FROM offers o
JOIN products p ON o.product_id = p.id
JOIN stores s ON o.store_id = s.id
JOIN product_types pt ON p.product_type_id = pt.id
WHERE o.is_active = TRUE
  AND CURRENT_DATE BETWEEN o.valid_from AND o.valid_until
  AND o.price_per_l_discounted IS NOT NULL
GROUP BY pt.id, pt.name, s.id, s.name
ORDER BY pt.name, min_price_per_l;


-- ----------------------------------------------------------------------------
-- 6. Best deals - highest discount percentage
-- ----------------------------------------------------------------------------
SELECT
    p.name AS product_name,
    pt.name AS product_type,
    s.name AS store_name,
    o.price_regular,
    o.price_discounted,
    o.discount_percentage,
    o.valid_until
FROM offers o
JOIN products p ON o.product_id = p.id
JOIN stores s ON o.store_id = s.id
LEFT JOIN product_types pt ON p.product_type_id = pt.id
WHERE o.is_active = TRUE
  AND CURRENT_DATE BETWEEN o.valid_from AND o.valid_until
  AND o.discount_percentage IS NOT NULL
ORDER BY o.discount_percentage DESC
LIMIT 20;


-- ----------------------------------------------------------------------------
-- 7. Find all rum types (including subtypes)
-- ----------------------------------------------------------------------------
SELECT
    o.id AS offer_id,
    p.name AS product_name,
    pt.name AS product_type,
    pt.slug AS product_type_slug,
    s.name AS store_name,
    o.price_discounted,
    o.price_per_l_discounted
FROM offers o
JOIN products p ON o.product_id = p.id
JOIN stores s ON o.store_id = s.id
JOIN product_types pt ON p.product_type_id = pt.id
WHERE (pt.slug = 'rum' OR pt.parent_slug = 'rum')
  AND o.is_active = TRUE
  AND CURRENT_DATE BETWEEN o.valid_from AND o.valid_until
ORDER BY pt.slug, o.price_per_l_discounted ASC NULLS LAST;


-- ----------------------------------------------------------------------------
-- 8. Products without classified type (need manual review)
-- ----------------------------------------------------------------------------
SELECT
    p.id,
    p.name,
    p.category_raw,
    p.unit_raw,
    COUNT(o.id) AS offer_count
FROM products p
LEFT JOIN offers o ON p.id = o.product_id AND o.is_active = TRUE
WHERE p.product_type_id IS NULL
  AND p.is_active = TRUE
GROUP BY p.id, p.name, p.category_raw, p.unit_raw
ORDER BY offer_count DESC, p.name;


-- ----------------------------------------------------------------------------
-- 9. Import statistics by batch
-- ----------------------------------------------------------------------------
SELECT
    import_batch_id,
    DATE(created_at) AS import_date,
    COUNT(*) AS total_records,
    COUNT(normalized_product_id) AS normalized_count,
    COUNT(*) - COUNT(normalized_product_id) AS pending_count
FROM offers_raw
WHERE import_batch_id IS NOT NULL
GROUP BY import_batch_id, DATE(created_at)
ORDER BY import_date DESC, import_batch_id;


-- ----------------------------------------------------------------------------
-- 10. Active offers using the view
-- ----------------------------------------------------------------------------
SELECT
    product_name,
    product_type_name,
    store_name,
    price_discounted,
    price_per_l_discounted,
    valid_until
FROM v_active_offers
WHERE product_type_slug = 'vodka'
ORDER BY price_per_l_discounted ASC NULLS LAST;


-- ============================================================================
-- USEFUL MAINTENANCE QUERIES
-- ============================================================================

-- Count offers by status
SELECT
    CASE
        WHEN valid_until < CURRENT_DATE THEN 'expired'
        WHEN valid_from > CURRENT_DATE THEN 'upcoming'
        ELSE 'active'
    END AS status,
    is_active,
    COUNT(*) AS count
FROM offers
GROUP BY 1, 2
ORDER BY 1, 2;

-- Products with volume info
SELECT
    pt.name AS product_type,
    COUNT(*) AS total,
    COUNT(p.total_volume_ml) AS with_volume,
    ROUND(100.0 * COUNT(p.total_volume_ml) / COUNT(*), 1) AS volume_pct
FROM products p
LEFT JOIN product_types pt ON p.product_type_id = pt.id
WHERE p.is_active = TRUE
GROUP BY pt.id, pt.name
ORDER BY total DESC;

-- Store statistics
SELECT
    s.name AS store_name,
    COUNT(DISTINCT o.id) AS total_offers,
    COUNT(DISTINCT CASE WHEN CURRENT_DATE BETWEEN o.valid_from AND o.valid_until THEN o.id END) AS active_offers,
    COUNT(DISTINCT p.product_type_id) AS product_types
FROM stores s
LEFT JOIN offers o ON s.id = o.store_id AND o.is_active = TRUE
LEFT JOIN products p ON o.product_id = p.id
WHERE s.is_active = TRUE
GROUP BY s.id, s.name
ORDER BY active_offers DESC;
