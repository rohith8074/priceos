# PriceOS Database Schema — Complete Design Document

> **Version:** 2.0 | **Updated:** 2026-02-18  
> **ORM:** Drizzle ORM (PostgreSQL) | **DB:** Neon Serverless Postgres  
> **Design Goal:** Optimized for AI agent context retrieval and real-time revenue management

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI AGENT LAYER                              │
│  (Reads from ALL tables to build pricing context)               │
│                                                                 │
│  Context Window = listings + calendar + reservations + reviews  │
│                 + events + competitors + execution_history      │
└────────────────────────────┬────────────────────────────────────┘
                             │ SQL Queries
┌────────────────────────────▼────────────────────────────────────┐
│                   POSTGRESQL (Neon)                              │
│                                                                 │
│  ┌─────────┐  ┌──────────┐  ┌──────────────┐  ┌────────────┐  │
│  │listings │←─│calendar  │  │reservations  │  │reviews     │  │
│  │         │←─│_days     │  │              │  │            │  │
│  │         │←─│proposals │  │              │  │            │  │
│  │         │←─│seasonal  │  │              │  │            │  │
│  │         │  │_rules    │  │              │  │            │  │
│  └────┬────┘  └──────────┘  └──────┬───────┘  └────────────┘  │
│       │                            │                            │
│  ┌────▼────┐  ┌──────────┐  ┌──────▼───────┐  ┌────────────┐  │
│  │tasks   │  │expenses  │  │conversations │  │events      │  │
│  │        │  │          │  │              │  │            │  │
│  └────────┘  └──────────┘  └──────────────┘  └────────────┘  │
│                                                                 │
│  ┌────────────┐  ┌───────────────┐  ┌─────────────────────┐   │
│  │executions  │  │chat_messages  │  │competitor_signals   │   │
│  │            │  │(AI Agent Log) │  │                     │   │
│  └────────────┘  └───────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Table of Contents

1. [Core Tables (Hostaway-Synced)](#1-core-tables)
2. [AI & Pricing Tables (PriceOS-Internal)](#2-ai--pricing-tables)
3. [Operations Tables](#3-operations-tables)
4. [Finance Tables](#4-finance-tables)
5. [Intelligence Tables (AI Context)](#5-intelligence-tables)
6. [System Tables](#6-system-tables)
7. [Index Strategy](#7-index-strategy)
8. [AI Agent Data Access Patterns](#8-ai-agent-data-access-patterns)
9. [Data Storage Optimization](#9-data-storage-optimization)

---

## 1. Core Tables (Hostaway-Synced)

### 1.1 `listings` — Property Inventory

The central table. Every other table references this.

| Column | Type | Nullable | Default | Source | AI Usage |
|--------|------|----------|---------|--------|----------|
| `id` | serial | PK | auto | — | Join key |
| `hostaway_id` | integer | NOT NULL | — | Hostaway `id` | API mapping |
| `name` | text | NOT NULL | — | Hostaway `name` | Context label |
| `internal_name` | text | YES | — | Hostaway `internalListingName` | Internal ref |
| `description` | text | YES | — | Hostaway `description` | Sentiment |
| `city` | text | NOT NULL | 'Dubai' | Hostaway `city` | Market grouping |
| `country_code` | varchar(3) | NOT NULL | 'AE' | Hostaway `countryCode` | — |
| `area` | text | NOT NULL | — | **PriceOS** custom | ⭐ Compset grouping |
| `address` | text | YES | — | Hostaway `address` | Location |
| `lat` | numeric(10,7) | YES | — | Hostaway `lat` | ⭐ Geo-compset |
| `lng` | numeric(10,7) | YES | — | Hostaway `lng` | ⭐ Geo-compset |
| `bedrooms_number` | integer | NOT NULL | 0 | Hostaway `bedroomsNumber` | ⭐ Property matching |
| `bathrooms_number` | integer | NOT NULL | 1 | Hostaway `bathroomsNumber` | Property matching |
| `property_type` | text | NOT NULL | — | Hostaway `propertyTypeId` mapped | ⭐ Compset filter |
| `property_type_id` | integer | YES | — | Hostaway `propertyTypeId` | API ref |
| `person_capacity` | integer | YES | — | Hostaway `personCapacity` | Capacity analysis |
| `price` | numeric(10,2) | NOT NULL | — | Hostaway `price` | ⭐ Base price |
| `currency_code` | varchar(3) | NOT NULL | 'AED' | Hostaway `currencyCode` | Normalization |
| `price_floor` | numeric(10,2) | NOT NULL | — | **PriceOS** | ⭐ AI guardrail |
| `price_ceiling` | numeric(10,2) | NOT NULL | — | **PriceOS** | ⭐ AI guardrail |
| `cleaning_fee` | numeric(10,2) | YES | — | Hostaway `cleaningFee` | Revenue calc |
| `min_nights` | integer | YES | 1 | Hostaway `minNights` | Availability |
| `max_nights` | integer | YES | 365 | Hostaway `maxNights` | Availability |
| `check_in_time` | integer | YES | — | Hostaway `checkInTimeStart` | Operations |
| `check_out_time` | integer | YES | — | Hostaway `checkOutTime` | Operations |
| `star_rating` | numeric(2,1) | YES | — | Hostaway `starRating` | ⭐ Quality score |
| `avg_review_rating` | numeric(3,2) | YES | — | Hostaway `averageReviewRating` | ⭐ Quality score |
| `amenities` | jsonb | YES | [] | Hostaway `listingAmenities` | Feature matching |
| `images` | jsonb | YES | [] | Hostaway `listingImages` | UI display |
| `cancellation_policy` | text | YES | — | Hostaway `cancellationPolicy` | Pricing factor |
| `channel_urls` | jsonb | YES | {} | airbnb/vrbo URLs | Channel tracking |
| `external_data` | jsonb | YES | — | Raw Hostaway JSON | Debug/fallback |
| `is_active` | boolean | NOT NULL | true | — | Active filter |
| `last_synced_at` | timestamp | YES | — | Sync tracking | Freshness |
| `created_at` | timestamp | NOT NULL | now() | — | — |
| `updated_at` | timestamp | YES | — | — | Change tracking |

**Why this design:**
- `hostaway_id` separated from `id` — our PK is stable even if Hostaway IDs change
- `area` is PriceOS-specific for Dubai sub-market grouping (Marina, Downtown, JBR, etc.)
- `price_floor` / `price_ceiling` are AI guardrails — the engine NEVER proposes outside these
- `external_data` stores the full Hostaway JSON for data we might need later without schema migration
- `lat/lng` enables geo-proximity competitor grouping

---

### 1.2 `calendar_days` — Daily Availability & Pricing

One row per listing per date. This is the **highest-volume table**.

| Column | Type | Nullable | Default | Source | AI Usage |
|--------|------|----------|---------|--------|----------|
| `id` | serial | PK | auto | — | — |
| `listing_id` | integer FK→listings | NOT NULL | — | — | Join |
| `date` | date | NOT NULL | — | Hostaway `date` | ⭐ Date matching |
| `status` | text | NOT NULL | 'available' | Hostaway `status` | ⭐ Occupancy calc |
| `price` | numeric(10,2) | NOT NULL | — | Hostaway `price` | ⭐ Current price |
| `minimum_stay` | integer | YES | 1 | Hostaway `minimumStay` | Stay rules |
| `maximum_stay` | integer | YES | 30 | Hostaway `maximumStay` | Stay rules |
| `is_available` | boolean | NOT NULL | true | Hostaway `isAvailable` | Quick filter |
| `block_reason` | text | YES | — | PriceOS | Operations |
| `notes` | text | YES | — | Hostaway `note` | Context |
| `reservation_id` | integer FK→reservations | YES | — | Linked booking | Cross-ref |
| `synced_at` | timestamp | YES | — | — | Freshness |

**Unique Constraint:** `(listing_id, date)` — one row per listing per day  
**Estimated Volume:** 15 listings × 365 days = **~5,475 rows** (manageable)

**Status values:** `available`, `booked`, `blocked`, `pending`, `maintenance`

---

### 1.3 `reservations` — Booking Records

| Column | Type | Nullable | Default | Source | AI Usage |
|--------|------|----------|---------|--------|----------|
| `id` | serial | PK | auto | — | — |
| `hostaway_id` | integer | NOT NULL UNIQUE | — | Hostaway `id` | Dedup |
| `listing_map_id` | integer FK→listings | NOT NULL | — | Hostaway `listingMapId` | ⭐ Property link |
| `guest_name` | text | NOT NULL | — | Hostaway `guestName` | Display |
| `guest_email` | text | YES | — | Hostaway `guestEmail` | Contact |
| `guest_phone` | text | YES | — | Hostaway `phone` | Contact |
| `channel_name` | text | NOT NULL | — | Hostaway `channelName` | ⭐ Channel mix |
| `channel_id` | integer | YES | — | Hostaway `channelId` | API ref |
| `confirmation_code` | text | YES | — | Hostaway `confirmationCode` | Reference |
| `arrival_date` | date | NOT NULL | — | Hostaway `arrivalDate` | ⭐ Occupancy |
| `departure_date` | date | NOT NULL | — | Hostaway `departureDate` | ⭐ Occupancy |
| `nights` | integer | NOT NULL | — | Hostaway `nights` | ⭐ LOS analysis |
| `total_price` | numeric(10,2) | NOT NULL | — | Hostaway `totalPrice` | ⭐ Revenue |
| `price_per_night` | numeric(10,2) | NOT NULL | — | Computed | ⭐ ADR |
| `number_of_guests` | integer | YES | — | Hostaway `numberOfGuests` | Capacity |
| `adults` | integer | YES | — | Hostaway `adults` | Guest mix |
| `children` | integer | YES | — | Hostaway `children` | Guest mix |
| `status` | text | NOT NULL | 'confirmed' | Hostaway `status` | ⭐ Active filter |
| `check_in_time` | text | YES | — | Hostaway `checkInTime` | Operations |
| `check_out_time` | text | YES | — | Hostaway `checkOutTime` | Operations |
| `cleaning_fee` | numeric(10,2) | YES | — | Hostaway `cleaningFee` | Net revenue |
| `tax_amount` | numeric(10,2) | YES | — | Hostaway `taxAmount` | Net revenue |
| `channel_commission` | numeric(10,2) | YES | — | Hostaway `channelCommissionAmount` | ⭐ Net revenue |
| `finance_breakdown` | jsonb | YES | — | Hostaway `financeField` | Full breakdown |
| `host_note` | text | YES | — | Hostaway `hostNote` | Internal |
| `external_data` | jsonb | YES | — | Raw Hostaway JSON | Debug |
| `reservation_date` | timestamp | YES | — | Hostaway `reservationDate` | ⭐ Lead time |
| `synced_at` | timestamp | YES | — | — | Freshness |
| `created_at` | timestamp | NOT NULL | now() | — | — |

**AI uses reservations for:** Booking velocity, lead time analysis, channel mix optimization, ADR trends, revenue pacing.

---

### 1.4 `reviews` — Guest Feedback (NEW)

| Column | Type | Nullable | Default | Source | AI Usage |
|--------|------|----------|---------|--------|----------|
| `id` | serial | PK | auto | — | — |
| `hostaway_id` | integer | NOT NULL UNIQUE | — | Hostaway `id` | Dedup |
| `listing_map_id` | integer FK→listings | NOT NULL | — | Hostaway `listingMapId` | Property link |
| `reservation_id` | integer FK→reservations | YES | — | Hostaway `reservationId` | Booking link |
| `channel_id` | integer | YES | — | Hostaway `channelId` | Source |
| `type` | text | NOT NULL | — | `guest-to-host` or `host-to-guest` | Direction |
| `status` | text | YES | — | `awaiting`, `submitted`, `expired` | State |
| `rating` | numeric(3,1) | YES | — | Hostaway `rating` | ⭐ Quality score |
| `public_review` | text | YES | — | Hostaway `publicReview` | ⭐ Sentiment input |
| `private_feedback` | text | YES | — | Hostaway `privateFeedback` | Quality alerts |
| `host_response` | text | YES | — | Hostaway `revieweeResponse` | Response tracking |
| `review_categories` | jsonb | YES | — | Hostaway `reviewCategory` | ⭐ Category scores |
| `arrival_date` | date | YES | — | Hostaway `arrivalDate` | Temporal context |
| `departure_date` | date | YES | — | Hostaway `departureDate` | Stay context |
| `guest_name` | text | YES | — | Hostaway `guestName` | Display |
| `synced_at` | timestamp | YES | — | — | Freshness |
| `created_at` | timestamp | NOT NULL | now() | — | — |

**AI uses reviews for:** Computing a **Quality Score** that modifies pricing power. Higher-rated properties can sustain higher prices.

---

## 2. AI & Pricing Tables (PriceOS-Internal)

### 2.1 `proposals` — AI Price Recommendations

| Column | Type | Nullable | Default | Source | AI Usage |
|--------|------|----------|---------|--------|----------|
| `id` | serial | PK | auto | — | — |
| `cycle_id` | text | NOT NULL | — | Revenue cycle run ID | Batch grouping |
| `listing_id` | integer FK→listings | NOT NULL | — | Target listing | — |
| `date` | date | NOT NULL | — | Target date | — |
| `current_price` | numeric(10,2) | NOT NULL | — | Price at generation time | Comparison |
| `proposed_price` | numeric(10,2) | NOT NULL | — | AI recommendation | — |
| `change_pct` | integer | NOT NULL | 0 | % change | Risk indicator |
| `risk_level` | text | NOT NULL | 'low' | `low/medium/high` | ⭐ Auto-approve gate |
| `status` | text | NOT NULL | 'pending' | `pending/approved/rejected/executed` | Workflow |
| `reasoning` | text | YES | — | AI explanation | ⭐ Audit trail |
| `signals` | jsonb | YES | {} | Events, demand, competition data | ⭐ Full context |
| `guardrails_applied` | jsonb | YES | [] | Which guardrails fired | Safety audit |
| `approved_by` | text | YES | — | User who approved | Audit |
| `approved_at` | timestamp | YES | — | Approval time | Audit |
| `created_at` | timestamp | NOT NULL | now() | — | — |

### 2.2 `executions` — Price Push Audit Log

| Column | Type | Nullable | Default | Source |
|--------|------|----------|---------|--------|
| `id` | serial | PK | auto | — |
| `proposal_id` | integer FK→proposals | NOT NULL | — | Source proposal |
| `listing_id` | integer FK→listings | NOT NULL | — | Target listing |
| `date_range_start` | date | NOT NULL | — | Affected start |
| `date_range_end` | date | NOT NULL | — | Affected end |
| `old_price` | numeric(10,2) | NOT NULL | — | Before |
| `new_price` | numeric(10,2) | NOT NULL | — | After |
| `sync_status` | text | NOT NULL | 'pending' | `pending/synced/failed/verified` |
| `hostaway_response` | jsonb | YES | — | API response |
| `verified_at` | timestamp | YES | — | Post-push verification |
| `created_at` | timestamp | NOT NULL | now() | — |

### 2.3 `revenue_cycles` — AI Run History (NEW)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | serial | PK | auto |
| `cycle_id` | text | NOT NULL UNIQUE | — |
| `properties` | jsonb | NOT NULL | — |
| `date_range_start` | date | NOT NULL | — |
| `date_range_end` | date | NOT NULL | — |
| `total_proposals` | integer | NOT NULL | 0 |
| `approved_count` | integer | NOT NULL | 0 |
| `rejected_count` | integer | NOT NULL | 0 |
| `avg_price_change` | integer | YES | — |
| `occupancy_rate` | integer | YES | — |
| `aggregated_data` | jsonb | YES | — |
| `execution_time_ms` | integer | YES | — |
| `created_at` | timestamp | NOT NULL | now() |

**Why this table:** Gives the AI agent historical context on past pricing decisions and their outcomes.

---

## 3. Operations Tables

### 3.1 `conversations` & `conversation_messages`

Same as current schema. Key fields for AI: `guest_name`, `unread_count`, `listing_id`, `reservation_id`.

### 3.2 `tasks`

Same as current schema. Key fields for AI: `status`, `priority`, `category`, `due_date`, `listing_id`.

### 3.3 `message_templates`

Same as current schema. Used by inbox for quick replies.

### 3.4 `seasonal_rules`

Same as current schema. Key fields for AI: `start_date`, `end_date`, `price_modifier`, `minimum_stay`.

---

## 4. Finance Tables

### 4.1 `expenses`

Current schema + add `hostaway_id` (integer, nullable) and `type` (text: 'expense' or 'extra').

### 4.2 `owner_statements`

Current schema + add `hostaway_id` (integer, nullable) and `statement_name` (text).

---

## 5. Intelligence Tables (AI Context)

### 5.1 `events` — Market Events (NEW)

| Column | Type | Nullable | Default | AI Usage |
|--------|------|----------|---------|----------|
| `id` | text | PK | — | Unique event ID |
| `name` | text | NOT NULL | — | ⭐ Event name |
| `description` | text | YES | — | Context |
| `start_date` | date | NOT NULL | — | ⭐ Date overlap |
| `end_date` | date | NOT NULL | — | ⭐ Date overlap |
| `location` | text | YES | — | Area impact |
| `category` | text | NOT NULL | — | `festival/conference/sports/cultural/religious` |
| `demand_impact` | text | NOT NULL | — | ⭐ `low/medium/high/extreme` |
| `demand_notes` | text | YES | — | ⭐ Impact reasoning |
| `confidence` | numeric(3,2) | NOT NULL | 1.0 | Signal reliability |
| `source_url` | text | YES | — | Attribution |
| `is_recurring` | boolean | NOT NULL | false | Annual events |
| `created_at` | timestamp | NOT NULL | now() | — |

### 5.2 `competitor_signals` — Market Intelligence (NEW)

| Column | Type | Nullable | Default | AI Usage |
|--------|------|----------|---------|----------|
| `id` | text | PK | — | Signal ID |
| `area` | text | NOT NULL | — | ⭐ Dubai sub-area |
| `start_date` | date | NOT NULL | — | ⭐ Date range |
| `end_date` | date | NOT NULL | — | ⭐ Date range |
| `signal` | text | NOT NULL | — | ⭐ `compression/release` |
| `confidence` | numeric(3,2) | NOT NULL | — | Reliability |
| `reasoning` | text | YES | — | ⭐ Market explanation |
| `available_units` | integer | YES | — | Supply metric |
| `average_price` | numeric(10,2) | YES | — | ⭐ Market rate |
| `price_change_pct` | numeric(5,2) | YES | — | ⭐ Trend |
| `occupancy_rate` | integer | YES | — | ⭐ Market occupancy |
| `source` | text | YES | — | `market_analysis/competitor_scrape/booking_velocity` |
| `created_at` | timestamp | NOT NULL | now() | — |

---

## 6. System Tables

### 6.1 `chat_messages` — AI Agent Conversation Log

Current schema. This table records all user↔AI interactions for context continuity.

### 6.2 `sync_log` — Data Sync Audit (NEW)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | serial | PK | auto |
| `entity_type` | text | NOT NULL | — |
| `entity_count` | integer | NOT NULL | 0 |
| `status` | text | NOT NULL | — |
| `error_message` | text | YES | — |
| `duration_ms` | integer | YES | — |
| `started_at` | timestamp | NOT NULL | now() |
| `completed_at` | timestamp | YES | — |

**Tracks:** `listings`, `calendar`, `reservations`, `reviews`, `conversations`, `tasks`, `expenses`

---

## 7. Index Strategy

### Critical Indexes (Performance-Essential)

```sql
-- Calendar: Most-queried table
CREATE UNIQUE INDEX calendar_listing_date_uniq ON calendar_days(listing_id, date);
CREATE INDEX calendar_status_idx ON calendar_days(status) WHERE status = 'available';
CREATE INDEX calendar_date_range_idx ON calendar_days(date) WHERE is_available = true;

-- Reservations: Date range + channel queries
CREATE INDEX reservations_listing_idx ON reservations(listing_map_id);
CREATE INDEX reservations_dates_idx ON reservations(arrival_date, departure_date);
CREATE INDEX reservations_status_idx ON reservations(status);
CREATE INDEX reservations_channel_idx ON reservations(channel_name);
CREATE INDEX reservations_created_idx ON reservations(reservation_date);

-- Proposals: Status workflow
CREATE INDEX proposals_listing_date_idx ON proposals(listing_id, date);
CREATE INDEX proposals_status_idx ON proposals(status);
CREATE INDEX proposals_cycle_idx ON proposals(cycle_id);

-- Events & Competitors: Date overlap queries
CREATE INDEX events_dates_idx ON events(start_date, end_date);
CREATE INDEX events_impact_idx ON events(demand_impact);
CREATE INDEX competitors_area_dates_idx ON competitor_signals(area, start_date, end_date);

-- Reviews: Quality score aggregation
CREATE INDEX reviews_listing_idx ON reviews(listing_map_id);
CREATE INDEX reviews_rating_idx ON reviews(rating) WHERE rating IS NOT NULL;
```

---

## 8. AI Agent Data Access Patterns

### Pattern 1: Pricing Context Build (Every Revenue Cycle)

```sql
-- The AI agent builds context by joining these tables:
SELECT l.*, 
       AVG(r.rating) as quality_score,
       COUNT(res.id) as recent_bookings,
       AVG(res.price_per_night) as avg_adr
FROM listings l
LEFT JOIN reviews r ON r.listing_map_id = l.id AND r.rating IS NOT NULL
LEFT JOIN reservations res ON res.listing_map_id = l.id 
  AND res.arrival_date >= CURRENT_DATE - INTERVAL '90 days'
WHERE l.is_active = true
GROUP BY l.id;
```

### Pattern 2: Occupancy Gap Detection

```sql
SELECT cd.listing_id, cd.date, cd.price, cd.status
FROM calendar_days cd
WHERE cd.date BETWEEN CURRENT_DATE AND CURRENT_DATE + 90
  AND cd.status = 'available'
  AND cd.listing_id = ?
ORDER BY cd.date;
```

### Pattern 3: Event-Aware Pricing

```sql
SELECT e.*, cs.*
FROM events e
LEFT JOIN competitor_signals cs 
  ON cs.start_date <= e.end_date AND cs.end_date >= e.start_date
WHERE e.start_date <= ? AND e.end_date >= ?
  AND e.demand_impact IN ('high', 'extreme');
```

### Pattern 4: Execution Feedback Loop

```sql
-- AI checks past decisions to learn what worked
SELECT p.proposed_price, p.change_pct, p.risk_level,
       e.sync_status, 
       res.total_price as actual_revenue
FROM proposals p
JOIN executions e ON e.proposal_id = p.id
LEFT JOIN reservations res ON res.listing_map_id = p.listing_id
  AND res.arrival_date = p.date
WHERE p.created_at >= CURRENT_DATE - INTERVAL '30 days';
```

---

## 9. Data Storage Optimization

### JSONB vs Normalized Columns

| Data | Storage | Reason |
|------|---------|--------|
| Amenities | JSONB array | Rarely queried individually, variable length |
| Images | JSONB array | Display-only, never filtered |
| Finance breakdown | JSONB | Complex nested structure, varies per channel |
| Signals (proposals) | JSONB | AI context blob, not queried independently |
| External data | JSONB | Full Hostaway backup, schema-free |
| Channel name | TEXT column | ⚠️ Frequently filtered/grouped — must be indexed |
| Rating | NUMERIC column | ⚠️ Aggregated for quality score — must be queryable |
| Dates | DATE columns | ⚠️ Range queries critical — must be indexed |

### Data Retention Policy

| Table | Retention | Reason |
|-------|-----------|--------|
| `calendar_days` | Rolling 365 days | Only future + recent past needed |
| `reservations` | 2 years | Revenue trend analysis |
| `proposals` | 1 year | AI feedback loop |
| `executions` | 1 year | Audit trail |
| `chat_messages` | 90 days | Context window |
| `reviews` | Indefinite | Quality score history |
| `events` | Indefinite | Recurring event patterns |
| `competitor_signals` | 1 year | Market trend analysis |
| `sync_log` | 30 days | Debugging only |

### Estimated Storage (15 properties)

| Table | Rows/Year | Avg Row Size | Annual Size |
|-------|-----------|-------------|-------------|
| listings | 15 | 2 KB | 30 KB |
| calendar_days | 5,475 | 200 B | 1.1 MB |
| reservations | 1,500 | 1 KB | 1.5 MB |
| reviews | 500 | 500 B | 250 KB |
| proposals | 50,000 | 500 B | 25 MB |
| executions | 10,000 | 300 B | 3 MB |
| events | 50 | 500 B | 25 KB |
| competitor_signals | 200 | 400 B | 80 KB |
| **Total** | | | **~31 MB/year** |

PostgreSQL handles this volume trivially. No sharding or partitioning needed.

---

## Complete Entity Relationship Diagram

```
listings (1) ←──── (N) calendar_days
    │
    ├──── (1:N) ──── reservations
    │                    │
    │                    ├──── (1:N) ──── reviews
    │                    │
    │                    └──── (1:1) ──── conversations
    │                                        │
    │                                        └──── (1:N) ──── conversation_messages
    │
    ├──── (1:N) ──── proposals
    │                    │
    │                    └──── (1:1) ──── executions
    │
    ├──── (1:N) ──── seasonal_rules
    │
    ├──── (1:N) ──── tasks
    │
    ├──── (1:N) ──── expenses
    │
    └──── (1:N) ──── owner_statements

events (standalone) ←── referenced by proposals.signals (JSONB)
competitor_signals (standalone) ←── referenced by proposals.signals (JSONB)
revenue_cycles (standalone) ←── groups proposals by cycle_id
chat_messages (standalone) ←── AI conversation log
sync_log (standalone) ←── system monitoring
```

---

## Summary: What Changed from Current Schema

| Change | Table | Why |
|--------|-------|-----|
| **ADD** `hostaway_id` | listings, reservations, reviews, expenses | Hostaway dedup, separate from internal PK |
| **ADD** `lat`, `lng` | listings | Geo-based competitor grouping |
| **ADD** `images`, `channel_urls` | listings | UI display + channel tracking |
| **ADD** `star_rating`, `avg_review_rating` | listings | Quality score for AI |
| **ADD** `is_active`, `updated_at` | listings | Lifecycle management |
| **NEW TABLE** `reviews` | — | Quality score for pricing engine |
| **NEW TABLE** `events` | — | Persist events (currently hardcoded mock) |
| **NEW TABLE** `competitor_signals` | — | Persist market data (currently mock) |
| **NEW TABLE** `revenue_cycles` | — | AI run history for feedback loop |
| **NEW TABLE** `sync_log` | — | Data freshness monitoring |
| **ADD** `cycle_id`, `guardrails_applied` | proposals | Batch grouping + safety audit |
| **ADD** `finance_breakdown`, `channel_commission` | reservations | Net revenue calculation |
| **ADD** `reservation_id` | calendar_days | Link booked days to bookings |
