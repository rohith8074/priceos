"""
Calendar day model - matches Drizzle schema exactly
"""
from __future__ import annotations

from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date as Date, datetime
from decimal import Decimal


class CalendarDay(SQLModel, table=True):
    """
    Calendar day model for listing availability and pricing
    Matches Drizzle schema: calendar_days table
    """
    __tablename__ = "calendar_days"

    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign key to listings
    listing_id: int = Field(..., foreign_key="listings.id", sa_column_kwargs={"name": "listing_id", "nullable": False})

    # Date and status
    date: Date = Field(..., sa_column_kwargs={"nullable": False})
    status: str = Field(default="available", sa_column_kwargs={"nullable": False})  # available, booked, blocked

    # Pricing
    price: Decimal = Field(..., decimal_places=2, max_digits=10, sa_column_kwargs={"nullable": False})

    # Stay restrictions
    minimum_stay: Optional[int] = Field(default=1, sa_column_kwargs={"name": "minimum_stay"})
    maximum_stay: Optional[int] = Field(default=30, sa_column_kwargs={"name": "maximum_stay"})

    # Notes
    notes: Optional[str] = Field(default=None)

    # Sync timestamp
    synced_at: Optional[datetime] = Field(default=None, sa_column_kwargs={"name": "synced_at"})

    class Config:
        """Pydantic configuration"""
        json_schema_extra = {
            "example": {
                "listing_id": 1,
                "date": "2026-03-15",
                "status": "available",
                "price": "850.00",
                "minimum_stay": 2,
                "maximum_stay": 30,
            }
        }
