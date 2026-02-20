
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

async function truncate() {
    console.log("Truncating tables...");
    try {
        // Truncate relevant tables
        await db.execute(sql`
      TRUNCATE TABLE proposals, calendar_days, reservations, listings RESTART IDENTITY CASCADE;
    `);
        console.log("✅ Tables truncated.");
    } catch (error) {
        console.error("Error truncating tables:", error);
        // If tables don't exist, it might fail, which is fine for db:push
    }
}

truncate();
