import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function fixSchema() {
    try {
        console.log("Checking and fixing user_settings schema...");

        // Add full_name if missing
        await db.execute(sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS full_name text`);
        console.log("✅ full_name column verified/added");

        // Add email if missing
        await db.execute(sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS email text`);
        console.log("✅ email column verified/added");

        // Add lyzr_api_key if missing
        await db.execute(sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS lyzr_api_key text`);
        console.log("✅ lyzr_api_key column verified/added");

        // Add hostaway_api_key if missing
        await db.execute(sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS hostaway_api_key text`);
        console.log("✅ hostaway_api_key column verified/added");

        // Add preferences if missing
        await db.execute(sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb`);
        console.log("✅ preferences column verified/added");

        // Add created_at and updated_at
        await db.execute(sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now() NOT NULL`);
        await db.execute(sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now() NOT NULL`);
        console.log("✅ timestamps verified/added");

    } catch (error) {
        console.error("❌ Error fixing schema:", error);
    } finally {
        process.exit(0);
    }
}

fixSchema();
