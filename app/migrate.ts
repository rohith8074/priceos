import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log("DB URL prefix:", process.env.DATABASE_URL?.substring(0, 50));
  console.log("🔄 Running schema migration...\n");

  // Check current tables
  const before = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log("Tables before:", before.map(t => t.table_name));

  // 1. Create the new `reservations` table
  console.log("\n1️⃣  Creating `reservations` table...");
  await sql`
    CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      listing_id INTEGER NOT NULL REFERENCES listings(id),
      guest_name TEXT,
      guest_email TEXT,
      guest_phone TEXT,
      num_guests INTEGER,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      channel_name TEXT,
      reservation_status TEXT DEFAULT 'confirmed',
      total_price NUMERIC(12,2),
      price_per_night NUMERIC(12,2),
      channel_commission NUMERIC(12,2) DEFAULT '0',
      cleaning_fee NUMERIC(12,2) DEFAULT '0',
      hostaway_reservation_id TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("   ✅ reservations table created");

  // 2. Create the new `market_events` table
  console.log("2️⃣  Creating `market_events` table...");
  await sql`
    CREATE TABLE IF NOT EXISTS market_events (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      event_type TEXT,
      location TEXT,
      expected_impact TEXT,
      confidence INTEGER,
      description TEXT,
      source TEXT,
      suggested_premium NUMERIC(8,2),
      competitor_median NUMERIC(10,2),
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("   ✅ market_events table created");

  // 3. Check if activity_timeline exists and migrate data
  const atExists = await sql`SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_timeline')`;
  if (atExists[0].exists) {
    // Check if reservations is empty (avoid double-migration)
    const resCount = await sql`SELECT count(*) as c FROM reservations`;
    if (parseInt(resCount[0].c) === 0) {
      console.log("3️⃣  Migrating reservation data...");
      await sql`
        INSERT INTO reservations (listing_id, guest_name, start_date, end_date, channel_name, reservation_status, total_price, price_per_night, channel_commission, cleaning_fee, created_at)
        SELECT 
          COALESCE(listing_id, 1),
          title,
          start_date,
          end_date,
          financials->>'channelName',
          COALESCE(financials->>'reservationStatus', 'confirmed'),
          COALESCE((financials->>'totalPrice')::NUMERIC, 0),
          COALESCE((financials->>'pricePerNight')::NUMERIC, 0),
          COALESCE((financials->>'channelCommission')::NUMERIC, 0),
          COALESCE((financials->>'cleaningFee')::NUMERIC, 0),
          created_at
        FROM activity_timeline
        WHERE type = 'reservation'
      `;
      console.log("   ✅ Migrated reservations");
    } else {
      console.log("3️⃣  ⏩ Reservations already has data, skipping");
    }

    const meCount = await sql`SELECT count(*) as c FROM market_events`;
    if (parseInt(meCount[0].c) === 0) {
      console.log("4️⃣  Migrating market event data...");
      await sql`
        INSERT INTO market_events (title, start_date, end_date, event_type, location, expected_impact, confidence, description, source, suggested_premium, competitor_median, metadata, created_at)
        SELECT 
          title,
          start_date,
          end_date,
          COALESCE(market_context->>'type', market_context->>'eventType', 'event'),
          COALESCE(market_context->>'location', 'Dubai'),
          COALESCE(market_context->>'expectedImpact', 'medium'),
          COALESCE((market_context->>'confidence')::INTEGER, 50),
          COALESCE(market_context->>'description', ''),
          market_context->>'source',
          COALESCE((market_context->>'suggested_premium_pct')::NUMERIC, (market_context->>'premium_pct')::NUMERIC),
          (market_context->>'median_rate')::NUMERIC,
          market_context,
          created_at
        FROM activity_timeline
        WHERE type = 'market_event'
      `;
      console.log("   ✅ Migrated market events");
    } else {
      console.log("4️⃣  ⏩ Market events already has data, skipping");
    }

    // 5. Drop old activity_timeline table
    console.log("5️⃣  Dropping old activity_timeline table...");
    await sql`DROP TABLE IF EXISTS activity_timeline CASCADE`;
    console.log("   ✅ activity_timeline table dropped");
  } else {
    console.log("3️⃣  ⏩ activity_timeline doesn't exist, skipping data migration");
  }

  // 6. Handle min_stay/max_stay columns
  console.log("6️⃣  Updating inventory_master columns...");
  const minStayCheck = await sql`SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_master' AND column_name = 'min_stay')`;
  if (!minStayCheck[0].exists) {
    await sql`ALTER TABLE inventory_master ADD COLUMN min_stay INTEGER DEFAULT 1`;
    console.log("   ✅ Added min_stay column");
  } else {
    console.log("   ⏩ min_stay already exists");
  }
  const maxStayCheck = await sql`SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_master' AND column_name = 'max_stay')`;
  if (!maxStayCheck[0].exists) {
    await sql`ALTER TABLE inventory_master ADD COLUMN max_stay INTEGER DEFAULT 30`;
    console.log("   ✅ Added max_stay column");
  } else {
    console.log("   ⏩ max_stay already exists");
  }
  const oldColCheck = await sql`SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_master' AND column_name = 'min_max_stay')`;
  if (oldColCheck[0].exists) {
    await sql`UPDATE inventory_master SET min_stay = COALESCE((min_max_stay->>'min')::INTEGER, 1), max_stay = COALESCE((min_max_stay->>'max')::INTEGER, 30) WHERE min_max_stay IS NOT NULL`;
    await sql`ALTER TABLE inventory_master DROP COLUMN min_max_stay`;
    console.log("   ✅ Migrated and dropped min_max_stay");
  }

  // 7. Now slim metadata: remove duplicate keys
  console.log("7️⃣  Slimming metadata...");
  const duplicateKeys = ['type', 'source', 'location', 'confidence', 'expectedImpact', 'suggested_premium_pct', 'premium_pct', 'median_rate'];
  for (const key of duplicateKeys) {
    await sql`UPDATE market_events SET metadata = metadata - ${key} WHERE metadata ? ${key}`;
  }
  await sql`UPDATE market_events SET metadata = NULL WHERE metadata = '{}'::jsonb`;
  console.log("   ✅ Removed duplicate keys from metadata");

  // Final check
  const after = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log("\n✅ Migration complete!");
  console.log("Tables after:", after.map(t => t.table_name));

  const rows = await sql`SELECT id, title, event_type, metadata FROM market_events ORDER BY id`;
  console.log("\n=== market_events ===");
  rows.forEach(r => {
    console.log(`  ID ${r.id}: type=${r.event_type} | title="${r.title}" | metadata=${r.metadata ? JSON.stringify(r.metadata) : 'NULL'}`);
  });
}

migrate().catch(e => { console.error("❌ Migration failed:", e); process.exit(1); });
