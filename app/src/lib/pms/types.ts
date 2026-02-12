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

  // Utility
  getMode(): "mock" | "live";
}
