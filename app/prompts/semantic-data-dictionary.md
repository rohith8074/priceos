# PriceOS — Semantic Data Dictionary

**Database:** Neon (PostgreSQL)
**Tables:** 3 (Optimized Agentic Fact-Store)
**Data Source:** Hostaway PMS API + PriceOS Internal Agents

---

## ⚠️ Access Restrictions

- **READ-ONLY access only** — `SELECT` queries only.
- **Database write access is STRICTLY FORBIDDEN.** Never run INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, or any write/DDL operation.
- All data modifications happen through the PriceOS backend application layer.
- Never expose raw SQL to the end user — summarize results in natural language.

---

## 1. `listings` (Optimized Base)

### Table Description

The **master property registry**. Every short-term rental property managed by PriceOS is stored here. Each row = one physical property.

**18 columns.** Referenced by: `inventory_master.listing_id`, `activity_timeline.listing_id`.

**When to query:**
- User asks about a property by name → `WHERE name ILIKE '%marina%'`
- Filtering properties by amenities or capacity
- Property metadata anchor for JOINs
- Finding the structural safety limits before pricing (`price_floor`, `price_ceiling`)

### Columns

* **`id`** — serial (PK)
* **`hostaway_id`** — text (UNIQUE) - Property's unique ID in Hostaway PMS.
* **`name`** — text (NOT NULL) - Human-readable property name.
* **`city`** — text (NOT NULL, default 'Dubai')
* **`country_code`** — varchar(3) (NOT NULL, default 'AE')
* **`area`** — text (NOT NULL) - Neighborhood (e.g., 'Dubai Marina').
* **`bedrooms_number`** — integer (NOT NULL)
* **`bathrooms_number`** — integer (NOT NULL)
* **`property_type_id`** — integer (NOT NULL)
* **`price`** — numeric(10,2) (NOT NULL) - Base standard nightly rate in AED.
* **`currency_code`** — varchar(3) (NOT NULL, default 'AED')
* **`person_capacity`** — integer (NULLABLE) - Max guests allowed.
* **`amenities`** — jsonb (NULLABLE) - Array of tags strings. e.g., `["pool", "wifi"]`.
* **`address`** — text (NULLABLE)
* **`latitude`** — numeric(10,7) (NULLABLE)
* **`longitude`** — numeric(10,7) (NULLABLE)
* **`price_floor`** — numeric(10,2) (NOT NULL) - Hard minimum nightly rate. Agent 5 uses to validate proposal bounds.
* **`price_ceiling`** — numeric(10,2) (NOT NULL) - Hard maximum nightly rate. Agent 5 uses to validate proposal bounds.

### Example Queries
```sql
-- Find a property by partial name
SELECT id, name, area, price_floor, price_ceiling FROM listings WHERE name ILIKE '%marina%';

-- Find properties by amenity using JSONB operator
SELECT id, name, amenities FROM listings WHERE amenities ? 'pool';
```

---

## 2. `inventory_master` (Calendar & Proposals)

### Table Description

The **daily operations and pricing matrix**. Consolidates both the current calendar state and the AI's future pricing proposals in a single row per day. 

**When to query:**
- Gap detection (1-3 available days between blocked/reserved days).
- Checking occupancy (`status = 'reserved'`).
- Reading the current active Hostaway price vs the AI's proposed price.
- Reviewing pending AI pricing proposals without joining a separate table.

### Columns

* **`id`** — serial (PK)
* **`listing_id`** — integer (FK) - Joins to `listings.id`.
* **`date`** — date (NOT NULL) - Target calendar day.
* **`status`** — text (NOT NULL) - Values: `'available'`, `'reserved'`, `'blocked'`.
* **`current_price`** — numeric(10,2) (NOT NULL) - Live price on booking platforms right now.
* **`min_max_stay`** — jsonb (NOT NULL) - Rules object. Examples: `{"min": 2, "max": 30}`
* **`proposed_price`** — numeric(10,2) (NULLABLE) - AI pricing recommendation.
* **`change_pct`** — integer (NULLABLE) - Percentage delta between current and proposed price.
* **`proposal_status`** — text (NULLABLE) - Values: `'pending'`, `'approved'`, `'rejected'`.
* **`reasoning`** — text (NULLABLE) - Agent's text explanation for why they set the proposed price.

### Example Queries
```sql
-- Check availability and proposed changes over the next 7 days
SELECT date, status, current_price, proposed_price, change_pct 
FROM inventory_master 
WHERE listing_id = 1 AND date BETWEEN CURRENT_DATE AND (CURRENT_DATE + 7);

-- Checking JSONB property (min stay requirement >= 3)
SELECT date, status, current_price 
FROM inventory_master 
WHERE listing_id = 1 AND (min_max_stay->>'min')::int >= 3;

-- Identifying orphaned gap nights
SELECT date, current_price 
FROM inventory_master 
WHERE listing_id = 1 AND status = 'available'; -- Advanced gap logic requires window functions
```

---

## 3. `activity_timeline` (Reservations & Market Events)

### Table Description

The **chronological event and transaction hub**. Stores both Guest Bookings AND local Market Events/Intelligence. Discriminator column `type` informs how to parse the JSONB attributes.

**When to query:**
- Plotting reservations on a chart (velocity, lead time, revenue).
- Checking if a calendar date overlaps with a market event (e.g., Gitex, Ramadan).
- Viewing competitor intel (found in `market_context` for market events).
- Extracting net financial metrics from the `financials` jsonb column for guest stays.

### Columns

* **`id`** — serial (PK)
* **`listing_id`** — integer (FK, NULLABLE) - Filled for `reservation`. NULL for city-wide `market_event`. 
* **`type`** — text (NOT NULL) - Discriminator. Values: `'reservation'` or `'market_event'`.
* **`start_date`** — date (NOT NULL) - Guest arrival OR Event start.
* **`end_date`** — date (NOT NULL) - Guest departure OR Event end.
* **`title`** — text (NOT NULL) - Guest Name OR Event Name (e.g., `'John Doe'`, `'Art Dubai 2026'`).
* **`impact_score`** — integer (NULLABLE) - Multiplier metric (stored as 0-100 percentage increase context) for market demand.
* **`financials`** — jsonb (NULLABLE) - **Populated only for `'reservation'`**. 
  - Standard keys: `total_price` (numeric), `price_per_night` (numeric), `channel_commission` (numeric), `cleaning_fee` (numeric), `channel_name` (text, e.g. "Airbnb", "Direct"), `reservation_status` (text, e.g. "confirmed", "cancelled").
* **`market_context`** — jsonb (NULLABLE) - **Populated only for `'market_event'`**.
  - Standard keys: `event_type` (text: 'event', 'holiday', 'competitor_intel', 'positioning'), `description` (text), `suggested_premium_pct` (int), `competitor_median_rate` (numeric), `insight_verdict` (text).

### Example Queries
```sql
-- NET REVENUE CALCULATION: Extracting data from JSONB block for Reservations
SELECT 
    title AS guest_name,
    start_date AS arrival,
    (financials->>'total_price')::numeric AS gross_revenue,
    (financials->>'channel_commission')::numeric AS commission,
    (financials->>'cleaning_fee')::numeric AS cleaning,
    (financials->>'total_price')::numeric - COALESCE((financials->>'channel_commission')::numeric, 0) - COALESCE((financials->>'cleaning_fee')::numeric, 0) AS net_revenue
FROM activity_timeline
WHERE type = 'reservation' AND listing_id = 1;

-- FIND OVERLAPPING MARKET EVENTS: E.g. finding events during March
SELECT 
    title AS event_name, 
    start_date, 
    end_date, 
    (market_context->>'event_type') AS event_type,
    (market_context->>'suggested_premium_pct') AS potential_premium
FROM activity_timeline
WHERE type = 'market_event' 
  AND start_date <= '2026-03-31' 
  AND end_date >= '2026-03-01';

-- BOOKING VELOCITY: Analyzing bookings made recently (assuming ID or chronological creation implies recent velocity)
SELECT 
    (financials->>'channel_name') AS channel, 
    COUNT(*) AS recent_bookings 
FROM activity_timeline 
WHERE type = 'reservation' AND listing_id = 1 
GROUP BY (financials->>'channel_name');
```
