/**
 * Hostaway API Type Definitions
 * Based on https://api.hostaway.com/documentation
 */

export interface HostawayResponse<T> {
  status: "success" | "fail";
  result: T;
  limit?: number;
  offset?: number;
  count?: number;
  page?: number;
  totalPages?: number;
}

export interface Listing {
  id: number;
  hostawayListingId: string;
  name: string;
  address: {
    city: string;
    area: string;
    country: string;
  };
  bedrooms: number;
  bathrooms: number;
  propertyType: "Studio" | "Apartment" | "Villa" | "House" | "Townhouse";
  basePrice: number;
  currency: "AED" | "USD";
  priceFloor: number;
  priceCeiling: number;
  maximumGuests?: number;
  amenities?: string[];
}

export interface CalendarDay {
  date: string; // ISO format YYYY-MM-DD
  status: "available" | "booked" | "blocked";
  price: number;
  minStay: number;
  maxStay: number;
  notes?: string;
}

export interface Reservation {
  id: number;
  hostawayReservationId: string;
  listingId: number;
  guestName: string;
  guestEmail?: string;
  channelName: "Airbnb" | "Booking.com" | "Direct" | "Other";
  arrivalDate: string; // ISO format
  departureDate: string; // ISO format
  nightsCount: number;
  totalPrice: number;
  pricePerNight: number;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  createdAt: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface CalendarInterval {
  startDate: string; // ISO format
  endDate: string; // ISO format
  price: number;
}

export interface UpdateResult {
  success: boolean;
  updatedCount: number;
  failedCount?: number;
  errors?: string[];
}

export interface VerificationResult {
  matches: boolean;
  totalDates: number;
  matchedDates: number;
  mismatches?: Array<{
    date: string;
    expected: number;
    actual: number;
  }>;
}

export interface ReservationFilters {
  listingId?: number;
  channelName?: string;
  status?: "confirmed" | "pending" | "cancelled" | "completed";
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}
