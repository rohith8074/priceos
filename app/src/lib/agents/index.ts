import { RevenueCycleResult } from "./types";
import { generatePriceProposals, reviewProposals } from "./mock-agents";
import { getEventsInRange, MOCK_EVENTS } from "@/data/mock-events";
import {
  getSignalsInRange,
  MOCK_COMPETITOR_SIGNALS,
} from "@/data/mock-competitors";
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import { generateMockCalendarForMultipleProperties } from "@/data/mock-calendar";
import { MOCK_RESERVATIONS, getReservationsInRange } from "@/data/mock-reservations";

/**
 * Revenue Cycle Orchestration
 * Runs the complete pricing loop:
 * 1. Data Aggregator - Collect calendar, reservations, occupancy
 * 2. Event Intelligence - Get relevant events
 * 3. Competitor Scanner - Get market signals
 * 4. Pricing Optimizer - Generate proposals
 * 5. Adjustment Reviewer - Apply guardrails
 */

export async function runRevenueCycle(
  propertyIds: number[],
  dateRange: {
    start: Date;
    end: Date;
  }
): Promise<RevenueCycleResult> {
  const cycleId = generateCycleId();

  // 1. Data Aggregator - Fetch calendars
  const calendars = generateMockCalendarForMultipleProperties(
    propertyIds,
    dateRange.start,
    dateRange.end
  );

  const reservations = getReservationsInRange(
    dateRange.start,
    dateRange.end,
    MOCK_RESERVATIONS
  );

  // 2. Event Intelligence - Get events in range
  const events = getEventsInRange(dateRange.start, dateRange.end, MOCK_EVENTS);

  // 3. Competitor Scanner - Get signals in range
  const competitorSignals = getSignalsInRange(
    dateRange.start,
    dateRange.end,
    MOCK_COMPETITOR_SIGNALS
  );

  // 4. Pricing Optimizer - Generate proposals
  const optimizerInputs = propertyIds.map((id) => ({
    propertyId: id,
    calendar: calendars.get(id) || [],
    dateRange,
    events,
    competitorSignals: competitorSignals.filter(
      (s) =>
        s.area ===
        MOCK_PROPERTIES.find((p) => p.id === id)?.address.area
    ),
  }));

  const allProposals = generatePriceProposals(optimizerInputs);

  // 5. Adjustment Reviewer - Review and apply guardrails
  const reviewedProposals = reviewProposals(allProposals);

  // Aggregate statistics
  const approvedProposals = reviewedProposals.filter((r) => r.approved);
  const rejectedProposals = reviewedProposals.filter((r) => !r.approved);

  const aggregatedData = calculateAggregatedData(
    calendars,
    propertyIds,
    dateRange
  );

  return {
    cycleId,
    timestamp: new Date().toISOString(),
    properties: propertyIds,
    dateRange: {
      start: dateRange.start.toISOString().split("T")[0],
      end: dateRange.end.toISOString().split("T")[0],
    },
    aggregatedData,
    events,
    competitorSignals,
    allProposals,
    approvedProposals,
    rejectedProposals,
    stats: {
      totalProposals: allProposals.length,
      approvedCount: approvedProposals.length,
      rejectedCount: rejectedProposals.length,
      avgPriceChange: calculateAveragePriceChange(allProposals),
      highRiskCount: allProposals.filter(
        (p) => p.riskLevel === "high"
      ).length,
    },
  };
}

function generateCycleId(): string {
  // Simple ID generation with timestamp and random suffix
  return `CYCLE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function calculateAggregatedData(
  calendars: Map<number, any[]>,
  propertyIds: number[],
  dateRange: { start: Date; end: Date }
) {
  let totalBooked = 0;
  let totalAvailable = 0;

  calendars.forEach((calendar) => {
    totalBooked += calendar.filter(
      (d: any) => d.status === "booked"
    ).length;
    totalAvailable += calendar.filter(
      (d: any) => d.status === "available"
    ).length;
  });

  const totalDays = (calendars.get(propertyIds[0]) || []).length;
  const totalDaysAll = totalDays * propertyIds.length;
  const occupancyRate =
    totalDaysAll > 0 ? (totalBooked / totalDaysAll) * 100 : 0;

  let totalPrice = 0;
  let priceCount = 0;

  calendars.forEach((calendar) => {
    calendar.forEach((day: any) => {
      if (day.status === "available") {
        totalPrice += day.price;
        priceCount++;
      }
    });
  });

  const averagePrice = priceCount > 0 ? Math.round(totalPrice / priceCount) : 0;

  return {
    totalProperties: propertyIds.length,
    bookedDays: totalBooked,
    availableDays: totalAvailable,
    occupancyRate: Math.round(occupancyRate),
    averagePrice,
  };
}

function calculateAveragePriceChange(proposals: any[]): number {
  if (proposals.length === 0) return 0;
  const sum = proposals.reduce((acc, p) => acc + p.changePct, 0);
  return Math.round(sum / proposals.length);
}

/**
 * Run revenue cycle for all properties
 */
export async function runFullRevenueCycle(
  dateRange: {
    start: Date;
    end: Date;
  } = {
    start: new Date(),
    end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  }
): Promise<RevenueCycleResult> {
  const propertyIds = MOCK_PROPERTIES.map((p) => p.id);
  return runRevenueCycle(propertyIds, dateRange);
}

export * from "./types";
