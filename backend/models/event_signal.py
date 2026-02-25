"""
EventSignal Model - Represents cached market intelligence events
"""
from sqlmodel import SQLModel, Field
from typing import Optional, Dict, Any
from datetime import datetime, date
import json


class EventSignal(SQLModel, table=True):
    """Event signal from market research"""
    __tablename__ = "event_signals"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(nullable=False)
    start_date: date = Field(nullable=False, index=True)
    end_date: date = Field(nullable=False, index=True)
    location: str = Field(default="Dubai", nullable=False, index=True)
    expected_impact: Optional[str] = Field(default="medium")  # high, medium, low
    confidence: Optional[int] = Field(default=50)  # 0-100
    description: Optional[str] = Field(default="")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, sa_column_kwargs={"type_": "jsonb"})
    fetched_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
