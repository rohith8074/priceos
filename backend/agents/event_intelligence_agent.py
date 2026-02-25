"""
Event Intelligence Agent - Analyzes Dubai events for pricing impact
"""
from api.agents.base import BaseAgent
from datetime import date, datetime
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class EventIntelligenceAgent(BaseAgent):
    """
    Agent for analyzing Dubai events and their pricing impact

    Responsibilities:
    - Monitor Dubai events (Ramadan, Expo, festivals, sports)
    - Classify event impact on demand (1-5 scale)
    - Provide pricing recommendations
    """

    def __init__(self, api_key: str, env: str = "prod"):
        super().__init__(api_key, env)

        # Create lyzr-adk agent
        self.agent = self.studio.create_agent(
            name="Event Intelligence Agent",
            provider="openai/gpt-4o",
            role="Dubai event monitoring and impact analysis specialist",
            goal="Identify events affecting short-term rental demand and pricing",
            instructions="""
            You are an event intelligence specialist for Dubai short-term rentals.

            Your responsibilities:
            - Monitor Dubai events (Ramadan, Expo, sporting events, festivals, conferences)
            - Classify event impact on demand using 1-5 scale:
              * 5 = Massive impact (Expo, Ramadan, New Year's Eve)
              * 4 = High impact (major sporting events, Dubai Shopping Festival)
              * 3 = Medium impact (concerts, cultural festivals)
              * 2 = Low impact (local events)
              * 1 = Minimal impact
            - Provide clear pricing recommendations
            - Consider event proximity to property, duration, and historical demand

            Always explain your reasoning for impact ratings.
            """,
            temperature=0.4,
            memory=20,  # Remember recent event analyses
        )

        # Add tools
        self.agent.add_tool(self.get_dubai_events)
        self.agent.add_tool(self.calculate_impact_score)

        logger.info("Event Intelligence Agent initialized")

    def get_dubai_events(self, start_date: str, end_date: str) -> List[Dict]:
        """
        Get Dubai events for date range

        Args:
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)

        Returns:
            List of events

        Note: In production, this would call an events API.
        For now, returns mock data.
        """
        # TODO: Integrate with real events API
        # For now, return mock Dubai events
        mock_events = [
            {
                "name": "Dubai Shopping Festival",
                "start_date": "2026-03-15",
                "end_date": "2026-03-30",
                "category": "cultural",
                "description": "Annual shopping festival attracting global visitors",
            },
            {
                "name": "Ramadan",
                "start_date": "2026-02-28",
                "end_date": "2026-03-29",
                "category": "religious",
                "description": "Holy month of Ramadan with unique hospitality patterns",
            },
        ]

        # Filter events by date range
        filtered_events = []
        for event in mock_events:
            event_start = datetime.strptime(event["start_date"], "%Y-%m-%d").date()
            event_end = datetime.strptime(event["end_date"], "%Y-%m-%d").date()
            range_start = datetime.strptime(start_date, "%Y-%m-%d").date()
            range_end = datetime.strptime(end_date, "%Y-%m-%d").date()

            # Check if events overlap with date range
            if event_start <= range_end and event_end >= range_start:
                filtered_events.append(event)

        return filtered_events

    def calculate_impact_score(self, event_data: Dict) -> Dict:
        """
        Calculate pricing impact score for an event

        Args:
            event_data: Event information

        Returns:
            Impact analysis
        """
        category = event_data.get("category", "")

        # Base impact by category
        impact_map = {
            "religious": 5,  # Ramadan, Eid
            "international": 5,  # Expo, major conferences
            "sports": 4,  # F1, golf tournaments
            "cultural": 4,  # Shopping Festival, Food Festival
            "business": 3,  # Trade shows, conferences
            "local": 2,  # Local events
        }

        impact_level = impact_map.get(category, 2)

        # Map to price increase recommendation
        if impact_level >= 4:
            suggested_increase = 25  # 25% increase
            recommendation = "High impact event - significant price increase recommended"
        elif impact_level == 3:
            suggested_increase = 15  # 15% increase
            recommendation = "Medium impact event - moderate price increase"
        else:
            suggested_increase = 5  # 5% increase
            recommendation = "Low impact event - slight price adjustment"

        return {
            "event_name": event_data.get("name"),
            "impact_level": impact_level,
            "suggested_increase": suggested_increase,
            "recommendation": recommendation,
            "reasoning": f"{category.title()} event with impact level {impact_level}/5"
        }

    def analyze_events(self, start_date: str, end_date: str) -> Dict:
        """
        Analyze all events in date range and provide pricing recommendations

        Args:
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)

        Returns:
            Event analysis result
        """
        try:
            response = self.agent.run(
                f"""Analyze Dubai events from {start_date} to {end_date}.

                Steps:
                1. Get all events in the date range
                2. Calculate impact score for each event
                3. Provide overall pricing recommendation
                4. Explain which events have the highest impact

                Return a summary with suggested price increases.""",
                stream=False
            )

            return {
                "success": True,
                "start_date": start_date,
                "end_date": end_date,
                "response": response.response,
                "status": "completed"
            }
        except Exception as e:
            logger.error(f"Error analyzing events: {e}")
            return {
                "success": False,
                "error": str(e),
                "status": "failed"
            }
