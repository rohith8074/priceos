/**
 * Integration Examples
 * Shows how to use the mock data store in different scenarios
 */

import { createPMSClient } from "./pms";
import { runFullRevenueCycle, runRevenueCycle } from "./agents";
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import { MOCK_EVENTS, getEventsInRange } from "@/data/mock-events";
import { MOCK_COMPETITOR_SIGNALS } from "@/data/mock-competitors";
import { addDays } from "date-fns";

/**
 * Example 1: Initialize PMS client and list properties
 */
export async function example1_ListProperties() {
  const pmsClient = createPMSClient();
  console.log(`PMS Mode: ${pmsClient.getMode()}`);

  const listings = await pmsClient.listListings();
  console.log(`Total properties: ${listings.length}`);

  listings.forEach((listing) => {
    console.log(`- ${listing.name} (${listing.bedroomsNumber}BR) - AED ${listing.price}/night`);
  });
}

/**
 * Example 2: Get 90-day calendar for a property
 */
export async function example2_GetCalendar() {
  const pmsClient = createPMSClient();

  const startDate = new Date();
  const endDate = addDays(startDate, 90);

  const calendar = await pmsClient.getCalendar(1001, startDate, endDate);

  const booked = calendar.filter((d) => d.status === "booked").length;
  const available = calendar.filter((d) => d.status === "available").length;
  const blocked = calendar.filter((d) => d.status === "blocked").length;

  console.log(`Property 1001 (90 days):`);
  console.log(`- Booked: ${booked} (${Math.round((booked / calendar.length) * 100)}%)`);
  console.log(`- Available: ${available}`);
  console.log(`- Blocked: ${blocked}`);

  const availablePrices = calendar
    .filter((d) => d.status === "available")
    .map((d) => d.price);
  const avgPrice = Math.round(
    availablePrices.reduce((a, b) => a + b, 0) / availablePrices.length
  );
  console.log(`- Average price: AED ${avgPrice}`);
}

/**
 * Example 3: Get reservations and bookings
 */
export async function example3_GetReservations() {
  const pmsClient = createPMSClient();

  // Get all reservations
  const allReservations = await pmsClient.getReservations();
  console.log(`Total reservations: ${allReservations.length}`);

  // By channel
  const airbnb = allReservations.filter((r) => r.channelName === "Airbnb");
  const booking = allReservations.filter((r) => r.channelName === "Booking.com");
  const direct = allReservations.filter((r) => r.channelName === "Direct");

  console.log(`- Airbnb: ${airbnb.length} (${Math.round((airbnb.length / allReservations.length) * 100)}%)`);
  console.log(`- Booking.com: ${booking.length} (${Math.round((booking.length / allReservations.length) * 100)}%)`);
  console.log(`- Direct: ${direct.length} (${Math.round((direct.length / allReservations.length) * 100)}%)`);

  // By property
  MOCK_PROPERTIES.forEach((prop) => {
    const propReservations = allReservations.filter((r) => r.listingMapId === prop.id);
    console.log(
      `- ${prop.name}: ${propReservations.length} bookings`
    );
  });
}

/**
 * Example 4: Analyze 2026 Dubai events
 */
export async function example4_AnalyzeEvents() {
  console.log(`Total 2026 events: ${MOCK_EVENTS.length}`);

  // By impact level
  const extreme = MOCK_EVENTS.filter((e) => e.demandImpact === "extreme");
  const high = MOCK_EVENTS.filter((e) => e.demandImpact === "high");
  const medium = MOCK_EVENTS.filter((e) => e.demandImpact === "medium");

  console.log(`- Extreme impact: ${extreme.length}`);
  extreme.forEach((e) => console.log(`  • ${e.name} (${e.startDate})`));

  console.log(`- High impact: ${high.length}`);
  high.forEach((e) => console.log(`  • ${e.name} (${e.startDate})`));

  console.log(`- Medium impact: ${medium.length}`);

  // Events in Q1 2026
  const q1Events = getEventsInRange(
    new Date(2026, 0, 1),
    new Date(2026, 2, 31)
  );
  console.log(`\nQ1 2026 events: ${q1Events.length}`);
  q1Events.forEach((e) => {
    console.log(`  - ${e.name}: ${e.demandImpact} impact`);
  });
}

/**
 * Example 5: Check market signals
 */
export async function example5_MarketSignals() {
  console.log(`Total competitor signals: ${MOCK_COMPETITOR_SIGNALS.length}`);

  // By signal type
  const compression = MOCK_COMPETITOR_SIGNALS.filter((s) => s.signal === "compression");
  const release = MOCK_COMPETITOR_SIGNALS.filter((s) => s.signal === "release");

  console.log(`- Compression signals: ${compression.length}`);
  console.log(`- Release signals: ${release.length}`);

  // By area
  const areas = [...new Set(MOCK_COMPETITOR_SIGNALS.map((s) => s.area))];
  console.log(`\nSignals by area:`);
  areas.forEach((area) => {
    const signals = MOCK_COMPETITOR_SIGNALS.filter((s) => s.area === area);
    const compressionCount = signals.filter((s) => s.signal === "compression").length;
    console.log(`  - ${area}: ${signals.length} signals (${compressionCount} compression)`);
  });

  // Highest confidence
  const sorted = [...MOCK_COMPETITOR_SIGNALS].sort((a, b) => b.confidence - a.confidence);
  console.log(`\nTop 3 signals by confidence:`);
  sorted.slice(0, 3).forEach((s) => {
    console.log(
      `  - ${s.area}: ${s.signal} (${Math.round(s.confidence * 100)}%) - AED ${s.dataPoints.averagePrice} avg`
    );
  });
}

/**
 * Example 6: Update calendar prices
 */
export async function example6_UpdateCalendar() {
  const pmsClient = createPMSClient();

  // Update prices for first week of March
  const result = await pmsClient.updateCalendar(1001, [
    {
      startDate: "2026-03-01",
      endDate: "2026-03-07",
      price: 650,
    },
  ]);

  console.log(`Update result: ${result.success}`);
  console.log(`Updated ${result.updatedCount} dates`);

  // Verify the update
  const verification = await pmsClient.verifyCalendar(1001, [
    "2026-03-01",
    "2026-03-05",
  ]);

  console.log(`Verification: ${verification.matches ? "✓ Matched" : "✗ Mismatched"}`);
  console.log(`Total dates: ${verification.totalDates}, Matched: ${verification.matchedDates}`);
}

/**
 * Example 7: Run full revenue cycle
 */
export async function example7_RunRevenueCycle() {
  console.log("Running full revenue cycle...\n");

  const result = await runFullRevenueCycle({
    start: new Date(2026, 2, 1), // Mar 1
    end: new Date(2026, 2, 31), // Mar 31
  });

  console.log(`Cycle ID: ${result.cycleId}`);
  console.log(`Properties analyzed: ${result.properties.length}`);
  console.log(`Date range: ${result.dateRange.start} to ${result.dateRange.end}`);

  console.log(`\nAggregated Data:`);
  console.log(`- Occupancy: ${result.aggregatedData.occupancyRate}%`);
  console.log(`- Average price: AED ${result.aggregatedData.averagePrice}`);
  console.log(`- Booked days: ${result.aggregatedData.bookedDays}`);

  console.log(`\nEvents detected: ${result.events.length}`);
  result.events.forEach((e) => {
    console.log(`- ${e.name} (${e.demandImpact} impact)`);
  });

  console.log(`\nMarket signals: ${result.competitorSignals.length}`);
  result.competitorSignals.forEach((s) => {
    console.log(`- ${s.area}: ${s.signal} (${Math.round(s.confidence * 100)}%)`);
  });

  console.log(`\nProposal Stats:`);
  console.log(`- Total: ${result.stats.totalProposals}`);
  console.log(`- Approved: ${result.stats.approvedCount}`);
  console.log(`- Rejected: ${result.stats.rejectedCount}`);
  console.log(`- Avg price change: ${result.stats.avgPriceChange}%`);
  console.log(`- High risk: ${result.stats.highRiskCount}`);

  // Show sample approved proposals
  console.log(`\nSample approved proposals:`);
  result.approvedProposals.slice(0, 3).forEach((p) => {
    console.log(
      `- ${p.proposal.date}: ${p.proposal.currentPrice} → ${p.proposal.proposedPrice} AED (+${p.proposal.changePct}%)`
    );
  });
}

/**
 * Example 8: Analyze specific property
 */
export async function example8_PropertyAnalysis() {
  const pmsClient = createPMSClient();

  const propertyId = 1004; // Palm Villa
  const property = await pmsClient.getListing(propertyId);

  console.log(`\nProperty: ${property.name}`);
  console.log(`Location: ${property.area}, Dubai`);
  console.log(`Type: ${property.bedroomsNumber}BR/${property.bathroomsNumber}BA ${property.propertyType}`);
  console.log(`Base price: AED ${property.price}/night`);
  console.log(`Price range: AED ${property.priceFloor} - AED ${property.priceCeiling}`);

  const startDate = new Date(2026, 2, 1);
  const endDate = addDays(startDate, 90);

  const calendar = await pmsClient.getCalendar(propertyId, startDate, endDate);
  const booked = calendar.filter((d) => d.status === "booked").length;
  const occupancy = Math.round((booked / calendar.length) * 100);

  console.log(`\n90-day projection:`);
  console.log(`- Occupancy: ${occupancy}%`);
  console.log(`- Booked nights: ${booked}`);

  const reservations = await pmsClient.getReservations({ listingMapId: propertyId });
  const revenue = reservations.reduce((sum, r) => sum + r.totalPrice, 0);

  console.log(`- Reservations: ${reservations.length}`);
  console.log(`- Projected revenue: AED ${revenue}`);
  console.log(`- Average per booking: AED ${Math.round(revenue / reservations.length)}`);
}

/**
 * Example 9: Competitor analysis for area
 */
export async function example9_AreaAnalysis() {
  const area = "Dubai Marina";
  const signals = MOCK_COMPETITOR_SIGNALS.filter((s) => s.area === area);

  console.log(`\n${area} market analysis:`);
  console.log(`Total signals: ${signals.length}`);

  signals.forEach((s) => {
    console.log(`\n${s.dateRange.start} to ${s.dateRange.end}:`);
    console.log(`  Signal: ${s.signal}`);
    console.log(`  Confidence: ${Math.round(s.confidence * 100)}%`);
    console.log(`  Avg price: AED ${s.dataPoints.averagePrice}`);
    console.log(`  Price change: ${s.dataPoints.priceChange > 0 ? "+" : ""}${s.dataPoints.priceChange}%`);
    console.log(`  Reason: ${s.reasoning}`);
  });
}
