"""
Pricing Analyst Agent - Generates data-driven pricing proposals
"""
from api.agents.base import BaseAgent
from api.database import get_session, ListingRepository, CalendarRepository, ProposalRepository
from api.models.proposal import Proposal
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class PricingAnalystAgent(BaseAgent):
    """
    Agent for generating pricing proposals

    Responsibilities:
    - Analyze occupancy rates and market signals
    - Generate data-driven pricing proposals
    - Classify risk level (low/medium/high)
    - Apply floor/ceiling price constraints
    """

    def __init__(self, api_key: str, env: str = "prod"):
        super().__init__(api_key, env)

        # Create lyzr-adk agent
        self.agent = self.studio.create_agent(
            name="Pricing Analyst",
            provider="openai/gpt-4o",
            role="Revenue management pricing analyst",
            goal="Generate data-driven pricing proposals for Dubai properties",
            instructions="""
            You are a pricing analyst for short-term rental properties in Dubai.

            Your responsibilities:
            - Analyze occupancy rates, events, and market signals
            - Generate pricing proposals with clear reasoning
            - Classify risk level:
              * LOW: 0-10% price change, supported by strong signals
              * MEDIUM: 11-20% price change, moderate signals
              * HIGH: >20% price change, requires strong justification
            - Always respect floor/ceiling price constraints
            - Group consecutive days with similar signals
            - Provide clear, data-driven reasoning

            Never suggest prices below floor or above ceiling.
            Always explain why a price change is recommended.
            """,
            temperature=0.5,
            memory=30,  # Remember context across proposals
        )

        # Add tools
        self.agent.add_tool(self.get_listing_data)
        self.agent.add_tool(self.calculate_occupancy)
        self.agent.add_tool(self.get_calendar_prices)
        self.agent.add_tool(self.save_proposal)

        logger.info("Pricing Analyst Agent initialized")

    def get_listing_data(self, listing_id: int) -> Dict:
        """
        Get listing details for pricing context

        Args:
            listing_id: Listing ID

        Returns:
            Listing data
        """
        try:
            with next(get_session()) as session:
                repo = ListingRepository(session)
                listing = repo.get_by_id(listing_id)

                if not listing:
                    return {"error": f"Listing {listing_id} not found"}

                return {
                    "id": listing.id,
                    "name": listing.name,
                    "current_price": float(listing.price),
                    "price_floor": float(listing.price_floor),
                    "price_ceiling": float(listing.price_ceiling),
                    "bedrooms": listing.bedrooms_number,
                    "city": listing.city,
                    "area": listing.area,
                }
        except Exception as e:
            logger.error(f"Error getting listing data: {e}")
            return {"error": str(e)}

    def calculate_occupancy(self, listing_id: int, days: int = 30) -> Dict:
        """
        Calculate occupancy rate for last N days

        Args:
            listing_id: Listing ID
            days: Number of days to analyze

        Returns:
            Occupancy statistics
        """
        try:
            with next(get_session()) as session:
                repo = CalendarRepository(session)
                end_date = date.today()
                start_date = end_date - timedelta(days=days)

                calendar = repo.get_by_listing_and_range(
                    listing_id, start_date, end_date
                )

                if not calendar:
                    return {"occupancy_rate": 0, "days_analyzed": 0, "message": "No calendar data"}

                booked_days = sum(1 for day in calendar if day.status == "booked")
                total_days = len(calendar)
                occupancy_rate = round((booked_days / total_days) * 100, 2)

                return {
                    "occupancy_rate": occupancy_rate,
                    "booked_days": booked_days,
                    "total_days": total_days,
                    "period": f"{days} days",
                    "message": f"{occupancy_rate}% occupancy over last {days} days"
                }
        except Exception as e:
            logger.error(f"Error calculating occupancy: {e}")
            return {"error": str(e)}

    def get_calendar_prices(self, listing_id: int, start_date: str, end_date: str) -> List[Dict]:
        """
        Get current prices for date range

        Args:
            listing_id: Listing ID
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)

        Returns:
            List of calendar prices
        """
        try:
            with next(get_session()) as session:
                repo = CalendarRepository(session)
                calendar = repo.get_by_listing_and_range(
                    listing_id,
                    datetime.strptime(start_date, "%Y-%m-%d").date(),
                    datetime.strptime(end_date, "%Y-%m-%d").date()
                )

                return [
                    {
                        "date": day.date.isoformat(),
                        "price": float(day.price),
                        "status": day.status,
                        "minimum_stay": day.minimum_stay,
                    }
                    for day in calendar
                ]
        except Exception as e:
            logger.error(f"Error getting calendar prices: {e}")
            return []

    def save_proposal(self, proposal_data: Dict) -> Dict:
        """
        Save pricing proposal to database

        Args:
            proposal_data: Proposal details

        Returns:
            Saved proposal info
        """
        try:
            with next(get_session()) as session:
                repo = ProposalRepository(session)

                proposal = Proposal(
                    listing_id=proposal_data["listing_id"],
                    date_range_start=datetime.strptime(proposal_data["date_range_start"], "%Y-%m-%d").date(),
                    date_range_end=datetime.strptime(proposal_data["date_range_end"], "%Y-%m-%d").date(),
                    current_price=Decimal(str(proposal_data["current_price"])),
                    proposed_price=Decimal(str(proposal_data["proposed_price"])),
                    change_pct=proposal_data["change_pct"],
                    risk_level=proposal_data["risk_level"],
                    reasoning=proposal_data["reasoning"],
                    signals=proposal_data.get("signals", {})
                )

                saved = repo.create(proposal)

                return {
                    "proposal_id": saved.id,
                    "status": "saved",
                    "message": f"Proposal {saved.id} created successfully"
                }
        except Exception as e:
            logger.error(f"Error saving proposal: {e}")
            return {"error": str(e)}

    def generate_proposals(self, listing_id: int, start_date: str, end_date: str) -> Dict:
        """
        Generate pricing proposals for date range

        Args:
            listing_id: Listing ID
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)

        Returns:
            Generation result
        """
        try:
            response = self.agent.run(
                f"""Generate pricing proposals for listing {listing_id} from {start_date} to {end_date}.

                Steps:
                1. Get listing data and price constraints (floor/ceiling)
                2. Calculate recent occupancy rate
                3. Get current calendar prices
                4. Analyze signals (occupancy, events, seasonality)
                5. Generate proposals respecting floor/ceiling constraints
                6. Classify risk level based on price change percentage
                7. Save proposals to database

                Return summary of proposals created with reasoning.""",
                stream=False
            )

            return {
                "success": True,
                "listing_id": listing_id,
                "date_range": f"{start_date} to {end_date}",
                "response": response.response,
                "status": "completed"
            }
        except Exception as e:
            logger.error(f"Error generating proposals: {e}")
            return {
                "success": False,
                "listing_id": listing_id,
                "error": str(e),
                "status": "failed"
            }
