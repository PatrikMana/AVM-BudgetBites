"""
Import pipeline for BudgetShots.
Handles the complete flow from raw data to normalized offers.
"""

import uuid
import logging
from datetime import date, datetime
from typing import Dict, Any, Optional, Tuple, List

from . import database as db
from . import normalizer
from . import scraper

logger = logging.getLogger(__name__)


class ImportPipeline:
    """
    Handles the complete import and normalization pipeline.

    Flow:
    1. Fetch raw data from KupiAPI
    2. For each item:
       a. Store in offers_raw
       b. Get or create store
       c. Classify product type
       d. Parse unit/volume
       e. Get or create product
       f. Calculate price per liter
       g. Create offer
       h. Update raw record with normalized IDs
    """

    def __init__(self):
        self.batch_id = str(uuid.uuid4())[:8]
        self.aliases = None
        self.stats = {
            'items_fetched': 0,
            'records_expanded': 0,
            'offers_created': 0,
            'offers_skipped': 0,
            'products_created': 0,
            'products_reused': 0,
            'stores_created': 0,
            'errors': 0
        }

    def load_aliases(self):
        """Load product aliases from database."""
        if self.aliases is None:
            self.aliases = db.get_all_aliases()
            logger.info(f"Loaded {len(self.aliases)} product aliases")

    def run_full_sync(self, max_pages: int = 0) -> Dict[str, int]:
        """
        Run a full synchronization from KupiAPI.

        Args:
            max_pages: Maximum pages to scrape (0 = all)

        Returns:
            Statistics dictionary
        """
        logger.info(f"Starting full sync (batch_id={self.batch_id})")
        self.load_aliases()

        # Fetch raw data
        discounts = scraper.fetch_alcohol_discounts(max_pages=max_pages)
        self.stats['items_fetched'] = len(discounts)

        if not discounts:
            logger.warning("No discounts fetched")
            return self.stats

        # Expand to individual records
        records = scraper.expand_discounts(discounts)
        self.stats['records_expanded'] = len(records)

        # Process each record
        for record in records:
            try:
                self.process_record(record)
            except Exception as e:
                logger.error(f"Error processing record: {e}", exc_info=True)
                self.stats['errors'] += 1

        logger.info(f"Sync complete: {self.stats}")
        return self.stats

    def process_record(self, record: Dict[str, Any]) -> Optional[Tuple[int, int]]:
        """
        Process a single discount record.

        Args:
            record: Expanded record from scraper

        Returns:
            Tuple of (product_id, offer_id) or None if skipped
        """
        product_name = record.get('product_name', '').strip()
        shop_name = record.get('shop_name', '').strip()
        price_str = record.get('price')
        original_price_str = record.get('original_price')
        unit_str = record.get('unit')
        validity_str = record.get('validity')
        raw_item = record.get('raw_item')

        if not product_name or not shop_name:
            logger.debug(f"Skipping record with missing name or shop")
            self.stats['offers_skipped'] += 1
            return None

        # Parse prices
        price = normalizer.parse_price(price_str)
        if not price or price <= 0:
            logger.debug(f"Skipping record with invalid price: {price_str}")
            self.stats['offers_skipped'] += 1
            return None

        price_regular = normalizer.parse_price(original_price_str)
        discount_pct = normalizer.calculate_discount_percentage(price, price_regular)

        # Parse validity dates
        valid_from, valid_until = normalizer.parse_validity(validity_str)
        if not valid_from:
            valid_from = date.today().isoformat()
        if not valid_until:
            from datetime import timedelta
            valid_until = (date.today() + timedelta(days=7)).isoformat()

        # Check if offer is still valid (not in the past)
        if valid_until < date.today().isoformat():
            logger.debug(f"Skipping expired offer: {product_name}")
            self.stats['offers_skipped'] += 1
            return None

        # Get or create store
        shop_slug, shop_display = normalizer.normalize_shop_name(shop_name)
        store_id, store_created = db.get_or_create_store(shop_slug, shop_display)
        if store_created:
            self.stats['stores_created'] += 1

        # Store raw record first (with all available price data)
        raw_id = db.create_offer_raw(
            product_name=product_name,
            shop_name=shop_name,
            price=price,
            original_price=price_regular,
            discount_percentage=discount_pct,
            unit=unit_str,
            valid_from=valid_from,
            valid_until=valid_until,
            raw_payload=raw_item,
            import_batch_id=self.batch_id
        )

        # Classify product
        classification = normalizer.classify_product(
            product_name, self.aliases, category='alkohol'
        )

        # Parse volume
        volume_info = normalizer.parse_unit(unit_str)
        total_volume = volume_info.total_volume_ml if volume_info else None

        # Normalize product name for deduplication
        normalized_name = normalizer.normalize_product_name(product_name)

        # Find existing product using improved deduplication
        existing_product = db.find_product(
            normalized_name=normalized_name,
            product_type_id=classification.product_type_id,
            total_volume_ml=total_volume
        )

        if existing_product:
            product_id = existing_product['id']
            self.stats['products_reused'] += 1

            # Update product if we have better data
            updates = {}
            if classification.product_type_id and not existing_product.get('product_type_id'):
                updates['product_type_id'] = classification.product_type_id
            if classification.brand and not existing_product.get('brand'):
                updates['brand'] = classification.brand
            if volume_info and not existing_product.get('total_volume_ml'):
                updates['pack_count'] = volume_info.pack_count
                updates['volume_per_unit_ml'] = volume_info.volume_per_unit_ml
                updates['total_volume_ml'] = volume_info.total_volume_ml
                updates['is_multipack'] = volume_info.is_multipack
                updates['unit_raw'] = volume_info.raw_unit
            if not existing_product.get('normalized_name'):
                updates['normalized_name'] = normalized_name

            if updates:
                db.update_product(product_id, **updates)
        else:
            # Create new product
            product_id = db.create_product(
                name=product_name,
                normalized_name=normalized_name,
                product_type_id=classification.product_type_id,
                brand=classification.brand,
                category_raw='alkohol',
                unit_raw=volume_info.raw_unit if volume_info else unit_str,
                pack_count=volume_info.pack_count if volume_info else None,
                volume_per_unit_ml=volume_info.volume_per_unit_ml if volume_info else None,
                total_volume_ml=volume_info.total_volume_ml if volume_info else None,
                is_multipack=volume_info.is_multipack if volume_info else False,
                normalization_confidence=classification.confidence if classification.product_type_id else None
            )
            self.stats['products_created'] += 1

        # Calculate price per liter
        if volume_info:
            final_volume = volume_info.total_volume_ml
        elif existing_product and existing_product.get('total_volume_ml'):
            final_volume = existing_product['total_volume_ml']
        else:
            final_volume = None

        price_per_l = normalizer.calculate_price_per_liter(price, final_volume)
        price_per_l_regular = normalizer.calculate_price_per_liter(price_regular, final_volume) if price_regular else None

        # Check for existing offer
        existing_offer = db.find_existing_offer(
            product_id, store_id, valid_from, valid_until
        )

        if existing_offer:
            logger.debug(f"Offer already exists for {product_name} at {shop_name}")
            self.stats['offers_skipped'] += 1
            # Update raw record anyway
            db.update_offer_raw(raw_id, product_id, existing_offer['id'])
            return product_id, existing_offer['id']

        # Create offer with all available price data
        offer_id = db.create_offer(
            product_id=product_id,
            store_id=store_id,
            price_discounted=price,
            price_regular=price_regular,
            discount_percentage=discount_pct,
            valid_from=valid_from,
            valid_until=valid_until,
            price_per_l_discounted=price_per_l,
            price_per_l_regular=price_per_l_regular,
            source_type='kupiapi',
            source_reference=self.batch_id
        )
        self.stats['offers_created'] += 1

        # Update raw record with normalized IDs
        db.update_offer_raw(raw_id, product_id, offer_id)

        return product_id, offer_id


def run_cleanup() -> Dict[str, int]:
    """
    Run cleanup tasks:
    - Deactivate expired offers
    - Delete old offers (30+ days expired)
    - Delete old raw records (60+ days)

    Returns:
        Statistics dictionary
    """
    logger.info("Running cleanup tasks")

    stats = {
        'offers_deactivated': db.deactivate_expired_offers(),
        'offers_deleted': db.delete_old_offers(days_old=30),
        'raw_deleted': db.delete_old_raw_offers(days_old=60)
    }

    logger.info(f"Cleanup complete: {stats}")
    return stats


def get_sync_stats() -> Dict[str, Any]:
    """Get current sync statistics."""
    return {
        'active_offers': db.get_active_offer_count(),
        'stores': len(db.get_all_stores()),
        'product_types': len(db.get_all_product_types())
    }
