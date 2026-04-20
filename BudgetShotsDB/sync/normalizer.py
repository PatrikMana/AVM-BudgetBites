"""
Normalization utilities for BudgetShots.
Handles unit parsing, product type classification, and price calculations.
"""

import re
import logging
from typing import Optional, Tuple, Dict, Any, List
from dataclasses import dataclass

logger = logging.getLogger(__name__)


def normalize_product_name(name: str) -> str:
    """
    Normalize product name for deduplication.

    Removes variations like extra spaces, case differences,
    unit suffixes that might cause duplicates.

    Args:
        name: Raw product name

    Returns:
        Normalized name for comparison
    """
    if not name:
        return ''

    normalized = name.lower().strip()

    # Remove common unit suffixes that might vary (will be in unit_raw anyway)
    normalized = re.sub(r'\s*\d+\s*x\s*[\d.,]+\s*(l|ml|cl)\b', '', normalized)
    normalized = re.sub(r'\s*[\d.,]+\s*(l|ml|cl)\b', '', normalized)

    # Normalize whitespace
    normalized = re.sub(r'\s+', ' ', normalized)

    # Remove trailing/leading punctuation
    normalized = normalized.strip(' .,;:-')

    return normalized


def calculate_discount_percentage(
    price_discounted: float,
    price_regular: Optional[float]
) -> Optional[float]:
    """
    Calculate discount percentage from prices.

    Args:
        price_discounted: Current discounted price
        price_regular: Original regular price

    Returns:
        Discount percentage (0-100) or None if cannot calculate
    """
    if not price_regular or price_regular <= 0:
        return None
    if price_discounted <= 0:
        return None
    if price_discounted >= price_regular:
        return None

    return round(((price_regular - price_discounted) / price_regular) * 100, 2)


@dataclass
class VolumeInfo:
    """Parsed volume information from unit string."""
    pack_count: int
    volume_per_unit_ml: int
    total_volume_ml: int
    is_multipack: bool
    raw_unit: str


@dataclass
class ProductClassification:
    """Result of product classification."""
    product_type_id: Optional[int]
    product_type_slug: Optional[str]
    brand: Optional[str]
    confidence: float


def parse_unit(unit_raw: Optional[str]) -> Optional[VolumeInfo]:
    """
    Parse unit string to extract volume information.

    Examples:
        "0.7 l" -> pack_count=1, volume_per_unit_ml=700, total=700
        "15x 0.5 l" -> pack_count=15, volume_per_unit_ml=500, total=7500
        "6x 0,33 l" -> pack_count=6, volume_per_unit_ml=330, total=1980
        "1 l" -> pack_count=1, volume_per_unit_ml=1000, total=1000
        "750 ml" -> pack_count=1, volume_per_unit_ml=750, total=750
    """
    if not unit_raw:
        return None

    unit_raw = unit_raw.strip().lower()
    original_unit = unit_raw

    # Normalize common variations
    unit_raw = unit_raw.replace(',', '.')
    unit_raw = unit_raw.replace('×', 'x')

    pack_count = 1
    volume_ml = None

    # Pattern: NNx N.NN l (multipack with liters)
    match = re.search(r'(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*l(?:itr)?', unit_raw)
    if match:
        pack_count = int(match.group(1))
        volume_ml = int(float(match.group(2)) * 1000)
        return VolumeInfo(
            pack_count=pack_count,
            volume_per_unit_ml=volume_ml,
            total_volume_ml=pack_count * volume_ml,
            is_multipack=pack_count > 1,
            raw_unit=original_unit
        )

    # Pattern: NNx NNN ml (multipack with ml)
    match = re.search(r'(\d+)\s*x\s*(\d+)\s*ml', unit_raw)
    if match:
        pack_count = int(match.group(1))
        volume_ml = int(match.group(2))
        return VolumeInfo(
            pack_count=pack_count,
            volume_per_unit_ml=volume_ml,
            total_volume_ml=pack_count * volume_ml,
            is_multipack=pack_count > 1,
            raw_unit=original_unit
        )

    # Pattern: N.NN l (single with liters)
    match = re.search(r'(\d+(?:\.\d+)?)\s*l(?:itr)?(?:\b|$)', unit_raw)
    if match:
        volume_ml = int(float(match.group(1)) * 1000)
        return VolumeInfo(
            pack_count=1,
            volume_per_unit_ml=volume_ml,
            total_volume_ml=volume_ml,
            is_multipack=False,
            raw_unit=original_unit
        )

    # Pattern: NNN ml (single with ml)
    match = re.search(r'(\d+)\s*ml', unit_raw)
    if match:
        volume_ml = int(match.group(1))
        return VolumeInfo(
            pack_count=1,
            volume_per_unit_ml=volume_ml,
            total_volume_ml=volume_ml,
            is_multipack=False,
            raw_unit=original_unit
        )

    # Pattern: NNx NN cl (multipack with centiliters)
    match = re.search(r'(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*cl', unit_raw)
    if match:
        pack_count = int(match.group(1))
        volume_ml = int(float(match.group(2)) * 10)  # cl to ml
        return VolumeInfo(
            pack_count=pack_count,
            volume_per_unit_ml=volume_ml,
            total_volume_ml=pack_count * volume_ml,
            is_multipack=pack_count > 1,
            raw_unit=original_unit
        )

    # Pattern: NN cl (single with centiliters)
    match = re.search(r'(\d+(?:\.\d+)?)\s*cl', unit_raw)
    if match:
        volume_ml = int(float(match.group(1)) * 10)  # cl to ml
        return VolumeInfo(
            pack_count=1,
            volume_per_unit_ml=volume_ml,
            total_volume_ml=volume_ml,
            is_multipack=False,
            raw_unit=original_unit
        )

    # Pattern: NNx N.NN (multipack without unit, assume liters if > 0 and < 10)
    match = re.search(r'(\d+)\s*x\s*(\d+(?:\.\d+)?)\b', unit_raw)
    if match:
        pack_count = int(match.group(1))
        value = float(match.group(2))
        if 0 < value < 10:
            volume_ml = int(value * 1000)
            return VolumeInfo(
                pack_count=pack_count,
                volume_per_unit_ml=volume_ml,
                total_volume_ml=pack_count * volume_ml,
                is_multipack=pack_count > 1,
                raw_unit=original_unit
            )

    logger.debug(f"Could not parse unit: {original_unit}")
    return None


def classify_product(
    product_name: str,
    aliases: List[Dict[str, Any]],
    category: Optional[str] = None
) -> ProductClassification:
    """
    Classify a product based on its name and optional category.

    Args:
        product_name: The product name to classify
        aliases: List of alias records from database (sorted by priority desc)
        category: Optional category hint from source

    Returns:
        ProductClassification with type, brand, and confidence
    """
    name_lower = product_name.lower()
    category_lower = category.lower() if category else ''

    best_match = None
    best_priority = -1

    for alias in aliases:
        match_value = alias['match_value'].lower()
        match_type = alias['match_type']
        priority = alias['priority']

        # Skip if we already found a better match
        if best_match and priority <= best_priority:
            continue

        matched = False

        if match_type == 'exact':
            matched = name_lower == match_value
        elif match_type == 'contains':
            matched = match_value in name_lower or match_value in category_lower
        elif match_type == 'starts_with':
            matched = name_lower.startswith(match_value)
        elif match_type == 'ends_with':
            matched = name_lower.endswith(match_value)
        elif match_type == 'regex':
            try:
                matched = bool(re.search(match_value, name_lower))
            except re.error:
                logger.warning(f"Invalid regex pattern: {match_value}")
                matched = False

        if matched:
            best_match = alias
            best_priority = priority

    if best_match:
        # Calculate confidence based on match type and priority
        base_confidence = 0.5
        if best_match['match_type'] == 'exact':
            base_confidence = 0.95
        elif best_match['match_type'] == 'contains':
            base_confidence = 0.7
        elif best_match['match_type'] in ('starts_with', 'ends_with'):
            base_confidence = 0.8

        # Adjust confidence based on priority
        priority_bonus = min(0.2, (best_match['priority'] - 100) / 500)
        confidence = min(1.0, base_confidence + priority_bonus)

        return ProductClassification(
            product_type_id=best_match['product_type_id'],
            product_type_slug=best_match['product_type_slug'],
            brand=best_match.get('brand'),
            confidence=confidence
        )

    return ProductClassification(
        product_type_id=None,
        product_type_slug=None,
        brand=None,
        confidence=0.0
    )


def calculate_price_per_liter(price: float, total_volume_ml: Optional[int]) -> Optional[float]:
    """
    Calculate price per liter.

    Args:
        price: Price in currency units
        total_volume_ml: Total volume in milliliters

    Returns:
        Price per liter rounded to 2 decimal places, or None if volume unknown
    """
    if not total_volume_ml or total_volume_ml <= 0:
        return None

    return round((price * 1000) / total_volume_ml, 2)


def parse_validity(validity_str: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    """
    Parse validity string to extract dates.

    Examples:
        "20.3. - 26.3." -> ("2024-03-20", "2024-03-26")
        "od 20.3." -> ("2024-03-20", +7 days)
        "do 26.3." -> (today, "2024-03-26")

    Note: This is a simplified parser. Real implementation would need
    to handle year boundaries and various formats.
    """
    import datetime

    if not validity_str:
        return None, None

    validity_str = validity_str.strip()
    today = datetime.date.today()
    current_year = today.year

    def safe_date(year: int, month: int, day: int) -> Optional[datetime.date]:
        """Safely create a date, handling invalid dates."""
        try:
            return datetime.date(year, month, day)
        except ValueError:
            return None

    def adjust_year_if_past(d: datetime.date) -> datetime.date:
        """If date is more than 2 months in the past, assume next year."""
        if d < today - datetime.timedelta(days=60):
            return datetime.date(d.year + 1, d.month, d.day)
        return d

    # Pattern: DD.MM. - DD.MM.
    match = re.search(r'(\d{1,2})\.(\d{1,2})\.\s*[-–]\s*(\d{1,2})\.(\d{1,2})\.', validity_str)
    if match:
        from_day, from_month = int(match.group(1)), int(match.group(2))
        to_day, to_month = int(match.group(3)), int(match.group(4))

        from_date = safe_date(current_year, from_month, from_day)
        to_date = safe_date(current_year, to_month, to_day)

        if from_date and to_date:
            # Handle year boundary (e.g., Dec 28 - Jan 3)
            if to_date < from_date:
                to_date = safe_date(current_year + 1, to_month, to_day)

            from_date = adjust_year_if_past(from_date)
            if to_date:
                return from_date.isoformat(), to_date.isoformat()

    # Pattern: od DD.MM.
    match = re.search(r'od\s*(\d{1,2})\.(\d{1,2})\.', validity_str, re.IGNORECASE)
    if match:
        from_day, from_month = int(match.group(1)), int(match.group(2))
        from_date = safe_date(current_year, from_month, from_day)
        if from_date:
            from_date = adjust_year_if_past(from_date)
            # Default to 7 days validity if no end date
            to_date = from_date + datetime.timedelta(days=7)
            return from_date.isoformat(), to_date.isoformat()

    # Pattern: do DD.MM.
    match = re.search(r'do\s*(\d{1,2})\.(\d{1,2})\.', validity_str, re.IGNORECASE)
    if match:
        to_day, to_month = int(match.group(1)), int(match.group(2))
        to_date = safe_date(current_year, to_month, to_day)
        if to_date:
            # If end date is in past, try next year
            if to_date < today:
                to_date = safe_date(current_year + 1, to_month, to_day)
            if to_date:
                return today.isoformat(), to_date.isoformat()

    # Pattern: DD.MM.YYYY - DD.MM.YYYY
    match = re.search(
        r'(\d{1,2})\.(\d{1,2})\.(\d{4})\s*[-–]\s*(\d{1,2})\.(\d{1,2})\.(\d{4})',
        validity_str
    )
    if match:
        from_date = safe_date(
            int(match.group(3)), int(match.group(2)), int(match.group(1))
        )
        to_date = safe_date(
            int(match.group(6)), int(match.group(5)), int(match.group(4))
        )
        if from_date and to_date:
            return from_date.isoformat(), to_date.isoformat()

    logger.debug(f"Could not parse validity: {validity_str}")
    return None, None


def normalize_shop_name(shop_name: str) -> Tuple[str, str]:
    """
    Normalize shop name to slug and display name.

    Args:
        shop_name: Raw shop name from source

    Returns:
        Tuple of (slug, display_name)
    """
    # Common mappings
    shop_mappings = {
        'kaufland': ('kaufland', 'Kaufland'),
        'lidl': ('lidl', 'Lidl'),
        'albert': ('albert', 'Albert'),
        'billa': ('billa', 'Billa'),
        'penny': ('penny', 'Penny Market'),
        'penny market': ('penny', 'Penny Market'),
        'tesco': ('tesco', 'Tesco'),
        'globus': ('globus', 'Globus'),
        'makro': ('makro', 'Makro'),
        'coop': ('coop', 'COOP'),
        'flop': ('flop', 'FLOP'),
        'norma': ('norma', 'Norma'),
        'ratio': ('ratio', 'Ratio'),
    }

    name_lower = shop_name.lower().strip()

    for key, (slug, display) in shop_mappings.items():
        if key in name_lower:
            return slug, display

    # Fallback: create slug from name
    slug = re.sub(r'[^a-z0-9]+', '_', name_lower).strip('_')
    return slug, shop_name.strip()


def parse_price(price_str: Optional[str]) -> Optional[float]:
    """
    Parse price string to float.

    Examples:
        "199,90 Kč" -> 199.90
        "99.90" -> 99.90
        "149,-" -> 149.00
    """
    if price_str is None:
        return None

    if isinstance(price_str, (int, float)):
        return float(price_str)

    price_str = str(price_str).strip()

    # Remove currency and whitespace
    price_str = re.sub(r'[Kk]č|CZK|,-', '', price_str)
    price_str = price_str.strip()

    # Replace comma with dot
    price_str = price_str.replace(',', '.')

    # Remove thousands separator (space or thin space)
    price_str = re.sub(r'\s+', '', price_str)

    try:
        return float(price_str)
    except ValueError:
        logger.debug(f"Could not parse price: {price_str}")
        return None
