"""
Data Sync Agent - Syncs Hostaway data to database
"""
from api.agents.base import BaseAgent
from api.database import get_session, ListingRepository, CalendarRepository, ReservationRepository
from datetime import datetime, timedelta
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class DataSyncAgent(BaseAgent):
    """
    Agent for syncing Hostaway data to database

    Responsibilities:
    - Check cache staleness (6-hour threshold)
    - Sync listings, calendar, and reservations
    - Update database with fresh data
    """

    def __init__(self, api_key: str, env: str = "prod"):
        super().__init__(api_key, env)

        # Create lyzr-adk agent
        self.agent = self.studio.create_agent(
            name="Data Sync Agent",
            provider="openai/gpt-4o",
            role="Data synchronization specialist",
            goal="Sync property data from Hostaway to database efficiently",
            instructions="""
            You are responsible for syncing data from Hostaway PMS to the database.

            Your responsibilities:
            - Check if cached data is stale (>6 hours old)
            - Fetch listings, calendar, and reservations from Hostaway
            - Update database with fresh data
            - Return sync statistics

            Always prioritize data accuracy and handle errors gracefully.
            """,
            temperature=0.3,
        )

        # Add tools
        self.agent.add_tool(self.check_cache_staleness)
        self.agent.add_tool(self.get_listing_count)

        logger.info("Data Sync Agent initialized")

    def check_cache_staleness(self, listing_id: int) -> Dict[str, any]:
        """
        Check if cached data is stale (>6 hours old)

        Args:
            listing_id: Listing ID to check

        Returns:
            Dict with staleness info
        """
        try:
            with next(get_session()) as session:
                repo = ListingRepository(session)
                listing = repo.get_by_id(listing_id)

                if not listing or not listing.synced_at:
                    return {"is_stale": True, "age_hours": None, "message": "Never synced"}

                age = datetime.now() - listing.synced_at
                age_hours = age.total_seconds() / 3600

                return {
                    "is_stale": age_hours > 6,
                    "age_hours": round(age_hours, 2),
                    "last_synced": listing.synced_at.isoformat(),
                    "message": f"Last synced {round(age_hours, 1)} hours ago"
                }
        except Exception as e:
            logger.error(f"Error checking cache staleness: {e}")
            return {"error": str(e)}

    def get_listing_count(self) -> Dict[str, any]:
        """
        Get total number of listings in database

        Returns:
            Dict with listing count
        """
        try:
            with next(get_session()) as session:
                repo = ListingRepository(session)
                listings = repo.get_all()
                return {
                    "total_listings": len(listings),
                    "message": f"Found {len(listings)} listings in database"
                }
        except Exception as e:
            logger.error(f"Error getting listing count: {e}")
            return {"error": str(e)}

    def run_sync(self, listing_id: int) -> Dict[str, any]:
        """
        Run full sync for a listing

        Args:
            listing_id: Listing ID to sync

        Returns:
            Sync result
        """
        try:
            response = self.agent.run(
                f"Check and sync data for listing ID {listing_id}. "
                f"First check if the cache is stale, then provide a sync status report.",
                stream=False
            )

            return {
                "success": True,
                "listing_id": listing_id,
                "response": response.response,
                "status": "completed"
            }
        except Exception as e:
            logger.error(f"Error running sync: {e}")
            return {
                "success": False,
                "listing_id": listing_id,
                "error": str(e),
                "status": "failed"
            }
