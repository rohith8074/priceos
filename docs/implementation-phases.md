# PriceOS — Phase-wise Implementation Plan

## Strategy: AI-Differentiation-First

Keep the existing AI intelligence layer. Each phase backfills the operational context the AI needs to be useful, then deepens both layers together.

## Data Layer Principle

**All features are powered by the mock data store first.** The PMSClient abstraction (`mock-client.ts` / `hostaway-client.ts`) means every new operation gets a mock implementation with realistic Dubai data. When `HOSTAWAY_MODE=live` is flipped, the same UI works against the real API with zero frontend changes. No phase requires a live Hostaway connection — the mock layer is the source of truth for development and demos.

---

## Phase 0 — Current MWB (Done)

What exists today:

| Area | Features |
|------|----------|
| Dashboard | KPI cards (properties, avg price, occupancy, revenue) |
| Properties | List view, detail page (read-only) |
| Calendar | Single-property 90-day grid, color-coded availability |
| Proposals | AI-generated price proposals, approve/reject, risk badges |
| Insights | Event intelligence, competitor market signals |
| AI Chat | Slide-out panel, property-context-aware |
| DB Schema | Aligned with Hostaway API field names |
| PMS Client | Mock/live abstraction layer with Hostaway wire types + mappers |

**What's missing:** No reservations, no calendar editing, no listing editing, no messaging. AI layer has no operational data to anchor to.

---

## Phase 1 — Operational Context for AI

**Goal:** Backfill the operational surfaces the AI layer needs. After Phase 1, a property manager can see reservations, manage calendar availability, and edit listings — and the AI recommendations have real operational context.

### 1.1 Reservations Page

**Why first:** Reservations are the core revenue data. The AI pricing engine needs reservation context (booking velocity, channel mix, revenue per property) to give good recommendations. Currently this data exists in mock but has zero UI.

| Feature | Hostaway API | Description |
|---------|-------------|-------------|
| Reservations list | `GET /reservations` | Filterable table: by property, channel, status, date range |
| Reservation detail | `GET /reservations/{id}` | Guest info, dates, financials, channel, check-in/out times |
| Status badges | — | confirmed, pending, cancelled, completed |
| Property filter | — | Dropdown to filter by listing |
| Channel breakdown | — | Visual indicator (Airbnb, Booking.com, Direct) |

**Navigation:** Add "Reservations" to sidebar between Properties and Calendar.

**AI integration:** "Ask AI" button on reservation detail → "Is this booking priced well for the dates?" Context-aware chat.

**New files:**
- `app/(dashboard)/reservations/page.tsx` — list page
- `app/(dashboard)/reservations/[id]/page.tsx` — detail page
- `components/reservations/reservation-table.tsx` — filterable table
- `components/reservations/reservation-detail-card.tsx` — detail view
- `data/mock-reservations.ts` — already exists, needs minor enrichment

### 1.2 Calendar Block/Unblock

**Why:** Property managers block dates daily (owner stays, maintenance, seasonal closures). Without this, the calendar is read-only and useless for operations. The AI also needs to know *why* dates are blocked to avoid proposing prices for them.

| Feature | Hostaway API | Description |
|---------|-------------|-------------|
| Block dates | `POST .../calendar/block` | Select date range → block with reason (owner stay, maintenance, other) |
| Unblock dates | `POST .../calendar/unblock` | Click blocked date → unblock |
| Block reason | — | PriceOS-specific: tag blocks with reason |
| Visual distinction | — | Different colors for booked vs owner-blocked vs maintenance-blocked |

**UI changes:**
- Calendar grid: click available date → popover with "Block Dates" option
- Calendar grid: click blocked date → popover with "Unblock" option
- Date range selection for bulk block/unblock
- Block reason selector (Owner Stay, Maintenance, Other)

**AI integration:** AI chat can say "I see 5 days blocked for owner stay in March — if you unblock Mar 15-17, projected revenue is +2,400 AED."

### 1.3 Listing Edit

**Why:** Property details (capacity, amenities, price floor/ceiling) directly feed the AI pricing engine. If a PM can't update these, the AI works with stale data.

| Feature | Hostaway API | Description |
|---------|-------------|-------------|
| Edit listing | `PUT /listings/{id}` | Edit form: name, description, bedrooms, bathrooms, capacity, amenities |
| Edit price bounds | — | PriceOS-specific: priceFloor, priceCeiling |
| Edit base price | — | Update the listing's base nightly rate |

**UI changes:**
- Property detail page: "Edit" button → slide-out form or inline edit
- Fields: name, propertyType, bedroomsNumber, bathroomsNumber, personCapacity, amenities, price, priceFloor, priceCeiling
- Save → updates mock store (or Hostaway API in live mode)

### 1.4 Sidebar Restructure

**Current:**
```
Overview
Properties
Calendar
Proposals
Insights
---
Agents (status)
Ask AI
```

**Phase 1 target:**
```
OPERATIONS
  Dashboard
  Properties
  Reservations    ← NEW
  Calendar

INTELLIGENCE
  Proposals
  Insights

---
Agents (status)
Ask AI
```

Group nav into two sections: Operations (daily PM workflow) and Intelligence (AI-powered). This makes the two-layer architecture visible in the UI.

### Phase 1 Deliverables Checklist

- [ ] Reservations list page with filters (property, channel, status, dates)
- [ ] Reservation detail page (guest info, financials, dates)
- [ ] Calendar block/unblock with reason tags
- [ ] Listing edit form (inline or slide-out)
- [ ] Sidebar restructured into Operations + Intelligence sections
- [ ] AI chat context enriched with reservation data
- [ ] Mock data layer supports all new operations
- [ ] PMSClient interface extended with new methods

---

## Phase 2 — Deepen Both Layers

**Goal:** Make operations richer (direct bookings, pricing rules, channel view) and make AI smarter (pricing rules awareness, channel-specific recommendations).

### 2.1 Direct Booking Creation

| Feature | Hostaway API | Description |
|---------|-------------|-------------|
| Create reservation | `POST /reservations` | Form: guest name, email, dates, property, channel=Direct |
| Price calculator | `POST .../price` | Auto-calculate total based on calendar prices |

**UI:** "New Booking" button on Reservations page → multi-step form.

### 2.2 Seasonal Pricing Rules

| Feature | Hostaway API | Description |
|---------|-------------|-------------|
| View rules | `GET .../seasonalRules` | List of pricing rules per property |
| Create rule | `POST .../seasonalRules` | Date range, min/max stay, rate adjustment |
| Edit rule | `PUT .../seasonalRules/{id}` | Modify existing rule |
| Delete rule | `DELETE .../seasonalRules/{id}` | Remove a rule |

**UI:** New "Pricing Rules" sub-page under each property, or a dedicated "Rules" section. Table of rules with inline editing.

**AI integration:** AI proposals become aware of existing seasonal rules. "Your high-season rule already sets +20% for Dec 15-31. My recommendation is an additional +8% because of the NYE concert series."

### 2.3 Channel Performance View

**UI:** Dashboard or dedicated view showing:
- Revenue by channel (Airbnb vs Booking.com vs Direct)
- Booking count by channel
- Average nightly rate by channel
- Channel trend over time

**AI integration:** "Your Airbnb ADR is 15% below Booking.com. Consider adjusting channel-specific pricing."

### 2.4 Multi-Property Calendar

**UI:** Replace single-property calendar with a Gantt-style view:
- Rows = properties
- Columns = dates
- Blocks = reservations (color-coded by channel)
- Click empty cell → block or create booking
- Hover block → guest name, dates, total

This is the "hotel front desk" view that operators expect.

### 2.5 Enhanced AI Proposals

- Proposals now reference seasonal rules they're working within
- Proposals show reservation context ("3 bookings this week, 2 gaps of 1 night")
- Batch approve/reject proposals
- "Apply All Low-Risk" one-click action

### Phase 2 Deliverables Checklist

- [ ] Direct booking creation form with price calculator
- [ ] Seasonal pricing rules CRUD per property
- [ ] Channel performance dashboard/view
- [ ] Multi-property calendar (Gantt-style)
- [ ] AI proposals enriched with rules + reservation context
- [ ] Batch proposal actions

---

## Phase 3 — Full Operations + Smart Automation

**Goal:** Complete the operational surface (messaging, tasks, expenses, payments). AI graduates from recommendations to automated actions.

### 3.1 Guest Messaging / Inbox

| Feature | Hostaway API | Description |
|---------|-------------|-------------|
| Conversation list | `GET /conversations` | Inbox with unread counts |
| Messages | GET/POST `.../messages` | Thread view with send capability |
| Templates | GET/POST `/messageTemplates` | Saved quick replies |

**UI:** "Inbox" in sidebar under Operations. Chat-style message threads. Quick-reply templates.

**AI integration:** AI suggests reply templates based on message content. "Guest is asking about early check-in — here's a suggested response."

### 3.2 Task Management

| Feature | Hostaway API | Description |
|---------|-------------|-------------|
| Task board | `GET .../tasks` | Kanban or list: cleaning, maintenance, inspections |
| Create/edit tasks | POST/PUT | Auto-create cleaning task on checkout |

**UI:** "Tasks" in sidebar. Kanban board (To Do → In Progress → Done). Auto-generated tasks from reservation check-outs.

### 3.3 Expense Tracking

| Feature | Hostaway API | Description |
|---------|-------------|-------------|
| Expenses per listing | `GET .../expenses` | List with category, amount, date |
| Add expense | `POST .../expenses` | Form: category, amount, notes, receipt |

**UI:** Expense tab on property detail page. Monthly expense summary on dashboard.

### 3.4 Financial Overview

| Feature | Hostaway API | Description |
|---------|-------------|-------------|
| Owner statements | `GET /ownerStatements` | Monthly P&L per property |
| Payment tracking | offlineCharges, autoRules | Guest payment status |

**UI:** "Finance" section in sidebar. Per-property P&L. Revenue vs expenses. Payout tracking.

### 3.5 AI Automation

- **Auto-approve low-risk proposals** — toggle in settings
- **Auto-block after check-out** — 1-day maintenance block
- **Price decay alerts** — "Property 1003 hasn't been booked in 14 days, suggest 10% drop"
- **Revenue forecasting** — 30/60/90-day projections per property
- **Anomaly detection** — "Booking for Palm Villa at 40% below market rate — review?"

### Phase 3 Deliverables Checklist

- [ ] Guest messaging inbox with thread view
- [ ] Message templates (quick replies)
- [ ] Task management (kanban board)
- [ ] Auto-generated tasks from reservations
- [ ] Expense tracking per property
- [ ] Owner statements / financial overview
- [ ] AI auto-approve toggle for low-risk proposals
- [ ] Revenue forecasting (30/60/90 day)
- [ ] Anomaly detection alerts

---

## Phase 4 — Polish & Scale

### 4.1 Settings & Configuration
- Hostaway API credentials setup
- Webhook configuration
- Notification preferences
- Custom fields management
- Cancellation policy display

### 4.2 Multi-User & Permissions
- Role-based access (owner, manager, cleaner)
- Activity log / audit trail

### 4.3 Mobile Optimization
- Responsive calendar
- Quick actions from mobile (approve proposal, respond to guest)
- Push notifications for new bookings, AI recommendations

### 4.4 Onboarding
- Connect Hostaway account flow
- Import properties
- Set price floor/ceiling per property
- First AI cycle run

---

## Target Sidebar (Final State)

```
OPERATIONS
  Dashboard           — KPI overview + today's activity feed
  Properties          — List, detail, edit
  Reservations        — Table, detail, create direct booking
  Calendar            — Multi-property Gantt view
  Inbox               — Guest messaging
  Tasks               — Cleaning, maintenance kanban

INTELLIGENCE
  Proposals           — AI price recommendations
  Pricing Rules       — Seasonal rules per property
  Insights            — Events, competitors, trends
  Finance             — Revenue, expenses, P&L

---
Agents (status indicators)
Ask AI (slide-out chat)
Settings
```

---

## Summary

| Phase | Focus | Key Deliverables | AI Enhancement |
|-------|-------|------------------|----------------|
| **0** | Current MWB | Dashboard, Properties (RO), Calendar (RO), Proposals, Insights, Chat | Base AI pricing engine |
| **1** | Operational context | Reservations page, Calendar block/unblock, Listing edit, Sidebar restructure | AI gets reservation + availability context |
| **2** | Deepen both layers | Direct bookings, Pricing rules, Channel view, Multi-property calendar | AI aware of rules + channels |
| **3** | Full operations + automation | Messaging, Tasks, Expenses, Finance | Auto-approve, forecasting, anomaly detection |
| **4** | Polish & scale | Settings, Multi-user, Mobile, Onboarding | End-to-end automated pricing |
