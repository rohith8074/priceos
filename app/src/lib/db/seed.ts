import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  properties,
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

  // 1. Insert properties
  console.log("Inserting properties...");
  const insertedProperties: { id: number; originalId: number }[] = [];

  for (const prop of MOCK_PROPERTIES) {
    const [inserted] = await db
      .insert(properties)
      .values({
        name: prop.name,
        area: prop.address.area,
        type: prop.propertyType,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        basePrice: prop.basePrice,
        currency: prop.currency,
        priceFloor: prop.priceFloor,
        priceCeiling: prop.priceCeiling,
        maximumGuests: prop.maximumGuests ?? null,
        amenities: prop.amenities ?? [],
        hostawayListingId: prop.hostawayListingId,
      })
      .returning({ id: properties.id });

    insertedProperties.push({ id: inserted.id, originalId: prop.id });
    console.log(`  Property: ${prop.name} (DB id: ${inserted.id})`);
  }

  // 2. Insert calendar days (90 days per property)
  console.log("Inserting calendar days...");
  const startDate = new Date();
  const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  let totalCalendarDays = 0;

  for (const { id: dbId, originalId } of insertedProperties) {
    const calendar = generateMockCalendar(originalId, startDate, endDate);

    // Insert in batches of 50
    for (let i = 0; i < calendar.length; i += 50) {
      const batch = calendar.slice(i, i + 50);
      await db.insert(calendarDays).values(
        batch.map((day) => ({
          propertyId: dbId,
          date: day.date,
          status: day.status,
          price: day.price,
          minStay: day.minStay,
          maxStay: day.maxStay,
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

  // Map original property IDs to DB IDs
  const idMap = new Map(
    insertedProperties.map(({ id, originalId }) => [originalId, id])
  );

  let totalProposals = 0;
  const allReviewed = [...cycle.approvedProposals, ...cycle.rejectedProposals];

  // Insert in batches
  for (let i = 0; i < allReviewed.length; i += 50) {
    const batch = allReviewed.slice(i, i + 50);
    await db.insert(proposals).values(
      batch.map((reviewed) => ({
        propertyId: idMap.get(reviewed.proposal.propertyId) ?? 1,
        date: reviewed.proposal.date,
        currentPrice: reviewed.proposal.currentPrice,
        proposedPrice: reviewed.proposal.proposedPrice,
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
  console.log(`  Properties: ${insertedProperties.length}`);
  console.log(`  Calendar days: ${totalCalendarDays}`);
  console.log(`  Proposals: ${totalProposals}`);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
