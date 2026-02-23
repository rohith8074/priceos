import { sql } from "drizzle-orm";
import { db, listings, reservations, inventoryMaster } from "./db";
import type { PMSClient } from "./pms/types";

/**
 * Get the maximum syncedAt timestamp from a list of records
 */
export function getMaxSyncedAt(
  records: Array<{ syncedAt: Date | null }>
): Date | null {
  const timestamps = records
    .map((r) => r.syncedAt)
    .filter((t): t is Date => t !== null);

  if (timestamps.length === 0) return null;

  return new Date(Math.max(...timestamps.map((t) => t.getTime())));
}

/**
 * Sync listings to database with syncedAt timestamp
 */
export async function syncListingsToDb(
  pmsListings: Array<{
    id: number;
    name: string;
    area: string;
    bedroomsNumber: number;
    bathroomsNumber: number;
    propertyTypeId: number;
    price: number;
    currencyCode: string;
    personCapacity?: number;
    amenities?: string[];
  }>
) {
  if (pmsListings.length === 0) return;

  const chunks = [];
  for (let i = 0; i < pmsListings.length; i += 100) {
    chunks.push(pmsListings.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    await db
      .insert(listings)
      .values(chunk.map(listing => ({
        hostawayId: listing.id.toString(),
        name: listing.name,
        area: listing.area,
        bedroomsNumber: listing.bedroomsNumber,
        bathroomsNumber: listing.bathroomsNumber,
        propertyTypeId: listing.propertyTypeId,
        price: listing.price.toString(),
        currencyCode: listing.currencyCode,
        personCapacity: listing.personCapacity,
        amenities: listing.amenities,
      })))
      .onConflictDoUpdate({
        target: listings.hostawayId,
        set: {
          name: sql`EXCLUDED.name`,
          area: sql`EXCLUDED.area`,
          bedroomsNumber: sql`EXCLUDED.bedrooms_number`,
          bathroomsNumber: sql`EXCLUDED.bathrooms_number`,
          propertyTypeId: sql`EXCLUDED.property_type_id`,
          price: sql`EXCLUDED.price`,
          currencyCode: sql`EXCLUDED.currency_code`,
          personCapacity: sql`EXCLUDED.person_capacity`,
          amenities: sql`EXCLUDED.amenities`,
        },
      });
  }
}

/**
 * Sync reservations to database — uses `reservations` table with direct columns
 */
export async function syncReservationsToDb(
  pmsReservations: Array<{
    id: number;
    listingMapId: number;
    guestName: string;
    guestEmail?: string;
    channelName: string;
    arrivalDate: string;
    departureDate: string;
    nights: number;
    totalPrice: number;
    pricePerNight: number;
    status?: string;
    checkInTime?: string;
    checkOutTime?: string;
  }>,
  syncedAt: Date
) {
  if (pmsReservations.length === 0) return;

  const chunks = [];
  for (let i = 0; i < pmsReservations.length; i += 100) {
    chunks.push(pmsReservations.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    await db
      .insert(reservations)
      .values(chunk.map(reservation => ({
        hostawayReservationId: reservation.id.toString(),
        listingId: reservation.listingMapId,
        guestName: reservation.guestName,
        guestEmail: reservation.guestEmail || null,
        startDate: reservation.arrivalDate,
        endDate: reservation.departureDate,
        channelName: reservation.channelName,
        reservationStatus: reservation.status || "confirmed",
        totalPrice: String(reservation.totalPrice),
        pricePerNight: String(reservation.pricePerNight),
        createdAt: syncedAt,
      })))
      .onConflictDoUpdate({
        target: reservations.hostawayReservationId,
        set: {
          listingId: sql`EXCLUDED.listing_id`,
          guestName: sql`EXCLUDED.guest_name`,
          guestEmail: sql`EXCLUDED.guest_email`,
          startDate: sql`EXCLUDED.start_date`,
          endDate: sql`EXCLUDED.end_date`,
          channelName: sql`EXCLUDED.channel_name`,
          reservationStatus: sql`EXCLUDED.reservation_status`,
          totalPrice: sql`EXCLUDED.total_price`,
          pricePerNight: sql`EXCLUDED.price_per_night`,
          createdAt: sql`EXCLUDED.created_at`,
        },
      });
  }
}

/**
 * Sync calendar days for listings — uses `min_stay`/`max_stay` integer columns
 */
export async function syncCalendarToDb(
  pmsClient: PMSClient,
  listingIds: number[],
  startDate: Date,
  endDate: Date,
  hostawayId?: number
) {
  for (const listingId of listingIds) {
    const pmsId = hostawayId || listingId;
    const calendarData = await pmsClient.getCalendar(
      pmsId,
      startDate,
      endDate
    );

    if (calendarData.length === 0) continue;

    const chunks = [];
    for (let i = 0; i < calendarData.length; i += 100) {
      chunks.push(calendarData.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      await db
        .insert(inventoryMaster)
        .values(chunk.map(day => ({
          listingId,
          date: day.date,
          status: day.status,
          currentPrice: day.price.toString(),
          minStay: day.minimumStay || 1,
          maxStay: day.maximumStay || 30,
        })))
        .onConflictDoUpdate({
          target: [inventoryMaster.listingId, inventoryMaster.date],
          set: {
            status: sql`EXCLUDED.status`,
            currentPrice: sql`EXCLUDED.current_price`,
            minStay: sql`EXCLUDED.min_stay`,
            maxStay: sql`EXCLUDED.max_stay`,
          },
        });
    }
  }
}
