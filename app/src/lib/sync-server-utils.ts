import { db, listings, activityTimeline, inventoryMaster } from "./db";
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
        hostawayId: listing.id.toString(), // Store Hostaway ID
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
        target: listings.hostawayId, // Match on hostawayId instead of id
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
      .insert(activityTimeline)
      .values({
        id: reservation.id,
        listingId: reservation.listingMapId,
        type: 'reservation',
        title: reservation.guestName,
        startDate: reservation.arrivalDate,
        endDate: reservation.departureDate,
        createdAt: syncedAt,
        financials: {
          totalPrice: reservation.totalPrice,
          pricePerNight: reservation.pricePerNight,
          channelName: reservation.channelName,
          reservationStatus: reservation.status || "confirmed"
        }
      })
      .onConflictDoUpdate({
        target: activityTimeline.id,
        set: {
          listingId: reservation.listingMapId,
          type: 'reservation',
          title: reservation.guestName,
          startDate: reservation.arrivalDate,
          endDate: reservation.departureDate,
          createdAt: syncedAt,
          financials: {
            totalPrice: reservation.totalPrice,
            pricePerNight: reservation.pricePerNight,
            channelName: reservation.channelName,
            reservationStatus: reservation.status || "confirmed"
          }
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
        .insert(inventoryMaster)
        .values({
          listingId,
          date: day.date,
          status: day.status,
          currentPrice: day.price.toString(),
          minMaxStay: { min: day.minimumStay, max: day.maximumStay },
        })
        .onConflictDoUpdate({
          target: [inventoryMaster.listingId, inventoryMaster.date],
          set: {
            status: day.status,
            currentPrice: day.price.toString(),
            minMaxStay: { min: day.minimumStay, max: day.maximumStay },
          },
        });
    }
  }
}
