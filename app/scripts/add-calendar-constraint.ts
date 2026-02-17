import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

async function addConstraint() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Adding unique constraint to calendar_days...");

  try {
    // First, remove any duplicate rows
    await sql`
      DELETE FROM calendar_days a
      USING calendar_days b
      WHERE a.id > b.id
        AND a.listing_id = b.listing_id
        AND a.date = b.date
    `;
    console.log("✓ Removed duplicate rows");

    // Add the unique constraint
    await sql`
      ALTER TABLE calendar_days
      ADD CONSTRAINT calendar_listing_date_unique
      UNIQUE (listing_id, date)
    `;
    console.log("✓ Added unique constraint");
    console.log("\n✅ Migration complete!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

addConstraint();
