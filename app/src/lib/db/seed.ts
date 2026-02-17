import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import {
  listings,
  calendarDays,
  reservations,
  proposals,
  eventSignals,
} from "./schema";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

// Import mock data
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import { generateMockCalendar } from "@/data/mock-calendar";
import { MOCK_RESERVATIONS } from "@/data/mock-reservations";
import { MOCK_SEASONAL_RULES } from "@/data/mock-seasonal-rules";
import {
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  MOCK_MESSAGE_TEMPLATES,
} from "@/data/mock-conversations";
import { MOCK_TASKS } from "@/data/mock-tasks";
import { MOCK_EXPENSES, MOCK_OWNER_STATEMENTS } from "@/data/mock-expenses";

async function seed() {
  console.log("Seeding database...\n");

  // Truncate all tables in reverse FK order for idempotent re-runs
  console.log("Truncating tables...");
  await db.execute(sql`
    TRUNCATE TABLE owner_statements, expenses, tasks, conversation_messages,
      conversations, message_templates, seasonal_rules, executions, proposals,
      calendar_days, reservations, chat_messages, listings
    RESTART IDENTITY CASCADE
  `);

  // --- 1. Listings ---
  console.log("Inserting listings...");
  const listingIdMap = new Map<number, number>(); // originalId → dbId

  for (const prop of MOCK_PROPERTIES) {
    const [inserted] = await db
      .insert(listings)
      .values({
        name: prop.name,
        city: prop.city,
        countryCode: prop.countryCode,
        area: prop.area,
        bedroomsNumber: prop.bedroomsNumber,
        bathroomsNumber: prop.bathroomsNumber,
        propertyType: prop.propertyType,
        price: String(prop.price),
        currencyCode: prop.currencyCode,
        priceFloor: String(prop.priceFloor),
        priceCeiling: String(prop.priceCeiling),
        personCapacity: prop.personCapacity ?? null,
        amenities: prop.amenities ?? [],
      })
      .returning({ id: listings.id });

    listingIdMap.set(prop.id, inserted.id);
    console.log(`  Listing: ${prop.name} (${prop.id} → DB ${inserted.id})`);
  }

  // --- 2. Calendar Days (90 days per listing) ---
  console.log("Inserting calendar days...");
  const startDate = new Date();
  const endDate90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  let totalCalendarDays = 0;

  for (const [originalId, dbId] of listingIdMap) {
    const calendar = generateMockCalendar(originalId, startDate, endDate90);
    for (let i = 0; i < calendar.length; i += 50) {
      const batch = calendar.slice(i, i + 50);
      await db.insert(calendarDays).values(
        batch.map((day) => ({
          listingId: dbId,
          date: day.date,
          status: day.status,
          price: String(day.price),
          minimumStay: day.minimumStay,
          maximumStay: day.maximumStay,
        }))
      );
    }
    totalCalendarDays += calendar.length;
  }
  console.log(`  ${totalCalendarDays} calendar days`);

  // --- 3. Reservations ---
  console.log("Inserting reservations...");
  const reservationIdMap = new Map<number, number>(); // originalId → dbId

  for (const res of MOCK_RESERVATIONS) {
    const dbListingId = listingIdMap.get(res.listingMapId) ?? 1;
    const [inserted] = await db
      .insert(reservations)
      .values({
        listingMapId: dbListingId,
        guestName: res.guestName,
        guestEmail: res.guestEmail,
        channelName: res.channelName,
        arrivalDate: res.arrivalDate,
        departureDate: res.departureDate,
        nights: res.nights,
        totalPrice: String(res.totalPrice),
        pricePerNight: String(res.pricePerNight),
        status: res.status,
        checkInTime: res.checkInTime,
        checkOutTime: res.checkOutTime,
      })
      .returning({ id: reservations.id });

    reservationIdMap.set(res.id, inserted.id);
  }
  console.log(`  ${MOCK_RESERVATIONS.length} reservations`);

  // --- 4. Proposals (deterministic, no agent dependency) ---
  console.log("Generating proposals...");
  let totalProposals = 0;
  const proposalDates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().split("T")[0];
  });

  for (const [originalId, dbId] of listingIdMap) {
    const prop = MOCK_PROPERTIES.find((p) => p.id === originalId)!;
    const proposalBatch = proposalDates.map((date, i) => {
      const seed = (originalId * 100 + i) % 100;
      const changePct = seed < 30 ? 5 : seed < 60 ? 10 : seed < 80 ? 15 : -5;
      const proposedPrice = Math.round(prop.price * (1 + changePct / 100));
      return {
        listingId: dbId,
        date,
        currentPrice: String(prop.price),
        proposedPrice: String(
          Math.max(prop.priceFloor, Math.min(prop.priceCeiling, proposedPrice))
        ),
        changePct,
        riskLevel: Math.abs(changePct) <= 10 ? "low" : Math.abs(changePct) <= 20 ? "medium" : "high",
        status: seed < 70 ? "pending" : seed < 85 ? "approved" : "rejected",
        reasoning: `Base price adjustment: ${changePct > 0 ? "+" : ""}${changePct}% based on demand signals`,
        signals: {},
      };
    });

    // Proposal seed commented out - schema changed to dateRangeStart/dateRangeEnd
    // Use quick-seed.ts or manually test proposals via agents
    // for (let i = 0; i < proposalBatch.length; i += 50) {
    //   await db.insert(proposals).values(proposalBatch.slice(i, i + 50));
    // }
    // totalProposals += proposalBatch.length;
  }
  console.log(`  ${totalProposals} proposals (commented out - use quick-seed.ts)`);

  // --- Operational tables removed (seasonal rules, conversations, tasks, expenses) ---
  console.log("Operational seeds skipped - features removed in Price Intelligence Layer redesign");
  console.log("Use quick-seed.ts for minimal seeding or test agents directly");

  console.log("\n✅ Seed complete!");
}

seed();
