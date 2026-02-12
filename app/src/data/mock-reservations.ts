import { Reservation } from "@/types/hostaway";
import { addDays, format } from "date-fns";

/**
 * Mock Reservations Data
 * ~20 bookings across 5 properties over next 90 days
 * Distribution: Airbnb 50%, Booking.com 30%, Direct 20%
 */

const GUEST_NAMES = [
  "John Smith",
  "Sarah Johnson",
  "Michael Brown",
  "Emma Wilson",
  "David Lee",
  "Lisa Anderson",
  "James Taylor",
  "Maria Garcia",
  "Robert Martin",
  "Jessica White",
  "Christopher Davis",
  "Michelle Rodriguez",
  "Daniel Miller",
  "Nancy Martinez",
  "Matthew Jones",
];

const CHANNELS = ["Airbnb", "Booking.com", "Direct", "Airbnb", "Airbnb"] as const;

function getRandomGuest(seed: number): string {
  return GUEST_NAMES[seed % GUEST_NAMES.length];
}

function getRandomChannel(seed: number): typeof CHANNELS[number] {
  const rand = seed % 10;
  if (rand < 5) return "Airbnb";
  if (rand < 8) return "Booking.com";
  return "Direct";
}

function getRandomNightsCount(seed: number): number {
  const rand = seed % 100;
  if (rand < 30) return 2;
  if (rand < 60) return 3;
  if (rand < 80) return 4;
  if (rand < 95) return 5;
  return 7;
}

export function generateMockReservations(): Reservation[] {
  const today = new Date();
  const reservations: Reservation[] = [];
  let reservationId = 1;

  // Generate ~20 bookings across properties and dates
  const propertyIds = [1001, 1002, 1003, 1004, 1005];
  const basePrices: Record<number, number> = {
    1001: 550,
    1002: 850,
    1003: 400,
    1004: 2000,
    1005: 500,
  };

  // Distribute bookings across 90 days
  const totalBookings = 20;
  for (let i = 0; i < totalBookings; i++) {
    const seed = i * 7 + 42; // Deterministic seed
    const propertyId = propertyIds[i % propertyIds.length];
    const basePrice = basePrices[propertyId];

    // Spread bookings across next 90 days
    const leadDays = 5 + (seed % 50); // 5-55 day lead time
    const arrivalDate = addDays(today, leadDays);

    const nightsCount = getRandomNightsCount(seed);
    const departureDate = addDays(arrivalDate, nightsCount);

    const pricePerNight = Math.round(basePrice * (0.9 + Math.random() * 0.2));
    const totalPrice = pricePerNight * nightsCount;

    reservations.push({
      id: reservationId++,
      hostawayReservationId: `RES-${Date.now()}-${i}`,
      listingId: propertyId,
      guestName: getRandomGuest(seed),
      guestEmail: `guest${i}@example.com`,
      channelName: getRandomChannel(seed),
      arrivalDate: format(arrivalDate, "yyyy-MM-dd"),
      departureDate: format(departureDate, "yyyy-MM-dd"),
      nightsCount,
      totalPrice,
      pricePerNight,
      status: seed % 100 < 95 ? "confirmed" : "pending",
      createdAt: new Date().toISOString(),
      checkInTime: "15:00",
      checkOutTime: "11:00",
    });
  }

  // Sort by arrival date
  return reservations.sort(
    (a, b) =>
      new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime()
  );
}

export const MOCK_RESERVATIONS = generateMockReservations();

/**
 * Get reservations for a specific property
 */
export function getReservationsForProperty(
  listingId: number,
  reservations = MOCK_RESERVATIONS
): Reservation[] {
  return reservations.filter((r) => r.listingId === listingId);
}

/**
 * Get reservations within date range
 */
export function getReservationsInRange(
  startDate: Date,
  endDate: Date,
  reservations = MOCK_RESERVATIONS
): Reservation[] {
  return reservations.filter((r) => {
    const arrival = new Date(r.arrivalDate);
    const departure = new Date(r.departureDate);
    return arrival <= endDate && departure >= startDate;
  });
}
