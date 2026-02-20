
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

async function runQuery() {
    const query = `
    SELECT date, price, status 
    FROM calendar_days 
    WHERE listing_id = (SELECT id FROM listings WHERE name = 'Silicon Oasis 2BR') 
    ORDER BY date 
    LIMIT 1000;
  `;

    console.log("Executing Query:", query);
    try {
        const result = await db.execute(sql.raw(query));

        // @ts-ignore
        const rows = Array.isArray(result) ? result : result.rows || [];
        console.log("\n--- RESULT ---");
        console.table(rows);
        console.log(`Total rows: ${rows.length}`);
        console.log("--------------\n");
    } catch (error) {
        console.error("Error executing query:", error);
    }
}

runQuery();
