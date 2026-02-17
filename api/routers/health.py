"""
Health check router
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlmodel import Session, text
from api.database import get_session

router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    database: Optional[str] = None
    lyzr_adk: Optional[str] = None


@router.get("/", response_model=HealthResponse)
async def health_check(session: Session = Depends(get_session)):
    """
    Comprehensive health check endpoint

    Checks:
    - API availability
    - Database connection
    - lyzr-adk availability
    """

    # Basic health check
    health_data = {
        "status": "healthy",
        "service": "priceos-agent-backend",
    }

    # Check database connection
    try:
        result = session.exec(text("SELECT 1")).one()
        health_data["database"] = "connected"
    except Exception as e:
        health_data["database"] = f"error: {str(e)}"
        health_data["status"] = "degraded"

    # Check lyzr-adk import
    try:
        from lyzr import Studio
        health_data["lyzr_adk"] = "available"
    except Exception as e:
        health_data["lyzr_adk"] = f"error: {str(e)}"
        health_data["status"] = "degraded"

    return health_data
