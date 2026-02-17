"""
Event signal model - matches Drizzle schema exactly
"""
from __future__ import annotations

from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB
from typing import Optional, Dict, Any
from datetime import date as Date, datetime


class EventSignal(SQLModel, table=True):
    """
    Event signal model for Dubai events affecting pricing
    Matches Drizzle schema: event_signals table
    """
    __tablename__ = "event_signals"

    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Event details
    name: str = Field(..., sa_column_kwargs={"nullable": False})
    start_date: Date = Field(..., sa_column_kwargs={"name": "start_date", "nullable": False})
    end_date: Date = Field(..., sa_column_kwargs={"name": "end_date", "nullable": False})
    location: str = Field(default="Dubai", sa_column_kwargs={"nullable": False})

    # Impact assessment
    expected_impact: Optional[str] = Field(default=None, sa_column_kwargs={"name": "expected_impact"})  # high, medium, low
    confidence: Optional[int] = Field(default=50)  # 0-100

    # Description
    description: Optional[str] = Field(default=None)

    # Additional metadata
    event_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, sa_column=Column("metadata", JSONB))

    # Timestamp
    fetched_at: datetime = Field(default_factory=datetime.now, sa_column_kwargs={"name": "fetched_at", "nullable": False})

    class Config:
        """Pydantic configuration"""
        json_schema_extra = {
            "example": {
                "name": "Dubai Shopping Festival",
                "start_date": "2026-03-15",
                "end_date": "2026-03-30",
                "location": "Dubai",
                "expected_impact": "high",
                "confidence": 90,
                "description": "Annual shopping festival attracting global visitors",
            }
        }
