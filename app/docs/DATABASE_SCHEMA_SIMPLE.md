# PriceOS Database Schema — Easy-to-Read Version

> **This is the simplified version of [`DATABASE_SCHEMA_DESIGN.md`](./DATABASE_SCHEMA_DESIGN.md)**  
> Same tables, same columns — just easier to understand.  
> ✅ = exists in current DB  |  🆕 = planned addition

---

## How Everything Connects

```
                           ┌──────────────┐
                           │  🏠 LISTINGS  │  ← The hub. Everything connects here.
                           │   (34 cols)   │
                           └───────┬───────┘
                                   │
        ┌──────────┬───────────┬───┼───┬──────────┬──────────┬──────────┐
        ▼          ▼           ▼   ▼   ▼          ▼          ▼          ▼
   📅 calendar  🏨 reserv   📝 tasks  📐 rules  💸 expenses 📊 owner  🎯 proposals
    (12 cols)   (22 cols)   (11 cols) (10 cols)  (8 cols)  (9 cols)   (14 cols)
                   │                                                      │
              ┌────┼────┐                                            ✅ executions
              ▼    ▼    ▼                                              (11 cols)
         ⭐ reviews 💬 convos
          (17 cols) (12 cols)
                       │
                  📩 messages
                   (6 cols)

         Standalone (not linked to one property):
         🌍 events (13 cols) | 📈 competitors (13 cols) | 🤖 chat (8 cols)
         🔄 revenue_cycles (12 cols) | 📋 sync_log (8 cols) | 📝 templates (5 cols)
```

---

## 📊 Quick Summary: All 17 Tables

| # | Table | Cols | Source | Status | Purpose |
|---|-------|------|--------|--------|---------|
| 1 | `listings` | 34 | Hostaway | ✅ exists (partial) | Properties you manage |
| 2 | `calendar_days` | 12 | Hostaway | ✅ exists (partial) | Daily price & availability |
| 3 | `reservations` | 22 | Hostaway | ✅ exists (partial) | Guest bookings |
| 4 | `reviews` | 17 | Hostaway | 🆕 **new table** | Guest ratings & feedback |
| 5 | `proposals` | 14 | PriceOS AI | ✅ exists (partial) | AI price suggestions |
| 6 | `executions` | 11 | PriceOS | ✅ exists (partial) | Price push audit trail |
| 7 | `revenue_cycles` | 12 | PriceOS AI | 🆕 **new table** | AI run history |
| 8 | `conversations` | 12 | Hostaway | ✅ exists | Guest chat threads |
| 9 | `conversation_messages` | 6 | Hostaway | ✅ exists | Individual messages |
| 10 | `tasks` | 11 | Hostaway | ✅ exists | Cleaning, maintenance |
| 11 | `message_templates` | 5 | Hostaway | ✅ exists | Quick reply templates |
| 12 | `seasonal_rules` | 10 | Hostaway | ✅ exists | Pricing rules per season |
| 13 | `expenses` | 8 | Hostaway | ✅ exists (partial) | Costs & bills |
| 14 | `owner_statements` | 9 | Hostaway | ✅ exists (partial) | Monthly P&L reports |
| 15 | `events` | 13 | PriceOS team | 🆕 **new table** | Dubai market events |
| 16 | `competitor_signals` | 13 | Market analysis | 🆕 **new table** | Competitor pricing data |
| 17 | `chat_messages` | 8 | PriceOS AI chat | ✅ exists | User ↔ AI conversations |
| — | `sync_log` | 8 | System | 🆕 **new table** | Data sync monitoring |

---

## Table 1: 🏠 LISTINGS — Property Inventory

> **The central table.** Every other table points back here.
> **Source:** Hostaway `GET /v1/listings`

| # | Column | Type | Required? | Default | Where it comes from | What AI uses it for |
|---|--------|------|-----------|---------|---------------------|---------------------|
| 1 | `id` | serial | PK | auto | — | Join key for all queries |
| 2 | `hostaway_id` | integer | ✅ required | — | Hostaway `id` | Maps to API calls |
| 3 | `name` | text | ✅ required | — | Hostaway `name` | Shows in proposals as label |
| 4 | `internal_name` | text | optional | — | Hostaway `internalListingName` | Internal team reference |
| 5 | `description` | text | optional | — | Hostaway `description` | Sentiment analysis |
| 6 | `city` | text | ✅ required | `'Dubai'` | Hostaway `city` | Groups properties by market |
| 7 | `country_code` | varchar(3) | ✅ required | `'AE'` | Hostaway `countryCode` | — |
| 8 | `area` | text | ✅ required | — | **We set this** (not Hostaway) | ⭐ Groups competitors by neighborhood (Marina, Downtown, JBR) |
| 9 | `address` | text | optional | — | Hostaway `address` | Location context |
| 10 | `lat` | numeric(10,7) | optional | — | Hostaway `lat` | ⭐ Finds nearby competitors on map |
| 11 | `lng` | numeric(10,7) | optional | — | Hostaway `lng` | ⭐ Finds nearby competitors on map |
| 12 | `bedrooms_number` | integer | ✅ required | `0` | Hostaway `bedroomsNumber` | ⭐ Matches with similar properties |
| 13 | `bathrooms_number` | integer | ✅ required | `1` | Hostaway `bathroomsNumber` | Property matching |
| 14 | `property_type` | text | ✅ required | — | Hostaway `propertyTypeId` (mapped to text) | ⭐ Compares apartment vs villa vs studio |
| 15 | `property_type_id` | integer | optional | — | Hostaway `propertyTypeId` | API reference |
| 16 | `person_capacity` | integer | optional | — | Hostaway `personCapacity` | Capacity analysis |
| 17 | `price` | numeric(10,2) | ✅ required | — | Hostaway `price` | ⭐ The base nightly price |
| 18 | `currency_code` | varchar(3) | ✅ required | `'AED'` | Hostaway `currencyCode` | Currency normalization |
| 19 | `price_floor` | numeric(10,2) | ✅ required | — | **We set this** | ⭐ AI NEVER goes below this (safety net) |
| 20 | `price_ceiling` | numeric(10,2) | ✅ required | — | **We set this** | ⭐ AI NEVER goes above this (safety net) |
| 21 | `cleaning_fee` | numeric(10,2) | optional | — | Hostaway `cleaningFee` | Revenue calculation |
| 22 | `min_nights` | integer | optional | `1` | Hostaway `minNights` | Availability rules |
| 23 | `max_nights` | integer | optional | `365` | Hostaway `maxNights` | Availability rules |
| 24 | `check_in_time` | integer | optional | — | Hostaway `checkInTimeStart` | Operations scheduling |
| 25 | `check_out_time` | integer | optional | — | Hostaway `checkOutTime` | Operations scheduling |
| 26 | `star_rating` | numeric(2,1) | optional | — | Hostaway `starRating` | ⭐ Quality score: higher rating → can charge more |
| 27 | `avg_review_rating` | numeric(3,2) | optional | — | Hostaway `averageReviewRating` | ⭐ Quality score: higher rating → can charge more |
| 28 | `amenities` | jsonb | optional | `[]` | Hostaway `listingAmenities` | Feature matching with competitors |
| 29 | `images` | jsonb | optional | `[]` | Hostaway `listingImages` | UI display only |
| 30 | `cancellation_policy` | text | optional | — | Hostaway `cancellationPolicy` | Pricing factor (strict = higher price) |
| 31 | `channel_urls` | jsonb | optional | `{}` | Airbnb/VRBO listing URLs | Channel tracking |
| 32 | `external_data` | jsonb | optional | — | Raw Hostaway JSON (full response) | Fallback: if we need a field later, it's here |
| 33 | `is_active` | boolean | ✅ required | `true` | We toggle this | Filters out inactive properties |
| 34 | `last_synced_at` / `created_at` / `updated_at` | timestamp | — | `now()` | System | Freshness tracking |

### What's new vs current DB:

| Column | Status | Why we added it |
|--------|--------|----------------|
| `hostaway_id` | 🆕 Add | Separate from our `id` — stable if Hostaway changes their IDs |
| `internal_name` | 🆕 Add | Team's internal name for the property |
| `description` | 🆕 Add | AI can analyze description quality |
| `area` | ✅ Exists | Already there — perfect for compset grouping |
| `address` | 🆕 Add | Full address from Hostaway |
| `lat`, `lng` | 🆕 Add | Geo-proximity: find properties within 2km |
| `check_in_time`, `check_out_time` | 🆕 Add | Operations scheduling |
| `star_rating`, `avg_review_rating` | 🆕 Add | Quality score for pricing power |
| `images` | 🆕 Add | Photos for property cards |
| `cancellation_policy` | 🆕 Add | Strict policy = can charge more |
| `channel_urls` | 🆕 Add | Direct links to Airbnb/VRBO listings |
| `is_active` | 🆕 Add | Show/hide inactive properties |
| `updated_at` | 🆕 Add | Track when data changed |

---

## Table 2: 📅 CALENDAR_DAYS — Daily Price & Availability

> **One row = one day for one property.** Highest-volume table (~5,475 rows for 15 properties).  
> **Source:** Hostaway `GET /v1/listings/{id}/calendar`

| # | Column | Type | Required? | Default | What it means |
|---|--------|------|-----------|---------|---------------|
| 1 | `id` | serial | PK | auto | — |
| 2 | `listing_id` | FK → listings | ✅ required | — | Which property |
| 3 | `date` | date | ✅ required | — | The specific day (e.g., `2026-03-15`) |
| 4 | `status` | text | ✅ required | `'available'` | `available` / `booked` / `blocked` / `pending` / `maintenance` |
| 5 | `price` | numeric(10,2) | ✅ required | — | Nightly price for this date |
| 6 | `minimum_stay` | integer | optional | `1` | Guest must book at least N nights |
| 7 | `maximum_stay` | integer | optional | `30` | Guest can book at most N nights |
| 8 | `is_available` | boolean | ✅ required | `true` | Quick filter (redundant with status but faster) |
| 9 | `block_reason` | text | optional | — | Why it's blocked (e.g., "Owner stay") |
| 10 | `notes` | text | optional | — | Internal notes for this day |
| 11 | `reservation_id` | FK → reservations | optional | — | 🆕 If booked, which booking |
| 12 | `synced_at` | timestamp | optional | — | When we last pulled this from Hostaway |

> **Unique rule:** Only one row per (listing_id + date) combination

### What's new vs current DB:

| Column | Status |
|--------|--------|
| `is_available` | 🆕 Add — quick boolean filter |
| `block_reason` | 🆕 Add — explains why date is blocked |
| `reservation_id` | 🆕 Add — links booked days to the booking |

---

## Table 3: 🏨 RESERVATIONS — Bookings

> **Every guest booking.** Who's staying, when, how much, which channel.  
> **Source:** Hostaway `GET /v1/reservations`

| # | Column | Type | Required? | Default | What it means |
|---|--------|------|-----------|---------|---------------|
| 1 | `id` | serial | PK | auto | Our booking ID |
| 2 | `hostaway_id` | integer | ✅ unique | — | 🆕 Hostaway's booking ID (for dedup) |
| 3 | `listing_map_id` | FK → listings | ✅ required | — | Which property |
| 4 | `guest_name` | text | ✅ required | — | Guest's full name |
| 5 | `guest_email` | text | optional | — | Guest's email |
| 6 | `guest_phone` | text | optional | — | 🆕 Guest's phone |
| 7 | `channel_name` | text | ✅ required | — | Where they booked: `airbnb`, `booking.com`, `direct` |
| 8 | `channel_id` | integer | optional | — | 🆕 Hostaway channel ID |
| 9 | `confirmation_code` | text | optional | — | 🆕 Booking reference (e.g., `HMABCDEF123`) |
| 10 | `arrival_date` | date | ✅ required | — | Check-in date |
| 11 | `departure_date` | date | ✅ required | — | Check-out date |
| 12 | `nights` | integer | ✅ required | — | Length of stay |
| 13 | `total_price` | numeric(10,2) | ✅ required | — | Total booking value |
| 14 | `price_per_night` | numeric(10,2) | ✅ required | — | Computed: total ÷ nights |
| 15 | `number_of_guests` | integer | optional | — | 🆕 How many guests total |
| 16 | `adults` | integer | optional | — | 🆕 Number of adults |
| 17 | `children` | integer | optional | — | 🆕 Number of children |
| 18 | `status` | text | ✅ required | `'confirmed'` | `new` / `modified` / `confirmed` / `cancelled` / `ownerStay` |
| 19 | `check_in_time` | text | optional | — | ✅ Exists |
| 20 | `check_out_time` | text | optional | — | ✅ Exists |
| 21 | `cleaning_fee` | numeric(10,2) | optional | — | 🆕 One-time cleaning charge |
| 22 | `tax_amount` | numeric(10,2) | optional | — | 🆕 Tax on booking |
| 23 | `channel_commission` | numeric(10,2) | optional | — | 🆕 How much Airbnb/Booking takes |
| 24 | `finance_breakdown` | jsonb | optional | — | 🆕 Full financial details (nested JSON) |
| 25 | `host_note` | text | optional | — | 🆕 Internal note about this booking |
| 26 | `external_data` | jsonb | optional | — | ✅ Exists — raw Hostaway response |
| 27 | `reservation_date` | timestamp | optional | — | 🆕 When the booking was made (for lead time analysis) |
| 28 | `synced_at` / `created_at` | timestamp | — | `now()` | System |

### What AI does with this:
- **Booking velocity** — are bookings speeding up or slowing down?
- **Lead time** — how far in advance do guests book?
- **ADR (Average Daily Rate)** — `price_per_night` trends
- **Channel mix** — which channel brings the most revenue?
- **Revenue pacing** — are we on track to hit monthly goals?

---

## Table 4: ⭐ REVIEWS — Guest Feedback (🆕 NEW TABLE)

> **Ratings and comments from guests.** Feeds into AI's Quality Score.  
> **Source:** Hostaway `GET /v1/reviews`

| # | Column | Type | Required? | What it means |
|---|--------|------|-----------|---------------|
| 1 | `id` | serial | PK | Our review ID |
| 2 | `hostaway_id` | integer | ✅ unique | Hostaway review ID |
| 3 | `listing_map_id` | FK → listings | ✅ required | Which property |
| 4 | `reservation_id` | FK → reservations | optional | Which booking |
| 5 | `channel_id` | integer | optional | Which platform (Airbnb, etc.) |
| 6 | `type` | text | ✅ required | `guest-to-host` or `host-to-guest` |
| 7 | `status` | text | optional | `awaiting` / `submitted` / `expired` |
| 8 | `rating` | numeric(3,1) | optional | Star rating (1.0 - 5.0) |
| 9 | `public_review` | text | optional | What guest wrote publicly |
| 10 | `private_feedback` | text | optional | What guest told host privately |
| 11 | `host_response` | text | optional | Host's response to the review |
| 12 | `review_categories` | jsonb | optional | Breakdown: `{cleanliness: 5, value: 4.5, ...}` |
| 13 | `arrival_date` | date | optional | When the stay started |
| 14 | `departure_date` | date | optional | When the stay ended |
| 15 | `guest_name` | text | optional | Who wrote it |
| 16 | `synced_at` | timestamp | — | Last sync |
| 17 | `created_at` | timestamp | — | Row created |

### Why this table matters:
> **Quality Score = average of all ratings.** Higher score → AI can set higher prices because guests clearly love the property.

---

## Table 5: 🎯 PROPOSALS — AI Price Suggestions

> **Every price change the AI recommends.** Internal to PriceOS.  
> **Created by:** Revenue Cycle engine

| # | Column | Type | Required? | Default | What it means |
|---|--------|------|-----------|---------|---------------|
| 1 | `id` | serial | PK | auto | Proposal ID |
| 2 | `cycle_id` | text | ✅ required | — | 🆕 Which AI run created this (groups proposals into batches) |
| 3 | `listing_id` | FK → listings | ✅ required | — | Which property |
| 4 | `date` | date | ✅ required | — | Which date to change price for |
| 5 | `current_price` | numeric(10,2) | ✅ required | — | Price right now |
| 6 | `proposed_price` | numeric(10,2) | ✅ required | — | AI's recommended price |
| 7 | `change_pct` | integer | ✅ required | `0` | % change (e.g., +31 or -15) |
| 8 | `risk_level` | text | ✅ required | `'low'` | `low` / `medium` / `high` |
| 9 | `status` | text | ✅ required | `'pending'` | `pending` → `approved` → `executed` (or `rejected`) |
| 10 | `reasoning` | text | optional | — | AI's explanation: "Dubai World Cup: extreme demand" |
| 11 | `signals` | jsonb | optional | `{}` | All data that drove the decision |
| 12 | `guardrails_applied` | jsonb | optional | `[]` | 🆕 Which safety checks fired (e.g., "price_floor_hit") |
| 13 | `approved_by` | text | optional | — | 🆕 Who approved it |
| 14 | `approved_at` / `created_at` | timestamp | — | `now()` | When |

### Status flow:
```
pending  →  approved  →  executed  (price pushed to Hostaway ✅)
   │
   └──→  rejected   (user said no ❌)
```

### Auto-approve rules:
- `low` risk → auto-approved ✅
- `medium` risk → needs manual approval ⏳
- `high` risk → requires review 🔍

---

## Table 6: ✅ EXECUTIONS — Price Push Audit Log

> **Record of every price we actually pushed to Hostaway.**

| # | Column | Type | Required? | Default | What it means |
|---|--------|------|-----------|---------|---------------|
| 1 | `id` | serial | PK | auto | Execution ID |
| 2 | `proposal_id` | FK → proposals | ✅ required | — | Which proposal was approved |
| 3 | `listing_id` | FK → listings | ✅ required | — | Which property |
| 4 | `date_range_start` | date | ✅ required | — | 🆕 Start of affected dates |
| 5 | `date_range_end` | date | ✅ required | — | 🆕 End of affected dates |
| 6 | `old_price` | numeric(10,2) | ✅ required | — | What it was before |
| 7 | `new_price` | numeric(10,2) | ✅ required | — | What we changed it to |
| 8 | `sync_status` | text | ✅ required | `'pending'` | `pending` → `synced` → `verified` (or `failed`) |
| 9 | `hostaway_response` | jsonb | optional | — | 🆕 API response from Hostaway |
| 10 | `verified_at` | timestamp | optional | — | 🆕 When we confirmed Hostaway accepted it |
| 11 | `created_at` | timestamp | — | `now()` | When we pushed |

---

## Table 7: 🔄 REVENUE_CYCLES — AI Run History (🆕 NEW TABLE)

> **Every time the AI runs a pricing cycle, we log it here.** Gives the AI memory of past decisions.

| # | Column | Type | Required? | What it means |
|---|--------|------|-----------|---------------|
| 1 | `id` | serial | PK | Run ID |
| 2 | `cycle_id` | text | ✅ unique | Unique run identifier (e.g., `CYCLE-170846...`) |
| 3 | `properties` | jsonb | ✅ required | Which properties were analyzed |
| 4 | `date_range_start` | date | ✅ required | Date range start |
| 5 | `date_range_end` | date | ✅ required | Date range end |
| 6 | `total_proposals` | integer | ✅ required | How many price changes suggested |
| 7 | `approved_count` | integer | ✅ required | How many were approved |
| 8 | `rejected_count` | integer | ✅ required | How many were rejected |
| 9 | `avg_price_change` | integer | optional | Average % change |
| 10 | `occupancy_rate` | integer | optional | Occupancy at time of run |
| 11 | `aggregated_data` | jsonb | optional | Summary stats |
| 12 | `execution_time_ms` / `created_at` | — | — | When, how long |

---

## Table 8: 💬 CONVERSATIONS — Guest Chat Threads

> **One row per guest conversation.** Parent of individual messages.  
> **Source:** Hostaway `GET /v1/conversations`

| # | Column | Type | Required? | Default | What it means |
|---|--------|------|-----------|---------|---------------|
| 1 | `id` | serial | PK | auto | Chat ID |
| 2 | `listing_id` | FK → listings | ✅ required | — | Which property |
| 3 | `reservation_id` | FK → reservations | optional | — | Which booking (if any) |
| 4 | `guest_name` | text | ✅ required | — | Guest's name |
| 5 | `guest_email` | text | ✅ required | — | Guest's email |
| 6 | `channel` | text | ✅ required | `'Direct'` | Communication channel |
| 7 | `last_message` | text | optional | — | Preview of latest message |
| 8 | `last_message_at` | timestamp | optional | — | When last message was sent |
| 9 | `unread_count` | integer | ✅ required | `0` | How many unread |
| 10 | `status` | text | ✅ required | `'active'` | `active` / `archived` |
| 11 | `created_at` | timestamp | — | `now()` | — |

---

## Table 9: 📩 CONVERSATION_MESSAGES — Individual Messages

| # | Column | Type | Required? | Default | What it means |
|---|--------|------|-----------|---------|---------------|
| 1 | `id` | serial | PK | auto | Message ID |
| 2 | `conversation_id` | FK → conversations | ✅ required | — | Which chat thread |
| 3 | `sender` | text | ✅ required | — | `guest` or `host` |
| 4 | `content` | text | ✅ required | — | The actual message |
| 5 | `sent_at` | timestamp | ✅ required | `now()` | When sent |

---

## Table 10: 📝 TASKS — Operations

> **Source:** Hostaway `GET /v1/tasks`

| # | Column | Type | Required? | Default | What it means |
|---|--------|------|-----------|---------|---------------|
| 1 | `id` | serial | PK | auto | Task ID |
| 2 | `listing_id` | FK → listings | ✅ required | — | Which property |
| 3 | `title` | text | ✅ required | — | What needs doing |
| 4 | `description` | text | optional | — | Details |
| 5 | `category` | text | ✅ required | — | `cleaning` / `maintenance` / `inspection` |
| 6 | `priority` | text | ✅ required | `'medium'` | `low` / `medium` / `high` / `urgent` |
| 7 | `status` | text | ✅ required | `'todo'` | `todo` → `in_progress` → `done` |
| 8 | `due_date` | date | optional | — | Deadline |
| 9 | `assignee` | text | optional | — | Who's doing it |
| 10 | `created_at` | timestamp | — | `now()` | — |

---

## Table 11: 📋 MESSAGE_TEMPLATES — Quick Replies

| # | Column | Type | Required? | What it means |
|---|--------|------|-----------|---------------|
| 1 | `id` | serial | PK | Template ID |
| 2 | `name` | text | ✅ required | Template name (e.g., "Check-in Instructions") |
| 3 | `content` | text | ✅ required | Message with `{{placeholders}}` |
| 4 | `category` | text | ✅ required | When to use: `check_in` / `check_out` / `welcome` |

---

## Table 12: 📐 SEASONAL_RULES — Pricing Rules

> **Source:** Hostaway `GET /v1/listings/{id}/seasonalRules`

| # | Column | Type | Required? | Default | What it means |
|---|--------|------|-----------|---------|---------------|
| 1 | `id` | serial | PK | auto | Rule ID |
| 2 | `listing_id` | FK → listings | ✅ required | — | Which property |
| 3 | `name` | text | ✅ required | — | Rule name (e.g., "Peak Winter Season") |
| 4 | `start_date` | date | ✅ required | — | Rule starts |
| 5 | `end_date` | date | ✅ required | — | Rule ends |
| 6 | `price_modifier` | integer | ✅ required | `0` | % adjustment (+15 = 15% more) |
| 7 | `minimum_stay` | integer | optional | — | Min nights during this period |
| 8 | `maximum_stay` | integer | optional | — | Max nights |
| 9 | `enabled` | boolean | ✅ required | `true` | Is rule active? |
| 10 | `created_at` | timestamp | — | `now()` | — |

---

## Table 13: 💸 EXPENSES — Costs & Bills

> **Source:** Hostaway `GET /v1/finance/expenseAndExtra`

| # | Column | Type | Required? | Default | What it means |
|---|--------|------|-----------|---------|---------------|
| 1 | `id` | serial | PK | auto | Expense ID |
| 2 | `listing_id` | FK → listings | ✅ required | — | Which property |
| 3 | `hostaway_id` | integer | optional | — | 🆕 Hostaway expense ID |
| 4 | `type` | text | optional | — | 🆕 `'expense'` or `'extra'` |
| 5 | `category` | text | ✅ required | — | `utilities` / `maintenance` / `supplies` |
| 6 | `amount` | numeric(10,2) | ✅ required | — | How much |
| 7 | `currency_code` | varchar(3) | ✅ required | `'AED'` | Currency |
| 8 | `description` | text | ✅ required | — | What it's for |
| 9 | `date` | date | ✅ required | — | When |

---

## Table 14: 📊 OWNER_STATEMENTS — Monthly P&L

> **Source:** Hostaway `GET /v1/ownerStatements`

| # | Column | Type | Required? | Default | What it means |
|---|--------|------|-----------|---------|---------------|
| 1 | `id` | serial | PK | auto | Statement ID |
| 2 | `listing_id` | FK → listings | ✅ required | — | Which property |
| 3 | `hostaway_id` | integer | optional | — | 🆕 Hostaway statement ID |
| 4 | `statement_name` | text | optional | — | 🆕 Statement title |
| 5 | `month` | text | ✅ required | — | Which month (`2026-01`) |
| 6 | `total_revenue` | numeric(10,2) | ✅ required | — | Total income |
| 7 | `total_expenses` | numeric(10,2) | ✅ required | — | Total costs |
| 8 | `net_income` | numeric(10,2) | ✅ required | — | Profit (revenue - expenses) |
| 9 | `occupancy_rate` | integer | ✅ required | `0` | % of days booked |
| 10 | `reservation_count` | integer | ✅ required | `0` | Total bookings |

---

## Table 15: 🌍 EVENTS — Dubai Market Events (🆕 NEW TABLE)

> **Festivals, conferences, sporting events.** Drives demand-based pricing.  
> **Source:** PriceOS team curates this

| # | Column | Type | Required? | Default | What AI uses it for |
|---|--------|------|-----------|---------|---------------------|
| 1 | `id` | text | PK | — | Event ID (e.g., `dsf-2026`) |
| 2 | `name` | text | ✅ required | — | ⭐ Event name |
| 3 | `description` | text | optional | — | Details |
| 4 | `start_date` | date | ✅ required | — | ⭐ When event starts |
| 5 | `end_date` | date | ✅ required | — | ⭐ When event ends |
| 6 | `location` | text | optional | — | Where in Dubai |
| 7 | `category` | text | ✅ required | — | `festival` / `conference` / `sports` / `cultural` / `religious` |
| 8 | `demand_impact` | text | ✅ required | — | ⭐ `low` / `medium` / `high` / `extreme` |
| 9 | `demand_notes` | text | optional | — | ⭐ Why it impacts demand |
| 10 | `confidence` | numeric(3,2) | ✅ required | `1.0` | How sure we are (0.0 - 1.0) |
| 11 | `source_url` | text | optional | — | Link to event page |
| 12 | `is_recurring` | boolean | ✅ required | `false` | Does it happen every year? |
| 13 | `created_at` | timestamp | — | `now()` | — |

---

## Table 16: 📈 COMPETITOR_SIGNALS — Market Intelligence (🆕 NEW TABLE)

> **What competitors are doing.** Pricing trends by area.  
> **Source:** Market analysis / scraping

| # | Column | Type | Required? | Default | What AI uses it for |
|---|--------|------|-----------|---------|---------------------|
| 1 | `id` | text | PK | — | Signal ID |
| 2 | `area` | text | ✅ required | — | ⭐ Dubai neighborhood |
| 3 | `start_date` | date | ✅ required | — | ⭐ Period start |
| 4 | `end_date` | date | ✅ required | — | ⭐ Period end |
| 5 | `signal` | text | ✅ required | — | ⭐ `compression` (prices going up) or `release` (prices dropping) |
| 6 | `confidence` | numeric(3,2) | ✅ required | — | How reliable (0.0 - 1.0) |
| 7 | `reasoning` | text | optional | — | ⭐ Why the market is moving |
| 8 | `available_units` | integer | optional | — | How many properties available |
| 9 | `average_price` | numeric(10,2) | optional | — | ⭐ Market average rate |
| 10 | `price_change_pct` | numeric(5,2) | optional | — | ⭐ How much prices changed |
| 11 | `occupancy_rate` | integer | optional | — | ⭐ Market occupancy % |
| 12 | `source` | text | optional | — | `market_analysis` / `competitor_scrape` / `booking_velocity` |
| 13 | `created_at` | timestamp | — | `now()` | — |

---

## Table 17: 🤖 CHAT_MESSAGES — User ↔ AI Conversations

> **History of chats between the PriceOS user and the AI assistant.**

| # | Column | Type | Required? | Default | What it means |
|---|--------|------|-----------|---------|---------------|
| 1 | `id` | serial | PK | auto | Message ID |
| 2 | `user_id` | text | optional | — | Which user |
| 3 | `session_id` | text | ✅ required | — | Chat session |
| 4 | `role` | text | ✅ required | — | `user` or `assistant` |
| 5 | `content` | text | ✅ required | — | The message |
| 6 | `listing_id` | integer | optional | — | Property context |
| 7 | `structured` | jsonb | optional | — | Structured AI response data |
| 8 | `created_at` | timestamp | — | `now()` | When |

---

## System Table: 🔄 SYNC_LOG — Data Sync Monitoring (🆕 NEW TABLE)

> **Tracks every data sync operation.** For debugging.

| # | Column | Type | Required? | What it means |
|---|--------|------|-----------|---------------|
| 1 | `id` | serial | PK | Log ID |
| 2 | `entity_type` | text | ✅ required | What synced: `listings`, `calendar`, `reservations`, etc. |
| 3 | `entity_count` | integer | ✅ required | How many records synced |
| 4 | `status` | text | ✅ required | `success` / `partial` / `failed` |
| 5 | `error_message` | text | optional | What went wrong (if failed) |
| 6 | `duration_ms` | integer | optional | How long the sync took |
| 7 | `started_at` | timestamp | ✅ required | When sync started |
| 8 | `completed_at` | timestamp | optional | When sync finished |

---

## 🔗 Foreign Key Relationships (All of them)

```
listings.id  ←──  calendar_days.listing_id          "Property has daily calendar"
listings.id  ←──  reservations.listing_map_id       "Property has bookings"
listings.id  ←──  conversations.listing_id          "Property has guest chats"
listings.id  ←──  tasks.listing_id                  "Property has tasks"
listings.id  ←──  seasonal_rules.listing_id         "Property has pricing rules"
listings.id  ←──  expenses.listing_id               "Property has costs"
listings.id  ←──  owner_statements.listing_id       "Property has monthly reports"
listings.id  ←──  proposals.listing_id              "Property has AI suggestions"
listings.id  ←──  executions.listing_id             "Property has price pushes"

reservations.id  ←──  reviews.reservation_id        "Booking has reviews"
reservations.id  ←──  conversations.reservation_id  "Booking has a chat"
reservations.id  ←──  calendar_days.reservation_id  "Booking links to blocked days"

conversations.id  ←──  conversation_messages.conversation_id  "Chat has messages"

proposals.id  ←──  executions.proposal_id           "Suggestion was executed"
```

---

## 📦 Storage Estimates (15 properties, 1 year)

| Table | Rows/Year | Row Size | Total |
|-------|-----------|----------|-------|
| listings | 15 | 2 KB | 30 KB |
| calendar_days | 5,475 | 200 B | 1.1 MB |
| reservations | 1,500 | 1 KB | 1.5 MB |
| reviews | 500 | 500 B | 250 KB |
| proposals | 50,000 | 500 B | 25 MB |
| executions | 10,000 | 300 B | 3 MB |
| events | 50 | 500 B | 25 KB |
| competitors | 200 | 400 B | 80 KB |
| **Total** | | | **~31 MB/year** |

> PostgreSQL handles this trivially. No sharding needed.

---

## 📋 Data Retention (How long we keep things)

| Table | Keep for | Why |
|-------|----------|-----|
| calendar_days | Rolling 365 days | Only need future + recent past |
| reservations | 2 years | Revenue trend analysis |
| proposals | 1 year | AI feedback loop |
| executions | 1 year | Audit trail |
| chat_messages | 90 days | Context window |
| reviews | Forever | Quality score history |
| events | Forever | Recurring patterns |
| competitors | 1 year | Market trends |
| sync_log | 30 days | Debugging only |
