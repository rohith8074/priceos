"""
Chat message model - matches Drizzle schema exactly
"""
from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB
from typing import Optional, Dict, Any
from datetime import datetime


class ChatMessage(SQLModel, table=True):
    """
    Chat message model for CRO conversations
    Matches Drizzle schema: chat_messages table
    """
    __tablename__ = "chat_messages"

    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)

    # User and session
    user_id: Optional[str] = Field(default=None, sa_column_kwargs={"name": "user_id"})
    session_id: str = Field(..., sa_column_kwargs={"name": "session_id", "nullable": False})

    # Message content
    role: str = Field(..., sa_column_kwargs={"nullable": False})  # user, assistant, error
    content: str = Field(..., sa_column_kwargs={"nullable": False})

    # Optional listing context
    listing_id: Optional[int] = Field(default=None, sa_column_kwargs={"name": "listing_id"})

    # Structured data (proposals, analysis, etc.)
    structured: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSONB))

    # Timestamp
    created_at: datetime = Field(default_factory=datetime.now, sa_column_kwargs={"name": "created_at", "nullable": False})

    class Config:
        """Pydantic configuration"""
        json_schema_extra = {
            "example": {
                "session_id": "sess_abc123",
                "role": "user",
                "content": "What should I price Marina Heights for next weekend?",
                "listing_id": 1,
            }
        }
