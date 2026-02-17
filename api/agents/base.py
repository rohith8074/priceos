"""
Base agent utilities for lyzr-adk agents
"""
from lyzr import Studio
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class BaseAgent:
    """Base class for all PriceOS agents"""

    def __init__(self, api_key: str, env: str = "prod"):
        """
        Initialize base agent with lyzr-adk Studio

        Args:
            api_key: Lyzr API key
            env: Environment (prod, dev, local)
        """
        self.api_key = api_key
        self.env = env

        # Initialize Lyzr Studio
        try:
            self.studio = Studio(
                api_key=api_key,
                env=env,
                timeout=30,
                log="info"
            )
            logger.info(f"Initialized Lyzr Studio for {self.__class__.__name__}")
        except Exception as e:
            logger.error(f"Failed to initialize Lyzr Studio: {e}")
            raise

    def create_agent(self, **kwargs):
        """
        Create a Lyzr agent with default configuration

        Override this in subclasses to create specific agents
        """
        raise NotImplementedError("Subclasses must implement create_agent()")
