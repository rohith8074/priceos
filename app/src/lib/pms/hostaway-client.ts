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
