import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import {
  listings,
  inventoryMaster,
  activityTimeline,
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
    TRUNCATE TABLE activity_timeline, inventory_master, chat_messages, listings
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
        latitude: prop.latitude != null ? String(prop.latitude) : null,
        longitude: prop.longitude != null ? String(prop.longitude) : null,
        priceFloor,
        priceCeiling,
      })
      .returning({ id: listings.id });

    listingIdMap.set(prop.id, inserted.id);
    console.log(`  Listing: ${prop.name} (${prop.id} → DB ${inserted.id})`);
  }

  // --- 2. Inventory Master (Merged Calendar + Proposals) ---
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
      // Generate some mock proposal data for the next 30 days
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
        minMaxStay: { min: day.minimumStay, max: day.maximumStay },
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

  // --- 3. Activity Timeline (Reservations & Events) ---
  console.log("Inserting activity_timeline (reservations)...");

  const timelineBatch = [];
  for (const res of MOCK_RESERVATIONS) {
    const dbListingId = listingIdMap.get(res.listingMapId) ?? 1;
    timelineBatch.push({
      listingId: dbListingId,
      type: "reservation",
      startDate: res.arrivalDate,
      endDate: res.departureDate,
      title: res.guestName,
      impactScore: null,
      financials: {
        totalPrice: res.totalPrice,
        pricePerNight: res.pricePerNight,
        channelCommission: res.channelCommission ?? 0,
        cleaningFee: res.cleaningFee ?? 0,
        channelName: res.channelName,
        reservationStatus: res.status,
      },
      marketContext: null,
    });
  }

  for (let i = 0; i < timelineBatch.length; i += 50) {
    await db.insert(activityTimeline).values(timelineBatch.slice(i, i + 50));
  }
  console.log(`  ${timelineBatch.length} reservations mapped to activity_timeline`);

  // Adding mock Market Events to Activity Timeline
  const mockEvents = [
    {
      type: "market_event",
      startDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date(today.getTime() + 19 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      title: "Gitex Technology Week",
      impactScore: 40,
      financials: null,
      marketContext: {
        eventType: "event",
        description: "Massive international tech show at DWTC.",
        suggestedPremiumPct: 40,
        competitorMedianRate: 950,
        insightVerdict: "UNDERPRICED",
        source: "https://www.gitex.com",
      }
    },
    {
      type: "market_event",
      startDate: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date(today.getTime() + 48 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      title: "Eid Al Fitr Start",
      impactScore: 25,
      financials: null,
      marketContext: {
        eventType: "holiday",
        description: "Public holiday driving regional tourism.",
        suggestedPremiumPct: 25,
        competitorMedianRate: 750,
        insightVerdict: "FAIR",
        source: "https://local-holidays.ae",
      }
    }
  ];

  for (const ev of mockEvents) {
    await db.insert(activityTimeline).values(ev);
  }
  console.log(`  ${mockEvents.length} market events populated in activity_timeline`);

  console.log("\n✅ DB Seed complete for 3-table Agentic schema!");
}

seed();

