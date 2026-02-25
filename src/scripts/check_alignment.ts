import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function checkDataAlignment() {
    const sql = neon(process.env.DATABASE_URL!);

    const listingId = 8; // JVC Family 3BR
    const fromDate = '2026-02-01';
    const toDate = '2026-03-31';

    console.log(`\n--- DATA ALIGNMENT CHECK FOR LISTING ${listingId} (${fromDate} to ${toDate}) ---\n`);

    // 1. Check Inventory Master Dates
    const minMaxDates = await sql`
    SELECT MIN(date) as min_date, MAX(date) as max_date, COUNT(*) as total_rows
    FROM inventory_master
    WHERE listing_id = ${listingId}
  `;
    console.log("1. Inventory Master Range for this Property:");
    console.log(minMaxDates[0]);

    // 2. Check Inventory Master Status Breakdown for the range
    const inventoryStats = await sql`
    SELECT status, COUNT(*) as days_count
    FROM inventory_master
    WHERE listing_id = ${listingId} 
      AND date >= ${fromDate} 
      AND date <= ${toDate}
    GROUP BY status
    ORDER BY status
  `;
    console.log(`\n2. Inventory Status Breakdown (Feb-Mar 2026):`);
    console.table(inventoryStats);

    // 3. Check Reservations in Activity Timeline for the range
    const reservations = await sql`
    SELECT id, title, start_date, end_date, financials->>'reservationStatus' as res_status
    FROM activity_timeline
    WHERE listing_id = ${listingId} 
      AND type = 'reservation'
      AND start_date <= ${toDate}
      AND end_date >= ${fromDate}
    ORDER BY start_date
  `;
    console.log(`\n3. Reservations in Activity Timeline (Feb-Mar 2026):`);
    if (reservations.length === 0) {
        console.log("   --> ZERO reservations found!");
    } else {
        console.table(reservations);
    }

    // 4. Check Market Events
    const events = await sql`
    SELECT id, title, start_date, end_date, market_context->>'eventType' as event_type
    FROM activity_timeline
    WHERE type = 'market_event'
      AND start_date <= ${toDate}
      AND end_date >= ${fromDate}
    ORDER BY start_date
  `;
    console.log(`\n4. Market Events in Activity Timeline (Feb-Mar 2026):`);
    console.log(`   --> ${events.length} events found across the market.`);
}

checkDataAlignment().catch(console.error);
