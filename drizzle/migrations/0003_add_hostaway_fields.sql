-- Migration: 0003_add_hostaway_fields.sql
-- Description: Adds 8 new columns to leverage Hostaway API data
-- Tables affected: listings, reservations, calendar_days
-- All columns nullable for non-breaking migration
-- Date: 2026-02-19

-- Listings: address + geolocation for market positioning
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "address" text;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "latitude" numeric(10, 7);
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "longitude" numeric(10, 7);

-- Reservations: booking detail fields for agent analysis
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "number_of_guests" integer;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "channel_commission" numeric(10, 2);
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "cleaning_fee" numeric(10, 2);
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp;

-- Calendar Days: block reason note
ALTER TABLE "calendar_days" ADD COLUMN IF NOT EXISTS "note" text;
