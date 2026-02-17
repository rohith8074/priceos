"""
Application settings from environment variables
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings from environment variables"""

    # Database
    DATABASE_URL: str

    # Lyzr ADK (optional - will be fetched per-user from database)
    LYZR_API_KEY: Optional[str] = None
    LYZR_ENV: str = "prod"

    # Hostaway (for sync agent)
    HOSTAWAY_API_KEY: Optional[str] = None
    HOSTAWAY_MODE: str = "db"  # db | mock | live

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "https://*.vercel.app"]

    # App config
    DEBUG: bool = False
    LOG_LEVEL: str = "info"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
