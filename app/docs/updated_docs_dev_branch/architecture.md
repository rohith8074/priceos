# PriceOS — Agent Architecture

> **Version:** 1.0
> **Last Updated:** 2026-02-05
> **Purpose:** Define the complete agent architecture and system state machine for PriceOS. Build-level contract for the engineering team.

---

## 1. Architecture Overview

The system follows a strict hierarchical **Manager–Worker** design built on the Lyzr framework.

- **One Manager Agent** — the Chief Revenue Officer (CRO)
- **Multiple Worker Agents** — each responsible for a narrow, well-defined task
- Only the CRO interacts with users
- Only the CRO can authorize execution
- Only the Channel Sync Agent can write data back to the PMS
- Worker agents never execute actions autonomously

---

## 2. System Layers

Agents are organized into four operational layers:

| Layer | Agents | Responsibility |
|-------|--------|---------------|
| **PMS Ops** | Data Aggregator, Channel Sync | Read/write PMS data (Hostaway API) |
| **External Audit** | Event Intelligence, Competitor Scanner | External signal gathering |
| **Price Audit** | Pricing Optimizer, Adjustment Reviewer | Price proposal generation + review |
| **Orchestration** | CRO (Manager) | Coordination, user interaction, authorization |

> **API boundary:** Only PMS Ops agents (Data Aggregator + Channel Sync) touch the Hostaway API. All other agents work with normalized data structures.

---

## 3. Manager Agent: Chief Revenue Officer (CRO)

The CRO acts as the single authority and orchestration layer for the system.

### Responsibilities

- Owns the system state and enforces state transitions
- Schedules and triggers worker agents
- Consolidates outputs from workers into structured decision proposals
- Determines risk level and whether human approval is required
- Communicates proposals, explanations, and summaries to users via the platform chat
- Authorizes execution through Channel Sync when permitted
- Pauses the system on anomalies or explicit user instruction
- Maintains explainability and audit trails for all decisions

### CRO Constraints

- Does NOT scrape or ingest raw PMS data directly
- Does NOT write prices or rules to the PMS
- Cannot bypass Adjustment Reviewer vetoes in V1
- Cannot execute actions outside the `active` state

---

## 4. Worker Agents

### POC Agent Roster (6 Workers + CRO)

| # | Agent | Layer | POC Role | Inputs | Outputs |
|---|-------|-------|----------|--------|---------|
| 1 | **Data Aggregator** | PMS Ops | Read Hostaway calendars, bookings, listings | PMS credentials, property mappings | Normalized portfolio snapshot (calendars, prices, bookings, LOS rules) with freshness flags |
| 2 | **Channel Sync** | PMS Ops | Write approved prices to Hostaway | CRO-authorized approved actions | Execution status, verification results, rollback payloads |
| 3 | **Event Intelligence** | External Audit | Gather Dubai event signals | Configured event sources, geographic filters | Event signals with date range, location, confidence score, rationale |
| 4 | **Competitor Scanner** | External Audit | Gather market compression signals | Competitor definitions by area and category | Market compression/release signals with confidence |
| 5 | **Pricing Optimizer** | Price Audit | Generate price proposals | Portfolio snapshot, event signals, competitor signals, PM strategy | Proposed price changes per listing and date with risk level and rationale |
| 6 | **Adjustment Reviewer** | Price Audit | Validate proposals, classify risk | Pricing proposals | Approved proposals, rejected proposals with reasons |

### Deferred Agents (Post-POC)

| Agent | Layer | Rationale for Deferral |
|-------|-------|----------------------|
| **Gap & LOS Optimizer** | Price Audit | POC focuses on base pricing; LOS optimization adds complexity without validating the core pricing loop |
| **Anomaly Detector** | PMS Ops | At 5 properties, Channel Sync verification is sufficient to catch issues; anomaly detection adds value at scale |
| **Reservation Agent** | Communication | Orthogonal to the pricing loop; operates on guest messaging, not revenue decisions |

---

## 5. Worker Agent Details

### 5.1 Data Aggregator

| Item | Detail |
|------|--------|
| **Layer** | PMS Ops |
| **Inputs** | PMS credentials (from `hostaway_connections`), property mappings |
| **Outputs** | Normalized portfolio snapshot: calendars, prices, bookings, LOS rules; freshness flags; data consistency checks |
| **Triggers** | Scheduled refresh, on-demand by CRO |
| **Constraints** | Read-only access to PMS; must flag stale or missing data |
| **Hostaway endpoints** | `GET /listings`, `GET /listings/{id}`, `GET /listings/{id}/calendar`, `GET /reservations` |

### 5.2 Event Intelligence Agent

| Item | Detail |
|------|--------|
| **Layer** | External Audit |
| **Inputs** | Configured event sources (web), geographic filters (Dubai) |
| **Outputs** | Event signals with date range, location, confidence score (0–1), rationale |
| **Triggers** | Scheduled refresh (weekly), on-demand by CRO |
| **Constraints** | No pricing recommendations; conservative confidence assignment |
| **Sources** | visitdubai.com, DWTC, TimeOut Dubai, Platinumlist, Dubai Calendar, Google |

### 5.3 Competitor Scanner

| Item | Detail |
|------|--------|
| **Layer** | External Audit |
| **Inputs** | Competitor definitions by area and category |
| **Outputs** | Market compression or release signals with confidence |
| **Triggers** | Scheduled refresh, on-demand by CRO |
| **Constraints** | Must filter temporary blocks and obvious noise; no pricing decisions |
| **POC approach** | Web browsing agent (no paid comp APIs) |

### 5.4 Pricing Optimizer

| Item | Detail |
|------|--------|
| **Layer** | Price Audit |
| **Inputs** | Portfolio snapshot, event signals, competitor signals, PM strategy inputs |
| **Outputs** | Proposed price changes per listing and date |
| **Date classification** | Protected, Healthy, At Risk, Distressed |
| **Risk assignment** | Low, Medium, High per proposal with rationale |
| **Triggers** | After signal refresh, on-demand by CRO |
| **Constraints** | Must obey configured price caps (floor/ceiling); proposals only; no execution |

### 5.5 Adjustment Reviewer

| Item | Detail |
|------|--------|
| **Layer** | Price Audit |
| **Inputs** | Pricing proposals from Pricing Optimizer |
| **Outputs** | Approved proposals, rejected proposals with reasons |
| **Approval classification** | Low risk (auto-approve eligible), Medium risk, High risk (requires human) |
| **Triggers** | Before CRO presents proposals to user |
| **Constraints** | Veto authority — CRO cannot override veto in V1 |

### 5.6 Channel Sync Agent

| Item | Detail |
|------|--------|
| **Layer** | PMS Ops |
| **Inputs** | CRO-authorized approved actions |
| **Outputs** | Execution status, verification results, rollback payloads |
| **Triggers** | Execution authorization by CRO |
| **Constraints** | Execution only in `active` state; must verify success; must rollback on failure |
| **Hostaway endpoints** | `PUT /listings/{id}/calendar`, `PUT /listings/{id}/calendarIntervals` (batch, up to 200 intervals) |

---

## 6. Orchestration Rules

### Core Revenue Loop

```
1. Data Aggregator → refreshes PMS data (Hostaway API)
2. Event Intelligence → updates event signals
3. Competitor Scanner → updates market signals
4. Pricing Optimizer → proposes pricing actions
5. Adjustment Reviewer → validates and classifies risk
6. CRO → presents proposals and explanations to user
7. Approval collected if required (HITL)
8. CRO → authorizes Channel Sync execution
9. Channel Sync → executes, verifies, stores rollback
```

> **Note:** Gap & LOS Optimizer (step between 4 and 5 in V1 full loop) is deferred from POC.
> **Note:** Anomaly Detector (post-step-9 monitoring) is deferred from POC.

### Agent Execution by State

| Agent | Connected | Observing | Simulating | Active | Paused |
|-------|-----------|-----------|------------|--------|--------|
| Data Aggregator | setup | ✅ | ✅ | ✅ | — |
| Event Intelligence | — | ✅ | ✅ | ✅ | — |
| Competitor Scanner | — | ✅ | ✅ | ✅ | — |
| Pricing Optimizer | — | — | ✅ | ✅ | — |
| Adjustment Reviewer | — | — | ✅ | ✅ | — |
| Channel Sync | — | — | — | ✅ | — |
| CRO | ✅ | ✅ | ✅ | ✅ | ✅ |

**Key constraints:**
- `connected`: Only CRO + Data Aggregator (initial setup/ingestion)
- `observing`: Signal agents run, but no proposals generated
- `simulating`: Full pipeline runs, proposals visible, no execution
- `active`: Channel Sync enabled — prices push to Hostaway
- `paused`: Only CRO active (to communicate pause reason and accept resume)

---

## 7. System State Machine

The system must always be in exactly one state. States are enforced globally.

### 7.1 States

| State | Description |
|-------|-------------|
| **Connected** | PMS linked; ingestion setup; no proposals, no execution |
| **Observing** | Read-only monitoring; signals gathered; no proposals shown to users |
| **Simulating** | Proposals and explanations visible; no execution |
| **Active** | Execution enabled under guardrails and approvals |
| **Paused** | Hard stop; no execution; requires explicit resume |

### 7.2 Allowed Transitions

```
Connected → Observing
Observing → Simulating
Simulating → Active
Active → Paused
Observing → Paused
Simulating → Paused
Paused → Observing
Active → Simulating
```

```
         ┌──────────┐
         │Connected │
         └────┬─────┘
              │
              ▼
         ┌──────────┐    ┌────────┐
    ┌───►│Observing │◄───│ Paused │
    │    └────┬─────┘    └────▲───┘
    │         │               │
    │         ▼               │
    │    ┌──────────┐         │
    │    │Simulating├─────────┤
    │    └────┬─────┘         │
    │         │               │
    │         ▼               │
    │    ┌──────────┐         │
    └────┤  Active  ├─────────┘
         └──────────┘
```

### 7.3 Forbidden Transitions

- Connected → Active (must progress through Observing → Simulating first)
- Connected → Simulating (must observe first)
- Paused → Active (must resume to Observing, then progress)
- Any transition to Active without explicit human action

---

## 8. Mock Store Layer

### Purpose

Enable development and testing before Hostaway API access is available.

### Pattern: PMSClient Adapter

```
┌─────────────────────┐
│     PMS Ops Agents   │
│  (Data Aggregator,   │
│   Channel Sync)      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│    PMSClient         │  ← interface
│  (read/write ops)    │
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌────────┐  ┌──────────┐
│  Mock  │  │ Hostaway │
│ Store  │  │  Client  │
└────────┘  └──────────┘
```

**Environment variable:** `HOSTAWAY_MODE=mock|live`
- `mock` — all PMS reads/writes go to local mock store
- `live` — all PMS reads/writes go to Hostaway API

### PMSClient Interface

Only Data Aggregator and Channel Sync use this interface. All other agents work with normalized data structures that are PMS-agnostic.

| Method | Description | Mock Behavior |
|--------|-------------|---------------|
| `list_listings()` | Get all managed properties | Return 5 mock Dubai properties |
| `get_listing(id)` | Get property details | Return mock property by ID |
| `get_calendar(id, start, end)` | Get calendar for date range | Return mock calendar with seasonal pricing |
| `get_reservations(filters)` | Get bookings | Return mock reservations |
| `update_calendar(id, intervals)` | Push price changes | Store in mock; return success |
| `verify_calendar(id, dates)` | Verify prices match | Compare against mock store |

### Mock Properties (5 Dubai Units)

| ID | Property | Area | Bedrooms | Base (AED) | Floor | Ceiling | Type |
|----|----------|------|----------|-----------|-------|---------|------|
| 1001 | Marina Heights 1BR | Dubai Marina | 1 | 550 | 400 | 800 | Apartment |
| 1002 | Downtown Residences 2BR | Downtown Dubai | 2 | 850 | 600 | 1200 | Apartment |
| 1003 | JBR Beach Studio | JBR | 0 | 400 | 300 | 600 | Studio |
| 1004 | Palm Villa 3BR | Palm Jumeirah | 3 | 2000 | 1500 | 3000 | Villa |
| 1005 | Bay View 1BR | Business Bay | 1 | 500 | 350 | 700 | Apartment |

### Mock Calendar

- **Range:** 90 days forward from current date
- **Seasonal pricing:** base rate ± 20% variation based on day-of-week and seasonality
- **Occupancy:** ~65% across portfolio (mix of booked, available, blocked)
- **Blocked dates:** scattered owner blocks

### Mock Reservations

- Mix of channels: Airbnb (~50%), Booking.com (~30%), Direct (~20%)
- Realistic lead times: 3–60 days
- Average LOS: 3–5 nights
- Revenue consistent with base rates

### Transition to Live

When Hostaway credentials are available:
1. Set `HOSTAWAY_MODE=live`
2. Enter Account ID + client_secret in connection setup
3. Data Aggregator begins reading from Hostaway API
4. Channel Sync begins writing to Hostaway API
5. No changes needed in any other agent — they work with normalized data

---

## 9. Hostaway-Specific Notes

### Authentication

| Item | Detail |
|------|--------|
| **Auth method** | OAuth 2.0 client credentials |
| **Token endpoint** | `POST https://api.hostaway.com/v1/accessTokens` |
| **Token body** | `grant_type=client_credentials`, `client_id` (Account ID), `client_secret`, `scope=general` |
| **Token lifetime** | 24 months — store and reuse |
| **Base URL** | `https://api.hostaway.com/v1` |

### Rate Limits

| Limit | Value |
|-------|-------|
| Per IP | 15 requests / 10 seconds |
| Per Account ID | 20 requests / 10 seconds |
| 429 response | `{ "status": "fail" }` with error message |

### Key Endpoints (PMS Ops Agents)

| Endpoint | Method | Agent | Notes |
|----------|--------|-------|-------|
| `/listings` | GET | Data Aggregator | Paginated (`offset` + `limit`) |
| `/listings/{id}` | GET | Data Aggregator | Single property details |
| `/listings/{id}/calendar?startDate=&endDate=` | GET | Data Aggregator | Calendar read |
| `/reservations` | GET | Data Aggregator | Filterable by listing, dates, status, channel |
| `/listings/{id}/calendar` | PUT | Channel Sync | Single date range write |
| `/listings/{id}/calendarIntervals` | PUT | Channel Sync | Batch write (up to 200 intervals) |

### ID Format

Hostaway IDs are **integers** (`int`). PriceOS stores them as **text** (cast `int` → `text`) for forward compatibility with other PMS platforms.

### Daily API Budget (5 Properties)

| Operation | Calls | Agent |
|-----------|-------|-------|
| List properties | 1 | Data Aggregator |
| Calendar read (5 × 90 days) | 5 | Data Aggregator |
| Reservations read | 1–2 | Data Aggregator |
| Price pushes (~20 proposals/day) | 5 | Channel Sync (batch endpoint) |
| Verification reads | 5 | Channel Sync |
| **Daily total** | **~18** | Well within rate limits |

---

## 10. Definition of Done

- [ ] Each agent has unambiguous responsibility and constraints
- [ ] Execution authority is centralized (CRO) and state-gated
- [ ] No worker can execute autonomously
- [ ] State transitions prevent accidental writes
- [ ] Orchestration flow is deterministic and auditable
- [ ] PMSClient adapter cleanly separates mock and live modes
- [ ] Only PMS Ops agents (Data Aggregator, Channel Sync) interact with the Hostaway API
