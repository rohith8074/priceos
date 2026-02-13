import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  listings,
  calendarDays,
  proposals,
} from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Import mock data generators
import { MOCK_PROPERTIES } from "@/data/mock-properties";
import { generateMockCalendar } from "@/data/mock-calendar";
import { runFullRevenueCycle } from "@/lib/agents/index";

async function seed() {
  console.log("Seeding database...");

  // 1. Insert listings
  console.log("Inserting listings...");
  const insertedListings: { id: number; originalId: number }[] = [];

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

    insertedListings.push({ id: inserted.id, originalId: prop.id });
    console.log(`  Listing: ${prop.name} (DB id: ${inserted.id})`);
  }

  // 2. Insert calendar days (90 days per listing)
  console.log("Inserting calendar days...");
  const startDate = new Date();
  const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  let totalCalendarDays = 0;

  for (const { id: dbId, originalId } of insertedListings) {
    const calendar = generateMockCalendar(originalId, startDate, endDate);

    // Insert in batches of 50
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
  console.log(`  Inserted ${totalCalendarDays} calendar days`);

  // 3. Run revenue cycle to generate proposals
  console.log("Generating proposals via revenue cycle...");
  const cycle = await runFullRevenueCycle({
    start: startDate,
    end: endDate,
  });

  // Map original listing IDs to DB IDs
  const idMap = new Map(
    insertedListings.map(({ id, originalId }) => [originalId, id])
  );

  let totalProposals = 0;
  const allReviewed = [...cycle.approvedProposals, ...cycle.rejectedProposals];

  // Insert in batches
  for (let i = 0; i < allReviewed.length; i += 50) {
    const batch = allReviewed.slice(i, i + 50);
    await db.insert(proposals).values(
      batch.map((reviewed) => ({
        listingId: idMap.get(reviewed.proposal.listingMapId) ?? 1,
        date: reviewed.proposal.date,
        currentPrice: String(reviewed.proposal.currentPrice),
        proposedPrice: String(reviewed.proposal.proposedPrice),
        changePct: reviewed.proposal.changePct,
        riskLevel: reviewed.proposal.riskLevel,
        status: reviewed.approved ? "pending" : "rejected",
        reasoning: reviewed.proposal.reasoning,
        signals: reviewed.proposal.signals as Record<string, unknown>,
      }))
    );
    totalProposals += batch.length;
  }

  console.log(`  Inserted ${totalProposals} proposals`);
  console.log("\nSeed complete!");
  console.log(`  Listings: ${insertedListings.length}`);
  console.log(`  Calendar days: ${totalCalendarDays}`);
  console.log(`  Proposals: ${totalProposals}`);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
