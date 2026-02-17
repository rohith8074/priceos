"""
User settings model - matches Drizzle schema exactly
"""
from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB
from typing import Optional, Dict, Any
from datetime import datetime


class UserSettings(SQLModel, table=True):
    """
    User settings model for API keys and preferences
    Matches Drizzle schema: user_settings table
    """
    __tablename__ = "user_settings"

    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)

    # User ID from Neon Auth
    user_id: str = Field(..., unique=True, sa_column_kwargs={"name": "user_id", "nullable": False})

    # API keys (should be encrypted in production)
    lyzr_api_key: Optional[str] = Field(default=None, sa_column_kwargs={"name": "lyzr_api_key"})
    hostaway_api_key: Optional[str] = Field(default=None, sa_column_kwargs={"name": "hostaway_api_key"})

    # User preferences
    preferences: Optional[Dict[str, Any]] = Field(default_factory=dict, sa_column=Column(JSONB))

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.now, sa_column_kwargs={"name": "created_at", "nullable": False})
    updated_at: datetime = Field(default_factory=datetime.now, sa_column_kwargs={"name": "updated_at", "nullable": False})

    class Config:
        """Pydantic configuration"""
        json_schema_extra = {
            "example": {
                "user_id": "user_123abc",
                "lyzr_api_key": "sk_***masked***",
                "preferences": {"auto_approve": True, "daily_cycle": True},
            }
        }
