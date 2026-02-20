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
// Operational types removed - PriceOS is now a price intelligence layer
import { db } from "@/lib/db";
import {
  listings,
  inventoryMaster,
  activityTimeline,
  type ListingRow,
  type ActivityTimelineRow,
  type InventoryMasterRow,
} from "@/lib/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { format, eachDayOfInterval, parseISO } from "date-fns";

// --- Row mappers (Drizzle numeric columns return strings) ---

function mapListingRow(row: ListingRow): Listing {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    countryCode: row.countryCode,
    area: row.area,
    bedroomsNumber: row.bedroomsNumber,
    bathroomsNumber: row.bathroomsNumber,
    propertyTypeId: row.propertyTypeId ?? undefined,
    price: parseFloat(row.price),
    priceFloor: parseFloat(row.priceFloor),
    priceCeiling: parseFloat(row.priceCeiling),
    currencyCode: row.currencyCode as "AED" | "USD",
    personCapacity: row.personCapacity ?? undefined,
    amenities: (row.amenities as string[]) ?? [],
  };
}

function mapCalendarDayRow(row: InventoryMasterRow): CalendarDay {
  return {
    date: row.date,
    status: row.status as CalendarDay["status"],
    price: parseFloat(row.currentPrice),
    minimumStay: row.minMaxStay?.min ?? 1,
    maximumStay: row.minMaxStay?.max ?? 30,
  };
}

function mapReservationRow(row: ActivityTimelineRow): Reservation {
  return {
    id: row.id,
    listingMapId: row.listingId!,
    guestName: row.title,
    guestEmail: undefined,
    channelName: (row.financials?.channelName as Reservation["channelName"]) || "Other",
    arrivalDate: row.startDate,
    departureDate: row.endDate,
    nights: Math.floor((new Date(row.endDate).getTime() - new Date(row.startDate).getTime()) / (1000 * 3600 * 24)),
    totalPrice: row.financials?.totalPrice || 0,
    pricePerNight: row.financials?.pricePerNight || 0,
    status: (row.financials?.reservationStatus as Reservation["status"]) || "confirmed",
    createdAt: row.createdAt.toISOString(),
    checkInTime: undefined,
    checkOutTime: undefined,
  };
}

// Mapper functions for deleted operational tables removed

// --- DbPMSClient ---

export class DbPMSClient implements PMSClient {
  // --- Listings ---

  async listListings(): Promise<Listing[]> {
    const rows = await db.select().from(listings);
    return rows.map(mapListingRow);
  }

  async getListing(id: string | number): Promise<Listing> {
    const numId = typeof id === "string" ? parseInt(id) : id;
    const rows = await db
      .select()
      .from(listings)
      .where(eq(listings.id, numId));
    if (rows.length === 0) throw new Error(`Listing ${id} not found`);
    return mapListingRow(rows[0]);
  }

  async updateListing(
    id: string | number,
    updates: Partial<Listing>
  ): Promise<Listing> {
    const numId = typeof id === "string" ? parseInt(id) : id;
    const setValues: Record<string, unknown> = {};
    if (updates.name !== undefined) setValues.name = updates.name;
    if (updates.price !== undefined) setValues.price = String(updates.price);
    if (updates.bedroomsNumber !== undefined)
      setValues.bedroomsNumber = updates.bedroomsNumber;
    if (updates.bathroomsNumber !== undefined)
      setValues.bathroomsNumber = updates.bathroomsNumber;
    if (updates.personCapacity !== undefined)
      setValues.personCapacity = updates.personCapacity;
    if (updates.amenities !== undefined) setValues.amenities = updates.amenities;

    if (Object.keys(setValues).length > 0) {
      await db.update(listings).set(setValues).where(eq(listings.id, numId));
    }
    return this.getListing(numId);
  }

  // --- Calendar ---

  async getCalendar(
    id: string | number,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarDay[]> {
    const numId = typeof id === "string" ? parseInt(id) : id;
    const startStr = format(startDate, "yyyy-MM-dd");
    const endStr = format(endDate, "yyyy-MM-dd");

    const rows = await db
      .select()
      .from(inventoryMaster)
      .where(
        and(
          eq(inventoryMaster.listingId, numId),
          gte(inventoryMaster.date, startStr),
          lte(inventoryMaster.date, endStr)
        )
      );
    return rows.map(mapCalendarDayRow);
  }

  async updateCalendar(
    id: string | number,
    intervals: CalendarInterval[]
  ): Promise<UpdateResult> {
    const numId = typeof id === "string" ? parseInt(id) : id;
    let updatedCount = 0;

    for (const interval of intervals) {
      const days = eachDayOfInterval({
        start: parseISO(interval.startDate),
        end: parseISO(interval.endDate),
      });
      for (const day of days) {
        const dateStr = format(day, "yyyy-MM-dd");
        await db
          .update(inventoryMaster)
          .set({ currentPrice: String(interval.price) })
          .where(
            and(
              eq(inventoryMaster.listingId, numId),
              eq(inventoryMaster.date, dateStr)
            )
          );
        updatedCount++;
      }
    }

    return { success: true, updatedCount };
  }

  async verifyCalendar(
    id: string | number,
    dates: string[]
  ): Promise<VerificationResult> {
    // Simplified: check that all dates exist in the calendar
    const numId = typeof id === "string" ? parseInt(id) : id;
    let matchedDates = 0;
    for (const dateStr of dates) {
      const rows = await db
        .select()
        .from(inventoryMaster)
        .where(
          and(
            eq(inventoryMaster.listingId, numId),
            eq(inventoryMaster.date, dateStr)
          )
        );
      if (rows.length > 0) matchedDates++;
    }
    return {
      matches: matchedDates === dates.length,
      totalDates: dates.length,
      matchedDates,
    };
  }

  async blockDates(
    id: string | number,
    startDate: string,
    endDate: string,
    reason: "owner_stay" | "maintenance" | "other"
  ): Promise<UpdateResult> {
    const numId = typeof id === "string" ? parseInt(id) : id;
    const days = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(endDate),
    });
    let updatedCount = 0;
    for (const day of days) {
      const dateStr = format(day, "yyyy-MM-dd");
      await db
        .update(inventoryMaster)
        .set({ status: "blocked", currentPrice: "0" })
        .where(
          and(
            eq(inventoryMaster.listingId, numId),
            eq(inventoryMaster.date, dateStr)
          )
        );
      updatedCount++;
    }
    return { success: true, updatedCount };
  }

  async unblockDates(
    id: string | number,
    startDate: string,
    endDate: string
  ): Promise<UpdateResult> {
    const numId = typeof id === "string" ? parseInt(id) : id;
    const days = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(endDate),
    });
    let updatedCount = 0;
    for (const day of days) {
      const dateStr = format(day, "yyyy-MM-dd");
      await db
        .update(inventoryMaster)
        .set({ status: "available" })
        .where(
          and(
            eq(inventoryMaster.listingId, numId),
            eq(inventoryMaster.date, dateStr)
          )
        );
      updatedCount++;
    }
    return { success: true, updatedCount };
  }
  // --- Reservations ---

  async getReservations(filters?: ReservationFilters): Promise<Reservation[]> {
    const conditions = [eq(activityTimeline.type, "reservation")];

    if (filters?.listingMapId) {
      conditions.push(eq(activityTimeline.listingId, filters.listingMapId));
    }
    if (filters?.startDate) {
      conditions.push(
        gte(activityTimeline.startDate, format(filters.startDate, "yyyy-MM-dd"))
      );
    }
    if (filters?.endDate) {
      conditions.push(
        lte(
          activityTimeline.endDate,
          format(filters.endDate, "yyyy-MM-dd")
        )
      );
    }

    let query = db.select().from(activityTimeline);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const rows = await query;
    let result = rows.map(mapReservationRow);

    if (filters?.channelName) {
      result = result.filter(r => r.channelName === filters.channelName);
    }
    if (filters?.status) {
      result = result.filter(r => r.status === filters.status);
    }

    if (filters?.offset) result = result.slice(filters.offset);
    if (filters?.limit) result = result.slice(0, filters.limit);

    return result;
  }

  async getReservation(id: string | number): Promise<Reservation> {
    const numId = typeof id === "string" ? parseInt(id) : id;
    const rows = await db
      .select()
      .from(activityTimeline)
      .where(
        and(
          eq(activityTimeline.id, numId),
          eq(activityTimeline.type, "reservation")
        )
      );
    if (rows.length === 0) throw new Error(`Reservation ${id} not found`);
    return mapReservationRow(rows[0]);
  }

  async createReservation(
    reservation: Omit<Reservation, "id" | "createdAt" | "pricePerNight">
  ): Promise<Reservation> {
    const pricePerNight =
      reservation.nights > 0
        ? Math.round(reservation.totalPrice / reservation.nights)
        : 0;

    const [inserted] = await db
      .insert(activityTimeline)
      .values({
        listingId: reservation.listingMapId,
        type: "reservation",
        startDate: reservation.arrivalDate,
        endDate: reservation.departureDate,
        title: reservation.guestName,
        financials: {
          totalPrice: reservation.totalPrice,
          pricePerNight: pricePerNight,
          channelCommission: reservation.channelCommission || 0,
          cleaningFee: reservation.cleaningFee || 0,
          channelName: reservation.channelName,
          reservationStatus: reservation.status,
        },
      })
      .returning();
    return mapReservationRow(inserted);
  }

  // Operational methods removed - PriceOS is now a price intelligence layer
  // Methods for seasonal rules, conversations, tasks, expenses, and owner statements
  // have been deprecated as part of the architectural redesign

  // --- Utility ---

  getMode(): "mock" | "live" {
    return "mock"; // DB-backed but still "mock" data
  }
}
