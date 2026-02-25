import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
    const sql = neon(process.env.DATABASE_URL!);

    const listingId = 13;
    const from = '2026-02-21';
    const to = '2026-03-23';

    const calendar = await sql`
    SELECT date, status, current_price 
    FROM inventory_master 
    WHERE listing_id = ${listingId}
    AND date >= ${from} AND date <= ${to}
    ORDER BY date ASC
  `;
    console.log(`Calendar rows for ${from} to ${to}:`, calendar.length);
    if (calendar.length > 0) {
        console.log("Calendar status distribution:", calendar.reduce((acc, row) => {
            acc[row.status] = (acc[row.status] || 0) + 1;
            return acc;
        }, {}));
    }
}
run().catch(console.error);
