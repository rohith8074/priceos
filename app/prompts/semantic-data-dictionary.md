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

# Table: `listings`

**Table Description:** The master property registry. Every short-term rental property managed by PriceOS is stored here. Each row represents one physical property. Always use this table as your primary anchor to grab property metadata. Use `price_floor` and `price_ceiling` explicitly to ensure your pricing bounds are respected. This table is primarily utilized by Agent 2 (Property Analyst), Agent 4 (Market Research) and Agent 5 (PriceGuard).

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
**Description:** A JSONB array containing simple string tags of the property's amenities (e.g., `["pool", "wifi", "gym"]`). Use JSONB operators to search.
**SQL Query:** `SELECT name, amenities FROM listings WHERE amenities ? 'pool';`

### `address`
**Description:** The full, human-readable street address of the property.
**SQL Query:** `SELECT name, address FROM listings WHERE id = 1;`

### `latitude`
**Description:** The geographical map latitude of the property for location plotting.
**SQL Query:** `SELECT latitude FROM listings WHERE id = 1;`

### `longitude`
**Description:** The geographical map longitude of the property for location plotting.
**SQL Query:** `SELECT longitude FROM listings WHERE id = 1;`

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

### `min_max_stay`
**Description:** A JSONB object dictating the minimum and maximum nights a guest is required to book if their stay includes this date. e.g. `{"min": 2, "max": 30}`
**SQL Query:** `SELECT date FROM inventory_master WHERE listing_id = 1 AND (min_max_stay->>'min')::int >= 3;`

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

# Table: `activity_timeline`

**Table Description:** The chronological event and transaction hub. This table uniquely stores both Guest Reservations AND local Market Events/Intelligence. The discriminator column `type` informs how to parse the deeply nested JSONB attributes. When looking for intelligence insights, depend on this table heavily. Agent 3 must filter conditionally for `type = 'reservation'`, while Agent 4 must rely on `type = 'market_event'`.

### `id`
**Description:** The primary key and unique internal identifier for the timeline event.
**SQL Query:** `SELECT id FROM activity_timeline LIMIT 5;`

### `listing_id`
**Description:** The foreign key connecting the event to a property. This field is populated for `reservation` types, but is strictly `NULL` for globally applicable `market_event` types.
**SQL Query:** `SELECT listing_id FROM activity_timeline WHERE type = 'reservation';`

### `type`
**Description:** The discriminator dictating the payload. It must be either `'reservation'` (handled by Agent 3) or `'market_event'` (handled by Agent 4).
**SQL Query:** `SELECT type, count(*) FROM activity_timeline GROUP BY type;`

### `start_date`
**Description:** The start boundary of the event. If `type='reservation'`, it's the check-in arrival date. If `type='market_event'`, it is the event jump-off date.
**SQL Query:** `SELECT start_date FROM activity_timeline WHERE type = 'market_event' AND title ILIKE '%Art Dubai%';`

### `end_date`
**Description:** The end boundary of the event. If `type='reservation'`, it's the check-out departure date. If `type='market_event'`, it is the event conclusion date.
**SQL Query:** `SELECT end_date FROM activity_timeline WHERE start_date >= CURRENT_DATE;`

### `title`
**Description:** The primary label. If `type='reservation'`, it holds the Guest's Name. If `type='market_event'`, it holds the Event Title (e.g. `'Gitex 2026'`).
**SQL Query:** `SELECT title FROM activity_timeline WHERE type = 'market_event';`

### `impact_score`
**Description:** An integer metric (0-100) scoring the anticipated market demand bump for a specific event. Used to judge whether to hike prices aggresively.
**SQL Query:** `SELECT title, impact_score FROM activity_timeline WHERE type = 'market_event' ORDER BY impact_score DESC;`

### `financials`
**Description:** A JSONB block **populated ONLY when `type = 'reservation'`**. Includes keys: `total_price`, `price_per_night`, `channel_commission`, `cleaning_fee`, `channel_name`, and `reservation_status`. Crucial for revenue math.
**SQL Query:** 
```sql
SELECT title AS guest_name, (financials->>'total_price')::numeric AS gross_revenue 
FROM activity_timeline 
WHERE type = 'reservation' AND listing_id = 1;
```

### `market_context`
**Description:** A JSONB block **populated ONLY when `type = 'market_event'`**. Includes intelligence flags like `event_type` ('event', 'holiday', 'competitor_intel'), `description`, `suggested_premium_pct`, `competitor_median_rate`, and `insight_verdict`.
**SQL Query:** 
```sql
SELECT title AS event_name, (market_context->>'event_type') AS sub_type, (market_context->>'suggested_premium_pct') AS premium 
FROM activity_timeline 
WHERE type = 'market_event' AND start_date >= '2026-03-01';
```
