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
  for (const listing of pmsListings) {
    await db
      .insert(listings)
      .values({
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
      })
      .onConflictDoUpdate({
        target: listings.hostawayId,
        set: {
          name: listing.name,
          area: listing.area,
          bedroomsNumber: listing.bedroomsNumber,
          bathroomsNumber: listing.bathroomsNumber,
          propertyTypeId: listing.propertyTypeId,
          price: listing.price.toString(),
          currencyCode: listing.currencyCode,
          personCapacity: listing.personCapacity,
          amenities: listing.amenities,
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
  for (const reservation of pmsReservations) {
    await db
      .insert(reservations)
      .values({
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
      })
      .onConflictDoUpdate({
        target: reservations.id,
        set: {
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

    for (const day of calendarData) {
      await db
        .insert(inventoryMaster)
        .values({
          listingId,
          date: day.date,
          status: day.status,
          currentPrice: day.price.toString(),
          minStay: day.minimumStay || 1,
          maxStay: day.maximumStay || 30,
        })
        .onConflictDoUpdate({
          target: [inventoryMaster.listingId, inventoryMaster.date],
          set: {
            status: day.status,
            currentPrice: day.price.toString(),
            minStay: day.minimumStay || 1,
            maxStay: day.maximumStay || 30,
          },
        });
    }
  }
}
