"""
Agent router - Main endpoint for AI agent interactions
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from sqlmodel import Session
from api.database import get_session, UserSettingsRepository
from api.agents import CROAgent
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class AgentRequest(BaseModel):
    """Agent request model"""
    message: str
    agent_id: Optional[str] = "cro"
    user_id: str
    session_id: Optional[str] = None
    cache: Optional[Dict[str, Any]] = None


class AgentResponse(BaseModel):
    """Agent response model"""
    success: bool
    response: Dict[str, Any]
    agent_id: str
    session_id: str
    user_id: str


@router.post("/", response_model=AgentResponse)
async def run_agent(
    request: AgentRequest,
    session: Session = Depends(get_session)
):
    """
    Run AI agent with user message

    This endpoint:
    1. Fetches user's lyzrApiKey from database
    2. Initializes appropriate agent (default: CRO)
    3. Runs agent with message and context
    4. Returns agent response

    Args:
        request: Agent request with message and context
        session: Database session

    Returns:
        Agent response with success status
    """
    try:
        # Validate required fields
        if not request.message or not request.user_id:
            raise HTTPException(
                status_code=400,
                detail="message and user_id are required"
            )

        # Fetch user's Lyzr API key from database
        user_repo = UserSettingsRepository(session)
        user_settings = user_repo.get_by_user_id(request.user_id)

        if not user_settings or not user_settings.lyzr_api_key:
            raise HTTPException(
                status_code=401,
                detail="Lyzr API key not configured. Please add your API key in Settings."
            )

        lyzr_api_key = user_settings.lyzr_api_key

        # Generate session ID if not provided
        session_id = request.session_id or f"session-{request.user_id}"

        # Initialize agent (default to CRO)
        # Future: Support other agents via agent_id
        logger.info(f"Initializing CRO agent for user {request.user_id}")
        agent = CROAgent(api_key=lyzr_api_key, env="prod")

        # Enhance message with cache context if available
        enhanced_message = request.message
        if request.cache:
            # TODO: Format cache context similar to TypeScript implementation
            logger.info("Cache context provided (not yet formatted)")

        # Run agent
        logger.info(f"Running agent with message: {request.message[:50]}...")
        result = agent.run(
            message=enhanced_message,
            session_id=session_id,
            user_id=request.user_id
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Agent execution failed")
            )

        return AgentResponse(
            success=True,
            response=result,
            agent_id=request.agent_id or "cro",
            session_id=session_id,
            user_id=request.user_id
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error running agent: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
