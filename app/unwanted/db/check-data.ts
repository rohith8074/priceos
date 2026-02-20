
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

async function check() {
    console.log("Checking status distribution...");
    const statusCounts = await db.execute(sql`
    SELECT status, count(*) as count 
    FROM calendar_days 
    WHERE date >= CURRENT_DATE 
    GROUP BY status
  `);

    // @ts-ignore
    const rows = Array.isArray(statusCounts) ? statusCounts : statusCounts.rows || [];
    console.log("Status counts:", rows);
}

check();
