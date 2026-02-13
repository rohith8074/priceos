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
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import { generateMockCalendar } from "@/data/mock-calendar";
import { MOCK_RESERVATIONS, getReservationsInRange, getReservationsForProperty } from "@/data/mock-reservations";
import { format, parseISO } from "date-fns";

/**
 * MockPMSClient
 * In-memory mock implementation of PMSClient
 * Simulates Hostaway API with realistic data
 */

export class MockPMSClient implements PMSClient {
  private calendarOverrides: Map<
    string,
    Map<string, { date: string; price: number }>
  > = new Map();
  private blockOverrides: Map<string, Map<string, { blocked: boolean; reason?: string }>> = new Map();
  private listingOverrides: Map<number, Partial<Listing>> = new Map();

  async listListings(): Promise<Listing[]> {
    // Simulate network delay
    await this.delay(100);
    return MOCK_PROPERTIES.map((p) => {
      const overrides = this.listingOverrides.get(p.id);
      return overrides ? { ...p, ...overrides } : p;
    });
  }

  async getListing(id: string | number): Promise<Listing> {
    await this.delay(50);

    const numId = typeof id === "string" ? parseInt(id) : id;
    const listing = MOCK_PROPERTIES.find((p) => p.id === numId);

    if (!listing) {
      throw new Error(`Listing ${id} not found`);
    }

    const overrides = this.listingOverrides.get(numId);
    return overrides ? { ...listing, ...overrides } : listing;
  }

  async getCalendar(
    id: string | number,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarDay[]> {
    await this.delay(150);

    const numId = typeof id === "string" ? parseInt(id) : id;
    const listing = MOCK_PROPERTIES.find((p) => p.id === numId);

    if (!listing) {
      throw new Error(`Listing ${id} not found`);
    }

    // Generate mock calendar
    let calendar = generateMockCalendar(numId, startDate, endDate);

    // Apply any overrides from updateCalendar calls
    const overrides = this.calendarOverrides.get(String(numId));
    if (overrides) {
      calendar = calendar.map((day) => {
        const override = overrides.get(day.date);
        if (override) {
          return { ...day, price: override.price };
        }
        return day;
      });
    }

    // Apply block overrides
    const blockOvr = this.blockOverrides.get(String(numId));
    if (blockOvr) {
      calendar = calendar.map((day) => {
        const override = blockOvr.get(day.date);
        if (override) {
          if (override.blocked) {
            return { ...day, status: "blocked" as const, price: 0, blockReason: override.reason as CalendarDay["blockReason"] };
          } else {
            return { ...day, status: "available" as const, blockReason: undefined };
          }
        }
        return day;
      });
    }

    return calendar;
  }

  async getReservations(filters?: ReservationFilters): Promise<Reservation[]> {
    await this.delay(200);

    let results = MOCK_RESERVATIONS;

    if (filters?.listingMapId) {
      results = getReservationsForProperty(filters.listingMapId);
    }

    if (filters?.startDate && filters?.endDate) {
      results = getReservationsInRange(filters.startDate, filters.endDate);
    }

    if (filters?.channelName) {
      results = results.filter((r) => r.channelName === filters.channelName);
    }

    if (filters?.status) {
      results = results.filter((r) => r.status === filters.status);
    }

    if (filters?.limit) {
      results = results.slice(0, filters.limit);
    }

    if (filters?.offset) {
      results = results.slice(filters.offset);
    }

    return results;
  }

  async updateListing(id: string | number, updates: Partial<Listing>): Promise<Listing> {
    await this.delay(100);
    const numId = typeof id === "string" ? parseInt(id) : id;
    const listing = MOCK_PROPERTIES.find((p) => p.id === numId);
    if (!listing) throw new Error(`Listing ${id} not found`);
    const existing = this.listingOverrides.get(numId) ?? {};
    this.listingOverrides.set(numId, { ...existing, ...updates });
    return { ...listing, ...existing, ...updates };
  }

  async getReservation(id: string | number): Promise<Reservation> {
    await this.delay(50);
    const numId = typeof id === "string" ? parseInt(id) : id;
    const reservation = MOCK_RESERVATIONS.find((r) => r.id === numId);
    if (!reservation) {
      throw new Error(`Reservation ${id} not found`);
    }
    return reservation;
  }

  async blockDates(
    id: string | number,
    startDate: string,
    endDate: string,
    reason: "owner_stay" | "maintenance" | "other"
  ): Promise<UpdateResult> {
    await this.delay(100);
    const key = String(typeof id === "string" ? parseInt(id) : id);
    if (!this.blockOverrides.has(key)) {
      this.blockOverrides.set(key, new Map());
    }
    const overrides = this.blockOverrides.get(key)!;
    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];
      overrides.set(dateStr, { blocked: true, reason });
      count++;
      current.setDate(current.getDate() + 1);
    }
    return { success: true, updatedCount: count };
  }

  async unblockDates(
    id: string | number,
    startDate: string,
    endDate: string
  ): Promise<UpdateResult> {
    await this.delay(100);
    const key = String(typeof id === "string" ? parseInt(id) : id);
    if (!this.blockOverrides.has(key)) {
      this.blockOverrides.set(key, new Map());
    }
    const overrides = this.blockOverrides.get(key)!;
    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];
      overrides.set(dateStr, { blocked: false });
      count++;
      current.setDate(current.getDate() + 1);
    }
    return { success: true, updatedCount: count };
  }

  async updateCalendar(
    id: string | number,
    intervals: CalendarInterval[]
  ): Promise<UpdateResult> {
    await this.delay(200);

    const numId = typeof id === "string" ? parseInt(id) : id;
    const listing = MOCK_PROPERTIES.find((p) => p.id === numId);

    if (!listing) {
      throw new Error(`Listing ${id} not found`);
    }

    // Initialize overrides for this listing if needed
    const listingKey = String(numId);
    if (!this.calendarOverrides.has(listingKey)) {
      this.calendarOverrides.set(listingKey, new Map());
    }

    const overrides = this.calendarOverrides.get(listingKey)!;
    let updatedCount = 0;

    // Apply each interval
    intervals.forEach((interval) => {
      const startDate = parseISO(interval.startDate);
      const endDate = parseISO(interval.endDate);

      const current = new Date(startDate);
      while (current <= endDate) {
        const dateStr = format(current, "yyyy-MM-dd");
        overrides.set(dateStr, {
          date: dateStr,
          price: interval.price,
        });
        updatedCount++;
        current.setDate(current.getDate() + 1);
      }
    });

    return {
      success: true,
      updatedCount,
    };
  }

  async verifyCalendar(
    id: string | number,
    dates: string[]
  ): Promise<VerificationResult> {
    await this.delay(150);

    const numId = typeof id === "string" ? parseInt(id) : id;
    const overrides = this.calendarOverrides.get(String(numId));

    if (!overrides) {
      // No updates made, so no mismatches
      return {
        matches: true,
        totalDates: dates.length,
        matchedDates: dates.length,
      };
    }

    const mismatches: Array<{
      date: string;
      expected: number;
      actual: number;
    }> = [];

    dates.forEach((date) => {
      const override = overrides.get(date);
      if (!override) {
        mismatches.push({
          date,
          expected: 0,
          actual: 0,
        });
      }
    });

    return {
      matches: mismatches.length === 0,
      totalDates: dates.length,
      matchedDates: dates.length - mismatches.length,
      mismatches: mismatches.length > 0 ? mismatches : undefined,
    };
  }

  getMode(): "mock" | "live" {
    return "mock";
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clear all overrides (useful for testing)
   */
  clearOverrides(): void {
    this.calendarOverrides.clear();
  }

  /**
   * Get current overrides for debugging
   */
  getOverrides(
    id: string | number
  ): Map<string, { date: string; price: number }> | undefined {
    return this.calendarOverrides.get(String(id));
  }
}
