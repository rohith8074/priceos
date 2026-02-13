export type {
  Listing,
  CalendarDay,
  Reservation,
  CalendarInterval,
  UpdateResult,
  VerificationResult,
  ReservationFilters,
} from "@/types/hostaway";

import type {
  Listing,
  CalendarDay,
  Reservation,
  CalendarInterval,
  UpdateResult,
  VerificationResult,
  ReservationFilters,
} from "@/types/hostaway";

/**
 * PMSClient Interface
 * Abstracts property management system operations
 * Allows switching between mock and real Hostaway API
 */

export interface PMSClient {
  // Read operations (Data Aggregator)
  listListings(): Promise<Listing[]>;
  getListing(id: string | number): Promise<Listing>;
  getCalendar(
    id: string | number,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarDay[]>;
  getReservations(filters?: ReservationFilters): Promise<Reservation[]>;

  // Write operations (Channel Sync)
  updateCalendar(
    id: string | number,
    intervals: CalendarInterval[]
  ): Promise<UpdateResult>;
  verifyCalendar(
    id: string | number,
    dates: string[]
  ): Promise<VerificationResult>;

  getReservation(id: string | number): Promise<Reservation>;

  blockDates(
    id: string | number,
    startDate: string,
    endDate: string,
    reason: "owner_stay" | "maintenance" | "other"
  ): Promise<UpdateResult>;
  unblockDates(
    id: string | number,
    startDate: string,
    endDate: string
  ): Promise<UpdateResult>;

  updateListing(id: string | number, updates: Partial<Listing>): Promise<Listing>;

  // Utility
  getMode(): "mock" | "live";
}
