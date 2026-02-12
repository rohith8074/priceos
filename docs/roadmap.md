# PriceOS — POC Roadmap

> **Version:** 2.0
> **Last Updated:** 2026-02-05
> **Purpose:** Combined POC specification and integration plan — scope, data model, UI, schema, integrations, timeline, and success criteria.

---

## 1. POC Scope

### Goal

Prove the core loop on real Hostaway-connected units:

```
Aggregate → Propose → Approve → Execute → Verify
```

A property manager connects their Hostaway account, PriceOS reads calendars and bookings on-demand from the Hostaway API, proposes pricing changes with reasoning, the PM approves or rejects, approved changes push back to Hostaway, and PriceOS verifies they landed.

If this loop works reliably on a handful of live units, the product thesis is validated.

### In Scope

| Area | POC Scope |
|------|-----------|
| **PMS** | Hostaway (Public API v1) — read calendars, bookings on-demand; write prices |
| **Agent Architecture** | Manager-Worker: CRO + 6 workers (see [architecture.md](architecture.md)) |
| **Mock Store** | Local mock layer for pre-integration development (`HOSTAWAY_MODE=mock\|live`) |
| **Events** | AI agent with web browsing — Dubai event calendar with impact scores |
| **Competition** | Competitor Scanner agent — web browsing for market compression signals |
| **Pricing proposals** | Rule-based + AI-assisted proposals with risk levels and reasoning |
| **Approval workflow** | Human-in-the-loop approval for all non-trivial changes |
| **Execution** | Push approved prices to Hostaway → verify on channel |
| **Rollback** | Revert failed or anomalous pushes via Hostaway API |
| **System states** | Connected → Observing → Simulating → Active → Paused (5 states) |
| **UI** | Dashboard, Properties, Calendar, Proposals, Activity Log |

### Deferred (Post-POC)

| Area | Why Deferred |
|------|-------------|
| Gap & LOS Optimizer | Focus on base pricing first; LOS optimization adds complexity without validating core loop |
| Anomaly Detector | Channel Sync verification sufficient for 5 properties; adds value at scale |
| Reservation Agent | Orthogonal to pricing loop; operates on guest messaging, not revenue decisions |
| CRO chat interface | Dashboard + calendar + proposals flow is sufficient for POC |
| Multi-PMS (Guesty, Channex, Lodgify, etc.) | Hostaway-only for POC — prove the loop on one PMS first |
| Autonomous execution | All changes require approval in POC |
| Owner-facing analytics | PM-only for POC |

### Constraints

- **PMS: Hostaway Public API v1** — REST API, OAuth 2.0 client credentials
- **Rate limits:** 15 req/10s per IP, 20 req/10s per Account ID
- **Token lifetime:** 24 months (store and reuse)
- **Event data via AI agent** — no paid APIs (PredictHQ, AirDNA)
- **Competition data via AI agent** — web browsing, no paid comp APIs
- **Human approval required** — no auto-execution in POC
- **Target: ~5 live units** to validate, scaling to 50 post-POC
- **Mock store available** — develop before Hostaway API access

---

## 2. Data Model

### Design Philosophy

**Don't replicate what Hostaway already stores.** Read from Hostaway API on-demand. Only persist what Hostaway can't: our config, intelligence, and audit trail.

| Dropped (read from Hostaway API) | API Endpoint |
|------|-------------|
| Property details (name, address, bedrooms, type, base price, currency) | `GET /listings/{id}` |
| Calendar (prices, availability, blocks, min/max stay) | `GET /listings/{listingId}/calendar?startDate=&endDate=` |
| Bookings (guest, dates, revenue, channel, status) | `GET /reservations` with filters |

**Why this works for POC:** 5 properties, ~18 API calls/day. A calendar view = 1 API call. Property list = 1 call. Reservation history = 1-2 calls. Zero sync complexity.

---

### 2.1 HostawayConnection

OAuth credentials for the Hostaway API. Single row for POC.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | PriceOS internal ID |
| `account_id` | `text` | Hostaway Account ID (used as `client_id` in OAuth) |
| `client_secret` | `text` | Hostaway API client secret (encrypt at rest) |
| `access_token` | `text` | Current access token / JWT (encrypt at rest) |
| `token_expires_at` | `timestamptz` | Token expiry time (~24 months from issue) |
| `webhook_id` | `text` | Registered webhook ID |
| `created_at` | `timestamptz` | Record creation time |
| `updated_at` | `timestamptz` | Last modification time |

**Table:** `hostaway_connections`
**Source:** Manual setup (PM enters API credentials)
**Relation:** Standalone — implicitly scopes everything (single-tenant POC)

---

### 2.2 Property (Thin Config Overlay)

Only stores what Hostaway doesn't have: our price bounds and active flag. Everything else (name, address, bedrooms, etc.) is read live from `GET /listings/{id}`.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | PriceOS internal ID |
| `hostaway_listing_id` | `text` | Hostaway listing identifier (integer cast to text, unique) |
| `price_floor` | `numeric` | Owner-set minimum nightly rate (AED) |
| `price_ceiling` | `numeric` | Owner-set maximum nightly rate (AED) |
| `is_active` | `boolean` | Whether PriceOS manages this property |
| `created_at` | `timestamptz` | Record creation time |
| `updated_at` | `timestamptz` | Last modification time |

**Table:** `properties`
**Source:** Created when PM selects which Hostaway listings to manage
**Relation:** Referenced by `price_proposals`, `execution_log`

---

### 2.3 Event

Dubai events with demand impact scoring, sourced by AI agent. Hostaway has no concept of local events — this is PriceOS-only data.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | PriceOS internal ID |
| `name` | `text` | Event name |
| `description` | `text` | Brief description |
| `start_date` | `date` | Event start |
| `end_date` | `date` | Event end |
| `location` | `text` | Venue or area |
| `category` | `text` | `festival` / `conference` / `sports` / `cultural` / `religious` / `other` |
| `demand_impact` | `text` | `low` / `medium` / `high` / `extreme` |
| `demand_notes` | `text` | Agent's reasoning for the impact score |
| `source_url` | `text` | Where the agent found this event |
| `is_hardcoded` | `boolean` | Whether this is a pre-seeded known event |
| `confidence` | `numeric` | Agent confidence score (0-1) |
| `last_verified_at` | `timestamptz` | Last time agent re-confirmed this event |
| `created_at` | `timestamptz` | Record creation time |
| `updated_at` | `timestamptz` | Last modification time |

**Table:** `events`
**Source:** Event Intelligence agent (web browsing) + hardcoded 2026 major events
**Update frequency:** Weekly agent scan + manual additions
**Relation:** Standalone (joined to calendar by date overlap, not FK)

---

### 2.4 PriceProposal

Recommended pricing changes generated by the Pricing Optimizer agent. Snapshots the current price at generation time (since we don't store calendar locally) — this is the only place the "before" price lives after generation.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | PriceOS internal ID |
| `property_id` | `uuid` | FK -> `properties.id` |
| `hostaway_listing_id` | `text` | Denormalized for API calls without join |
| `date` | `date` | Target date for price change |
| `current_price` | `numeric` | Snapshot from Hostaway at generation time (AED) |
| `proposed_price` | `numeric` | Recommended rate (AED) |
| `change_pct` | `numeric` | Percentage change |
| `risk_level` | `text` | `low` / `medium` / `high` |
| `reasoning` | `text` | Why this change is recommended |
| `signals` | `jsonb` | Contributing factors: `{ events: [...], demand: {...}, patterns: {...}, competition: {...} }` |
| `status` | `text` | `pending` / `approved` / `rejected` / `expired` |
| `reviewed_by` | `text` | Who approved/rejected |
| `reviewed_at` | `timestamptz` | When the decision was made |
| `expires_at` | `timestamptz` | Auto-expire if not reviewed |
| `batch_id` | `uuid` | Groups proposals from the same generation run |
| `created_at` | `timestamptz` | Record creation time |

**Table:** `price_proposals`
**Source:** Pricing Optimizer agent -> Adjustment Reviewer -> CRO
**Update frequency:** Generated daily (or on-demand)
**Relation:** `property_id` -> `properties.id`; referenced by `execution_log`

---

### 2.5 ExecutionLog

Audit trail of every price push, verification, and rollback. Performed by the Channel Sync agent.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | PriceOS internal ID |
| `proposal_id` | `uuid` | FK -> `price_proposals.id` |
| `property_id` | `uuid` | FK -> `properties.id` |
| `hostaway_listing_id` | `text` | Denormalized for API calls without join |
| `date` | `date` | Target date |
| `action` | `text` | `push` / `verify` / `rollback` |
| `old_price` | `numeric` | Price before action (AED) |
| `new_price` | `numeric` | Price after action (AED) |
| `status` | `text` | `success` / `failed` / `pending` |
| `error_message` | `text` | Error details if failed |
| `pms_response` | `jsonb` | Raw Hostaway API response (forward-compatible for multi-PMS) |
| `verified_at` | `timestamptz` | When post-push verification ran |
| `verification_match` | `boolean` | Did Hostaway calendar match expected price? |
| `executed_at` | `timestamptz` | When the action was performed |

**Table:** `execution_log`
**Source:** Channel Sync agent
**Update frequency:** On every push/verify/rollback action
**Relation:** `proposal_id` -> `price_proposals.id`; `property_id` -> `properties.id`

---

### 2.6 SystemState

Current operating mode — controls which agents run and whether execution is allowed.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `uuid` | PriceOS internal ID |
| `state` | `text` | `connected` / `observing` / `simulating` / `active` / `paused` |
| `changed_by` | `text` | Who triggered the state change |
| `reason` | `text` | Why the state was changed |
| `changed_at` | `timestamptz` | When the state changed |

**Table:** `system_state`
**Source:** User-controlled (UI toggle) + CRO-managed transitions
**Update frequency:** On explicit user action or anomaly-triggered pause

**State rules:**
- Execution only allowed in `active` state
- State transitions require explicit human action
- CRO can force `paused` state on anomaly
- Resuming from `paused` requires deliberate confirmation
- See [architecture.md](architecture.md) for full state machine and forbidden transitions

---

### Agent Architecture Summary

Full specification: [architecture.md](architecture.md)

**POC Agents (6 Workers + CRO Manager):**

| Agent | Layer | Role |
|-------|-------|------|
| CRO (Manager) | Orchestration | User interaction, authorization, state management |
| Data Aggregator | PMS Ops | Read Hostaway data -> normalized portfolio snapshot |
| Channel Sync | PMS Ops | Write approved prices to Hostaway, verify, rollback |
| Event Intelligence | External Audit | Dubai event signals with demand impact |
| Competitor Scanner | External Audit | Market compression/release signals |
| Pricing Optimizer | Price Audit | Generate price proposals with risk levels |
| Adjustment Reviewer | Price Audit | Validate proposals, veto authority |

**Deferred Agents (3):**

| Agent | Reason |
|-------|--------|
| Gap & LOS Optimizer | Base pricing focus in POC |
| Anomaly Detector | Channel Sync verification sufficient at 5 properties |
| Reservation Agent | Orthogonal to pricing loop |

**Simplified Orchestration Flow:**

```
Data Aggregator --> Event Intelligence --> Competitor Scanner
        |                   |                      |
        +-------------------+----------------------+
                            |
                            v
                    Pricing Optimizer
                            |
                            v
                    Adjustment Reviewer
                            |
                            v
                        CRO (Manager)
                            |
                    +-------+-------+
                    v               v
              Present to PM    Channel Sync
              (proposals)     (execute if approved)
```

---

### Mock Store Layer

**Purpose:** Enable development and testing before Hostaway API access is available.

**Pattern:** PMSClient adapter with `HOSTAWAY_MODE=mock|live` environment variable. Only Data Aggregator and Channel Sync use this interface — all other agents work with PMS-agnostic normalized data.

**Mock Properties (5 Dubai Units):**

| ID | Property | Area | Bedrooms | Base (AED) | Floor | Ceiling |
|----|----------|------|----------|-----------|-------|---------|
| 1001 | Marina Heights 1BR | Dubai Marina | 1 | 550 | 400 | 800 |
| 1002 | Downtown Residences 2BR | Downtown Dubai | 2 | 850 | 600 | 1200 |
| 1003 | JBR Beach Studio | JBR | 0 | 400 | 300 | 600 |
| 1004 | Palm Villa 3BR | Palm Jumeirah | 3 | 2000 | 1500 | 3000 |
| 1005 | Bay View 1BR | Business Bay | 1 | 500 | 350 | 700 |

**Mock Calendar:** 90 days forward, seasonal pricing (base +/- 20%), ~65% occupancy, scattered owner blocks.

**Mock Reservations:** Mix of Airbnb (~50%), Booking.com (~30%), Direct (~20%). Lead times 3-60 days. Average LOS 3-5 nights.

**Transition to Live:** Set `HOSTAWAY_MODE=live`, enter Account ID + client_secret. No changes needed in non-PMS agents.

See [architecture.md](architecture.md#8-mock-store-layer) for full interface specification.

---

### Entity Relationships

```
hostaway_connections (1 row, standalone)

properties (thin config)
  +-- 1:N -> price_proposals
  +-- 1:N -> execution_log

price_proposals
  +-- 1:N -> execution_log (push -> verify -> rollback)

events (standalone, joined by date overlap)

system_state (standalone, append-only log)

Hostaway API (external, read on-demand via Data Aggregator):
  /listings          -> property details (name, address, bedrooms...)
  /listings/{id}/calendar -> prices, availability, blocks, min_stay
  /reservations      -> bookings, guest info, revenue, channels
```

### How Each UI View Gets Its Data

| View | Local Data | Hostaway API Call | Combined |
|---|---|---|---|
| **Dashboard** | `system_state`, `price_proposals` (pending count), `execution_log` (recent) | `GET /listings` (count + sync check) | KPIs, state, activity |
| **Properties** | `properties` (floor/ceiling, active) | `GET /listings` (name, address, bedrooms, base_price) | Left join on `hostaway_listing_id` |
| **Calendar** | `price_proposals` (overlays), `events` (date range) | `GET /listings/{id}/calendar?startDate=&endDate=` | Overlay proposals + events on calendar |
| **Proposals** | `price_proposals` (all data) | None (current_price is snapshotted) | Pure local |
| **Activity Log** | `execution_log` (all data) | None (pms_response stored in jsonb) | Pure local |

### API Call Budget (Daily, 5 Properties)

| Operation | Calls | When |
|---|---|---|
| List properties | 1 | `GET /listings` for property count |
| Dashboard load | 1 | `GET /listings` for details |
| Calendar view (per property) | 1 | `GET /listings/{id}/calendar?startDate=&endDate=` |
| Proposal generation | ~7 | 5 calendar reads + 1-2 reservation reads |
| Price pushes (~20/day) | 5 | Batch via `PUT /listings/{id}/calendarIntervals` |
| Verification reads | 5 | Re-read calendar per property |
| **Typical daily total** | **~18** | Well within rate limits (15/10s per IP, 20/10s per Account) |

---

## 3. UI Experience

Five core views. No CRO chat in POC — the dashboard + calendar + proposals flow is the interface.

### 3.1 Dashboard

**Purpose:** Portfolio-level overview at a glance.

| Section | Content |
|---------|---------|
| **System Status** | Current state badge (Connected/Observing/Simulating/Active/Paused) with toggle |
| **Portfolio KPIs** | Total properties, overall occupancy rate, average ADR, revenue MTD |
| **Pending Proposals** | Count of proposals awaiting review, grouped by risk level |
| **Upcoming Events** | Next 30 days of Dubai events with demand impact indicators |
| **Recent Activity** | Last 10 execution actions (pushed, verified, rolled back) |
| **Hostaway Connection** | API connection status — token valid, last API call |

**Key interaction:** Click any KPI or card to drill into the relevant view.

---

### 3.2 Properties

**Purpose:** List of managed Hostaway properties with configuration.

| Column | Content |
|--------|---------|
| **Name** | Property name with area badge (from Hostaway API) |
| **Type** | Apartment / Villa / Studio (from Hostaway API) |
| **Bedrooms** | Bedroom count (from Hostaway API) |
| **Base Price** | Default nightly rate (from Hostaway API) |
| **Price Bounds** | Floor - Ceiling (AED) (local config) |
| **Active** | Whether PriceOS manages this property |
| **Occupancy** | Next 30-day occupancy % (from Hostaway API) |
| **Pending** | Count of pending proposals (local) |

**Key interactions:**
- Click property -> opens Calendar view for that property
- Edit price bounds (floor/ceiling) inline
- Toggle active/inactive per property
- Bulk approve/reject proposals for a property

---

### 3.3 Calendar (Per Property)

**Purpose:** The central decision-making view. Monthly calendar showing prices, bookings, proposals, and events overlaid on a single grid.

This is **THE key view** — where the PM sees everything and makes decisions.

| Layer | Visual Treatment |
|-------|-----------------|
| **Price** | Nightly rate displayed in each cell |
| **Availability** | Available (default) / Booked (shaded) / Blocked (striped) |
| **Bookings** | Colored bars spanning check-in to check-out, showing channel + revenue |
| **Proposals** | Highlighted cells with current -> proposed price, colored by risk level |
| **Events** | Event markers/badges on affected dates with demand impact color |

**Color coding:**
- Green: Low-risk proposal / High demand event
- Yellow: Medium-risk proposal / Medium demand event
- Red: High-risk proposal / Extreme demand event
- Grey: Blocked dates

**Key interactions:**
- Click a date -> see full detail: current price, booking status, events, active proposals
- Approve/reject proposals directly from calendar cells
- Compare current vs proposed pricing across the month
- Navigate months with forward/back
- See PriceOS-modified prices vs original Hostaway prices

---

### 3.4 Proposals

**Purpose:** Review pending price changes in a focused, actionable list.

| Column | Content |
|--------|---------|
| **Property** | Property name |
| **Date** | Target date |
| **Current** | Current nightly rate (AED) |
| **Proposed** | Recommended rate (AED) |
| **Change** | Percentage change with direction indicator |
| **Risk** | Low / Medium / High badge |
| **Reasoning** | Why this change is recommended (expandable) |
| **Signals** | Contributing factors — events, demand patterns, booking velocity, competition |
| **Actions** | Approve / Reject buttons |

**Key interactions:**
- Filter by: property, risk level, date range, status
- Sort by: risk level, change magnitude, date
- Bulk approve low-risk proposals
- Expand reasoning to see full signal breakdown
- Click property name -> jumps to Calendar view for that date

**Proposal lifecycle:**
```
Generated -> Pending -> Approved -> Executed -> Verified
                     -> Rejected
                     -> Expired (if not reviewed within window)
```

---

### 3.5 Activity Log

**Purpose:** Full execution history — what was pushed, verified, and rolled back.

| Column | Content |
|--------|---------|
| **Timestamp** | When the action occurred |
| **Property** | Property name |
| **Date** | Target calendar date |
| **Action** | Push / Verify / Rollback |
| **Price Change** | Old -> New (AED) |
| **Status** | Success / Failed / Pending |
| **Verification** | Match / Mismatch / Pending |
| **Error** | Error details if failed (expandable) |

**Key interactions:**
- Filter by: property, action type, status, date range
- Expand row to see full Hostaway API response
- Click property -> jumps to Calendar view
- Export to CSV for auditing

---

## 4. Supabase Schema

### Tables

```sql
-- Hostaway API connection (single row for POC)
create table hostaway_connections (
  id uuid primary key default gen_random_uuid(),
  account_id text not null,              -- Hostaway Account ID (used as client_id in OAuth)
  client_secret text not null,           -- encrypt at rest
  access_token text,                     -- JWT, encrypt at rest
  token_expires_at timestamptz,          -- ~24 months from issue
  webhook_id text,                       -- registered webhook ID
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Thin config overlay — only PriceOS-specific fields
-- Property details (name, address, bedrooms, etc.) read from GET /listings/{id}
create table properties (
  id uuid primary key default gen_random_uuid(),
  hostaway_listing_id text unique not null,  -- Hostaway integer ID stored as text
  price_floor numeric,                   -- owner-set minimum nightly rate (AED)
  price_ceiling numeric,                 -- owner-set maximum nightly rate (AED)
  is_active boolean not null default true,  -- whether PriceOS manages this property
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Dubai events (AI agent + hardcoded) — PriceOS-only data
create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  start_date date not null,
  end_date date not null,
  location text,
  category text,                         -- festival/conference/sports/cultural/religious/other
  demand_impact text not null default 'low',  -- low/medium/high/extreme
  demand_notes text,                     -- AI reasoning
  source_url text,
  is_hardcoded boolean not null default false,
  confidence numeric,                    -- 0-1
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Price change proposals (current_price snapshotted from Hostaway at generation time)
create table price_proposals (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  hostaway_listing_id text not null,     -- denormalized for API calls without join
  date date not null,
  current_price numeric not null,        -- snapshot from Hostaway at generation time
  proposed_price numeric not null,
  change_pct numeric not null,
  risk_level text not null default 'low',  -- low/medium/high
  reasoning text,
  signals jsonb,                         -- { events: [...], demand: {...}, patterns: {...}, competition: {...} }
  status text not null default 'pending',  -- pending/approved/rejected/expired
  reviewed_by text,
  reviewed_at timestamptz,
  expires_at timestamptz,
  batch_id uuid,                         -- groups proposals from same generation run
  created_at timestamptz not null default now()
);

-- Execution audit trail (Channel Sync agent)
create table execution_log (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references price_proposals(id),
  property_id uuid not null references properties(id) on delete cascade,
  hostaway_listing_id text not null,     -- denormalized for API calls
  date date not null,
  action text not null,                  -- push/verify/rollback
  old_price numeric,
  new_price numeric,
  status text not null default 'pending',  -- success/failed/pending
  error_message text,
  pms_response jsonb,                    -- raw API response (forward-compatible for multi-PMS)
  verified_at timestamptz,
  verification_match boolean,
  executed_at timestamptz not null default now()
);

-- System operating state (append-only log)
create table system_state (
  id uuid primary key default gen_random_uuid(),
  state text not null default 'connected',  -- connected/observing/simulating/active/paused
  changed_by text,
  reason text,
  changed_at timestamptz not null default now()
);
```

### Indexes

```sql
create index idx_proposals_property_status on price_proposals(property_id, status);
create index idx_proposals_status on price_proposals(status);
create index idx_proposals_batch on price_proposals(batch_id);
create index idx_proposals_date on price_proposals(date);
create index idx_execution_log_property on execution_log(property_id);
create index idx_execution_log_proposal on execution_log(proposal_id);
create index idx_events_dates on events(start_date, end_date);
```

### Row-Level Security Notes

POC uses a single-tenant model (one PM). RLS is simple:

```sql
-- Enable RLS on all tables
alter table hostaway_connections enable row level security;
alter table properties enable row level security;
alter table events enable row level security;
alter table price_proposals enable row level security;
alter table execution_log enable row level security;
alter table system_state enable row level security;

-- POC: authenticated users can read/write all rows
-- Post-POC: add organization_id column and scope policies per org
create policy "Authenticated access" on properties
  for all using (auth.role() = 'authenticated');

-- Repeat for all tables (or use a shared policy pattern)
```

For V1 multi-tenant, add `organization_id uuid` to every table and scope RLS policies.

---

## 5. Integrations

### Integration Architecture

```
PriceOS Agent System -> Hostaway API -> OTA Channels (Airbnb, Booking.com, VRBO)
```

Direct OTA integration is not feasible — Airbnb's API is invitation-only, Booking.com's partner program is paused for new providers. The standard path is through PMS platforms that are already OTA-certified. This is how PriceLabs, Beyond Pricing, and Wheelhouse all operate.

For POC, Hostaway alone is sufficient. Hostaway syncs prices to all connected OTAs automatically.

### POC Integration Summary

| Layer | POC Approach | Future (V1+) |
|-------|-------------|---------------|
| **PMS** | Hostaway (Free API — included with subscription) | Guesty, Channex, Lodgify |
| **Events** | AI agent with web browsing (Event Intelligence) | PredictHQ, Dubai Pulse APIs |
| **Competitors** | AI agent with web browsing (Competitor Scanner) | AirDNA, Lighthouse, DLD |
| **Market Data** | Not in scope | Dubai Pulse (DTCM), Skyscanner |

**POC data costs:** $0/mo (Hostaway API included with PM's existing subscription)

---

### 5.1 Hostaway PMS

#### Overview

| Item | Detail |
|------|--------|
| **Platform** | Hostaway |
| **API** | Public API v1 (REST) |
| **Base URL** | `https://api.hostaway.com/v1` |
| **Auth** | OAuth 2.0 client credentials (Bearer JWT) |
| **Token lifetime** | 24 months — store and reuse |
| **Rate Limits** | 15 req/10s per IP, 20 req/10s per Account ID |
| **Cost** | $0 (API included with Hostaway subscription) |
| **Webhooks** | Yes — all events on single subscription (reservation created/updated) |
| **ID format** | Integer (stored as text in PriceOS) |

#### Authentication

```
POST https://api.hostaway.com/v1/accessTokens
Body: grant_type=client_credentials&client_id={account_id}&client_secret={secret}&scope=general
-> Returns Bearer token (JWT), valid ~24 months
```

- Account ID found in Hostaway Settings -> Integrations -> API
- Token should be stored and reused — do NOT regenerate per request
- Revoke: `DELETE /v1/accessTokens?token={token}`

#### What We Can Read

| Endpoint | Data | Agent |
|----------|------|-------|
| `GET /listings` | Property list (paginated) | Data Aggregator |
| `GET /listings/{id}` | Property details (name, address, bedrooms, type, price) | Data Aggregator |
| `GET /listings/{id}/calendar?startDate=&endDate=` | Calendar (prices, availability, min/max stay, status) | Data Aggregator |
| `GET /reservations` | Bookings (guest, dates, revenue, channel, status) | Data Aggregator |

#### What We Can Write

| Endpoint | Data | Agent |
|----------|------|-------|
| `PUT /listings/{id}/calendar` | Single date range: price, min/max stay, availability | Channel Sync |
| `PUT /listings/{id}/calendarIntervals` | Batch write: up to 200 intervals per request | Channel Sync |

#### Batch Write Details

The `calendarIntervals` endpoint is the primary write path for POC:

```json
PUT /listings/{id}/calendarIntervals

[
  { "startDate": "2026-03-01", "endDate": "2026-03-01", "price": 450 },
  { "startDate": "2026-03-02", "endDate": "2026-03-02", "price": 500 }
]
```

- Max 200 intervals per request
- 90 days of per-night pricing = 90 intervals -> fits in one request per property
- Groups proposals by property for efficient batch writes

#### Webhooks

```
POST /v1/webhooks
Body: { "url": "https://...", "login": "...", "password": "..." }
```

| Behavior | Detail |
|----------|--------|
| Events | All events on single subscription (no per-event filtering) |
| Relevant events | Reservation Created, Reservation Updated |
| No calendar webhook | Direct calendar edits require polling |
| Retries | 3 automatic retries on failure |
| Auth | Optional HTTP Basic Auth |
| Best practice | Re-fetch from API after webhook to get complete data |

#### Rate Limits

| Limit | Value |
|-------|-------|
| Per IP | 15 requests / 10 seconds |
| Per Account ID | 20 requests / 10 seconds |
| 429 response | `{ "status": "fail" }` with error message |
| Daily budget (5 properties) | ~18 calls (well within limits) |

---

### 5.2 Event Intelligence — AI Agent with Web Browsing

Instead of paid event APIs (PredictHQ at $500-$5K/yr), the POC uses the **Event Intelligence agent** with web browsing capability to gather and assess event impact.

#### How It Works

```
Event Intelligence Agent (web-capable)
    |
    +-- Searches: visitdubai.com, DWTC, TimeOut Dubai, Platinumlist
    +-- Searches: Google for "Dubai events [date range]"
    +-- Assesses: Expected attendance, event type, location proximity
    |
    +-- Outputs: Event signals with date range, confidence, demand impact
```

#### Agent Responsibilities

1. **Discover events** — Browse public event calendars and listings for Dubai
2. **Assess demand impact** — Score each event (Low / Medium / High / Extreme) based on type, expected attendance, and historical patterns
3. **Flag proximity relevance** — Events near the property matter more than city-wide events
4. **Maintain rolling calendar** — Keep a forward-looking 90-day event window

#### Sources the Agent Should Browse

| Source | URL | What to Extract |
|--------|-----|----------------|
| Visit Dubai | visitdubai.com | Official event calendar |
| DWTC | dwtc.com | Exhibition/conference schedule |
| TimeOut Dubai | timeoutdubai.com | Entertainment, dining, cultural events |
| Platinumlist | platinumlist.net | Ticketed events, concerts |
| Dubai Calendar | dubaicalendar.com | Government event listings |
| Google Events | google.com | "Dubai events [month] [year]" |

#### Hardcoded 2026 Major Events

These are known, high-impact events to seed the agent's knowledge. The agent validates and supplements this list via web browsing.

| Event | Dates | Demand Impact |
|-------|-------|--------------|
| Dubai Shopping Festival | Dec 5 '25 - Jan 11 '26 | Extreme |
| Ramadan | Feb 19 - Mar 19 '26 | Extreme (drops then spikes for Eid) |
| Eid Al Fitr | Mar 20-22 '26 | Extreme |
| Dubai World Cup | Mar 28 '26 | High |
| Art Dubai | Apr 17-19 '26 | Medium-High |
| Eid Al Adha | May 27 - Jun 1 '26 | Extreme |
| Dubai Summer Surprises | Jul 3 - Aug 30 '26 | Medium-High |
| F1 Abu Dhabi GP | Dec 4-6 '26 | High (spillover) |
| GITEX Global | Dec 7-11 '26 | High |
| New Year's Eve | Dec 31 '26 | Extreme |

**Note on Ramadan:** Demand *drops* during fasting weeks (especially Western tourists) but *spikes* dramatically for Eid Al Fitr. The pricing model must treat these as separate signals.

#### Limitations of Agent-Based Approach

| Limitation | Impact | Mitigation |
|-----------|--------|-----------|
| No structured API data | Agent may miss events | Hardcoded major events as baseline |
| No ML-based impact scoring | Subjective impact ratings | Use historical booking patterns from Hostaway to calibrate |
| Web sources may change | Broken scraping paths | Agent adapts — uses search as fallback |
| No real-time updates | May lag on newly announced events | Periodic re-scan (weekly) |

---

### 5.3 Integration Steps (POC)

1. **Get Hostaway credentials** — PM provides Account ID + client_secret from Settings -> Integrations -> API
2. **OAuth client credentials flow** — `POST /v1/accessTokens` -> store JWT (24-month lifetime)
3. **Validate + list properties** — `GET /listings` to confirm connection and display available properties
4. **Calendar read** — `GET /listings/{id}/calendar?startDate=&endDate=` for each managed property
5. **Batch price push** — `PUT /listings/{id}/calendarIntervals` for approved proposals
6. **Webhook setup** — `POST /v1/webhooks` for reservation notifications
7. **Verification** — re-read calendar after each push to confirm prices landed

---

## 6. User Flow

### Step 1: Connect Hostaway

```
PM signs up -> enters Hostaway credentials (account_id + client_secret)
-> PriceOS stores credentials in hostaway_connections -> fetches access token (24-month JWT)
```

- System state: `connected` (default on first connect)
- PriceOS validates credentials by calling `GET /listings`
- Transition to `observing` after listings confirmed and properties selected
- Optionally registers webhook for real-time reservation notifications

### Step 2: Select Properties

```
PriceOS calls GET /listings -> displays available Hostaway properties
-> PM selects which properties to manage -> PriceOS creates thin property records
-> PM sets price floor/ceiling per property
```

- No data sync — property details (name, address, bedrooms) are always read live from Hostaway
- In mock mode: displays 5 mock Dubai properties from local store
- PM configures price bounds on the Properties view
- Only selected properties get a row in `properties` table

### Step 3: View Calendar

```
PM opens Calendar view for a property
-> Data Aggregator calls GET /listings/{id}/calendar?startDate=&endDate= for live prices + availability
-> events overlay shows upcoming Dubai events with impact scores
-> any pending proposals are overlaid on the calendar
```

- PM can browse month-by-month (each month = 1 API call)
- Data is always live from Hostaway — no stale cache to worry about
- Client-side cache with 60s TTL prevents excessive API calls on re-renders

### Step 4: Generate Proposals (Simulating Mode)

```
PM transitions system to "simulating"
-> Data Aggregator reads current calendar from Hostaway (snapshots current_price)
-> Event Intelligence gathers upcoming Dubai events
-> Competitor Scanner gathers market signals
-> Pricing Optimizer generates price proposals based on:
  - Current occupancy and booking patterns (from Hostaway via Data Aggregator)
  - Upcoming events and demand impact (from Event Intelligence)
  - Market compression signals (from Competitor Scanner)
  - Owner price bounds (from local properties table)
  - Day-of-week patterns
-> Adjustment Reviewer validates proposals, classifies risk, vetoes if needed
-> CRO consolidates and presents proposals to PM
-> Proposals stored locally with snapshotted current_price
-> Proposals appear in Calendar (overlaid) and Proposals view
```

- No execution in simulating mode — proposals are preview-only
- PM reviews proposals, builds confidence in the system's recommendations

### Step 5: Review & Approve Proposals

```
PM opens Proposals view -> reviews pending changes
-> sees current price, proposed price, % change, risk level, reasoning
-> approves or rejects each proposal (or bulk approves low-risk)
```

- Approved proposals are queued for execution
- Rejected proposals are archived with feedback
- Proposals view is pure local data — no API calls needed

### Step 6: Activate Execution

```
PM transitions system to "active"
-> CRO authorizes Channel Sync to execute approved proposals
-> Channel Sync pushes prices to Hostaway via PUT /listings/{id}/calendarIntervals (batch, up to 200 intervals)
-> Hostaway syncs to OTA channels (Airbnb, Booking.com, etc.)
```

- System only executes approved proposals — never generates + executes in one step
- Each push is logged in the execution log with full Hostaway API response

### Step 7: Verify Execution

```
After push -> Channel Sync reads calendar back from Hostaway API
-> compares expected price vs actual price
-> logs verification result (match / mismatch)
-> if mismatch -> triggers rollback via Hostaway API
```

- Verification runs automatically after each push
- Mismatches are flagged in Activity Log and Dashboard
- Rollback restores the previous price (from `current_price` snapshot) and logs the action

### Step 8: Monitor & Iterate

```
PM monitors Dashboard for:
  - Pending proposals (new recommendations?)
  - Execution results (everything verified?)
  - Upcoming events (anything to prepare for?)
  - Hostaway API health (connection status, token validity)
```

- Daily cycle: Data Aggregator reads -> agents propose -> PM reviews -> Channel Sync executes -> verify
- PM can pause system at any time -> all execution stops immediately
- CRO communicates pause reason and accepts resume command

---

## 7. Dev Timeline & Costs

### POC Integration Stack

```
+------------------------------------------------------+
|                    PriceOS (POC)                     |
+--------------+-----------------+---------------------+
| PMS Ops      | External Audit  | Price Audit         |
|              |                 |                     |
| Hostaway API | Event Intel     | Pricing Optimizer   |
| (Free)       | + Competitor    | + Adj. Reviewer     |
|              | Scanner         |                     |
| Mock Store   | (web browsing)  |                     |
| (pre-access) |                 |                     |
+------+-------+--------+-------+---------------------+
       |                |
       v                v
 OTA Channels     Event Calendar
 (via Hostaway)  (web-sourced)
```

### POC Cost Summary

| Item | Cost |
|------|------|
| Hostaway API | $0/mo (included with PM's subscription) |
| Event intelligence | $0 (AI agent + web) |
| Competitor scanning | $0 (AI agent + web) |
| **Total** | **$0/mo** |

### POC Dev Timeline

```
Week 1:      Mock store + agent scaffolding (CRO, Data Aggregator, Channel Sync)
Week 2-3:    Core pricing loop (Pricing Optimizer, Adjustment Reviewer, Event Intelligence)
Week 3-4:    Competition Scanner + Hostaway API integration (swap mock -> live)
Week 4:      End-to-end testing — event -> competition -> price proposal -> Hostaway push
```

**Total: ~4 weeks**

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Hostaway rate limits (per-10s, not per-hour) | Burst operations may hit limits | Throttle API calls with 10s sliding window; batch endpoint reduces call count |
| No dedicated calendar webhook | Direct calendar edits not pushed via webhook | Daily calendar poll via Data Aggregator; reservation-triggered changes captured |
| Integer IDs in Hostaway | Type mismatch with text-based storage | Cast `int` -> `text` in Data Aggregator; `hostaway_listing_id` is `text` type |
| All-events webhook (no filtering) | Noisy webhook stream | Filter events in receiver; ignore irrelevant types (messages, inquiries) |
| Event agent misses key events | Bad pricing recommendations | Hardcoded major events as safety net |
| Mock store divergence from real API | Unexpected behavior on switch to live | Keep mock store interface identical to PMSClient; test both modes |
| No comp data APIs -> limited market context | Recommendations may lack competitive awareness | Competitor Scanner web browsing + Hostaway booking patterns as proxy |

---

## 9. Decision Log

| Decision | Rationale | Date |
|----------|-----------|------|
| Switched from Guesty to Hostaway for POC | Free API (included with subscription), simpler auth (24-month token), batch write endpoint, lower barrier to entry | 2026-02-05 |
| Mock store layer for pre-integration dev | Enables agent development before Hostaway API access; PMSClient adapter pattern for clean swap | 2026-02-05 |
| Manager-Worker agent architecture (CRO + 6 workers) | Strict separation of concerns; only PMS Ops agents touch API; deterministic orchestration | 2026-02-05 |
| 6 POC agents, 3 deferred | Gap & LOS Optimizer, Anomaly Detector, Reservation Agent add complexity without validating core pricing loop | 2026-02-05 |
| Competitor Scanner in POC scope | Market compression signals improve pricing quality; web browsing approach is zero-cost | 2026-02-05 |
| AI agent for events, not PredictHQ | Zero cost, good enough for POC validation | 2026-02-05 |
| PMS-first architecture (not direct OTA) | Industry standard; OTA APIs are closed to new entrants | 2026-02-05 |
| Hardcode major 2026 events | Known events de-risk agent gaps | 2026-02-05 |
| `pms_response` (not `hostaway_response`) in execution log | Forward-compatible for multi-PMS support post-POC | 2026-02-05 |
| 5-state machine (added `connected`) | Distinguishes initial PMS link from active monitoring; prevents accidental execution before setup completes | 2026-02-05 |

---

## 10. Success Criteria

| Metric | Target |
|--------|--------|
| **Properties connected** | 5+ live Hostaway listings managed by PriceOS |
| **API reliability** | Hostaway API calls succeed >99% of the time |
| **Proposals generated** | Daily proposals for next 30 days across all properties |
| **Approval rate** | >70% of proposals accepted by PM (relevance test) |
| **Execution success** | >95% of approved proposals push successfully to Hostaway |
| **Verification pass** | >95% of pushes match on verification read-back |
| **Rollback reliability** | 100% of failed pushes automatically rolled back |
| **Pause response** | System stops all execution within 5 seconds of pause |
| **PM time saved** | Measurable reduction in manual pricing checks per week |
| **Mock -> Live transition** | Seamless switch from mock store to live Hostaway API |

---

## Appendix: V1 Roadmap (Post-POC)

### Future Integrations

After POC validation, the full V1 stack adds:

| # | Integration | Purpose | Cost | Dev Time |
|---|------------|---------|------|----------|
| 1 | **Guesty** | Second PMS, large Dubai market share | $23/mo per listing | 4-6 weeks |
| 2 | **PredictHQ** | Structured event intelligence with ML scoring | $500-$5K/yr | 1-2 weeks |
| 3 | **Dubai Pulse** | Official tourism stats, occupancy data | Free | 1 week |
| 4 | **AirDNA** | Competitor ADR, occupancy, comp sets | $5K-$15K/yr | 2-3 weeks |
| 5 | **DLD Open Data** | Holiday home permits, supply tracking | Free | 1 week |
| 6 | **Gap & LOS Optimizer** | LOS rules, targeted discounts | — | 2-3 weeks |
| 7 | **Anomaly Detector** | Post-execution monitoring at scale | — | 1-2 weeks |
| 8 | **Reservation Agent** | Guest communication automation | — | 2-3 weeks |

**V1 total estimated cost:** $5.5K-$20K/year + PMS subscriptions
**V1 total dev timeline:** ~16-20 weeks from POC completion

### What's NOT in POC Scope

These are documented for future reference but explicitly excluded from POC.

#### Competitor & Market Intelligence (Future)

| Source | What It Provides | Cost | When |
|--------|-----------------|------|------|
| AirDNA | ADR, occupancy, RevPAR, comp sets | $5K-$15K/yr | V1 |
| Lighthouse | Hotel + STR rate shopping | Subscription | V1 |
| DLD Open Data | Holiday home permits, supply tracking | Free | V1 |

#### Additional PMS Platforms (Future)

| PMS | When | Why |
|-----|------|-----|
| Guesty | V1 | Large Dubai PM market share; covers different customer segment |
| Channex | V2 | Covers long-tail (50+ OTA channels) |
| Lodgify | V2 | Self-service PM segment |

#### Paid Event APIs (Future)

| Source | Cost | When |
|--------|------|------|
| PredictHQ | $500-$5K/yr | V1 (replaces/augments Event Intelligence agent) |
| Dubai Pulse (DTCM) | Free | V1 |
