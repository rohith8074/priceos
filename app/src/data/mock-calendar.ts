import { CalendarDay } from "@/types/hostaway";
import {
  eachDayOfInterval,
  getDay,
} from "date-fns";

/**
 * Mock Calendar Data Generation
 * Generates 90 days of realistic Dubai calendar data with:
 * - ~65% occupancy across portfolio
 * - Seasonal pricing (20% variation)
 * - Day-of-week premium (Thu-Fri)
 * - Owner blocks scattered throughout
 */

interface DubaiSeasonConfig {
  startMonth: number;
  endMonth: number;
  multiplier: number;
  name: string;
}

// Dubai tourism seasons
const DUBAI_SEASONS: DubaiSeasonConfig[] = [
  { startMonth: 0, endMonth: 3, multiplier: 1.2, name: "High (Winter)" }, // Jan-Apr
  { startMonth: 4, endMonth: 5, multiplier: 1.0, name: "Shoulder" }, // May-Jun
  { startMonth: 6, endMonth: 9, multiplier: 0.85, name: "Low (Summer)" }, // Jul-Oct
  { startMonth: 10, endMonth: 11, multiplier: 1.15, name: "High (Festive)" }, // Nov-Dec
];

function isHighSeason(date: Date): boolean {
  const month = date.getMonth();
  const season = DUBAI_SEASONS.find(
    (s) => month >= s.startMonth && month <= s.endMonth
  );
  return season ? season.multiplier >= 1.15 : false;
}

function getSeasonMultiplier(date: Date): number {
  const month = date.getMonth();
  const season = DUBAI_SEASONS.find(
    (s) => month >= s.startMonth && month <= s.endMonth
  );
  return season?.multiplier ?? 1.0;
}

function getDayOfWeekMultiplier(date: Date): number {
  const dayOfWeek = getDay(date);
  // Thu (4) and Fri (5) are weekend in Dubai - premium rates
  return dayOfWeek === 4 || dayOfWeek === 5 ? 1.15 : 1.0;
}

function shouldBeBooked(seed: number): boolean {
  // Use seeded random to get ~65% occupancy across portfolio
  // This is deterministic based on date + property combo
  return seed % 100 < 65;
}

function shouldBeBlocked(seed: number): boolean {
  // Owner blocks: ~2% of days
  return seed % 100 >= 97;
}

export function generateMockCalendar(
  listingId: number,
  startDate: Date,
  endDate: Date,
  propertyInfo?: { price: number; priceFloor: number; priceCeiling: number }
): CalendarDay[] {
  const basePrice = propertyInfo?.price ?? 500;
  const floor = propertyInfo?.priceFloor ?? Math.round(basePrice * 0.5);
  const ceiling = propertyInfo?.priceCeiling ?? Math.round(basePrice * 2);

  const calendar: CalendarDay[] = [];
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  days.forEach((date, index) => {
    // Seeded randomness per property per day
    const seed = (listingId * 1000 + index) % 100;

    const seasonMultiplier = getSeasonMultiplier(date);
    const dayOfWeekMultiplier = getDayOfWeekMultiplier(date);
    const randomVariation = 0.95 + (seed % 10) / 100; // ±5% variation

    let status: "available" | "booked" | "blocked" = "available";
    let price = basePrice;

    if (shouldBeBlocked(seed)) {
      status = "blocked";
      price = 0;
    } else if (shouldBeBooked(seed)) {
      status = "booked";
      price = Math.round(
        basePrice * seasonMultiplier * dayOfWeekMultiplier * randomVariation
      );
    } else {
      price = Math.round(
        basePrice * seasonMultiplier * dayOfWeekMultiplier * randomVariation
      );
    }

    // Clamp to floor/ceiling
    price = Math.max(floor, Math.min(ceiling, price));

    calendar.push({
      date: date.toISOString().split("T")[0],
      status,
      price,
      minimumStay: status === "available" ? 1 : 0,
      maximumStay: status === "available" ? 30 : 0,
    });
  });

  return calendar;
}

export function generateMockCalendarForMultipleProperties(
  listings: { id: number; price: number; priceFloor: number; priceCeiling: number }[],
  startDate: Date,
  endDate: Date
): Map<number, CalendarDay[]> {
  const result = new Map<number, CalendarDay[]>();

  listings.forEach((listing) => {
    result.set(
      listing.id,
      generateMockCalendar(listing.id, startDate, endDate, {
        price: listing.price,
        priceFloor: listing.priceFloor,
        priceCeiling: listing.priceCeiling,
      })
    );
  });

  return result;
}

/**
 * Calculate occupancy rate for a property's calendar
 */
export function calculateOccupancyRate(calendar: CalendarDay[]): number {
  const bookedDays = calendar.filter((day) => day.status === "booked").length;
  const totalDays = calendar.length;
  return totalDays > 0 ? (bookedDays / totalDays) * 100 : 0;
}

/**
 * Calculate average price for available days
 */
export function calculateAveragePrice(calendar: CalendarDay[]): number {
  const availableDays = calendar.filter((day) => day.status === "available");
  if (availableDays.length === 0) return 0;

  const sum = availableDays.reduce((acc, day) => acc + day.price, 0);
  return Math.round(sum / availableDays.length);
}
