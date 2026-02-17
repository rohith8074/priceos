import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

async function verifySyncData() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log("📊 Verifying synced data...\n");

  const listings = await sql`SELECT COUNT(*), MAX(synced_at) as last_sync FROM listings`;
  console.log("📦 Listings:");
  console.log(`   Count: ${listings[0].count}`);
  console.log(`   Last synced: ${listings[0].last_sync}\n`);

  const reservations = await sql`SELECT COUNT(*), MAX(synced_at) as last_sync FROM reservations`;
  console.log("📅 Reservations:");
  console.log(`   Count: ${reservations[0].count}`);
  console.log(`   Last synced: ${reservations[0].last_sync}\n`);

  const calendar = await sql`SELECT COUNT(*), MAX(synced_at) as last_sync FROM calendar_days`;
  console.log("📊 Calendar Days:");
  console.log(`   Count: ${calendar[0].count}`);
  console.log(`   Last synced: ${calendar[0].last_sync}\n`);

  console.log("✅ Sync verification complete!");
}

verifySyncData();
