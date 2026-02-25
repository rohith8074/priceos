import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
    const sql = neon(process.env.DATABASE_URL!);

    try {
        const res = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`;
        console.log("Tables:", res.map(r => r.table_name));

        // Check market events
        const events = await sql`
        SELECT *
        FROM activity_timeline
        WHERE type = 'market_event'
        LIMIT 1;
    `;
        console.log("Event:", JSON.stringify(events[0]));

    } catch (e: any) {
        console.log("FAILED", e.message);
    }
}
run().catch(console.error);
