import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('📦 Running minimal schema migration...');

    // Step 1: Add new columns to existing tables
    console.log('[1/4] Adding new columns...');
    await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS hostaway_id text UNIQUE`;
    await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS hostaway_id text UNIQUE`;
    await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS hostaway_api_key text`;
    await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb`;

    // Step 2: Modify proposals table
    console.log('[2/4] Modifying proposals table...');
    await sql`ALTER TABLE proposals RENAME COLUMN date TO date_range_start`;
    await sql`ALTER TABLE proposals ADD COLUMN IF NOT EXISTS date_range_end date NOT NULL DEFAULT CURRENT_DATE`;
    await sql`ALTER TABLE proposals ADD COLUMN IF NOT EXISTS executed_at timestamp`;
    await sql`DROP INDEX IF EXISTS proposals_listing_date_idx`;
    await sql`CREATE INDEX proposals_listing_date_idx ON proposals (listing_id, date_range_start)`;

    // Step 3: Create event_signals table
    console.log('[3/4] Creating event_signals table...');
    await sql`
      CREATE TABLE IF NOT EXISTS event_signals (
        id serial PRIMARY KEY,
        name text NOT NULL,
        start_date date NOT NULL,
        end_date date NOT NULL,
        location text NOT NULL DEFAULT 'Dubai',
        expected_impact text,
        confidence integer DEFAULT 50,
        description text,
        metadata jsonb DEFAULT '{}'::jsonb,
        fetched_at timestamp DEFAULT now() NOT NULL
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS event_signals_dates_idx ON event_signals (start_date, end_date)`;
    await sql`CREATE INDEX IF NOT EXISTS event_signals_location_idx ON event_signals (location)`;

    // Step 4: Drop unused tables
    console.log('[4/4] Dropping unused tables...');
    await sql`DROP TABLE IF EXISTS conversation_messages CASCADE`;
    await sql`DROP TABLE IF EXISTS conversations CASCADE`;
    await sql`DROP TABLE IF EXISTS message_templates CASCADE`;
    await sql`DROP TABLE IF EXISTS tasks CASCADE`;
    await sql`DROP TABLE IF EXISTS expenses CASCADE`;
    await sql`DROP TABLE IF EXISTS owner_statements CASCADE`;
    await sql`DROP TABLE IF EXISTS seasonal_rules CASCADE`;
    await sql`DROP TABLE IF EXISTS executions CASCADE`;

    console.log('✓ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

runMigration();
