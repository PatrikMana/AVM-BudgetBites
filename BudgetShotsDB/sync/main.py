"""
Main entry point for BudgetShots sync service.
Runs periodic synchronization from KupiAPI to PostgreSQL.
"""

import os
import sys
import time
import logging
import signal
from datetime import datetime

import schedule

from . import database as db
from .pipeline import ImportPipeline, run_cleanup, get_sync_stats

# Configure logging
logging.basicConfig(
    level=os.environ.get('LOG_LEVEL', 'INFO'),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Global flag for graceful shutdown
shutdown_requested = False


def signal_handler(signum, frame):
    """Handle shutdown signals gracefully."""
    global shutdown_requested
    logger.info(f"Received signal {signum}, initiating graceful shutdown...")
    shutdown_requested = True


def wait_for_database(max_retries: int = 30, retry_interval: int = 2) -> bool:
    """
    Wait for database to become available and ensure schema exists.

    Args:
        max_retries: Maximum number of connection attempts
        retry_interval: Seconds between retries

    Returns:
        True if connected and schema ready, False if timeout
    """
    for attempt in range(1, max_retries + 1):
        try:
            if db.check_schema_exists():
                logger.info("Database schema verified")
                return True
            else:
                logger.info("Database connected but schema not found, initializing...")
                db.init_schema()
                logger.info("Schema initialized successfully")
                return True
        except Exception as e:
            logger.warning(f"Database connection attempt {attempt}/{max_retries}: {e}")
            time.sleep(retry_interval)

    logger.error("Failed to connect to database after all retries")
    return False


def run_sync_job():
    """Run the synchronization job."""
    logger.info("=" * 60)
    logger.info("Starting scheduled sync job")
    logger.info("=" * 60)

    try:
        # Run cleanup first
        cleanup_stats = run_cleanup()
        logger.info(f"Cleanup: {cleanup_stats}")

        # Run full sync
        pipeline = ImportPipeline()
        sync_stats = pipeline.run_full_sync(max_pages=0)
        logger.info(f"Sync: {sync_stats}")

        # Log current state
        current_stats = get_sync_stats()
        logger.info(f"Current state: {current_stats}")

    except Exception as e:
        logger.error(f"Sync job failed: {e}", exc_info=True)


def run_initial_sync():
    """Run initial synchronization on startup."""
    logger.info("Running initial sync on startup")
    run_sync_job()


def main():
    """Main entry point."""
    global shutdown_requested

    logger.info("=" * 60)
    logger.info("BudgetShots Sync Service Starting")
    logger.info("=" * 60)

    # Register signal handlers
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    # Get sync interval from environment
    sync_interval_hours = int(os.environ.get('SYNC_INTERVAL_HOURS', 12))
    logger.info(f"Sync interval: {sync_interval_hours} hours")

    # Wait for database
    if not wait_for_database():
        logger.error("Database not available, exiting")
        sys.exit(1)

    # Run initial sync
    run_initial_sync()

    # Schedule periodic syncs
    schedule.every(sync_interval_hours).hours.do(run_sync_job)
    logger.info(f"Scheduled sync job every {sync_interval_hours} hours")

    # Also schedule at specific times for predictability
    schedule.every().day.at("06:00").do(run_sync_job)
    schedule.every().day.at("18:00").do(run_sync_job)
    logger.info("Scheduled sync jobs at 06:00 and 18:00")

    # Main loop
    logger.info("Entering main loop...")
    while not shutdown_requested:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

    logger.info("Shutdown complete")


if __name__ == '__main__':
    main()
