import { db, listings, reservations, calendarDays } from "./db";
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
    propertyType: string;
    price: number;
    currencyCode: string;
    priceFloor: number;
    priceCeiling: number;
    personCapacity?: number;
    amenities?: string[];
  }>,
  syncedAt: Date
) {
  for (const listing of pmsListings) {
    await db
      .insert(listings)
      .values({
        hostawayId: listing.id.toString(), // Store Hostaway ID
        name: listing.name,
        area: listing.area,
        bedroomsNumber: listing.bedroomsNumber,
        bathroomsNumber: listing.bathroomsNumber,
        propertyType: listing.propertyType,
        price: listing.price.toString(),
        currencyCode: listing.currencyCode,
        priceFloor: listing.priceFloor.toString(),
        priceCeiling: listing.priceCeiling.toString(),
        personCapacity: listing.personCapacity,
        amenities: listing.amenities,
        syncedAt,
      })
      .onConflictDoUpdate({
        target: listings.hostawayId, // Match on hostawayId instead of id
        set: {
          name: listing.name,
          area: listing.area,
          bedroomsNumber: listing.bedroomsNumber,
          bathroomsNumber: listing.bathroomsNumber,
          propertyType: listing.propertyType,
          price: listing.price.toString(),
          currencyCode: listing.currencyCode,
          priceFloor: listing.priceFloor.toString(),
          priceCeiling: listing.priceCeiling.toString(),
          personCapacity: listing.personCapacity,
          amenities: listing.amenities,
          syncedAt,
        },
      });
  }
}

/**
 * Sync reservations to database with syncedAt timestamp
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
        id: reservation.id,
        listingMapId: reservation.listingMapId,
        guestName: reservation.guestName,
        guestEmail: reservation.guestEmail,
        channelName: reservation.channelName,
        arrivalDate: reservation.arrivalDate,
        departureDate: reservation.departureDate,
        nights: reservation.nights,
        totalPrice: reservation.totalPrice.toString(),
        pricePerNight: reservation.pricePerNight.toString(),
        status: reservation.status || "confirmed",
        checkInTime: reservation.checkInTime,
        checkOutTime: reservation.checkOutTime,
        syncedAt,
      })
      .onConflictDoUpdate({
        target: reservations.id,
        set: {
          listingMapId: reservation.listingMapId,
          guestName: reservation.guestName,
          guestEmail: reservation.guestEmail,
          channelName: reservation.channelName,
          arrivalDate: reservation.arrivalDate,
          departureDate: reservation.departureDate,
          nights: reservation.nights,
          totalPrice: reservation.totalPrice.toString(),
          pricePerNight: reservation.pricePerNight.toString(),
          status: reservation.status || "confirmed",
          checkInTime: reservation.checkInTime,
          checkOutTime: reservation.checkOutTime,
          syncedAt,
        },
      });
  }
}

/**
 * Sync calendar days for listings
 */
export async function syncCalendarToDb(
  pmsClient: PMSClient,
  listingIds: number[],
  startDate: Date,
  endDate: Date,
  syncedAt: Date,
  hostawayId?: number
) {
  for (const listingId of listingIds) {
    // Use hostawayId for PMS fetch if provided, otherwise use listingId
    const pmsId = hostawayId || listingId;
    const calendarData = await pmsClient.getCalendar(
      pmsId,
      startDate,
      endDate
    );

    for (const day of calendarData) {
      await db
        .insert(calendarDays)
        .values({
          listingId,
          date: day.date,
          status: day.status,
          price: day.price.toString(),
          minimumStay: day.minimumStay,
          maximumStay: day.maximumStay,
          notes: day.notes,
          syncedAt,
        })
        .onConflictDoUpdate({
          target: [calendarDays.listingId, calendarDays.date],
          set: {
            status: day.status,
            price: day.price.toString(),
            minimumStay: day.minimumStay,
            maximumStay: day.maximumStay,
            notes: day.notes,
            syncedAt,
          },
        });
    }
  }
}
