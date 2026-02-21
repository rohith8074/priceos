import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const sql = neon(process.env.DATABASE_URL!);

  const listingId = 15;
  const from = '2026-03-01';
  const to = '2026-04-30';

  const events = await sql`
    SELECT * 
    FROM activity_timeline
    WHERE type = 'market_event'
    AND start_date <= ${to}
    AND end_date >= ${from}
  `;
  console.log("Market events:", events.length);
  events.forEach(r => {
    console.log(`- Event: ${r.title} | ${r.start_date} to ${r.end_date} | MarketContext:`, JSON.stringify(r.market_context));
  });
}
run().catch(console.error);
