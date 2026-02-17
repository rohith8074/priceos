-- Migration: Minimal Schema (Price Intelligence Layer)
-- Phase 1 of architectural redesign

-- Step 1: Add new columns to existing tables
ALTER TABLE "listings" ADD COLUMN "hostaway_id" text UNIQUE;
ALTER TABLE "reservations" ADD COLUMN "hostaway_id" text UNIQUE;
ALTER TABLE "user_settings" ADD COLUMN "hostaway_api_key" text;
ALTER TABLE "user_settings" ADD COLUMN "preferences" jsonb DEFAULT '{}'::jsonb;

-- Step 2: Modify proposals table
ALTER TABLE "proposals" RENAME COLUMN "date" TO "date_range_start";
ALTER TABLE "proposals" ADD COLUMN "date_range_end" date NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE "proposals" ADD COLUMN "executed_at" timestamp;
ALTER TABLE "proposals" DROP CONSTRAINT IF EXISTS "proposals_listing_date_idx";
CREATE INDEX IF NOT EXISTS "proposals_listing_date_idx" ON "proposals" ("listing_id", "date_range_start");

-- Step 3: Create event_signals table
CREATE TABLE IF NOT EXISTS "event_signals" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "location" text NOT NULL DEFAULT 'Dubai',
  "expected_impact" text,
  "confidence" integer DEFAULT 50,
  "description" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "fetched_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "event_signals_dates_idx" ON "event_signals" ("start_date", "end_date");
CREATE INDEX IF NOT EXISTS "event_signals_location_idx" ON "event_signals" ("location");

-- Step 4: Drop unused tables (operational features)
DROP TABLE IF EXISTS "conversation_messages" CASCADE;
DROP TABLE IF EXISTS "conversations" CASCADE;
DROP TABLE IF EXISTS "message_templates" CASCADE;
DROP TABLE IF EXISTS "tasks" CASCADE;
DROP TABLE IF EXISTS "expenses" CASCADE;
DROP TABLE IF EXISTS "owner_statements" CASCADE;
DROP TABLE IF EXISTS "seasonal_rules" CASCADE;
DROP TABLE IF EXISTS "executions" CASCADE;
