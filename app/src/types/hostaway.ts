/**
 * Hostaway API Type Definitions
 * Field names aligned with Hostaway API (https://api.hostaway.com/documentation)
 * PriceOS-specific fields (priceFloor, priceCeiling, area) are clearly marked.
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
  name: string;
  city: string;
  countryCode: string;
  area: string; // PriceOS-specific: Dubai sub-area (e.g., "Dubai Marina")
  bedroomsNumber: number;
  bathroomsNumber: number;
  propertyType: "Studio" | "Apartment" | "Villa" | "House" | "Townhouse";
  propertyTypeId?: number; // Hostaway API integer ID
  price: number;
  currencyCode: "AED" | "USD";
  priceFloor: number; // PriceOS-specific
  priceCeiling: number; // PriceOS-specific
  personCapacity?: number;
  amenities?: string[];
}

export interface CalendarDay {
  date: string; // ISO format YYYY-MM-DD
  status: "available" | "booked" | "blocked";
  price: number;
  minimumStay: number;
  maximumStay: number;
  notes?: string;
  blockReason?: "owner_stay" | "maintenance" | "other";
}

export interface Reservation {
  id: number;
  listingMapId: number;
  guestName: string;
  guestEmail?: string;
  channelName: "Airbnb" | "Booking.com" | "Direct" | "Other";
  arrivalDate: string; // ISO format
  departureDate: string; // ISO format
  nights: number;
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
  listingMapId?: number;
  channelName?: string;
  status?: "confirmed" | "pending" | "cancelled" | "completed";
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}
