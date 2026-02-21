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

The **master property registry**. Every short-term rental property managed by PriceOS is stored here. Each row = one physical property. **Agent Instructions:** Always use this table as your primary anchor to grab property metadata. Use `price_floor` and `price_ceiling` explicitly to ensure your pricing bounds are respected. This table is primarily utilized by Agent 2 (Property Analyst), Agent 4 (Market Research) and Agent 5 (PriceGuard).

### Columns

* **`id`** — serial (PK). The unique identifier for the internal database.
* **`hostaway_id`** — text (UNIQUE). Property's unique ID in Hostaway PMS.
* **`name`** — text (NOT NULL). Human-readable property name.
  * **SQL Example**: `SELECT id, name FROM listings WHERE name ILIKE '%marina%';`
* **`city`** — text (NOT NULL, default 'Dubai').
* **`country_code`** — varchar(3) (NOT NULL, default 'AE').
* **`area`** — text (NOT NULL). Neighborhood (e.g., 'Dubai Marina').
* **`bedrooms_number`** — integer (NOT NULL).
* **`bathrooms_number`** — integer (NOT NULL).
* **`property_type_id`** — integer (NOT NULL).
* **`price`** — numeric(10,2) (NOT NULL). Base standard nightly rate in AED.
* **`currency_code`** — varchar(3) (NOT NULL, default 'AED').
* **`person_capacity`** — integer (NULLABLE). Max guests allowed.
* **`amenities`** — jsonb (NULLABLE). Array of tags strings. e.g., `["pool", "wifi"]`.
  * **SQL Example**: `SELECT id, name, amenities FROM listings WHERE amenities ? 'pool';`
* **`address`** — text (NULLABLE).
* **`latitude`** — numeric(10,7) (NULLABLE).
* **`longitude`** — numeric(10,7) (NULLABLE).
* **`price_floor`** — numeric(10,2) (NOT NULL). Hard minimum nightly rate.
* **`price_ceiling`** — numeric(10,2) (NOT NULL). Hard maximum nightly rate.
  * **SQL Example**: `SELECT price_floor, price_ceiling FROM listings WHERE id = 1;`

---

## 2. `inventory_master` (Calendar & Proposals)

### Table Description

The **daily operations and pricing matrix**. Consolidates both the current calendar state and the AI's future pricing proposals in a single row per day per listing. **Agent Instructions:** When analyzing calendar gaps, verifying occupancy rates, or confirming live vs proposed rates, query this table. Always constrain your search strictly using a `DATE` overlap. This table is utilized by Agent 2 (Property Analyst) and Agent 5 (PriceGuard).

### Columns

* **`id`** — serial (PK). The unique internal identifier.
* **`listing_id`** — integer (FK) - Joins to `listings.id`.
* **`date`** — date (NOT NULL). Target calendar day.
  * **SQL Example**: `SELECT date, status FROM inventory_master WHERE listing_id = 1 AND date BETWEEN CURRENT_DATE AND (CURRENT_DATE + 7);`
* **`status`** — text (NOT NULL). Values: `'available'`, `'reserved'`, `'blocked'`.
  * **SQL Example**: `SELECT date FROM inventory_master WHERE listing_id = 1 AND status = 'available';`
* **`current_price`** — numeric(10,2) (NOT NULL). Live price on booking platforms right now.
* **`min_max_stay`** — jsonb (NOT NULL). Rules object. Examples: `{"min": 2, "max": 30}`
  * **SQL Example**: `SELECT date FROM inventory_master WHERE listing_id = 1 AND (min_max_stay->>'min')::int >= 3;`
* **`proposed_price`** — numeric(10,2) (NULLABLE). AI pricing recommendation.
* **`change_pct`** — integer (NULLABLE). Percentage delta between current and proposed price.
* **`proposal_status`** — text (NULLABLE). Values: `'pending'`, `'approved'`, `'rejected'`.
* **`reasoning`** — text (NULLABLE). Agent's text explanation for why they set the proposed price.

---

## 3. `activity_timeline` (Reservations & Market Events)

### Table Description

The **chronological event and transaction hub**. Stores both Guest Bookings AND local Market Events/Intelligence. Discriminator column `type` informs how to parse the JSONB attributes. **Agent Instructions:** When looking for insights (Agent 3 and 4), depend on this table heavily. Use the `type` column to delineate your logic. Agent 3 must filter for `type = 'reservation'` while Agent 4 must filter for `type = 'market_event'`.

### Columns

* **`id`** — serial (PK). The unique internal identifier.
* **`listing_id`** — integer (FK, NULLABLE). Filled for `reservation`. NULL for city-wide `market_event`. 
* **`type`** — text (NOT NULL). Discriminator. Values: `'reservation'` or `'market_event'`.
  * **SQL Example**: `SELECT * FROM activity_timeline WHERE type = 'reservation' AND listing_id = 1;`
* **`start_date`** — date (NOT NULL). Guest arrival OR Event start.
* **`end_date`** — date (NOT NULL). Guest departure OR Event end.
* **`title`** — text (NOT NULL). Guest Name OR Event Name (e.g., `'John Doe'`, `'Art Dubai 2026'`).
* **`impact_score`** — integer (NULLABLE). Multiplier metric (stored as 0-100 percentage increase context) for market demand.
* **`financials`** — jsonb (NULLABLE). **Populated only for `'reservation'`**. 
  - Standard keys: `total_price` (numeric), `price_per_night` (numeric), `channel_commission` (numeric), `cleaning_fee` (numeric), `channel_name` (text, e.g. "Airbnb", "Direct"), `reservation_status` (text, e.g. "confirmed", "cancelled").
  * **SQL Example for Math**: `SELECT title AS guest_name, (financials->>'total_price')::numeric - COALESCE((financials->>'channel_commission')::numeric, 0) AS net_revenue FROM activity_timeline WHERE type = 'reservation' AND listing_id = 1;`
  * **SQL Example for Categorization**: `SELECT (financials->>'channel_name') AS channel, COUNT(*) FROM activity_timeline WHERE type = 'reservation' AND listing_id = 1 GROUP BY (financials->>'channel_name');`
* **`market_context`** — jsonb (NULLABLE). **Populated only for `'market_event'`**.
  - Standard keys: `event_type` (text: 'event', 'holiday', 'competitor_intel', 'positioning'), `description` (text), `suggested_premium_pct` (int), `competitor_median_rate` (numeric), `insight_verdict` (text).
  * **SQL Example**: `SELECT title AS event_name, start_date, (market_context->>'suggested_premium_pct') AS potential_premium FROM activity_timeline WHERE type = 'market_event' AND start_date <= '2026-03-31' AND end_date >= '2026-03-01';`
