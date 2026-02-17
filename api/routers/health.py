"""
Health check router
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    database: Optional[str] = None
    lyzr_adk: Optional[str] = None


@router.get("/", response_model=HealthResponse)
async def health_check():
    """
    Comprehensive health check endpoint

    Checks:
    - API availability
    - Database connection (TODO: implement in Task 3)
    - lyzr-adk availability
    """

    # Basic health check
    health_data = {
        "status": "healthy",
        "service": "priceos-agent-backend",
    }

    # Check lyzr-adk import
    try:
        from lyzr import Studio
        health_data["lyzr_adk"] = "available"
    except Exception as e:
        health_data["lyzr_adk"] = f"error: {str(e)}"
        health_data["status"] = "degraded"

    # TODO: Database check will be added in Task 3
    health_data["database"] = "not_configured"

    return health_data
