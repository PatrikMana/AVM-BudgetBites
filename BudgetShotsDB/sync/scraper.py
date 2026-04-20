"""
Scraper module for fetching discount data from KupiAPI.
"""

import json
import logging
from typing import List, Dict, Any, Optional

from kupiapi.scraper import KupiScraper

logger = logging.getLogger(__name__)

# Category for alcohol on kupi.cz
ALCOHOL_CATEGORY = 'alkohol'


def get_scraper() -> KupiScraper:
    """Get a KupiScraper instance."""
    return KupiScraper()


def fetch_alcohol_discounts(max_pages: int = 0) -> List[Dict[str, Any]]:
    """
    Fetch all alcohol discounts from kupi.cz.

    Args:
        max_pages: Maximum pages to scrape (0 = all pages)

    Returns:
        List of discount items
    """
    scraper = get_scraper()
    logger.info(f"Fetching alcohol discounts (max_pages={max_pages})")

    try:
        result_json = scraper.get_discounts_by_category(ALCOHOL_CATEGORY, max_pages=max_pages)
        discounts = json.loads(result_json)
        logger.info(f"Fetched {len(discounts)} alcohol discount items")
        return discounts
    except Exception as e:
        logger.error(f"Error fetching alcohol discounts: {e}")
        return []


def fetch_discounts_by_shop(shop: str, max_pages: int = 0) -> List[Dict[str, Any]]:
    """
    Fetch alcohol discounts from a specific shop.

    Args:
        shop: Shop slug (e.g., 'kaufland', 'lidl')
        max_pages: Maximum pages to scrape (0 = all pages)

    Returns:
        List of discount items
    """
    scraper = get_scraper()
    logger.info(f"Fetching discounts from {shop} (max_pages={max_pages})")

    try:
        result_json = scraper.get_discounts_by_category_shop(
            ALCOHOL_CATEGORY, shop, max_pages=max_pages
        )
        discounts = json.loads(result_json)
        logger.info(f"Fetched {len(discounts)} items from {shop}")
        return discounts
    except Exception as e:
        logger.error(f"Error fetching discounts from {shop}: {e}")
        return []


def fetch_available_categories() -> List[str]:
    """
    Fetch list of available categories.

    Returns:
        List of category slugs
    """
    scraper = get_scraper()

    try:
        result_json = scraper.get_categories()
        categories = json.loads(result_json)
        return categories
    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        return []


def parse_discount_item(item: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Parse a discount item from KupiAPI into normalized records.

    KupiAPI returns items with lists for shops, prices, etc.
    This function expands them into individual records.

    Args:
        item: Raw item from KupiAPI

    Returns:
        List of normalized offer records (one per shop)
    """
    name = item.get('name', '')
    shops = item.get('shops', [])
    prices = item.get('prices', [])
    original_prices = item.get('original_prices', [])  # May exist in some responses
    amounts = item.get('amounts', [])
    validities = item.get('validities', [])

    # Handle None values in lists
    if not shops:
        shops = []
    if not prices:
        prices = [None] * len(shops)
    if not original_prices:
        original_prices = [None] * len(shops)
    if not amounts:
        amounts = [None] * len(shops)
    if not validities:
        validities = [None] * len(shops)

    # Ensure all lists have same length
    max_len = max(len(shops), len(prices), len(amounts), len(validities), len(original_prices))
    shops = (shops + [None] * max_len)[:max_len]
    prices = (prices + [None] * max_len)[:max_len]
    original_prices = (original_prices + [None] * max_len)[:max_len]
    amounts = (amounts + [None] * max_len)[:max_len]
    validities = (validities + [None] * max_len)[:max_len]

    records = []
    for i, shop in enumerate(shops):
        if not shop:
            continue

        records.append({
            'product_name': name,
            'shop_name': shop,
            'price': prices[i] if i < len(prices) else None,
            'original_price': original_prices[i] if i < len(original_prices) else None,
            'unit': amounts[i] if i < len(amounts) else None,
            'validity': validities[i] if i < len(validities) else None,
            'raw_item': item
        })

    return records


def expand_discounts(discounts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Expand raw discount items into individual shop-specific records.

    Args:
        discounts: List of raw items from KupiAPI

    Returns:
        List of expanded records (one per product-shop combination)
    """
    expanded = []
    for item in discounts:
        records = parse_discount_item(item)
        expanded.extend(records)

    logger.info(f"Expanded {len(discounts)} items into {len(expanded)} records")
    return expanded
