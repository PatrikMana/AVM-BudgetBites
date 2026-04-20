"""
Database connection and operations for BudgetShots.
"""

import os
import logging
from contextlib import contextmanager
from typing import Optional, List, Dict, Any, Tuple

import psycopg2
from psycopg2.extras import RealDictCursor, execute_values

logger = logging.getLogger(__name__)


def get_connection_string() -> str:
    """Get database connection string from environment."""
    return os.environ.get(
        'DATABASE_URL',
        'postgresql://budgetshots:budgetshots_secret@localhost:5432/budgetshots'
    )


@contextmanager
def get_connection():
    """Context manager for database connections."""
    conn = psycopg2.connect(get_connection_string())
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@contextmanager
def get_cursor(conn=None):
    """Context manager for database cursors with dict results."""
    if conn is None:
        with get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                yield cur
    else:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            yield cur


def check_schema_exists() -> bool:
    """Check if the database schema has been initialized."""
    with get_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = 'stores'
                )
            """)
            return cur.fetchone()['exists']


def init_schema() -> None:
    """Initialize database schema and seed data if not exists."""
    import pathlib

    # Find SQL files - check multiple possible locations
    possible_paths = [
        pathlib.Path('/app/DB'),  # Docker container
        pathlib.Path(__file__).parent.parent / 'DB',  # Relative to sync module
    ]

    db_path = None
    for path in possible_paths:
        if path.exists():
            db_path = path
            break

    if not db_path:
        logger.error("Could not find DB directory with SQL files")
        raise RuntimeError("DB directory not found")

    schema_file = db_path / 'schema.sql'
    seed_file = db_path / 'seed.sql'

    with get_connection() as conn:
        with conn.cursor() as cur:
            # Run schema
            if schema_file.exists():
                logger.info(f"Executing schema from {schema_file}")
                cur.execute(schema_file.read_text(encoding='utf-8'))
                conn.commit()
                logger.info("Schema created successfully")
            else:
                logger.error(f"Schema file not found: {schema_file}")
                raise RuntimeError(f"Schema file not found: {schema_file}")

            # Run seed
            if seed_file.exists():
                logger.info(f"Executing seed from {seed_file}")
                cur.execute(seed_file.read_text(encoding='utf-8'))
                conn.commit()
                logger.info("Seed data loaded successfully")
            else:
                logger.warning(f"Seed file not found: {seed_file}")


# =============================================================================
# STORES
# =============================================================================

def get_or_create_store(slug: str, name: str) -> Tuple[int, bool]:
    """
    Get existing store by slug or create new one.

    Returns:
        Tuple of (store_id, created) where created is True if newly created
    """
    with get_connection() as conn:
        with get_cursor(conn) as cur:
            # Try to get existing
            cur.execute("SELECT id FROM stores WHERE slug = %s", (slug,))
            row = cur.fetchone()
            if row:
                return row['id'], False

            # Create new
            cur.execute(
                "INSERT INTO stores (slug, name) VALUES (%s, %s) RETURNING id",
                (slug, name)
            )
            return cur.fetchone()['id'], True


def get_all_stores() -> List[Dict[str, Any]]:
    """Get all active stores."""
    with get_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute("SELECT * FROM stores WHERE is_active = TRUE")
            return cur.fetchall()


# =============================================================================
# PRODUCT TYPES
# =============================================================================

def get_all_product_types() -> List[Dict[str, Any]]:
    """Get all product types."""
    with get_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute("SELECT * FROM product_types")
            return cur.fetchall()


def get_product_type_by_slug(slug: str) -> Optional[Dict[str, Any]]:
    """Get product type by slug."""
    with get_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute("SELECT * FROM product_types WHERE slug = %s", (slug,))
            return cur.fetchone()


# =============================================================================
# PRODUCT ALIASES
# =============================================================================

def get_all_aliases() -> List[Dict[str, Any]]:
    """Get all product aliases ordered by priority (highest first)."""
    with get_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute("""
                SELECT pa.*, pt.slug as product_type_slug
                FROM product_aliases pa
                JOIN product_types pt ON pa.product_type_id = pt.id
                ORDER BY pa.priority DESC
            """)
            return cur.fetchall()


# =============================================================================
# PRODUCTS
# =============================================================================

def find_product_by_name_and_store(name: str, store_id: int) -> Optional[Dict[str, Any]]:
    """Find existing product by exact name match."""
    with get_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute("""
                SELECT p.* FROM products p
                JOIN offers o ON p.id = o.product_id
                WHERE LOWER(p.name) = LOWER(%s) AND o.store_id = %s
                LIMIT 1
            """, (name, store_id))
            return cur.fetchone()


def find_product_by_name(name: str) -> Optional[Dict[str, Any]]:
    """Find existing product by exact name match (any store)."""
    with get_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                "SELECT * FROM products WHERE LOWER(name) = LOWER(%s) LIMIT 1",
                (name,)
            )
            return cur.fetchone()


def find_product(
    normalized_name: str,
    product_type_id: Optional[int] = None,
    total_volume_ml: Optional[int] = None
) -> Optional[Dict[str, Any]]:
    """
    Find existing product using multiple criteria for better deduplication.

    Matching strategy (in order):
    1. Exact normalized_name + product_type_id + total_volume_ml (if all provided)
    2. Exact normalized_name + product_type_id (if type provided)
    3. Exact normalized_name + total_volume_ml (if volume provided)
    4. Exact normalized_name only (fallback)

    Args:
        normalized_name: Normalized product name (lowercase, no unit suffix)
        product_type_id: Optional product type ID
        total_volume_ml: Optional total volume in ml

    Returns:
        Product dict if found, None otherwise
    """
    with get_connection() as conn:
        with get_cursor(conn) as cur:
            # Try most specific match first: name + type + volume
            if product_type_id and total_volume_ml:
                cur.execute("""
                    SELECT * FROM products
                    WHERE normalized_name = %s
                      AND product_type_id = %s
                      AND total_volume_ml = %s
                      AND is_active = TRUE
                    LIMIT 1
                """, (normalized_name, product_type_id, total_volume_ml))
                row = cur.fetchone()
                if row:
                    return row

            # Try name + type
            if product_type_id:
                cur.execute("""
                    SELECT * FROM products
                    WHERE normalized_name = %s
                      AND product_type_id = %s
                      AND is_active = TRUE
                    LIMIT 1
                """, (normalized_name, product_type_id))
                row = cur.fetchone()
                if row:
                    return row

            # Try name + volume
            if total_volume_ml:
                cur.execute("""
                    SELECT * FROM products
                    WHERE normalized_name = %s
                      AND total_volume_ml = %s
                      AND is_active = TRUE
                    LIMIT 1
                """, (normalized_name, total_volume_ml))
                row = cur.fetchone()
                if row:
                    return row

            # Fallback: just normalized name
            cur.execute("""
                SELECT * FROM products
                WHERE normalized_name = %s
                  AND is_active = TRUE
                LIMIT 1
            """, (normalized_name,))
            return cur.fetchone()


def create_product(
    name: str,
    normalized_name: Optional[str] = None,
    product_type_id: Optional[int] = None,
    brand: Optional[str] = None,
    category_raw: Optional[str] = None,
    category_display_raw: Optional[str] = None,
    unit_raw: Optional[str] = None,
    pack_count: Optional[int] = None,
    volume_per_unit_ml: Optional[int] = None,
    total_volume_ml: Optional[int] = None,
    is_multipack: bool = False,
    normalization_confidence: Optional[float] = None
) -> int:
    """Create a new product. Returns product id."""
    with get_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute("""
                INSERT INTO products (
                    name, normalized_name, product_type_id, brand,
                    category_raw, category_display_raw, unit_raw,
                    pack_count, volume_per_unit_ml, total_volume_ml,
                    is_multipack, normalization_confidence
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                name, normalized_name, product_type_id, brand,
                category_raw, category_display_raw, unit_raw,
                pack_count, volume_per_unit_ml, total_volume_ml,
                is_multipack, normalization_confidence
            ))
            return cur.fetchone()['id']


def update_product(product_id: int, **kwargs) -> None:
    """Update product fields."""
    if not kwargs:
        return

    set_clause = ', '.join(f"{k} = %s" for k in kwargs.keys())
    values = list(kwargs.values()) + [product_id]

    with get_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute(
                f"UPDATE products SET {set_clause}, updated_at = NOW() WHERE id = %s",
                values
            )


# =============================================================================
# OFFERS
# =============================================================================

def find_existing_offer(product_id: int, store_id: int, valid_from, valid_until) -> Optional[Dict[str, Any]]:
    """Find existing offer for product/store/date range."""
    with get_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute("""
                SELECT * FROM offers
                WHERE product_id = %s AND store_id = %s
                AND valid_from = %s AND valid_until = %s
            """, (product_id, store_id, valid_from, valid_until))
            return cur.fetchone()


def create_offer(
    product_id: int,
    store_id: int,
    price_discounted: float,
    valid_from,
    valid_until,
    price_regular: Optional[float] = None,
    discount_percentage: Optional[float] = None,
    price_per_l_discounted: Optional[float] = None,
    price_per_l_regular: Optional[float] = None,
    source_type: Optional[str] = None,
    source_reference: Optional[str] = None
) -> int:
    """Create a new offer. Returns offer id."""
    with get_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute("""
                INSERT INTO offers (
                    product_id, store_id, price_discounted, price_regular,
                    discount_percentage, valid_from, valid_until,
                    price_per_l_discounted, price_per_l_regular,
                    source_type, source_reference
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                product_id, store_id, price_discounted, price_regular,
                discount_percentage, valid_from, valid_until,
                price_per_l_discounted, price_per_l_regular,
                source_type, source_reference
            ))
            return cur.fetchone()['id']


def deactivate_expired_offers() -> int:
    """Mark expired offers as inactive. Returns count of deactivated offers."""
    with get_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute("""
                UPDATE offers
                SET is_active = FALSE, updated_at = NOW()
                WHERE is_active = TRUE AND valid_until < CURRENT_DATE
            """)
            return cur.rowcount


def delete_old_offers(days_old: int = 30) -> int:
    """Delete offers older than specified days. Returns count of deleted offers."""
    with get_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute("""
                DELETE FROM offers
                WHERE valid_until < CURRENT_DATE - %s * INTERVAL '1 day'
            """, (days_old,))
            return cur.rowcount


def get_active_offer_count() -> int:
    """Get count of active offers."""
    with get_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute("""
                SELECT COUNT(*) as cnt FROM offers
                WHERE is_active = TRUE AND valid_until >= CURRENT_DATE
            """)
            return cur.fetchone()['cnt']


# =============================================================================
# OFFERS RAW
# =============================================================================

def create_offer_raw(
    product_name: str,
    shop_name: str,
    price: Optional[float] = None,
    original_price: Optional[float] = None,
    discount_percentage: Optional[float] = None,
    category: Optional[str] = None,
    unit: Optional[str] = None,
    valid_from=None,
    valid_until=None,
    raw_payload: Optional[dict] = None,
    import_batch_id: Optional[str] = None,
    normalized_product_id: Optional[int] = None,
    normalized_offer_id: Optional[int] = None
) -> int:
    """Create a raw offer record. Returns raw offer id."""
    import json

    with get_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute("""
                INSERT INTO offers_raw (
                    product_name, shop_name, price, original_price,
                    discount_percentage, category, unit,
                    valid_from, valid_until, raw_payload,
                    import_batch_id, normalized_product_id, normalized_offer_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                product_name, shop_name, price, original_price,
                discount_percentage, category, unit,
                valid_from, valid_until,
                json.dumps(raw_payload) if raw_payload else None,
                import_batch_id, normalized_product_id, normalized_offer_id
            ))
            return cur.fetchone()['id']


def update_offer_raw(raw_id: int, normalized_product_id: int, normalized_offer_id: int) -> None:
    """Update raw offer with normalized references."""
    with get_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute("""
                UPDATE offers_raw
                SET normalized_product_id = %s, normalized_offer_id = %s
                WHERE id = %s
            """, (normalized_product_id, normalized_offer_id, raw_id))


def delete_old_raw_offers(days_old: int = 60) -> int:
    """Delete old raw offers. Returns count of deleted records."""
    with get_connection() as conn:
        with get_cursor(conn) as cur:
            cur.execute("""
                DELETE FROM offers_raw
                WHERE created_at < NOW() - %s * INTERVAL '1 day'
            """, (days_old,))
            return cur.rowcount
