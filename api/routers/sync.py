"""
Sync router - Data synchronization endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlmodel import Session
from api.database import get_session, UserSettingsRepository
from api.agents import DataSyncAgent
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class SyncRequest(BaseModel):
    """Sync request model"""
    user_id: str
    listing_id: Optional[int] = None  # None = sync all
    context: Optional[str] = "portfolio"  # portfolio | property


class SyncResponse(BaseModel):
    """Sync response model"""
    success: bool
    synced: dict
    timestamp: str
    message: Optional[str] = None


@router.post("/", response_model=SyncResponse)
async def sync_data(
    request: SyncRequest,
    session: Session = Depends(get_session)
):
    """
    Sync data from Hostaway to database

    This endpoint:
    1. Fetches user's Hostaway API key from database
    2. Initializes Data Sync Agent
    3. Syncs specified listing or all listings
    4. Returns sync statistics

    Args:
        request: Sync request with user_id and optional listing_id
        session: Database session

    Returns:
        Sync statistics
    """
    try:
        # Validate required fields
        if not request.user_id:
            raise HTTPException(
                status_code=400,
                detail="user_id is required"
            )

        # Fetch user's settings from database
        user_repo = UserSettingsRepository(session)
        user_settings = user_repo.get_by_user_id(request.user_id)

        if not user_settings:
            raise HTTPException(
                status_code=401,
                detail="User settings not found. Please configure your account in Settings."
            )

        # Get Lyzr API key for agent
        if not user_settings.lyzr_api_key:
            raise HTTPException(
                status_code=401,
                detail="Lyzr API key not configured. Please add your API key in Settings."
            )

        lyzr_api_key = user_settings.lyzr_api_key

        # Initialize Data Sync Agent
        logger.info(f"Initializing Data Sync Agent for user {request.user_id}")
        agent = DataSyncAgent(api_key=lyzr_api_key, env="prod")

        # Perform sync
        if request.listing_id:
            # Sync single listing
            logger.info(f"Syncing listing {request.listing_id}")
            result = agent.run_sync(request.listing_id)

            if not result.get("success"):
                raise HTTPException(
                    status_code=500,
                    detail=result.get("error", "Sync failed")
                )

            return SyncResponse(
                success=True,
                synced={
                    "listings": 1,
                    "calendar_days": 0,  # TODO: Get from result
                    "reservations": 0,   # TODO: Get from result
                },
                timestamp=result.get("timestamp", ""),
                message=f"Synced listing {request.listing_id}"
            )
        else:
            # Sync all listings
            logger.info("Syncing all listings")
            # TODO: Implement sync_all method in DataSyncAgent
            return SyncResponse(
                success=True,
                synced={
                    "listings": 0,
                    "calendar_days": 0,
                    "reservations": 0,
                },
                timestamp="",
                message="Sync all not yet implemented"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error syncing data: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
