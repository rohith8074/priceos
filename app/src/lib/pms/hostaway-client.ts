import { PMSClient } from "./types";
import {
  Listing,
  CalendarDay,
  Reservation,
  CalendarInterval,
  UpdateResult,
  VerificationResult,
  ReservationFilters,
} from "@/types/hostaway";

/**
 * Hostaway API Wire Types
 * Exact shape of Hostaway API responses before mapping to app types
 */

export interface HostawayListingResponse {
  id: number;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  bedroomsNumber: number;
  bathroomsNumber: number;
  propertyTypeId: number;
  price: number;
  currencyCode: string;
  personCapacity: number;
  listingAmenities: Array<{ name: string }>;
}

export interface HostawayCalendarResponse {
  date: string;
  isAvailable: boolean;
  price: number;
  minimumStay: number;
  maximumStay: number;
}

export interface HostawayReservationResponse {
  id: number;
  listingMapId: number;
  guestName: string;
  guestEmail: string;
  channelName: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  totalPrice: number;
  status: string;
  checkInTime: string;
  checkOutTime: string;
}

/**
 * Mapper: Hostaway API listing → App Listing
 */
export function mapHostawayListing(raw: HostawayListingResponse): Listing {
  return {
    id: raw.id,
    name: raw.name,
    city: raw.city,
    countryCode: raw.countryCode,
    area: "", // PriceOS-specific — must be enriched separately
    bedroomsNumber: raw.bedroomsNumber,
    bathroomsNumber: raw.bathroomsNumber,
    propertyType: mapPropertyTypeId(raw.propertyTypeId),
    propertyTypeId: raw.propertyTypeId,
    price: raw.price,
    currencyCode: raw.currencyCode as "AED" | "USD",
    priceFloor: 0, // PriceOS-specific — must be set by user
    priceCeiling: 0, // PriceOS-specific — must be set by user
    personCapacity: raw.personCapacity,
    amenities: raw.listingAmenities?.map((a) => a.name) ?? [],
  };
}

/**
 * Mapper: Hostaway API calendar day → App CalendarDay
 */
export function mapHostawayCalendarDay(raw: HostawayCalendarResponse): CalendarDay {
  return {
    date: raw.date,
    status: raw.isAvailable ? "available" : "booked",
    price: raw.price,
    minimumStay: raw.minimumStay,
    maximumStay: raw.maximumStay,
  };
}

/**
 * Mapper: Hostaway API reservation → App Reservation
 */
export function mapHostawayReservation(raw: HostawayReservationResponse): Reservation {
  const pricePerNight = raw.nights > 0 ? Math.round(raw.totalPrice / raw.nights) : 0;
  return {
    id: raw.id,
    listingMapId: raw.listingMapId,
    guestName: raw.guestName,
    guestEmail: raw.guestEmail || undefined,
    channelName: mapChannelName(raw.channelName),
    arrivalDate: raw.arrivalDate,
    departureDate: raw.departureDate,
    nights: raw.nights,
    totalPrice: raw.totalPrice,
    pricePerNight,
    status: mapReservationStatus(raw.status),
    createdAt: new Date().toISOString(),
    checkInTime: raw.checkInTime || undefined,
    checkOutTime: raw.checkOutTime || undefined,
  };
}

function mapPropertyTypeId(id: number): Listing["propertyType"] {
  const map: Record<number, Listing["propertyType"]> = {
    1: "Apartment",
    2: "House",
    3: "Villa",
    4: "Studio",
    5: "Townhouse",
  };
  return map[id] ?? "Apartment";
}

function mapChannelName(name: string): Reservation["channelName"] {
  const normalized = name.toLowerCase();
  if (normalized.includes("airbnb")) return "Airbnb";
  if (normalized.includes("booking")) return "Booking.com";
  if (normalized.includes("direct")) return "Direct";
  return "Other";
}

function mapReservationStatus(status: string): Reservation["status"] {
  const normalized = status.toLowerCase();
  if (normalized === "confirmed" || normalized === "new") return "confirmed";
  if (normalized === "pending") return "pending";
  if (normalized === "cancelled" || normalized === "canceled") return "cancelled";
  if (normalized === "completed" || normalized === "checked_out") return "completed";
  return "confirmed";
}

/**
 * HostawayClient
 * Real Hostaway API client (stub for future implementation)
 * Requires:
 * - HOSTAWAY_ACCOUNT_ID env variable
 * - HOSTAWAY_CLIENT_SECRET env variable
 */

export class HostawayClient implements PMSClient {
  private accountId: string;
  private clientSecret: string;
  private baseUrl: string = "https://api.hostaway.com/v1";
  private authToken?: string;

  constructor() {
    this.accountId = process.env.HOSTAWAY_ACCOUNT_ID || "";
    this.clientSecret = process.env.HOSTAWAY_CLIENT_SECRET || "";

    if (!this.accountId || !this.clientSecret) {
      throw new Error(
        "HOSTAWAY_ACCOUNT_ID and HOSTAWAY_CLIENT_SECRET environment variables are required"
      );
    }
  }

  async listListings(): Promise<Listing[]> {
    throw new Error(
      "Live Hostaway API not yet implemented. Set HOSTAWAY_MODE=mock"
    );
  }

  async getListing(id: string | number): Promise<Listing> {
    throw new Error(
      "Live Hostaway API not yet implemented. Set HOSTAWAY_MODE=mock"
    );
  }

  async getCalendar(
    id: string | number,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarDay[]> {
    throw new Error(
      "Live Hostaway API not yet implemented. Set HOSTAWAY_MODE=mock"
    );
  }

  async getReservations(filters?: ReservationFilters): Promise<Reservation[]> {
    throw new Error(
      "Live Hostaway API not yet implemented. Set HOSTAWAY_MODE=mock"
    );
  }

  async getReservation(id: string | number): Promise<Reservation> {
    throw new Error(
      "Live Hostaway API not yet implemented. Set HOSTAWAY_MODE=mock"
    );
  }

  async updateListing(id: string | number, updates: Partial<Listing>): Promise<Listing> {
    throw new Error("Live Hostaway API not yet implemented. Set HOSTAWAY_MODE=mock");
  }

  async blockDates(id: string | number, startDate: string, endDate: string, reason: "owner_stay" | "maintenance" | "other"): Promise<UpdateResult> {
    throw new Error("Live Hostaway API not yet implemented. Set HOSTAWAY_MODE=mock");
  }

  async unblockDates(id: string | number, startDate: string, endDate: string): Promise<UpdateResult> {
    throw new Error("Live Hostaway API not yet implemented. Set HOSTAWAY_MODE=mock");
  }

  async updateCalendar(
    id: string | number,
    intervals: CalendarInterval[]
  ): Promise<UpdateResult> {
    throw new Error(
      "Live Hostaway API not yet implemented. Set HOSTAWAY_MODE=mock"
    );
  }

  async verifyCalendar(
    id: string | number,
    dates: string[]
  ): Promise<VerificationResult> {
    throw new Error(
      "Live Hostaway API not yet implemented. Set HOSTAWAY_MODE=mock"
    );
  }

  getMode(): "mock" | "live" {
    return "live";
  }

  /**
   * Authenticate with Hostaway API (stub)
   */
  private async authenticate(): Promise<void> {
    // TODO: Implement Hostaway OAuth flow
    // See: https://api.hostaway.com/documentation#authentication
  }
}
