"""
Proposal model - matches Drizzle schema exactly
"""
from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB
from typing import Optional, Dict, Any
from datetime import date, datetime
from decimal import Decimal


class Proposal(SQLModel, table=True):
    """
    Pricing proposal model
    Matches Drizzle schema: proposals table
    """
    __tablename__ = "proposals"

    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign key to listings
    listing_id: int = Field(..., foreign_key="listings.id", sa_column_kwargs={"name": "listing_id", "nullable": False})

    # Date range
    date_range_start: date = Field(..., sa_column_kwargs={"name": "date_range_start", "nullable": False})
    date_range_end: date = Field(..., sa_column_kwargs={"name": "date_range_end", "nullable": False})

    # Pricing
    current_price: Decimal = Field(..., decimal_places=2, max_digits=10, sa_column_kwargs={"name": "current_price", "nullable": False})
    proposed_price: Decimal = Field(..., decimal_places=2, max_digits=10, sa_column_kwargs={"name": "proposed_price", "nullable": False})
    change_pct: int = Field(default=0, sa_column_kwargs={"name": "change_pct", "nullable": False})

    # Risk and status
    risk_level: str = Field(default="low", sa_column_kwargs={"name": "risk_level", "nullable": False})  # low, medium, high
    status: str = Field(default="pending", sa_column_kwargs={"nullable": False})  # pending, approved, rejected, executed

    # AI reasoning
    reasoning: Optional[str] = Field(default=None)

    # Signals used for pricing decision
    signals: Optional[Dict[str, Any]] = Field(default_factory=dict, sa_column=Column(JSONB))

    # Timestamps
    executed_at: Optional[datetime] = Field(default=None, sa_column_kwargs={"name": "executed_at"})
    created_at: datetime = Field(default_factory=datetime.now, sa_column_kwargs={"name": "created_at", "nullable": False})

    class Config:
        """Pydantic configuration"""
        json_schema_extra = {
            "example": {
                "listing_id": 1,
                "date_range_start": "2026-03-20",
                "date_range_end": "2026-03-25",
                "current_price": "800.00",
                "proposed_price": "920.00",
                "change_pct": 15,
                "risk_level": "low",
                "status": "pending",
                "reasoning": "High demand due to Dubai Shopping Festival",
                "signals": {"event": "Dubai Shopping Festival", "occupancy": 0.85},
            }
        }
