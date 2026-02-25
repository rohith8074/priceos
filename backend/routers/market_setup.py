"""
Market Setup Router - Handles event data pre-fetching and caching
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from sqlmodel import Session, select
import json
import logging

from api.database import get_session, EventSignalsRepository
from api.models.event_signal import EventSignal
from api.agents import MarketResearchAgent

logger = logging.getLogger(__name__)
router = APIRouter()


class DateRange(BaseModel):
    """Date range model"""
    start: str  # YYYY-MM-DD
    end: str    # YYYY-MM-DD


class MarketSetupRequest(BaseModel):
    """Market setup request model"""
    date_range: DateRange
    listing_id: int
    user_id: str


class SetupProgressEvent(BaseModel):
    """Streaming progress event"""
    status: str  # checking, fetching, saving, complete, error
    message: str
    progress: Optional[int] = 0
    events_count: Optional[int] = 0
    events: Optional[list] = None
    error: Optional[str] = None


async def stream_market_setup(
    request: MarketSetupRequest,
    session: Session,
    lyzr_api_key: str
):
    """
    Stream market setup progress to frontend
    
    Flow:
    1. Check if events exist in event_signals table for date range
    2. If exists → return cached data
    3. If not → call Market Research agent → save to DB
    4. Return complete status
    """
    try:
        # Step 1: Check cached events
        yield json.dumps({
            "status": "checking",
            "message": "Checking cached events for selected date range...",
            "progress": 10
        }) + "\n"
        
        # Query event_signals table
        repo = EventSignalsRepository(session)
        existing_events = repo.get_by_date_range(
            start_date=request.date_range.start,
            end_date=request.date_range.end,
            location="Dubai"
        )
        
        if existing_events and len(existing_events) > 0:
            # Events already cached
            logger.info(f"Found {len(existing_events)} cached events for {request.date_range.start} to {request.date_range.end}")
            
            yield json.dumps({
                "status": "complete",
                "message": f"Using {len(existing_events)} cached events. No API call needed.",
                "progress": 100,
                "events_count": len(existing_events),
                "events": [
                    {
                        "name": e.name,
                        "start_date": str(e.start_date),
                        "end_date": str(e.end_date),
                        "impact": e.expected_impact
                    } for e in existing_events
                ]
            }) + "\n"
            return
        
        # Step 2: Call Market Research agent
        yield json.dumps({
            "status": "fetching",
            "message": "Calling Market Research agent to search for Dubai events...",
            "progress": 30
        }) + "\n"
        
        # Initialize Market Research agent
        market_agent = MarketResearchAgent(api_key=lyzr_api_key, env="prod")
        
        logger.info(f"Fetching events for listing {request.listing_id}, range {request.date_range.start} to {request.date_range.end}")
        
        # Call agent to search for events
        agent_result = market_agent.search_events(
            listing_id=request.listing_id,
            start_date=request.date_range.start,
            end_date=request.date_range.end
        )
        
        if not agent_result.get("success"):
            raise Exception(agent_result.get("error", "Market research failed"))
        
        events_data = agent_result.get("events", [])
        
        yield json.dumps({
            "status": "fetching",
            "message": f"Found {len(events_data)} events. Preparing to save...",
            "progress": 60,
            "events_count": len(events_data)
        }) + "\n"
        
        # Step 3: Save events to database
        yield json.dumps({
            "status": "saving",
            "message": f"Saving {len(events_data)} events to database...",
            "progress": 75
        }) + "\n"
        
        saved_events = []
        for event in events_data:
            try:
                event_signal = EventSignal(
                    name=event.get("title"),
                    start_date=datetime.strptime(event.get("date_start"), "%Y-%m-%d").date(),
                    end_date=datetime.strptime(event.get("date_end"), "%Y-%m-%d").date(),
                    location="Dubai",
                    expected_impact=event.get("impact", "medium"),
                    confidence=int(event.get("confidence", 0.5) * 100),
                    description=event.get("description", ""),
                    metadata={
                        "source": event.get("source", ""),
                        "suggested_premium_pct": event.get("suggested_premium_pct", 0)
                    },
                    fetched_at=datetime.utcnow()
                )
                
                session.add(event_signal)
                saved_events.append({
                    "name": event_signal.name,
                    "start_date": str(event_signal.start_date),
                    "end_date": str(event_signal.end_date),
                    "impact": event_signal.expected_impact
                })
                
            except Exception as e:
                logger.error(f"Error saving event: {e}")
                continue
        
        session.commit()
        
        logger.info(f"Saved {len(saved_events)} events to database")
        
        # Step 4: Complete
        yield json.dumps({
            "status": "complete",
            "message": f"Setup complete! {len(saved_events)} events cached and ready.",
            "progress": 100,
            "events_count": len(saved_events),
            "events": saved_events
        }) + "\n"
        
    except Exception as e:
        logger.error(f"Error in market setup: {e}", exc_info=True)
        yield json.dumps({
            "status": "error",
            "message": f"Setup failed: {str(e)}",
            "progress": 0,
            "error": str(e)
        }) + "\n"


@router.post("/setup")
async def market_setup(
    request: MarketSetupRequest,
    session: Session = Depends(get_session)
):
    """
    Setup market data for selected date range
    
    This endpoint:
    1. Checks event_signals table for cached events
    2. If missing, calls Market Research agent
    3. Saves events to database
    4. Streams progress to frontend
    
    Returns:
        StreamingResponse with progress updates
    """
    try:
        # Get user's Lyzr API key from database
        from api.database import UserSettingsRepository
        user_repo = UserSettingsRepository(session)
        user_settings = user_repo.get_by_user_id(request.user_id)
        
        if not user_settings or not user_settings.lyzr_api_key:
            raise HTTPException(
                status_code=401,
                detail="Lyzr API key not configured. Please add your API key in Settings."
            )
        
        lyzr_api_key = user_settings.lyzr_api_key
        
        # Return streaming response
        return StreamingResponse(
            stream_market_setup(request, session, lyzr_api_key),
            media_type="application/x-ndjson"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in market setup endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
