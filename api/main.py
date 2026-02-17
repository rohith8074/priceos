"""
PriceOS Agent Backend - FastAPI Application
AI-powered revenue management agents using lyzr-adk
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.config.settings import settings
import logging

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="PriceOS Agent Backend",
    description="AI-powered revenue management agents using lyzr-adk",
    version="1.0.0",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from api.routers import health
# from api.routers import agent, chat, sync  # Will be created in next tasks

# Include routers
app.include_router(health.router, prefix="/api/health", tags=["health"])
# app.include_router(agent.router, prefix="/api/agent", tags=["agents"])
# app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
# app.include_router(sync.router, prefix="/api/sync", tags=["sync"])


@app.get("/")
async def root():
    """Root endpoint - API info"""
    return {
        "name": "PriceOS Agent Backend",
        "version": "1.0.0",
        "status": "running",
        "framework": "FastAPI + lyzr-adk",
    }


@app.get("/health")
async def health_check():
    """Quick health check endpoint"""
    return {"status": "healthy", "service": "priceos-agent-backend"}


# For Vercel serverless deployment
# Vercel uses the 'app' variable by default
handler = app
