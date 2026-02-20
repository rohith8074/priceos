import { createHostawayClient } from "../hostaway/client";
import { db, listings, inventoryMaster, activityTimeline } from "@/lib/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { addDays, format } from "date-fns";
import type { HostawayListing, HostawayCalendarDay, HostawayReservation } from "../hostaway/types";

const STALE_THRESHOLD_MS = 6 * 60 * 60 * 1000; // 6 hours
const CALENDAR_DAYS = 90; // Sync 90-day window

export interface SyncResult {
  listingId: number;
  listingsSynced: number;
  calendarDaysSynced: number;
  reservationsSynced: number;
  syncedAt: Date;
  errors: string[];
}

/**
 * Data Sync Agent
 * Responsible for syncing HostAway data to database cache
 */
export class DataSyncAgent {
  private hostawayApiKey: string;

  constructor(hostawayApiKey: string) {
    this.hostawayApiKey = hostawayApiKey;
  }

  /**
   * Check if cached data is stale
   */
  async isCacheStale(listingId: number): Promise<boolean> {
    // Without syncedAt on listings, we always consider data potentially stale
    // In production, consider using a separate sync_metadata table
    const listing = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);

    if (!listing.length) {
      return true; // No listing found
    }

    // For now, always return false (data is considered fresh after initial sync)
    // TODO: Implement sync tracking via separate metadata table
    return false;
  }

  /**
   * Sync a single property from HostAway
   */
  async syncProperty(listingId: number): Promise<SyncResult> {
    const client = createHostawayClient(this.hostawayApiKey);
    const errors: string[] = [];
    const syncedAt = new Date();

    try {
      // Get listing from database to find hostawayId
      const [dbListing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, listingId))
        .limit(1);

      if (!dbListing?.hostawayId) {
        throw new Error(`Listing ${listingId} has no hostawayId`);
      }

      const hostawayId = parseInt(dbListing.hostawayId);

      // Fetch listing details
      const hostawayListing = await client.getListing(hostawayId);

      // Update listing in database
      await db
        .update(listings)
        .set({
          name: hostawayListing.name,
          city: hostawayListing.city,
          countryCode: hostawayListing.countryCode,
          bedroomsNumber: hostawayListing.bedroomsNumber,
          bathroomsNumber: hostawayListing.bathroomsNumber,
          price: hostawayListing.price.toString(),
          currencyCode: hostawayListing.currencyCode,
          personCapacity: hostawayListing.personCapacity,
          amenities: hostawayListing.amenities || [],
        })
        .where(eq(listings.id, listingId));

      // Fetch and sync calendar (90-day window)
      const startDate = new Date();
      const endDate = addDays(startDate, CALENDAR_DAYS);

      const calendarData = await client.getCalendar(
        hostawayId,
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd")
      );

      // Delete old calendar data for this range
      await db
        .delete(inventoryMaster)
        .where(
          and(
            eq(inventoryMaster.listingId, listingId),
            gte(inventoryMaster.date, format(startDate, "yyyy-MM-dd")),
            lte(inventoryMaster.date, format(endDate, "yyyy-MM-dd"))
          )
        );

      // Insert new calendar data
      if (calendarData.length > 0) {
        await db.insert(inventoryMaster).values(
          calendarData.map((day) => ({
            listingId,
            date: day.date,
            status: day.status,
            currentPrice: day.price.toString(),
            minMaxStay: { min: day.minimumStay || 1, max: day.maximumStay || 30 },
          }))
        );
      }

      // Fetch and sync reservations (next 90 days)
      const reservationsData = await client.getReservations(
        hostawayId,
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd")
      );

      // Upsert reservations
      for (const reservation of reservationsData) {
        const existing = await db.select().from(activityTimeline).where(and(eq(activityTimeline.title, reservation.guestName), eq(activityTimeline.startDate, reservation.arrivalDate))).limit(1);
        if (existing.length > 0) {
          await db.update(activityTimeline).set({
            endDate: reservation.departureDate,
            financials: { totalPrice: reservation.totalPrice, pricePerNight: reservation.nightlyRate, channelName: reservation.channelName, reservationStatus: this.mapReservationStatus(reservation.status) }
          }).where(eq(activityTimeline.id, existing[0].id));
        } else {
          await db.insert(activityTimeline).values({
            listingId,
            type: 'reservation',
            title: reservation.guestName,
            startDate: reservation.arrivalDate,
            endDate: reservation.departureDate,
            createdAt: syncedAt,
            financials: {
              totalPrice: reservation.totalPrice,
              pricePerNight: reservation.nightlyRate,
              channelName: reservation.channelName,
            }
          });
        }
      }

      return {
        listingId,
        listingsSynced: 1,
        calendarDaysSynced: calendarData.length,
        reservationsSynced: reservationsData.length,
        syncedAt,
        errors,
      };
    } catch (error) {
      errors.push((error as Error).message);
      return {
        listingId,
        listingsSynced: 0,
        calendarDaysSynced: 0,
        reservationsSynced: 0,
        syncedAt,
        errors,
      };
    }
  }

  /**
   * Sync all properties for a user
   */
  async syncAllProperties(): Promise<SyncResult[]> {
    const allListings = await db.select().from(listings);
    const results: SyncResult[] = [];

    // Sync properties in parallel (with rate limiting consideration)
    const syncPromises = allListings.map((listing) =>
      this.syncProperty(listing.id)
    );

    const syncResults = await Promise.allSettled(syncPromises);

    for (const result of syncResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        console.error("Sync failed:", result.reason);
      }
    }

    return results;
  }

  /**
   * Initial import from HostAway (first-time setup)
   */
  async initialImport(): Promise<{ success: boolean; listingsImported: number; error?: string }> {
    try {
      const client = createHostawayClient(this.hostawayApiKey);
      const hostawayListings = await client.getListings();

      let importedCount = 0;

      for (const hostawayListing of hostawayListings) {
        // Check if listing already exists
        const existing = await db
          .select()
          .from(listings)
          .where(eq(listings.hostawayId, hostawayListing.id.toString()))
          .limit(1);

        if (existing.length === 0) {
          // Insert new listing
          const [inserted] = await db
            .insert(listings)
            .values({
              hostawayId: hostawayListing.id.toString(),
              name: hostawayListing.name,
              city: hostawayListing.city,
              countryCode: hostawayListing.countryCode,
              area: hostawayListing.address || "N/A",
              bedroomsNumber: hostawayListing.bedroomsNumber,
              bathroomsNumber: hostawayListing.bathroomsNumber,
              propertyTypeId: hostawayListing.propertyTypeId,
              price: hostawayListing.price.toString(),
              currencyCode: hostawayListing.currencyCode,
              personCapacity: hostawayListing.personCapacity,
              amenities: hostawayListing.amenities || [],
            })
            .returning();

          // Sync calendar and reservations for new listing
          await this.syncProperty(inserted.id);
          importedCount++;
        }
      }

      return {
        success: true,
        listingsImported: importedCount,
      };
    } catch (error) {
      return {
        success: false,
        listingsImported: 0,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Map HostAway reservation status to internal status
   */
  private mapReservationStatus(
    status: string
  ): "confirmed" | "pending" | "cancelled" {
    switch (status) {
      case "new":
      case "modified":
        return "confirmed";
      case "awaiting_payment":
        return "pending";
      case "cancelled":
        return "cancelled";
      default:
        return "confirmed";
    }
  }
}

/**
 * Create a Data Sync Agent instance
 */
export function createDataSyncAgent(hostawayApiKey: string): DataSyncAgent {
  return new DataSyncAgent(hostawayApiKey);
}
