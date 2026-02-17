"""
CRO (Chief Revenue Officer) Agent - Manager orchestrating workers
"""
from api.agents.base import BaseAgent
from api.agents.data_sync_agent import DataSyncAgent
from api.agents.event_intelligence_agent import EventIntelligenceAgent
from api.agents.pricing_analyst_agent import PricingAnalystAgent
from typing import Dict
import logging

logger = logging.getLogger(__name__)


class CROAgent(BaseAgent):
    """
    Chief Revenue Officer - Manager agent orchestrating worker agents

    Responsibilities:
    - Understand user queries and delegate to workers
    - Synthesize information from multiple agents
    - Provide strategic pricing recommendations
    - Never execute pricing changes without approval
    """

    def __init__(self, api_key: str, env: str = "prod"):
        super().__init__(api_key, env)

        # Create manager agent
        self.agent = self.studio.create_agent(
            name="CRO (Chief Revenue Officer)",
            provider="openai/gpt-4o",
            role="Chief Revenue Officer managing pricing strategy",
            goal="Optimize revenue through data-driven pricing decisions",
            instructions="""
            You are the Chief Revenue Officer for a Dubai property portfolio.

            You coordinate worker agents:
            - Data Sync Agent: Refreshes data from Hostaway
            - Event Intelligence Agent: Monitors Dubai events
            - Pricing Analyst Agent: Generates pricing proposals

            Your responsibilities:
            - Understand property manager queries
            - Delegate tasks to appropriate worker agents
            - Synthesize insights from multiple agents
            - Provide clear, strategic recommendations
            - Explain reasoning in business terms

            IMPORTANT RULES:
            - Never execute pricing changes without explicit approval
            - Always explain the rationale behind recommendations
            - Highlight risks and opportunities clearly
            - Consider both revenue and occupancy goals

            You speak like a business partner, not a technical system.
            Be professional, concise, and action-oriented.
            """,
            temperature=0.6,
            memory=50,  # Remember conversation context
        )

        # Initialize worker agents (lazy initialization to avoid overhead)
        self._data_sync = None
        self._event_intel = None
        self._pricing_analyst = None

        # Add delegation tools
        self.agent.add_tool(self.delegate_to_data_sync)
        self.agent.add_tool(self.delegate_to_event_intel)
        self.agent.add_tool(self.delegate_to_pricing_analyst)

        logger.info("CRO Agent initialized")

    @property
    def data_sync(self) -> DataSyncAgent:
        """Lazy initialization of Data Sync Agent"""
        if self._data_sync is None:
            self._data_sync = DataSyncAgent(self.api_key, self.env)
        return self._data_sync

    @property
    def event_intel(self) -> EventIntelligenceAgent:
        """Lazy initialization of Event Intelligence Agent"""
        if self._event_intel is None:
            self._event_intel = EventIntelligenceAgent(self.api_key, self.env)
        return self._event_intel

    @property
    def pricing_analyst(self) -> PricingAnalystAgent:
        """Lazy initialization of Pricing Analyst Agent"""
        if self._pricing_analyst is None:
            self._pricing_analyst = PricingAnalystAgent(self.api_key, self.env)
        return self._pricing_analyst

    def delegate_to_data_sync(self, listing_id: int) -> Dict:
        """
        Delegate sync task to Data Sync Agent

        Args:
            listing_id: Listing ID to sync

        Returns:
            Sync result
        """
        logger.info(f"CRO delegating sync task for listing {listing_id}")
        return self.data_sync.run_sync(listing_id)

    def delegate_to_event_intel(self, start_date: str, end_date: str) -> Dict:
        """
        Delegate event analysis to Event Intelligence Agent

        Args:
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)

        Returns:
            Event analysis
        """
        logger.info(f"CRO delegating event analysis for {start_date} to {end_date}")
        return self.event_intel.analyze_events(start_date, end_date)

    def delegate_to_pricing_analyst(
        self,
        listing_id: int,
        start_date: str,
        end_date: str
    ) -> Dict:
        """
        Delegate pricing analysis to Pricing Analyst Agent

        Args:
            listing_id: Listing ID
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)

        Returns:
            Pricing analysis
        """
        logger.info(f"CRO delegating pricing analysis for listing {listing_id}")
        return self.pricing_analyst.generate_proposals(listing_id, start_date, end_date)

    def run(self, message: str, session_id: str, user_id: str = "default") -> Dict:
        """
        Run CRO agent with user message

        Args:
            message: User message/query
            session_id: Conversation session ID
            user_id: User ID for context

        Returns:
            Agent response
        """
        try:
            logger.info(f"CRO processing message for session {session_id}")

            response = self.agent.run(
                message,
                session_id=session_id,
                stream=False
            )

            return {
                "success": True,
                "response": response.response,
                "session_id": session_id,
                "user_id": user_id,
                "status": "completed"
            }
        except Exception as e:
            logger.error(f"Error running CRO agent: {e}")
            return {
                "success": False,
                "error": str(e),
                "session_id": session_id,
                "user_id": user_id,
                "status": "failed"
            }
