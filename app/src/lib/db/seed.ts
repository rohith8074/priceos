import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import {
  listings,
  inventoryMaster,
  reservations,
  marketEvents,
} from "./schema";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

// Import mock data
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import { generateMockCalendar } from "@/data/mock-calendar";
import { MOCK_RESERVATIONS } from "@/data/mock-reservations";

async function seed() {
  console.log("Seeding database...\n");

  // Truncate all tables in reverse FK order for idempotent re-runs
  console.log("Truncating tables...");
  await db.execute(sql`
    TRUNCATE TABLE market_events, reservations, inventory_master, chat_messages, listings
    RESTART IDENTITY CASCADE
  `);

  // --- 1. Listings ---
  console.log("Inserting listings...");
  const listingIdMap = new Map<number, number>(); // originalId → dbId

  for (const prop of MOCK_PROPERTIES) {
    const priceFloor = String(Math.round(prop.price * 0.5));
    const priceCeiling = String(Math.round(prop.price * 3.0));

    const [inserted] = await db
      .insert(listings)
      .values({
        name: prop.name,
        city: prop.city,
        countryCode: prop.countryCode,
        area: prop.area,
        bedroomsNumber: prop.bedroomsNumber,
        bathroomsNumber: prop.bathroomsNumber,
        propertyTypeId: prop.propertyTypeId,
        price: String(prop.price),
        currencyCode: prop.currencyCode,
        personCapacity: prop.personCapacity ?? null,
        amenities: prop.amenities ?? [],
        address: prop.address ?? null,
        priceFloor,
        priceCeiling,
      })
      .returning({ id: listings.id });

    listingIdMap.set(prop.id, inserted.id);
    console.log(`  Listing: ${prop.name} (${prop.id} → DB ${inserted.id})`);
  }

  // --- 2. Inventory Master (Calendar + Proposals) ---
  console.log("Inserting inventory_master (calendar + proposals)...");
  const today = new Date();
  let totalInventoryDays = 0;

  const calendarRanges: Record<number, { startOffset: number; days: number }> = {
    1001: { startOffset: 0, days: 90 },
    1002: { startOffset: 0, days: 120 },
    1003: { startOffset: 0, days: 60 },
    1004: { startOffset: 0, days: 90 },
    1005: { startOffset: 0, days: 75 },
    1006: { startOffset: 5, days: 45 },
    1007: { startOffset: 0, days: 90 },
    1008: { startOffset: 0, days: 60 },
    1009: { startOffset: 3, days: 80 },
    1010: { startOffset: 0, days: 120 },
    1011: { startOffset: 0, days: 90 },
    1012: { startOffset: 7, days: 30 },
    1013: { startOffset: 0, days: 75 },
    1014: { startOffset: 0, days: 90 },
    1015: { startOffset: 0, days: 60 },
  };

  for (const [originalId, dbId] of listingIdMap) {
    const range = calendarRanges[originalId] || { startOffset: 0, days: 90 };
    const startDate = new Date(today.getTime() + range.startOffset * 24 * 60 * 60 * 1000);
    const endDate = new Date(today.getTime() + (range.startOffset + range.days) * 24 * 60 * 60 * 1000);

    const prop = MOCK_PROPERTIES.find((p) => p.id === originalId)!;
    const priceFloor = Math.round(prop.price * 0.5);
    const priceCeiling = Math.round(prop.price * 3.0);

    const calendar = generateMockCalendar(originalId, startDate, endDate);

    const inventoryBatch = calendar.map((day, i) => {
      const isNearFuture = i < 30;
      let proposedPrice = null;
      let changePct = null;
      let proposalStatus = null;
      let reasoning = null;

      if (isNearFuture && day.status === "available") {
        const seedVal = (originalId * 100 + i) % 100;
        changePct = seedVal < 30 ? 5 : seedVal < 60 ? 10 : seedVal < 80 ? 15 : -5;
        const proposedRaw = Math.round(prop.price * (1 + changePct / 100));
        proposedPrice = String(Math.max(priceFloor, Math.min(priceCeiling, proposedRaw)));
        proposalStatus = seedVal < 70 ? "pending" : seedVal < 85 ? "approved" : "rejected";
        reasoning = `Base price adjustment: ${changePct > 0 ? "+" : ""}${changePct}% based on demand signals.`;
      }

      return {
        listingId: dbId,
        date: day.date,
        status: day.status,
        currentPrice: String(day.price),
        minStay: day.minimumStay || 1,
        maxStay: day.maximumStay || 30,
        proposedPrice,
        changePct,
        proposalStatus,
        reasoning,
      };
    });

    for (let i = 0; i < inventoryBatch.length; i += 50) {
      await db.insert(inventoryMaster).values(inventoryBatch.slice(i, i + 50));
    }
    totalInventoryDays += inventoryBatch.length;
  }
  console.log(`  Total: ${totalInventoryDays} inventory_master rows`);

  // --- 3. Reservations (dedicated table, no JSON) ---
  console.log("Inserting reservations...");

  const reservationBatch = [];
  for (const res of MOCK_RESERVATIONS) {
    const dbListingId = listingIdMap.get(res.listingMapId) ?? 1;
    reservationBatch.push({
      listingId: dbListingId,
      startDate: res.arrivalDate,
      endDate: res.departureDate,
      guestName: res.guestName,
      guestEmail: null as string | null,
      channelName: res.channelName,
      reservationStatus: res.status || "confirmed",
      totalPrice: String(res.totalPrice),
      pricePerNight: String(res.pricePerNight),
      channelCommission: String(res.channelCommission ?? 0),
      cleaningFee: String(res.cleaningFee ?? 0),
    });
  }

  for (let i = 0; i < reservationBatch.length; i += 50) {
    await db.insert(reservations).values(reservationBatch.slice(i, i + 50));
  }
  console.log(`  ${reservationBatch.length} reservations inserted`);

  // --- 4. Market Events (dedicated table, no JSON for core fields) ---
  console.log("Inserting market_events...");
  const mockMarketEvents = [
    {
      title: "Gitex Technology Week",
      startDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date(today.getTime() + 19 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      eventType: "event",
      location: "Dubai",
      expectedImpact: "high",
      confidence: 90,
      description: "Massive international tech show at DWTC.",
      source: "https://www.gitex.com",
      suggestedPremium: "40",
      competitorMedian: "950",
      metadata: {
        insightVerdict: "UNDERPRICED",
      },
    },
    {
      title: "Eid Al Fitr Start",
      startDate: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date(today.getTime() + 48 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      eventType: "holiday",
      location: "Dubai",
      expectedImpact: "medium",
      confidence: 85,
      description: "Public holiday driving regional tourism.",
      source: "https://local-holidays.ae",
      suggestedPremium: "25",
      competitorMedian: "750",
      metadata: {
        insightVerdict: "FAIR",
      },
    },
  ];

  for (const ev of mockMarketEvents) {
    await db.insert(marketEvents).values(ev);
  }
  console.log(`  ${mockMarketEvents.length} market events inserted`);

  console.log("\n✅ DB Seed complete for new 6-table relational schema!");
}

seed();
