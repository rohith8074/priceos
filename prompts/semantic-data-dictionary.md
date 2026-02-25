# PriceOS — Semantic Data Dictionary

**Database:** Neon (PostgreSQL)
**Tables:** 4 core tables used by Agents (Optimized Relational Schema — No JSON on core tables)
**Data Source:** Hostaway PMS API + PriceOS Internal Agents

---

## ⚠️ Access Restrictions

- **READ-ONLY access only** — `SELECT` queries only.
- **Database write access is STRICTLY FORBIDDEN.** Never run INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, or any write/DDL operation.
- All data modifications happen through the PriceOS backend application layer.
- Never expose raw SQL to the end user — summarize results in natural language.

---

# Table: `listings`

**Table Description:** The master property registry. Every short-term rental property managed by PriceOS is stored here. Each row represents one physical property. Always use this table as your primary anchor to grab property metadata. Use `price_floor` and `price_ceiling` explicitly to ensure your pricing bounds are respected. This table is primarily utilized by Agent 2 (Property Analyst), Agent 4 (Market Research), and Agent 5 (PriceGuard).

### `id`
**Description:** The primary key and unique internal identifier for the property record in our database.
**SQL Query:** `SELECT id FROM listings LIMIT 5;`

### `hostaway_id`
**Description:** The property's unique ID synced directly from the Hostaway Property Management System. Used for API matching.
**SQL Query:** `SELECT hostaway_id FROM listings WHERE id = 1;`

### `name`
**Description:** The human-readable property name as it appears on booking sites. Searchable and often used for text matching.
**SQL Query:** `SELECT name FROM listings WHERE name ILIKE '%marina%';`

### `city`
**Description:** The city where the property is located. By default, this is set to 'Dubai'.
**SQL Query:** `SELECT city FROM listings WHERE id = 1;`

### `country_code`
**Description:** The standard 2-digit country code. By default, this is set to 'AE'.
**SQL Query:** `SELECT country_code FROM listings WHERE id = 1;`

### `area`
**Description:** The specific geographic neighborhood or sub-market (e.g., 'Dubai Marina', 'Downtown Dubai'). Critical for competitor grouping.
**SQL Query:** `SELECT area, count(*) FROM listings GROUP BY area;`

### `bedrooms_number`
**Description:** The integer count of physical bedrooms in the property.
**SQL Query:** `SELECT name, bedrooms_number FROM listings WHERE bedrooms_number >= 2;`

### `bathrooms_number`
**Description:** The integer count of physical bathrooms in the property.
**SQL Query:** `SELECT name, bathrooms_number FROM listings WHERE id = 1;`

### `property_type_id`
**Description:** An integer ID matching the physical property type category (e.g., Apartment, Villa).
**SQL Query:** `SELECT property_type_id FROM listings WHERE id = 1;`

### `price`
**Description:** The standard or default nightly base rate in AED. This acts as a reference point for dynamic adjustments.
**SQL Query:** `SELECT name, price FROM listings ORDER BY price DESC;`

### `currency_code`
**Description:** The 3-character currency string. By default, 'AED'.
**SQL Query:** `SELECT currency_code FROM listings WHERE id = 1;`

### `person_capacity`
**Description:** The maximum number of guests legally allowed to sleep in the rental property.
**SQL Query:** `SELECT name, person_capacity FROM listings WHERE person_capacity >= 4;`

### `amenities`
**Description:** A PostgreSQL `text[]` array containing simple string tags of the property's amenities (e.g., `{"pool","wifi","gym"}`). Use the `ANY` operator to search.
**SQL Query:** `SELECT name, amenities FROM listings WHERE 'pool' = ANY(amenities);`

### `address`
**Description:** The full, human-readable street address of the property.
**SQL Query:** `SELECT name, address FROM listings WHERE id = 1;`

### `price_floor`
**Description:** The strict minimum base limit (in AED) that the AI cannot price below under any circumstance. Crucial safety guardrail.
**SQL Query:** `SELECT name, price_floor FROM listings WHERE id = 1;`

### `price_ceiling`
**Description:** The strict maximum limit (in AED) that the AI cannot price above. Used by PriceGuard for clipping.
**SQL Query:** `SELECT name, price_ceiling FROM listings WHERE id = 1;`

---

# Table: `inventory_master`

**Table Description:** The daily operations and pricing matrix. It consolidates both the current calendar state (booked, blocked, available) and the AI's future pricing proposals in a single row per day per listing. When analyzing calendar gaps, verifying occupancy rates, or confirming live vs proposed rates, query this table. Always constrain your search strictly using a `DATE` overlap. This table is utilized by Agent 2 (Property Analyst) and Agent 5 (PriceGuard).

### `id`
**Description:** The primary key and unique internal identifier for this specific day's inventory record.
**SQL Query:** `SELECT id FROM inventory_master LIMIT 5;`

### `listing_id`
**Description:** The foreign key linking this day's record back to the `listings` table.
**SQL Query:** `SELECT listing_id FROM inventory_master WHERE date = CURRENT_DATE;`

### `date`
**Description:** The exact calendar day this row represents. Every property has exactly one row per calendar day.
**SQL Query:** `SELECT date FROM inventory_master WHERE listing_id = 1 AND date BETWEEN CURRENT_DATE AND (CURRENT_DATE + 30);`

### `status`
**Description:** The active state of the calendar day. Permitted enum values are `'available'`, `'reserved'`, or `'blocked'`.
**SQL Query:** `SELECT date, status FROM inventory_master WHERE listing_id = 1 AND status = 'available';`

### `current_price`
**Description:** The actual, live nightly price currently active on all booking channels (in AED) for this day.
**SQL Query:** `SELECT date, current_price FROM inventory_master WHERE listing_id = 1 AND date = '2026-03-15';`

### `min_stay`
**Description:** The minimum number of nights a guest must book if their stay includes this date. Integer column — no JSON.
**SQL Query:** `SELECT date, min_stay FROM inventory_master WHERE listing_id = 1 AND min_stay >= 3;`

### `max_stay`
**Description:** The maximum number of nights allowed for a stay that includes this date. Integer column — no JSON.
**SQL Query:** `SELECT date, max_stay FROM inventory_master WHERE listing_id = 1;`

### `proposed_price`
**Description:** The new nightly rate the AI Pricing Agent is recommending for this specific date. It can be null if no suggestion exists.
**SQL Query:** `SELECT date, proposed_price FROM inventory_master WHERE listing_id = 1 AND proposed_price IS NOT NULL;`

### `change_pct`
**Description:** The calculated mathematical percentage difference between the `current_price` and the `proposed_price`.
**SQL Query:** `SELECT date, change_pct FROM inventory_master WHERE listing_id = 1 AND proposed_price IS NOT NULL;`

### `proposal_status`
**Description:** The state of the AI's proposal. Values are `'pending'`, `'approved'`, or `'rejected'`.
**SQL Query:** `SELECT date, proposal_status FROM inventory_master WHERE listing_id = 1 AND proposal_status = 'pending';`

### `reasoning`
**Description:** A short text explanation generated by the AI detailing *why* the `proposed_price` was generated (e.g. "Gap discount to fill 2 nights").
**SQL Query:** `SELECT date, reasoning FROM inventory_master WHERE listing_id = 1 AND proposal_status = 'pending';`

---

# Table: `reservations`

**Table Description:** The guest booking and financial ledger. Each row represents one guest reservation from the Hostaway PMS. This table contains guest contact details and financial breakdowns as proper typed columns — no JSON. Agent 3 (Booking Intelligence) uses this table to compute revenue, booking velocity, length-of-stay, and cancellation risk.

### `id`
**Description:** The primary key and unique internal identifier for the reservation.
**SQL Query:** `SELECT id FROM reservations LIMIT 5;`

### `listing_id`
**Description:** The foreign key connecting the reservation to a property in the `listings` table.
**SQL Query:** `SELECT listing_id FROM reservations WHERE listing_id = 1;`

### `guest_name`
**Description:** The guest's full name as provided by the PMS.
**SQL Query:** `SELECT guest_name FROM reservations WHERE listing_id = 1;`

### `guest_email`
**Description:** The guest's email address.
**SQL Query:** `SELECT guest_email FROM reservations WHERE listing_id = 1;`

### `guest_phone`
**Description:** The guest's phone number.
**SQL Query:** `SELECT guest_phone FROM reservations WHERE listing_id = 1;`

### `num_guests`
**Description:** The number of guests in the booking.
**SQL Query:** `SELECT guest_name, num_guests FROM reservations WHERE num_guests >= 4;`

### `start_date`
**Description:** The guest's check-in (arrival) date.
**SQL Query:** `SELECT guest_name, start_date FROM reservations WHERE start_date >= CURRENT_DATE;`

### `end_date`
**Description:** The guest's check-out (departure) date.
**SQL Query:** `SELECT guest_name, start_date, end_date FROM reservations WHERE listing_id = 1;`

### `channel_name`
**Description:** The booking channel (e.g., 'Airbnb', 'Booking.com', 'Direct').
**SQL Query:** `SELECT channel_name, COUNT(*) FROM reservations GROUP BY channel_name;`

### `reservation_status`
**Description:** The booking status: 'confirmed', 'pending', or 'cancelled'.
**SQL Query:** `SELECT guest_name, reservation_status FROM reservations WHERE reservation_status = 'confirmed';`

### `total_price`
**Description:** The total gross payout for the entire stay in AED.
**SQL Query:**
```sql
SELECT SUM(total_price) AS total_revenue
FROM reservations
WHERE listing_id = 1 AND reservation_status = 'confirmed';
```

### `price_per_night`
**Description:** The average nightly rate for this reservation in AED.
**SQL Query:** `SELECT guest_name, price_per_night FROM reservations WHERE listing_id = 1;`

### `channel_commission`
**Description:** The commission charged by the booking channel in AED.
**SQL Query:** `SELECT SUM(channel_commission) FROM reservations WHERE channel_name = 'Airbnb';`

### `cleaning_fee`
**Description:** The cleaning fee charged for this reservation in AED.
**SQL Query:** `SELECT SUM(cleaning_fee) FROM reservations WHERE listing_id = 1;`

### `hostaway_reservation_id`
**Description:** The unique reservation ID from Hostaway PMS, used for deduplication during sync.
**SQL Query:** `SELECT hostaway_reservation_id FROM reservations WHERE id = 1;`

### `created_at`
**Description:** The timestamp when this reservation record was created in our database.
**SQL Query:** `SELECT created_at FROM reservations WHERE listing_id = 1 ORDER BY created_at DESC LIMIT 5;`

---

# Table: `market_events`

**Table Description:** The AI-generated market intelligence store. Populated during the **Setup phase** when the Marketing Agent (Agent 6) searches the internet for Dubai events, holidays, competitor pricing, demand trends, and market positioning. Each row is one typed market signal. Agent 4 (Market Research) reads from this table during chat. Data is scoped per `listing_id` + date range — re-running Setup for the same property/dates **replaces** only that scope, leaving other records intact.

**Event types and which fields they populate:**
| `event_type` | Key fields populated |
|---|---|
| `event` | `expected_impact`, `confidence`, `suggested_premium`, `source`, `description` |
| `holiday` | `expected_impact`, `confidence`, `suggested_premium`, `description` |
| `competitor_intel` | `comp_sample_size`, `comp_min_rate`, `comp_max_rate`, `comp_median_rate`, `description` |
| `positioning` | `positioning_verdict`, `positioning_percentile`, `description` |
| `demand_outlook` | `demand_trend`, `description` |
| `market_summary` | `description` only |

### `id`
**Description:** Primary key.
**SQL Query:** `SELECT id FROM market_events LIMIT 5;`

### `listing_id`
**Description:** FK to `listings`. Null = portfolio-level signal. Always filter by `listing_id` when in property context.
**SQL Query:** `SELECT * FROM market_events WHERE listing_id = 1 ORDER BY start_date;`

### `title`
**Description:** Signal name (e.g., 'Art Dubai 2026', 'Competitor Rate Snapshot').
**SQL Query:** `SELECT title FROM market_events WHERE event_type = 'event';`

### `start_date` / `end_date`
**Description:** Date range the signal applies to.
**SQL Query:** `SELECT title, start_date, end_date FROM market_events WHERE start_date <= '2026-03-31' AND end_date >= '2026-03-01';`

### `event_type`
**Description:** Signal category: `'event'`, `'holiday'`, `'competitor_intel'`, `'positioning'`, `'demand_outlook'`, `'market_summary'`.
**SQL Query:** `SELECT event_type, COUNT(*) FROM market_events GROUP BY event_type;`

### `expected_impact`
**Description:** Demand impact: `'high'`, `'medium'`, `'low'`. Populated for events + holidays.
**SQL Query:** `SELECT title, expected_impact FROM market_events WHERE expected_impact = 'high';`

### `confidence`
**Description:** Integer 0-100. AI confidence in this signal.
**SQL Query:** `SELECT title, confidence FROM market_events WHERE confidence >= 80;`

### `suggested_premium`
**Description:** % price premium suggested for this event (e.g., 15.00 = +15%). Events + holidays only.
**SQL Query:** `SELECT title, suggested_premium FROM market_events WHERE event_type IN ('event','holiday') AND suggested_premium > 0 ORDER BY suggested_premium DESC;`

### `source`
**Description:** Source URL or attribution string.
**SQL Query:** `SELECT title, source FROM market_events WHERE source IS NOT NULL;`

### `description`
**Description:** Human-readable detail. For `demand_outlook`, concatenates reason + weather + supply notes with ` | ` separator.
**SQL Query:** `SELECT title, description FROM market_events WHERE event_type = 'demand_outlook';`

### `comp_sample_size`
**Description:** Number of competitor properties sampled. Populated for `competitor_intel` rows.
**SQL Query:** `SELECT comp_sample_size FROM market_events WHERE event_type = 'competitor_intel' AND listing_id = 1;`

### `comp_min_rate`
**Description:** Lowest competitor nightly rate (AED) found in market scan. `competitor_intel` rows only.
**SQL Query:** `SELECT comp_min_rate, comp_max_rate, comp_median_rate FROM market_events WHERE event_type = 'competitor_intel' AND listing_id = 1;`

### `comp_max_rate`
**Description:** Highest competitor nightly rate (AED). `competitor_intel` rows only.
**SQL Query:** `SELECT comp_max_rate FROM market_events WHERE event_type = 'competitor_intel' AND listing_id = 1;`

### `comp_median_rate`
**Description:** Median competitor rate (AED). Use this to quickly gauge market mid-point when `benchmark_data` is unavailable. `competitor_intel` rows only.
**SQL Query:** `SELECT comp_median_rate FROM market_events WHERE event_type = 'competitor_intel' AND listing_id = 1;`

### `positioning_verdict`
**Description:** AI pricing verdict: `'UNDERPRICED'`, `'FAIR'`, `'SLIGHTLY_ABOVE'`, `'OVERPRICED'`. `positioning` rows only.
**SQL Query:** `SELECT positioning_verdict, positioning_percentile FROM market_events WHERE event_type = 'positioning' AND listing_id = 1;`

### `positioning_percentile`
**Description:** Integer 0-100. Where the property price sits vs comparable listings. `positioning` rows only.
**SQL Query:** `SELECT positioning_percentile FROM market_events WHERE event_type = 'positioning' AND listing_id = 1;`

### `demand_trend`
**Description:** Demand direction: `'strong'`, `'moderate'`, `'weak'`. `demand_outlook` rows only.
**SQL Query:** `SELECT demand_trend, description FROM market_events WHERE event_type = 'demand_outlook' AND listing_id = 1;`

### `created_at`
**Description:** Timestamp when this signal was saved.
**SQL Query:** `SELECT created_at FROM market_events ORDER BY created_at DESC LIMIT 1;`

# Table: `benchmark_data`

**Table Description:** The competitor pricing intelligence store. Populated during the **Setup phase** when the Benchmark Agent (Agent 7) searches Airbnb, Booking.com, and Vrbo in real-time for comparable properties (same area + bedroom count). **One row per listing + date range** — the full benchmark in a single, clean record. Individual competitor listings are stored in the `comps` JSONB array within that row. All agents use `p50_rate` as the primary pricing anchor and `recommended_weekday`/`recommended_weekend`/`recommended_event` as the AI rate targets. Re-running "Market Analysis" **replaces** the row for that listing+date range.

### `id`
**Description:** Primary key.
**SQL Query:** `SELECT id FROM benchmark_data LIMIT 5;`

### `listing_id`
**Description:** FK to `listings`. Always required — benchmark is always property-scoped.
**SQL Query:** `SELECT * FROM benchmark_data WHERE listing_id = 1;`

### `date_from` / `date_to`
**Description:** The Setup date range the benchmark covers.
**SQL Query:** `SELECT date_from, date_to FROM benchmark_data WHERE listing_id = 1;`

### `sample_size`
**Description:** Number of comps the benchmark is based on. Higher = more reliable.
**SQL Query:** `SELECT sample_size FROM benchmark_data WHERE listing_id = 1;`

### `p25_rate`
**Description:** 25th percentile competitor rate (AED). Budget tier. PriceGuard flags proposals below this as revenue risk.
**SQL Query:** `SELECT p25_rate, p50_rate, p75_rate, p90_rate FROM benchmark_data WHERE listing_id = 1;`

### `p50_rate`
**Description:** **Market median rate (AED). The primary pricing anchor for ALL agents.** Build all price proposals relative to this value.
**SQL Query:** `SELECT p50_rate FROM benchmark_data WHERE listing_id = 1;`

### `p75_rate`
**Description:** 75th percentile (AED). Premium tier target for high-rated, well-reviewed properties.
**SQL Query:** `SELECT p75_rate FROM benchmark_data WHERE listing_id = 1;`

### `p90_rate`
**Description:** 90th percentile (AED). Luxury/event-peak ceiling. PriceGuard flags proposals above this as occupancy risk.
**SQL Query:** `SELECT p90_rate FROM benchmark_data WHERE listing_id = 1;`

### `avg_weekday`
**Description:** Average weekday rate (AED) across all comps. Weekday baseline.
**SQL Query:** `SELECT avg_weekday, avg_weekend FROM benchmark_data WHERE listing_id = 1;`

### `avg_weekend`
**Description:** Average weekend rate (AED) across all comps. Weekend baseline.
**SQL Query:** `SELECT avg_weekend FROM benchmark_data WHERE listing_id = 1;`

### `your_price`
**Description:** The listing's `listings.price` captured at benchmark time. Use alongside `p50_rate` to understand relative positioning — compute gap in application code as `your_price - p50_rate`.
**SQL Query:** `SELECT your_price, p50_rate FROM benchmark_data WHERE listing_id = 1;`

### `percentile`
**Description:** 0-100. Where the property price sits vs all comps. E.g., 42 = priced below 58% of market.
**SQL Query:** `SELECT percentile, verdict FROM benchmark_data WHERE listing_id = 1;`

### `verdict`
**Description:** Pricing position: `'UNDERPRICED'` (below P25), `'FAIR'` (P25–P65), `'SLIGHTLY_ABOVE'` (P65–P85), `'OVERPRICED'` (above P85).
**SQL Query:** `SELECT verdict FROM benchmark_data WHERE listing_id = 1;`

> **Note:** `aed_gap` (difference between `your_price` and `p50_rate`) is **not stored** — compute it as `your_price::numeric - p50_rate::numeric` in SQL or `Number(yourPrice) - Number(p50Rate)` in application code.

### `rate_trend`
**Description:** Market direction: `'rising'`, `'stable'`, or `'falling'`.
**SQL Query:** `SELECT rate_trend, trend_pct FROM benchmark_data WHERE listing_id = 1;`

### `trend_pct`
**Description:** % change in competitor rates vs prior typical period (positive = market heating).
**SQL Query:** `SELECT rate_trend, trend_pct FROM benchmark_data WHERE listing_id = 1;`

### `recommended_weekday`
**Description:** Benchmark Agent's weekday rate recommendation (AED), anchored at P50–P60 across comps.
**SQL Query:** `SELECT recommended_weekday, recommended_weekend, recommended_event FROM benchmark_data WHERE listing_id = 1;`

### `recommended_weekend`
**Description:** Weekend rate recommendation (AED), anchored at P60–P75 across comps.
**SQL Query:** `SELECT recommended_weekend FROM benchmark_data WHERE listing_id = 1;`

### `recommended_event`
**Description:** Rate recommendation during high-impact events (AED), anchored at P75–P90 across comps.
**SQL Query:** `SELECT recommended_event FROM benchmark_data WHERE listing_id = 1;`

### `reasoning`
**Description:** Text explanation from the Benchmark Agent on how the recommended rates were derived.
**SQL Query:** `SELECT reasoning FROM benchmark_data WHERE listing_id = 1;`

### `comps`
**Description:** JSONB array of individual competitor listings. Each element has: `name`, `source`, `sourceUrl`, `rating`, `reviews`, `avgRate`, `weekdayRate`, `weekendRate`, `minRate`, `maxRate`. **Never query this with SQL predicates** — always fetch the full array and process in application code.
**SQL Query:**
```sql
-- Read all comps for a listing (process in code, not SQL)
SELECT comps FROM benchmark_data WHERE listing_id = 1;

-- Count comps without fetching
SELECT jsonb_array_length(comps) AS comp_count FROM benchmark_data WHERE listing_id = 1;
```

### `created_at`
**Description:** Timestamp when this benchmark row was saved.
**SQL Query:** `SELECT created_at FROM benchmark_data WHERE listing_id = 1;`

---

## Cross-Table Example Queries

### Events overlapping a date range with premium suggestions
```sql
SELECT title, start_date, end_date, expected_impact, suggested_premium
FROM market_events
WHERE listing_id = 1
  AND event_type IN ('event', 'holiday')
  AND start_date <= '2026-03-31' AND end_date >= '2026-03-01'
ORDER BY start_date;
```

### Demand outlook + competitor snapshot for a listing
```sql
SELECT event_type, title, demand_trend, comp_median_rate, description
FROM market_events
WHERE listing_id = 1
  AND event_type IN ('demand_outlook', 'competitor_intel');
```

### Benchmark vs current price
```sql
SELECT
  l.name,
  l.price AS current_price,
  b.p50_rate AS market_median,
  (b.your_price::numeric - b.p50_rate::numeric) AS aed_gap,  -- computed, not stored
  b.verdict,
  b.recommended_weekday,
  b.recommended_weekend,
  b.recommended_event,
  jsonb_array_length(b.comps) AS comp_count                  -- computed, not stored
FROM listings l
JOIN benchmark_data b ON b.listing_id = l.id
WHERE l.id = 1;
```

### Gap night pricing anchored to benchmark rates
```sql
SELECT
  im.date,
  im.current_price,
  CASE
    WHEN EXTRACT(DOW FROM im.date::date) IN (5, 6, 0) THEN b.recommended_weekend
    ELSE b.recommended_weekday
  END AS benchmark_target,
  b.p50_rate,
  b.verdict
FROM inventory_master im
JOIN benchmark_data b ON b.listing_id = im.listing_id
WHERE im.listing_id = 1
  AND im.status = 'available'
  AND im.date BETWEEN '2026-03-01' AND '2026-03-31'
ORDER BY im.date;
```

### Full pricing picture: events + benchmark in one query
```sql
SELECT 'event' AS source_type, title AS label, start_date, end_date,
       expected_impact, CAST(suggested_premium AS text) AS rate_note
FROM market_events
WHERE listing_id = 1
  AND event_type IN ('event', 'holiday')
  AND start_date <= '2026-03-31' AND end_date >= '2026-03-01'
UNION ALL
SELECT 'benchmark' AS source_type,
       CONCAT('P50=AED ', p50_rate, ' | ', verdict) AS label,
       date_from, date_to,
       rate_trend,
       CONCAT('W/D AED ', recommended_weekday, ' | W/E AED ', recommended_weekend, ' | Event AED ', recommended_event)
FROM benchmark_data
WHERE listing_id = 1;
```
