"""
Listing model - matches Drizzle schema exactly
"""
from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal


class Listing(SQLModel, table=True):
    """
    Property listing model
    Matches Drizzle schema: listings table
    """
    __tablename__ = "listings"

    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Hostaway integration
    hostaway_id: Optional[str] = Field(default=None, unique=True, sa_column_kwargs={"name": "hostaway_id"})

    # Basic info
    name: str = Field(..., sa_column_kwargs={"nullable": False})
    city: str = Field(default="Dubai", sa_column_kwargs={"nullable": False})
    country_code: str = Field(default="AE", max_length=3, sa_column_kwargs={"name": "country_code", "nullable": False})
    area: str = Field(..., sa_column_kwargs={"nullable": False})

    # Property details
    bedrooms_number: int = Field(default=0, sa_column_kwargs={"name": "bedrooms_number", "nullable": False})
    bathrooms_number: int = Field(default=1, sa_column_kwargs={"name": "bathrooms_number", "nullable": False})
    property_type: str = Field(..., sa_column_kwargs={"name": "property_type", "nullable": False})
    property_type_id: Optional[int] = Field(default=None, sa_column_kwargs={"name": "property_type_id"})

    # Pricing
    price: Decimal = Field(..., decimal_places=2, max_digits=10, sa_column_kwargs={"nullable": False})
    currency_code: str = Field(default="AED", max_length=3, sa_column_kwargs={"name": "currency_code", "nullable": False})
    price_floor: Decimal = Field(..., decimal_places=2, max_digits=10, sa_column_kwargs={"name": "price_floor", "nullable": False})
    price_ceiling: Decimal = Field(..., decimal_places=2, max_digits=10, sa_column_kwargs={"name": "price_ceiling", "nullable": False})

    # Capacity
    person_capacity: Optional[int] = Field(default=None, sa_column_kwargs={"name": "person_capacity"})

    # JSONB fields
    amenities: Optional[List[str]] = Field(default_factory=list, sa_column=Column(JSONB))
    external_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column("external_data", JSONB))

    # Timestamps
    synced_at: Optional[datetime] = Field(default=None, sa_column_kwargs={"name": "synced_at"})
    created_at: datetime = Field(default_factory=datetime.now, sa_column_kwargs={"name": "created_at", "nullable": False})

    class Config:
        """Pydantic configuration"""
        json_schema_extra = {
            "example": {
                "name": "Marina Heights 1BR",
                "city": "Dubai",
                "area": "Dubai Marina",
                "bedrooms_number": 1,
                "bathrooms_number": 1,
                "property_type": "Apartment",
                "price": "800.00",
                "price_floor": "560.00",
                "price_ceiling": "1200.00",
                "person_capacity": 2,
            }
        }
