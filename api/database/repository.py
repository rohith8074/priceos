"""
Repository pattern for database access
"""
from sqlmodel import Session, select
from typing import List, Optional
from datetime import date, datetime
from api.models.listing import Listing
from api.models.calendar import CalendarDay
from api.models.reservation import Reservation
from api.models.proposal import Proposal
from api.models.user_settings import UserSettings


class ListingRepository:
    """Repository for Listing operations"""

    def __init__(self, session: Session):
        self.session = session

    def get_all(self) -> List[Listing]:
        """Get all listings"""
        statement = select(Listing)
        return list(self.session.exec(statement).all())

    def get_by_id(self, listing_id: int) -> Optional[Listing]:
        """Get listing by ID"""
        return self.session.get(Listing, listing_id)

    def get_by_hostaway_id(self, hostaway_id: str) -> Optional[Listing]:
        """Get listing by Hostaway ID"""
        statement = select(Listing).where(Listing.hostaway_id == hostaway_id)
        return self.session.exec(statement).first()

    def create(self, listing: Listing) -> Listing:
        """Create new listing"""
        self.session.add(listing)
        self.session.commit()
        self.session.refresh(listing)
        return listing

    def update(self, listing: Listing) -> Listing:
        """Update existing listing"""
        self.session.add(listing)
        self.session.commit()
        self.session.refresh(listing)
        return listing


class CalendarRepository:
    """Repository for CalendarDay operations"""

    def __init__(self, session: Session):
        self.session = session

    def get_by_listing_and_range(
        self,
        listing_id: int,
        start_date: date,
        end_date: date
    ) -> List[CalendarDay]:
        """Get calendar days for a listing in date range"""
        statement = select(CalendarDay).where(
            CalendarDay.listing_id == listing_id,
            CalendarDay.date >= start_date,
            CalendarDay.date <= end_date
        ).order_by(CalendarDay.date)
        return list(self.session.exec(statement).all())

    def get_by_date(self, listing_id: int, date: date) -> Optional[CalendarDay]:
        """Get calendar day for a specific date"""
        statement = select(CalendarDay).where(
            CalendarDay.listing_id == listing_id,
            CalendarDay.date == date
        )
        return self.session.exec(statement).first()

    def bulk_create(self, calendar_days: List[CalendarDay]) -> List[CalendarDay]:
        """Create multiple calendar days"""
        for day in calendar_days:
            self.session.add(day)
        self.session.commit()
        return calendar_days


class ReservationRepository:
    """Repository for Reservation operations"""

    def __init__(self, session: Session):
        self.session = session

    def get_by_listing(self, listing_id: int) -> List[Reservation]:
        """Get all reservations for a listing"""
        statement = select(Reservation).where(
            Reservation.listing_map_id == listing_id
        ).order_by(Reservation.arrival_date)
        return list(self.session.exec(statement).all())

    def get_by_id(self, reservation_id: int) -> Optional[Reservation]:
        """Get reservation by ID"""
        return self.session.get(Reservation, reservation_id)

    def get_by_hostaway_id(self, hostaway_id: str) -> Optional[Reservation]:
        """Get reservation by Hostaway ID"""
        statement = select(Reservation).where(Reservation.hostaway_id == hostaway_id)
        return self.session.exec(statement).first()


class ProposalRepository:
    """Repository for Proposal operations"""

    def __init__(self, session: Session):
        self.session = session

    def get_by_listing(self, listing_id: int, status: Optional[str] = None) -> List[Proposal]:
        """Get proposals for a listing, optionally filtered by status"""
        statement = select(Proposal).where(Proposal.listing_id == listing_id)
        if status:
            statement = statement.where(Proposal.status == status)
        statement = statement.order_by(Proposal.created_at.desc())
        return list(self.session.exec(statement).all())

    def create(self, proposal: Proposal) -> Proposal:
        """Create new proposal"""
        self.session.add(proposal)
        self.session.commit()
        self.session.refresh(proposal)
        return proposal

    def update_status(self, proposal_id: int, status: str) -> Optional[Proposal]:
        """Update proposal status"""
        proposal = self.session.get(Proposal, proposal_id)
        if proposal:
            proposal.status = status
            if status == "executed":
                proposal.executed_at = datetime.now()
            self.session.add(proposal)
            self.session.commit()
            self.session.refresh(proposal)
        return proposal


class UserSettingsRepository:
    """Repository for UserSettings operations"""

    def __init__(self, session: Session):
        self.session = session

    def get_by_user_id(self, user_id: str) -> Optional[UserSettings]:
        """Get user settings by user ID"""
        statement = select(UserSettings).where(UserSettings.user_id == user_id)
        return self.session.exec(statement).first()

    def create_or_update(self, user_id: str, **kwargs) -> UserSettings:
        """Create or update user settings"""
        settings = self.get_by_user_id(user_id)

        if settings:
            # Update existing
            for key, value in kwargs.items():
                if hasattr(settings, key):
                    setattr(settings, key, value)
            settings.updated_at = datetime.now()
        else:
            # Create new
            settings = UserSettings(user_id=user_id, **kwargs)

        self.session.add(settings)
        self.session.commit()
        self.session.refresh(settings)
        return settings
