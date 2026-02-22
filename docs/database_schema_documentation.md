# PriceOS Database Schema & Data Flow Architecture

This document provides a comprehensive breakdown of the core PostgreSQL database schema powering PriceOS, designed using Drizzle ORM.

## 1. `listings` Table
**Purpose:** Acts as the primary source of truth for all properties managed by PriceOS.
**When it is updated:** 
- Initially populated via seed scripts or when adding a new property block.
- Updated when underlying property attributes (like floor/ceiling bounds) are modified in the Settings UI.

**Key Columns:**
*   `id` (serial primary key): Internal unique identifier.
*   `hostawayId` (text, unique): External mapping to the Hostaway PMS listing ID.
*   `name`, `city`, `area`: Descriptive location strings.
*   `price` (numeric): The default/base price of the property.
*   `amenities` (jsonb): Array of strings.
*   `latitude`, `longitude` (numeric): Geolocation for map features.
*   `priceFloor` & `priceCeiling` (numeric): **CRITICAL**. These dictate the absolute bounds allowed for AI pricing. The `PriceGuard` agent reads these columns to strictly bound any proposed adjustments.

---

## 2. `inventory_master` Table
**Purpose:** The central pricing and availability matrix. It consolidates both the current calendar state (booked/blocked/available) and the AI's future pricing proposals in a single row per day per listing.

**When it is updated:**
1.  **Sync Service:** A background cron (or `/api/sync`) pulls availability/prices from Hostaway and updates `status` and `currentPrice`.
2.  **AI Chat (Save Action):** When a user clicks "Save" on a proposal card, `/api/proposals/bulk-save` populates the `proposedPrice`, `changePct`, `reasoning`, and sets `proposalStatus` to `'pending'`.
3.  **Approval Flow:** When a user formally approves a pending proposal, a sync agent pushes it to Hostaway, and the DB row moves `proposedPrice` -> `currentPrice` and clears the pending columns.

**Key Columns:**
*   `listingId` & `date`: Forms a **unique composite index**. There is exactly ONE row per property per day.
*   `status` (text): Enumerable state (`available`, `booked`, `blocked`).
*   `currentPrice` (numeric): The live, active price currently pushed to the PMS.
*   `proposedPrice` (numeric): The unapplied price suggested by the AI.
*   `changePct` (integer): Display metric showing the delta between current and proposed.
*   `proposalStatus` (text): Enum (`pending`, `approved`, `rejected`).
*   `reasoning` (text): Stores the AI's plain-text justification for the price shift, rendered in the UI.

---

## 3. `activity_timeline` Table
**Purpose:** A polymorphic "catch-all" timeline that stores both **Internal Data** (actual bookings, blocked days) and **External Data** (holidays, market events, competitor rates) on a unified calendar.

**When it is updated:**
1.  **Market Setup (External):** When a user clicks "Setup" in the chat, the Marketing Agent queries Perplexity for web events. The `/api/market-setup` route wipes old events for those dates and `INSERT`s new ones tagged as `type = 'market_event'`.
2.  **PMS Sync (Internal):** When real-life bookings clear through the PMS, sync routers update this table with `type = 'reservation'`, attaching exact financials and guest data.

**Key Columns (Polymorphic Design):**
*   `type` (text): Crucial discriminator (`market_event` vs `reservation`).
*   `startDate` & `endDate` (date): The temporal bounds of the event.
*   `title` (text): Human-readable event string (e.g., "Dubai Food Festival" or "Booking #1024").
*   `impactScore` (integer): Usually calculated at inference time by Market Research to quantify event severity. Often `null` upon initial insertion.
*   `financials` (jsonb): Populated **ONLY** for `type = 'reservation'`. Contains exact booking revenue, cleaning fees, and channel commissions. Will be empty/null for market events.
*   `guestDetails` (jsonb): Populated **ONLY** for `type = 'reservation'`. Contains guest PII/contact. Will be empty/null for market events.
*   `marketContext` (jsonb): Populated **ONLY** for `type = 'market_event'`. Contains the pure AI research payload from Perplexity (eventType, location, suggested premiums).

---

## 4. `chat_messages` Table
**Purpose:** Persists all interactions between the user and the CRO Router / AI agents to provide LLM memory continuity and audit logs.

**When it is updated:**
- Instantly upon sending a prompt (`/api/chat` route inserts `role="user"`).
- Instantly upon receiving a Lyzr payload (`/api/chat` route inserts `role="assistant"`).

**Key Columns:**
*   `sessionId` (text): Ties requests together into a continuous conversational thread context.
*   `listingId` (integer): The specific property the context was bound to (if not portfolio level).
*   `structured` (jsonb): Saves a snapshot of what the AI was "looking at" when making its decision (the date range bounds, the occupancy metrics fed in the prompt, and the exact JSON proposal array returned by the AI).

---

## 5. `user_settings` Table
**Purpose:** Stores user-level configurations, specifically securing routing keys required to operate the application.

**When it is updated:**
- Managed via the UI settings pages to securely store API keys.

**Key Columns:**
*   `lyzrApiKey` & `hostawayApiKey` (text): Third party keys used heavily in API middleware contexts.
