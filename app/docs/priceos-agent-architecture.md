# ⚠️ DEPRECATED — DO NOT USE

> **This document describes the OLD 7-agent architecture. It has been superseded by the 5-agent architecture.**
> 
> **Canonical documents:**
> - `priceos-architecture-overview.html` — 5-Agent Architecture (the correct one)
> - `schema-agents-sufficiency.html` — Schema changes, agent responses, data sufficiency
>
> Last updated: 2026-02-19
> Status: **DEPRECATED**

---

# PriceOS Agent Architecture — ~~Updated Plan~~ (OLD 7-Agent Version)

> Last updated: 2026-02-19
> Status: ~~Active Development~~ **DEPRECATED — See priceos-architecture-overview.html**

---

## Overview

PriceOS uses a **7-agent architecture** to power intelligent pricing decisions for Dubai short-term rentals. Each agent has a single clear responsibility, uses the internal database for factual grounding, and the internet for real-time market intelligence — with **zero cron jobs** or external data caching.

### Design Principles

1. **DB-First**: All factual claims (prices, availability, occupancy) MUST come from SQL queries against the database. Never hallucinate.
2. **Real-Time Research**: Events, competitor prices, and market trends are fetched live via internet search when the user asks — no stale cached data.
3. **Single Responsibility**: Each agent answers ONE clear question. No overlapping scope.
4. **Pipeline Order**: Agents feed signals top-down. The PriceGuard agent runs LAST as a gatekeeper.

---

## Database Schema (4 Tables)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   listings (12 cols)                                             │
│   ├── id (PK)                                                   │
│   ├── name, city, area, country_code                            │
│   ├── bedrooms_number, bathrooms_number, property_type_id       │
│   ├── price (base nightly rate AED)                             │
│   ├── currency_code, person_capacity, amenities                 │
│   │                                                              │
│   │        ┌──────────────────────┐                              │
│   ├──FK──▶ │ calendar_days (7 cols)│                             │
│   │        │ ├── id (PK)          │                              │
│   │        │ ├── listing_id (FK)  │                              │
│   │        │ ├── date             │                              │
│   │        │ ├── status           │  available | booked | blocked│
│   │        │ ├── price            │  active nightly rate         │
│   │        │ ├── minimum_stay     │                              │
│   │        │ └── maximum_stay     │                              │
│   │        └──────────────────────┘                              │
│   │                                                              │
│   │        ┌──────────────────────┐                              │
│   ├──FK──▶ │ proposals (12 cols)  │                              │
│   │        │ ├── id (PK)          │                              │
│   │        │ ├── listing_id (FK)  │                              │
│   │        │ ├── date             │                              │
│   │        │ ├── current_price    │                              │
│   │        │ ├── proposed_price   │                              │
│   │        │ ├── change_pct       │                              │
│   │        │ ├── price_floor      │                              │
│   │        │ ├── price_ceiling    │                              │
│   │        │ ├── risk_level       │  low | medium | high         │
│   │        │ ├── status           │  pending | approved | rejected│
│   │        │ ├── reasoning        │                              │
│   │        │ └── is_pushed        │                              │
│   │        └──────────────────────┘                              │
│   │                                                              │
│   │        ┌──────────────────────────┐                          │
│   └──FK──▶ │ reservations (13 cols)   │                          │
│            │ ├── id (PK)              │                          │
│            │ ├── listing_map_id (FK)  │                          │
│            │ ├── guest_name           │                          │
│            │ ├── channel_name         │  airbnb | booking.com    │
│            │ ├── arrival_date         │                          │
│            │ ├── departure_date       │                          │
│            │ ├── nights               │                          │
│            │ ├── total_price          │                          │
│            │ ├── price_per_night      │                          │
│            │ ├── status               │  confirmed | cancelled   │
│            │ └── created_at           │  booking timestamp       │
│            └──────────────────────────┘                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Why 4 Tables (Not 3)

The optimized ERD has 3 tables (`listings`, `calendar_days`, `proposals`). We add `reservations` back because **4 out of 7 agents** require reservation data for booking velocity, lead time analysis, length-of-stay patterns, and cancellation risk. The table already exists in the codebase and has seed data.

### What We Do NOT Store

| Data | Why Not in DB |
|------|---------------|
| Events / holidays | Fetched live via internet search; always current, no staleness risk |
| Seasonal rules | Seasons are inferred from actual `calendar_days` data (prices + occupancy patterns) |
| Competitor prices | Fetched live via internet search; stale comp data is dangerous |
| Market demand indices | Fetched live; no cron jobs needed |

---

## The 7 Agents

### Agent 1: CalendarOptimizationAgent

> *"What should I do with my calendar to maximize bookings?"*

| Attribute | Detail |
|-----------|--------|
| **Merges** | GapNightAgent (#2) + LastMinuteDemandAgent (#3) + RestrictionsAgent (#5) + LengthOfStayAgent (#6) |
| **Data Source** | Internal only — `calendar_days`, `reservations`, `listings` |
| **What It Does** | Detects orphan gaps between bookings, identifies last-minute demand surges, recommends min/max stay adjustments, and analyzes length-of-stay patterns |
| **Output** | Unified calendar recommendation: price adjustments + restriction changes + gap-fill strategies |

**Key Queries:**
```sql
-- Detect 1-3 night gaps between booked dates
-- Analyze LOS distribution from reservations.nights
-- Check if minimum_stay is creating unbookable gaps
-- Identify last-minute open dates (next 7 days, status = 'available')
```

---

### Agent 2: DemandSignalAgent

> *"How fast are bookings coming in, and what does the future look like?"*

| Attribute | Detail |
|-----------|--------|
| **Merges** | BookingVelocityAgent (#1) + MarketDemandAgent (#10) + RevenueForecastAgent (#14) |
| **Data Source** | Internal (`reservations`, `calendar_days`, `listings`, `proposals`) + Internet (market trends) |
| **What It Does** | Calculates booking pace (bookings/day), portfolio occupancy trends, and projects 30/60/90-day revenue forecasts. Searches internet for Dubai market demand signals when needed. |
| **Output** | Demand report: velocity signal (accelerating/stalling) + occupancy forecast + revenue projection |

**Key Queries:**
```sql
-- Booking velocity: COUNT reservations created in last 7 days
-- Portfolio occupancy: booked/total for next 30 days from calendar_days
-- Confirmed revenue: SUM(price) from calendar_days WHERE status = 'booked'
-- Projected revenue: SUM(price) × historical_fill_rate for available dates
```

**Internet Research (on-demand):**
- "Dubai short-term rental market demand [current month] 2026"
- "Dubai tourism occupancy rates [current season]"

---

### Agent 3: EventCalendarAgent

> *"What's happening in Dubai that should affect my pricing?"*

| Attribute | Detail |
|-----------|--------|
| **Merges** | EventDetectionAgent (#7) + HolidayPremiumAgent (#8) + SeasonalPatternAgent (#12) |
| **Data Source** | Internal (`calendar_days`, `listings`) + Internet (events, holidays, seasons) |
| **What It Does** | Searches the internet for upcoming Dubai events, UAE holidays, school breaks, and Ramadan dates. Cross-references with the portfolio to identify impacted properties and recommend date-specific price premiums. Infers seasonal patterns from actual calendar data. |
| **Output** | Unified event/season overlay: list of demand drivers with impacted dates, areas, and recommended premium % |

**Key Queries:**
```sql
-- Seasonal inference: AVG(price), occupancy rate grouped by month from calendar_days
-- Impact mapping: listings.area matched to event locations
-- Current pricing check: calendar_days.price for event dates (is premium already applied?)
```

**Internet Research (on-demand):**
- "Dubai events [next month] 2026"
- "UAE public holidays 2026"
- "When is Ramadan 2026 exact dates"
- "KHDA Dubai school holidays 2026"
- "Dubai Shopping Festival dates 2026"

---

### Agent 4: MarketPositioningAgent

> *"Is my property priced right for its market?"*

| Attribute | Detail |
|-----------|--------|
| **Merges** | CompetitorPriceAgent (#9) + PropertyPositioningAgent (#11) |
| **Data Source** | Internal (`listings`, `calendar_days`) + Internet (competitor prices, reviews) |
| **What It Does** | Searches for comparable property prices on Airbnb/Booking.com in the same area and bedroom count. Assesses property quality tier. Produces a positioning verdict: underpriced, competitive, or overpriced for the quality level. |
| **Output** | Market position report: comp set pricing range + quality tier + positioning verdict + recommended adjustment |

**Internet Research (on-demand):**
- "Airbnb [area] [bedrooms]BR nightly price [current month] Dubai"
- "Average short-term rental price [area] Dubai 2026"
- "Booking.com [area] apartment [bedrooms] bedroom price per night"

---

### Agent 5: LeadTimeAgent

> *"When do my guests typically book, and how should I price based on that?"*

| Attribute | Detail |
|-----------|--------|
| **Merges** | None — standalone |
| **Data Source** | Internal only — `reservations`, `listings` |
| **What It Does** | Analyzes the gap between reservation `created_at` and `arrival_date` to build a lead-time distribution (P25/P50/P75/P90). Recommends early-bird premiums or last-minute discount strategies. |
| **Output** | Lead time profile: median lead time + distribution + pricing window recommendation |

**Key Queries:**
```sql
-- Lead time per booking: arrival_date - created_at::date
-- Distribution: percentiles of lead time grouped by listing
-- Correlation: AVG(price_per_night) by lead-time bracket
```

---

### Agent 6: CancellationRiskAgent

> *"Which of my bookings are most likely to cancel?"*

| Attribute | Detail |
|-----------|--------|
| **Merges** | None — standalone |
| **Data Source** | Internal only — `reservations`, `listings`, `calendar_days` |
| **What It Does** | Assesses cancellation probability based on lead time, channel, booking value, and historical cancellation patterns. Flags at-risk revenue and recommends policy adjustments. |
| **Output** | Risk assessment: at-risk bookings list + cancellation probability + recommended actions |

**Key Queries:**
```sql
-- Cancellation rate by channel: COUNT cancelled / COUNT total grouped by channel_name
-- At-risk bookings: reservations with lead_time > 60 days AND channel = 'booking.com'
-- Revenue at risk: SUM(total_price) for high-risk bookings
```

**Prerequisite:** Requires `reservations.status` to include `'cancelled'` state (currently only `'confirmed'`).

---

### Agent 7: PriceGuardAgent (Gatekeeper)

> *"Is this proposed price within safe bounds?"*

| Attribute | Detail |
|-----------|--------|
| **Merges** | None — standalone |
| **Data Source** | Internal only — `proposals`, `listings`, `calendar_days`, `reservations` |
| **What It Does** | Runs LAST in the pipeline. Validates every price recommendation against floor/ceiling constraints. Blocks proposals that would damage the brand (too low) or lose bookings (too high). Periodically recommends recalibrating floors and ceilings based on actual booking data. |
| **Output** | Validation verdict: approved / blocked / ceiling-flagged. Floor/ceiling adjustment recommendations. |

**Key Queries:**
```sql
-- Floor violations: proposals WHERE proposed_price < price_floor
-- Ceiling hits: proposals WHERE proposed_price >= price_ceiling (ceiling may be too low)
-- Calibration: AVG(price_per_night) from reservations vs current floor/ceiling
```

---

## Agent Pipeline Flowchart

```
                    ┌─────────────────┐
                    │   USER MESSAGE  │
                    │  (Chat Input)   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  PRICING AGENT  │ ← Main orchestrator (Lyzr)
                    │  (Router)       │   Decides which agents to invoke
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼────────┐  ┌─▼──────────┐  ┌▼─────────────────┐
    │                  │  │            │  │                   │
    │ CONTEXT LAYER    │  │ SIGNAL     │  │ MARKET LAYER      │
    │ (What's on the   │  │ LAYER      │  │ (What's happening │
    │  calendar?)      │  │ (How's     │  │  outside?)        │
    │                  │  │  demand?)  │  │                   │
    │ ┌──────────────┐ │  │ ┌────────┐ │  │ ┌───────────────┐ │
    │ │ 1. Calendar  │ │  │ │2.Demand│ │  │ │3. Event       │ │
    │ │ Optimization │ │  │ │ Signal │ │  │ │   Calendar    │ │
    │ │ Agent        │ │  │ │ Agent  │ │  │ │   Agent       │ │
    │ │              │ │  │ │        │ │  │ │               │ │
    │ │ • Gap detect │ │  │ │•Booking│ │  │ │ • Events 🌐   │ │
    │ │ • Min/max    │ │  │ │ velocity│ │  │ │ • Holidays 🌐 │ │
    │ │   stay       │ │  │ │•Occupan│ │  │ │ • Seasons     │ │
    │ │ • LOS pricing│ │  │ │ cy rate│ │  │ │   (from data) │ │
    │ │ • Last-min   │ │  │ │•Revenue│ │  │ │               │ │
    │ │   demand     │ │  │ │ forcast│ │  │ ├───────────────┤ │
    │ │              │ │  │ │•Market │ │  │ │4. Market      │ │
    │ │ DB: calendar │ │  │ │ trend🌐│ │  │ │   Positioning │ │
    │ │ DB: listings │ │  │ │        │ │  │ │   Agent       │ │
    │ │ DB: reserv.  │ │  │ │DB: res.│ │  │ │               │ │
    │ └──────┬───────┘ │  │ │DB: cal.│ │  │ │ • Comp prices🌐│ │
    │        │         │  │ │DB: list│ │  │ │ • Quality tier│ │
    │        │         │  │ └───┬────┘ │  │ │ • Positioning │ │
    │        │         │  │     │      │  │ │               │ │
    └────────┼─────────┘  └─────┼──────┘  │ │DB: listings   │ │
             │                  │         │ │DB: calendar   │ │
             │                  │         │ └───────┬───────┘ │
             │                  │         └─────────┼─────────┘
             │                  │                   │
             ▼                  ▼                   ▼
    ┌──────────────────────────────────────────────────────────┐
    │                    ANALYSIS LAYER                        │
    │                                                          │
    │  ┌─────────────────────┐    ┌──────────────────────┐     │
    │  │ 5. LeadTime Agent   │    │ 6. Cancellation Risk │     │
    │  │                     │    │    Agent              │     │
    │  │ • When guests book  │    │ • Which bookings     │     │
    │  │ • Early-bird pricing│    │   might cancel?      │     │
    │  │ • Pricing windows   │    │ • At-risk revenue    │     │
    │  │                     │    │ • Policy adjustments  │     │
    │  │ DB: reservations    │    │                      │     │
    │  │ DB: listings        │    │ DB: reservations     │     │
    │  └──────────┬──────────┘    └──────────┬───────────┘     │
    │             │                          │                 │
    └─────────────┼──────────────────────────┼─────────────────┘
                  │                          │
                  └────────────┬─────────────┘
                               │
                               ▼
    ┌──────────────────────────────────────────────────────────┐
    │                   GATEKEEPER LAYER                       │
    │                                                          │
    │  ┌──────────────────────────────────────────────────┐    │
    │  │            7. PriceGuard Agent                    │    │
    │  │                                                   │    │
    │  │  • Validates ALL price recommendations            │    │
    │  │  • Blocks proposals below price_floor             │    │
    │  │  • Flags proposals above price_ceiling            │    │
    │  │  • Recommends floor/ceiling recalibration         │    │
    │  │                                                   │    │
    │  │  DB: proposals, listings, calendar_days            │    │
    │  └──────────────────────┬────────────────────────────┘    │
    │                         │                                │
    └─────────────────────────┼────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   FINAL OUTPUT  │
                    │                 │
                    │  Price proposal │
                    │  → proposals    │
                    │    table        │
                    │                 │
                    │  Chat response  │
                    │  → to user      │
                    └─────────────────┘


🌐 = Uses internet research (real-time, no caching)
DB = Uses internal database tables
```

---

## Data Flow Summary

### What Each Agent Reads and Writes

| Agent | Reads (DB) | Reads (Internet) | Writes |
|-------|-----------|-------------------|--------|
| 1. CalendarOptimization | `calendar_days`, `reservations`, `listings` | — | Proposals (gap fills, restriction changes) |
| 2. DemandSignal | `reservations`, `calendar_days`, `listings`, `proposals` | Market demand trends | Demand report + revenue forecast |
| 3. EventCalendar | `calendar_days`, `listings` | Events, holidays, school breaks | Event-driven price premiums |
| 4. MarketPositioning | `listings`, `calendar_days` | Competitor prices, reviews | Market position verdict |
| 5. LeadTime | `reservations`, `listings` | — | Lead time analysis + pricing windows |
| 6. CancellationRisk | `reservations`, `listings`, `calendar_days` | — | Risk assessment + at-risk revenue |
| 7. PriceGuard | `proposals`, `listings`, `calendar_days`, `reservations` | — | Validation verdict (approve/block) |

### Agent Dependency Map

```
Independent (can run alone, no agent dependencies):
  ├── 1. CalendarOptimizationAgent
  ├── 3. EventCalendarAgent
  ├── 4. MarketPositioningAgent
  ├── 5. LeadTimeAgent
  └── 6. CancellationRiskAgent

Depends on other agents' context:
  └── 2. DemandSignalAgent
       ├── Uses occupancy from CalendarOptimization
       └── Uses event context from EventCalendar

Always runs LAST:
  └── 7. PriceGuardAgent
       └── Validates output from ALL other agents
```

---

## Implementation Phases

### Phase 1: Foundation (Current → 1 Week)

| Task | Status |
|------|--------|
| Fix agent prompt to enforce SQL-grounded responses | 🔴 Not started |
| Inject system date into every agent call | 🔴 Not started |
| Add `reservations` table back to active ERD | 🔴 Not started |
| Update semantic data dictionary with reservations table | 🔴 Not started |
| Ensure `reservations` seed data is populated | ✅ Already in seed.ts |
| Markdown rendering in chat | ✅ Done |
| Occupancy + price metrics in chat header | ✅ Done |
| Logging for all chat interactions | ✅ Done |

### Phase 2: Agent Implementation (Weeks 2-3)

| Task | Agents Unlocked |
|------|-----------------|
| Implement CalendarOptimizationAgent prompt | Agent 1 |
| Implement DemandSignalAgent prompt | Agent 2 |
| Implement EventCalendarAgent with internet search | Agent 3 |
| Implement PriceGuardAgent validation logic | Agent 7 |

### Phase 3: Advanced Agents (Weeks 4-6)

| Task | Agents Unlocked |
|------|-----------------|
| Implement MarketPositioningAgent with internet research | Agent 4 |
| Implement LeadTimeAgent | Agent 5 |
| Implement CancellationRiskAgent (requires `cancelled` status in reservations) | Agent 6 |

---

## Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| **7 agents instead of 15** | Eliminates inter-agent conflicts, reduces maintenance, clearer responsibilities |
| **No `seasonal_rules` table** | Seasons inferred from actual `calendar_days` data — more accurate than pre-defined rules |
| **No `event_signals` caching** | Events fetched live via internet — always fresh, no cron jobs needed |
| **No cron jobs** | Vercel serverless constraints + real-time research produces better results |
| **`reservations` table added back** | 4 of 7 agents need booking history for velocity, lead time, LOS, and cancellation analysis |
| **PriceGuard runs last** | Separation of concerns — recommenders propose, gatekeeper validates |
| **Internet research on-demand** | User asks → agent searches → fresh answer. No stale data risk. |
