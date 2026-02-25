"""
Database connection and session management
"""
from sqlmodel import create_engine, Session
from api.config.settings import settings
from typing import Generator
import logging

logger = logging.getLogger(__name__)

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    pool_pre_ping=True,   # Verify connections before using
    pool_size=5,
    max_overflow=10,
)


def get_session() -> Generator[Session, None, None]:
    """
    FastAPI dependency for database sessions

    Usage:
        @app.get("/items")
        def get_items(session: Session = Depends(get_session)):
            return session.exec(select(Item)).all()
    """
    with Session(engine) as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {e}")
            session.rollback()
            raise
        finally:
            session.close()


def init_db():
    """
    Initialize database (create tables)
    Note: In production, use Alembic migrations instead
    """
    from sqlmodel import SQLModel
    from api.models import listing, calendar, reservation, proposal, chat, event, user_settings

    logger.info("Creating database tables...")
    SQLModel.metadata.create_all(engine)
    logger.info("Database tables created successfully")
