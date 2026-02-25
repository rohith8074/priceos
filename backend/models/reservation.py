"""
Reservation model - matches Drizzle schema exactly
"""
from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB
from typing import Optional, Dict, Any
from datetime import date, datetime
from decimal import Decimal


class Reservation(SQLModel, table=True):
    """
    Reservation/booking model
    Matches Drizzle schema: reservations table
    """
    __tablename__ = "reservations"

    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Hostaway integration
    hostaway_id: Optional[str] = Field(default=None, unique=True, sa_column_kwargs={"name": "hostaway_id"})

    # Foreign key to listings
    listing_map_id: int = Field(..., foreign_key="listings.id", sa_column_kwargs={"name": "listing_map_id", "nullable": False})

    # Guest info
    guest_name: str = Field(..., sa_column_kwargs={"name": "guest_name", "nullable": False})
    guest_email: Optional[str] = Field(default=None, sa_column_kwargs={"name": "guest_email"})

    # Booking channel
    channel_name: str = Field(..., sa_column_kwargs={"name": "channel_name", "nullable": False})

    # Dates
    arrival_date: date = Field(..., sa_column_kwargs={"name": "arrival_date", "nullable": False})
    departure_date: date = Field(..., sa_column_kwargs={"name": "departure_date", "nullable": False})
    nights: int = Field(..., sa_column_kwargs={"nullable": False})

    # Pricing
    total_price: Decimal = Field(..., decimal_places=2, max_digits=10, sa_column_kwargs={"name": "total_price", "nullable": False})
    price_per_night: Decimal = Field(..., decimal_places=2, max_digits=10, sa_column_kwargs={"name": "price_per_night", "nullable": False})

    # Status
    status: str = Field(default="confirmed", sa_column_kwargs={"nullable": False})  # confirmed, pending, cancelled

    # Check-in/out times
    check_in_time: Optional[str] = Field(default=None, sa_column_kwargs={"name": "check_in_time"})
    check_out_time: Optional[str] = Field(default=None, sa_column_kwargs={"name": "check_out_time"})

    # JSONB external data
    external_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column("external_data", JSONB))

    # Timestamps
    synced_at: Optional[datetime] = Field(default=None, sa_column_kwargs={"name": "synced_at"})
    created_at: datetime = Field(default_factory=datetime.now, sa_column_kwargs={"name": "created_at", "nullable": False})

    class Config:
        """Pydantic configuration"""
        json_schema_extra = {
            "example": {
                "listing_map_id": 1,
                "guest_name": "John Smith",
                "guest_email": "john@example.com",
                "channel_name": "Airbnb",
                "arrival_date": "2026-03-20",
                "departure_date": "2026-03-25",
                "nights": 5,
                "total_price": "4250.00",
                "price_per_night": "850.00",
                "status": "confirmed",
            }
        }
