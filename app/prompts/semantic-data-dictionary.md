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

**Table Description:** The AI-generated market intelligence store. Populated during the **Setup** phase when the Marketing Agent (Agent 6) searches the internet for Dubai events, holidays, competitor pricing, and market positioning. Each row is one market signal. Agent 4 (Market Research) reads from this table during chat. This data is ephemeral — it is cleared and re-populated on every Setup click.

### `id`
**Description:** The primary key and unique internal identifier for the market signal.
**SQL Query:** `SELECT id FROM market_events LIMIT 5;`

### `title`
**Description:** The name of the event, holiday, or intelligence record (e.g., 'Art Dubai 2026', 'Eid Al Fitr').
**SQL Query:** `SELECT title FROM market_events WHERE event_type = 'event';`

### `start_date`
**Description:** The start date of the event or applicable period.
**SQL Query:** `SELECT title, start_date FROM market_events WHERE start_date >= '2026-03-01';`

### `end_date`
**Description:** The end date of the event or applicable period.
**SQL Query:** `SELECT title, start_date, end_date FROM market_events WHERE event_type = 'holiday';`

### `event_type`
**Description:** The category of the market signal. Values: `'event'`, `'holiday'`, `'competitor_intel'`, `'positioning'`, `'market_summary'`.
**SQL Query:** `SELECT event_type, COUNT(*) FROM market_events GROUP BY event_type;`

### `location`
**Description:** The geographic location of the event (default: 'Dubai').
**SQL Query:** `SELECT title, location FROM market_events WHERE location = 'Dubai';`

### `expected_impact`
**Description:** The anticipated demand impact: 'high', 'medium', or 'low'.
**SQL Query:** `SELECT title, expected_impact FROM market_events WHERE expected_impact = 'high';`

### `confidence`
**Description:** An integer score (0-100) representing the confidence level of the AI in this data point.
**SQL Query:** `SELECT title, confidence FROM market_events WHERE confidence >= 80 ORDER BY confidence DESC;`

### `description`
**Description:** A text description of the event or market insight.
**SQL Query:** `SELECT title, description FROM market_events WHERE event_type = 'event' AND title ILIKE '%Art Dubai%';`

### `source`
**Description:** The source URL or attribution for the data (e.g., a website link or "Lyzr Marketing Agent").
**SQL Query:** `SELECT title, source FROM market_events WHERE source IS NOT NULL;`

### `suggested_premium`
**Description:** The suggested price premium percentage for this event (e.g., 15.00 means +15%).
**SQL Query:**
```sql
SELECT title, suggested_premium
FROM market_events
WHERE event_type = 'event' AND suggested_premium > 0
ORDER BY suggested_premium DESC;
```

### `competitor_median`
**Description:** The median competitor rate in AED, sourced from Airbnb/Booking.com research.
**SQL Query:**
```sql
SELECT competitor_median
FROM market_events
WHERE event_type = 'competitor_intel';
```

### `metadata`
**Description:** A small JSONB catch-all for variable AI data like competitor examples array or positioning details. Only used for fields that genuinely have no fixed schema.
**SQL Query:**
```sql
SELECT metadata->>'verdict' AS verdict
FROM market_events
WHERE event_type = 'positioning';
```

### `created_at`
**Description:** The timestamp when this record was saved during Setup.
**SQL Query:** `SELECT created_at FROM market_events ORDER BY created_at DESC LIMIT 1;`

---

## Cross-Table Example Queries

### Total revenue by channel for a property
```sql
SELECT channel_name, SUM(total_price) AS revenue, COUNT(*) AS bookings
FROM reservations
WHERE listing_id = 1 AND reservation_status = 'confirmed'
GROUP BY channel_name;
```

### Available gap nights with no reservation
```sql
SELECT im.date, im.current_price, im.min_stay
FROM inventory_master im
WHERE im.listing_id = 1
  AND im.status = 'available'
  AND im.date BETWEEN '2026-03-01' AND '2026-03-31'
ORDER BY im.date;
```

### Events overlapping a date range with premium suggestions
```sql
SELECT title, start_date, end_date, expected_impact, suggested_premium
FROM market_events
WHERE event_type IN ('event', 'holiday')
  AND start_date <= '2026-03-31' AND end_date >= '2026-03-01'
ORDER BY start_date;
```

### Property occupancy rate (30-day window)
```sql
SELECT
  listing_id,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status IN ('reserved', 'booked'))
    / NULLIF(COUNT(*) - COUNT(*) FILTER (WHERE status = 'blocked'), 0), 0) AS occupancy_pct
FROM inventory_master
WHERE date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
GROUP BY listing_id;
```
