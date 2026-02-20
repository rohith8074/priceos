# PriceOS Database — Simple Schema Guide

> **What is this?** A plain-English guide to every table in our database.  
> Each table shows: what it stores, what each column means, a sample row, and where it shows up in the app.

---

## How the Tables Connect

```
┌──────────────┐
│   LISTINGS   │  ← The center of everything. Every other table points here.
│  (Properties)│
└──────┬───────┘
       │
       │ "This property has..."
       │
       ├──→  CALENDAR_DAYS      (daily prices & availability)
       ├──→  RESERVATIONS       (guest bookings)
       │         └──→ REVIEWS   (guest feedback)
       ├──→  CONVERSATIONS      (guest messages)
       │         └──→ CONVERSATION_MESSAGES
       ├──→  TASKS              (cleaning, maintenance)
       ├──→  SEASONAL_RULES     (min stay, price rules)
       ├──→  EXPENSES           (costs & bills)
       └──→  OWNER_STATEMENTS   (monthly profit reports)

Standalone tables (not linked to one property):
       ├──→  PROPOSALS          (AI price suggestions)
       │         └──→ EXECUTIONS (price push history)
       ├──→  EVENTS             (Dubai festivals, conferences)
       ├──→  COMPETITOR_SIGNALS (market pricing data)
       ├──→  CHAT_MESSAGES      (user ↔ AI conversations)
       └──→  MESSAGE_TEMPLATES  (pre-written reply templates)
```

---

## 📋 Table 1: LISTINGS (Properties)

**What:** Every property you manage. This is the main table.  
**Comes from:** Hostaway `GET /v1/listings`  
**Shows on:** Dashboard, Properties page, everywhere

### Columns

| Column | What it means | Example |
|--------|--------------|---------|
| `id` | Our internal ID (auto-generated) | `1` |
| `hostaway_id` | Hostaway's ID for this property | `40160` |
| `name` | Property name guests see | `Luxury Marina View 2BR` |
| `city` | City | `Dubai` |
| `country_code` | 2-letter country | `AE` |
| `area` | Neighborhood (we set this) | `Dubai Marina` |
| `lat` / `lng` | GPS coordinates | `25.080 / 55.140` |
| `bedrooms_number` | How many bedrooms | `2` |
| `bathrooms_number` | How many bathrooms | `2` |
| `property_type` | Apartment, villa, studio | `apartment` |
| `person_capacity` | Max guests allowed | `6` |
| `price` | Base nightly price | `650.00` |
| `currency_code` | Currency | `AED` |
| `price_floor` | AI cannot go below this | `450.00` |
| `price_ceiling` | AI cannot go above this | `950.00` |
| `cleaning_fee` | One-time cleaning charge | `200.00` |
| `min_nights` / `max_nights` | Stay length limits | `2` / `30` |
| `star_rating` | Property rating | `4.5` |
| `avg_review_rating` | Average guest review | `4.8` |
| `amenities` | List of features (JSON) | `["wifi","pool","gym"]` |
| `images` | Photo URLs (JSON) | `[{"url":"...", "caption":"Living Room"}]` |
| `is_active` | Are we managing it? | `true` |
| `last_synced_at` | When we last pulled from Hostaway | `2026-02-18 10:00:00` |

### Sample Row

```
id=1 | hostaway_id=40160 | name="Luxury Marina View 2BR" | city="Dubai"
area="Dubai Marina" | bedrooms=2 | bathrooms=2 | price=650.00 AED
floor=450 | ceiling=950 | capacity=6 | rating=4.8 | active=true
```

### Where it appears in the app
- **Dashboard** → "15 Properties" count, "AED 525 Avg Price"
- **Properties page** → Each property card
- **Pricing Engine** → Base price + floor/ceiling guardrails

---

## 📅 Table 2: CALENDAR_DAYS (Daily Prices)

**What:** One row for each day for each property. Shows if it's available and the price.  
**Comes from:** Hostaway `GET /v1/listings/{id}/calendar`  
**Shows on:** Bookings page calendar, Pricing engine

### Columns

| Column | What it means | Example |
|--------|--------------|---------|
| `id` | Auto ID | `1` |
| `listing_id` | Which property (links to listings) | `1` |
| `date` | The specific date | `2026-03-15` |
| `status` | What's happening that day | `available` |
| `price` | Nightly rate for that date | `700.00` |
| `minimum_stay` | Guest must book at least N nights | `2` |
| `maximum_stay` | Guest can book at most N nights | `30` |
| `is_available` | Quick yes/no for availability | `true` |
| `notes` | Any internal notes | `null` |
| `synced_at` | When we last pulled this | `2026-02-18 10:00:00` |

### Status Values

| Status | Meaning | Calendar Color |
|--------|---------|---------------|
| `available` | Open for booking | 🟢 Green |
| `reserved` | Guest has booked it | 🔵 Blue |
| `blocked` | Host blocked it manually | ⚫ Gray |
| `pending` | Booking not confirmed yet | 🟡 Yellow |
| `maintenance` | Under repair | 🟠 Orange |

### Sample Rows (Property #1, March 2026)

```
listing=1 | date=2026-03-14 | status=available | price=650  | min_stay=2
listing=1 | date=2026-03-15 | status=reserved  | price=700  | min_stay=2
listing=1 | date=2026-03-16 | status=reserved  | price=700  | min_stay=2
listing=1 | date=2026-03-17 | status=reserved  | price=700  | min_stay=2
listing=1 | date=2026-03-18 | status=available | price=650  | min_stay=2
listing=1 | date=2026-03-19 | status=blocked   | price=650  | min_stay=2  | note="Owner stay"
```

### Where it appears
- **Bookings page** → The calendar grid (green/blue/gray cells)
- **Pricing engine** → AI looks at available dates to suggest price changes
- **Dashboard** → Occupancy % = reserved days ÷ total days

---

## 🏨 Table 3: RESERVATIONS (Bookings)

**What:** Every guest booking — who's staying, when, how much they paid, which channel.  
**Comes from:** Hostaway `GET /v1/reservations`  
**Shows on:** Dashboard, Bookings page, Finance

### Columns

| Column | What it means | Example |
|--------|--------------|---------|
| `id` | Our internal ID | `1` |
| `hostaway_id` | Hostaway's booking ID | `5001` |
| `listing_map_id` | Which property | `1` |
| `guest_name` | Guest's full name | `Sarah Johnson` |
| `guest_email` | Guest's email | `sarah@gmail.com` |
| `guest_phone` | Guest's phone | `+447911123456` |
| `channel_name` | Where they booked | `airbnb` |
| `confirmation_code` | Booking reference | `HMABCDEF123` |
| `arrival_date` | Check-in date | `2026-03-15` |
| `departure_date` | Check-out date | `2026-03-20` |
| `nights` | Length of stay | `5` |
| `total_price` | Total booking value | `3750.00` |
| `price_per_night` | Per-night rate | `750.00` |
| `number_of_guests` | How many guests | `3` |
| `status` | Booking state | `confirmed` |
| `channel_commission` | Channel's fee | `112.50` |
| `cleaning_fee` | Cleaning charge | `200.00` |
| `tax_amount` | Tax charged | `187.50` |
| `reservation_date` | When booking was made | `2026-02-10` |
| `synced_at` | Last sync | `2026-02-18 10:00:00` |

### Status Values

| Status | Meaning |
|--------|---------|
| `new` | Fresh booking, just came in |
| `modified` | Guest changed dates or details |
| `confirmed` | Payment confirmed |
| `cancelled` | Booking was cancelled |
| `ownerStay` | Owner is using the property |

### Sample Rows

```
id=1 | guest="Sarah Johnson" | property=1 | channel=airbnb
  check-in=Mar 15 | check-out=Mar 20 | 5 nights | AED 3,750 | status=confirmed

id=2 | guest="Ahmed Al-Rashid" | property=2 | channel=booking.com
  check-in=Mar 22 | check-out=Mar 25 | 3 nights | AED 1,350 | status=new

id=3 | guest="Maria Garcia" | property=1 | channel=direct
  check-in=Apr 5 | check-out=Apr 10 | 5 nights | AED 4,250 | status=confirmed
```

### Where it appears
- **Dashboard** → Monthly Revenue, Occupancy %, Channel Breakdown chart
- **Bookings page** → List of all reservations
- **Finance** → Revenue calculations, commission tracking
- **AI Engine** → Booking velocity (are bookings speeding up or slowing down?)

---

## ⭐ Table 4: REVIEWS (Guest Feedback)

**What:** Ratings and comments guests leave after their stay.  
**Comes from:** Hostaway `GET /v1/reviews`  
**Shows on:** Property detail, used by AI for quality scoring

### Columns

| Column | What it means | Example |
|--------|--------------|---------|
| `id` | Our ID | `1` |
| `hostaway_id` | Hostaway review ID | `7001` |
| `listing_map_id` | Which property | `1` |
| `reservation_id` | Which booking | `1` |
| `rating` | Star rating (1-5) | `4.8` |
| `public_review` | What guest wrote publicly | `"Amazing apartment! Very clean."` |
| `private_feedback` | What guest told host privately | `"WiFi was slow in bedroom"` |
| `review_categories` | Category breakdown (JSON) | `{"cleanliness":5, "value":4.5}` |
| `guest_name` | Who wrote it | `Sarah Johnson` |
| `type` | Direction | `guest-to-host` |

### Sample Row

```
id=1 | property=1 | guest="Sarah Johnson" | rating=4.8
  public="Amazing apartment with stunning marina views! Very clean."
  private="WiFi was a bit slow in the bedroom"
  categories: cleanliness=5.0, communication=5.0, accuracy=4.5, value=4.5
```

### Where it appears
- **AI Engine** → Calculates Quality Score = average of all ratings. Higher score = AI can price higher
- **Property Detail** → Shows review cards with star ratings

---

## 💬 Table 5: CONVERSATIONS (Guest Chats)

**What:** Parent container for each guest chat thread.  
**Comes from:** Hostaway `GET /v1/conversations`  
**Shows on:** Inbox page, Dashboard unread count

### Columns

| Column | What it means | Example |
|--------|--------------|---------|
| `id` | Our ID | `1` |
| `listing_id` | Which property | `1` |
| `reservation_id` | Which booking | `1` |
| `guest_name` | Guest's name | `Sarah Johnson` |
| `guest_email` | Guest's email | `sarah@gmail.com` |
| `channel` | Communication channel | `airbnb` |
| `last_message` | Preview of latest message | `"Your check-in code is 4521"` |
| `last_message_at` | When last message was sent | `2026-02-18 10:30:00` |
| `unread_count` | How many unread messages | `1` |
| `status` | Chat state | `active` |

---

## 💬 Table 6: CONVERSATION_MESSAGES (Individual Messages)

**What:** Each individual message within a conversation.  
**Comes from:** Hostaway `GET /v1/conversations/{id}/messages`

### Columns

| Column | What it means | Example |
|--------|--------------|---------|
| `id` | Our ID | `1` |
| `conversation_id` | Which conversation thread | `1` |
| `sender` | Who sent it | `guest` or `host` |
| `content` | The actual message text | `"What time can I check in?"` |
| `sent_at` | When it was sent | `2026-02-18 09:15:00` |

### Sample Messages (one conversation)

```
Conv #1 (Sarah Johnson ↔ Host, about Booking #1):

  09:15 [GUEST] "Hi! What time can I check in early?"
  10:30 [HOST]  "Hello Sarah! Early check-in at 1 PM is available for AED 100."
  10:45 [GUEST] "Perfect, I'd like that please!"
  11:00 [HOST]  "Done! Your check-in is confirmed for 1 PM. Door code: 4521"
```

---

## 🎯 Table 7: PROPOSALS (AI Price Suggestions)

**What:** Every price change the AI recommends. Internal to PriceOS — NOT from Hostaway.  
**Created by:** PriceOS Revenue Cycle engine  
**Shows on:** Pricing page

### Columns

| Column | What it means | Example |
|--------|--------------|---------|
| `id` | Proposal ID | `1` |
| `cycle_id` | Which AI run generated this | `CYCLE-17084...` |
| `listing_id` | Which property | `1` |
| `date` | Which date to change | `2026-03-28` |
| `current_price` | Price right now | `650.00` |
| `proposed_price` | AI's suggestion | `850.00` |
| `change_pct` | % change | `+31%` |
| `risk_level` | How risky is this change | `medium` |
| `status` | What happened to it | `pending` |
| `reasoning` | Why AI suggested this | `"Dubai World Cup: extreme demand"` |
| `signals` | Data that drove the decision (JSON) | `{"event":"Dubai World Cup", "occupancy":88%}` |

### Status Flow

```
pending  →  approved  →  executed  (price pushed to Hostaway)
   │
   └──→  rejected   (user said no)
```

### Sample Rows

```
Property 1 | Mar 28 | Current: 650 → Proposed: 850 (+31%) | MEDIUM risk
  Reason: "Dubai World Cup event. Extreme demand expected. Market avg: 890"
  Status: pending (waiting for user approval)

Property 1 | Apr 5 | Current: 650 → Proposed: 550 (-15%) | LOW risk
  Reason: "Post-event demand release. Occupancy dropping to 42%"
  Status: approved (auto-approved because low risk)
```

---

## ✅ Table 8: EXECUTIONS (Price Push History)

**What:** Record of every price change we actually pushed to Hostaway.  
**Created when:** User approves a proposal and we call `PUT /v1/listings/{id}/calendar`

### Columns

| Column | What it means | Example |
|--------|--------------|---------|
| `id` | Execution ID | `1` |
| `proposal_id` | Which proposal was approved | `1` |
| `listing_id` | Which property | `1` |
| `date_range_start` | Start date of change | `2026-03-28` |
| `date_range_end` | End date of change | `2026-03-30` |
| `old_price` | What it was before | `650.00` |
| `new_price` | What we changed it to | `850.00` |
| `sync_status` | Did the push succeed? | `synced` |
| `created_at` | When we pushed it | `2026-02-18 11:00:00` |

### Sync Status

| Status | Meaning |
|--------|---------|
| `pending` | About to push to Hostaway |
| `synced` | ✅ Successfully pushed |
| `failed` | ❌ API call failed (will retry) |
| `verified` | ✅ Double-checked: Hostaway has the new price |

---

## 📐 Table 9: SEASONAL_RULES (Pricing Rules)

**What:** Date-based rules like "min 3 nights in peak season" or "+15% during events"  
**Comes from:** Hostaway `GET /v1/listings/{id}/seasonalRules`

### Columns

| Column | What it means | Example |
|--------|--------------|---------|
| `id` | Rule ID | `1` |
| `listing_id` | Which property | `1` |
| `name` | Rule name | `Peak Winter Season` |
| `start_date` | Rule starts | `2025-12-01` |
| `end_date` | Rule ends | `2026-02-28` |
| `price_modifier` | Price adjustment (%) | `+15` |
| `minimum_stay` | Min nights during this period | `3` |
| `maximum_stay` | Max nights | `30` |
| `enabled` | Is rule active? | `true` |

### Sample Row

```
"Peak Winter Season" | Dec 1 - Feb 28 | +15% price | Min 3 nights | enabled
```

---

## 📝 Table 10: TASKS (Cleaning, Maintenance)

**What:** Operational tasks like cleaning, repairs, inspections.  
**Comes from:** Hostaway `GET /v1/tasks`  
**Shows on:** Tasks page, Dashboard overdue count

### Columns

| Column | What it means | Example |
|--------|--------------|---------|
| `id` | Task ID | `1` |
| `listing_id` | Which property | `1` |
| `title` | What needs to be done | `Deep cleaning after checkout` |
| `description` | Details | `Full clean including linens` |
| `category` | Type of task | `cleaning` |
| `priority` | Urgency | `high` |
| `status` | Current state | `todo` |
| `due_date` | When it must be done by | `2026-03-20` |
| `assignee` | Who's doing it | `Maria (Cleaner)` |

### Status Flow

```
todo  →  in_progress  →  done
```

---

## 💰 Table 11: EXPENSES (Costs)

**What:** Every cost — cleaning supplies, maintenance, utility bills.  
**Comes from:** Hostaway `GET /v1/finance/expenseAndExtra`  
**Shows on:** Finance page

### Columns

| Column | What it means | Example |
|--------|--------------|---------|
| `id` | Expense ID | `1` |
| `listing_id` | Which property | `1` |
| `category` | Expense type | `utilities` |
| `amount` | How much | `350.00` |
| `currency_code` | Currency | `AED` |
| `description` | What it's for | `Monthly internet bill` |
| `date` | When the expense occurred | `2026-02-15` |

---

## 📊 Table 12: OWNER_STATEMENTS (Monthly Reports)

**What:** Monthly profit/loss summary per property.  
**Comes from:** Hostaway `GET /v1/ownerStatements`  
**Shows on:** Finance page

### Columns

| Column | What it means | Example |
|--------|--------------|---------|
| `id` | Statement ID | `1` |
| `listing_id` | Which property | `1` |
| `month` | Which month | `2026-01` |
| `total_revenue` | Total income | `28,500.00` |
| `total_expenses` | Total costs | `4,200.00` |
| `net_income` | Profit (revenue - expenses) | `24,300.00` |
| `occupancy_rate` | % of days booked | `78` |
| `reservation_count` | How many bookings | `6` |

### Sample Row

```
Property 1 | January 2026
  Revenue: AED 28,500 | Expenses: AED 4,200 | Net: AED 24,300
  Occupancy: 78% | Bookings: 6
```

---

## 🌍 Table 13: EVENTS (Dubai Market Events)

**What:** Festivals, conferences, and events that affect demand.  
**Source:** PriceOS team curates this (not from Hostaway)  
**Used by:** AI pricing engine

### Columns

| Column | What it means | Example |
|--------|--------------|---------|
| `id` | Event ID | `dsf-2026` |
| `name` | Event name | `Dubai Shopping Festival` |
| `start_date` | Event starts | `2025-12-05` |
| `end_date` | Event ends | `2026-01-11` |
| `category` | Type | `festival` |
| `demand_impact` | How much it affects pricing | `extreme` |
| `demand_notes` | Details | `30%+ occupancy boost citywide` |
| `confidence` | How sure we are (0-1) | `1.0` |

### Sample Rows

```
Dubai Shopping Festival  | Dec 5 - Jan 11 | EXTREME demand | confidence: 100%
Dubai World Cup          | Mar 28          | EXTREME demand | confidence: 100%
Ramadan                  | Feb 26 - Mar 27 | MEDIUM demand  | confidence: 100%
Art Dubai                | Apr 15-19       | HIGH demand    | confidence: 95%
```

---

## 📈 Table 14: COMPETITOR_SIGNALS (Market Data)

**What:** Pricing trends in competing properties by area.  
**Source:** Market analysis / scraping (not from Hostaway)  
**Used by:** AI pricing engine

### Columns

| Column | What it means | Example |
|--------|--------------|---------|
| `id` | Signal ID | `comp-001` |
| `area` | Dubai neighborhood | `Dubai Marina` |
| `start_date` | Period start | `2026-03-15` |
| `end_date` | Period end | `2026-03-22` |
| `signal` | Market direction | `compression` |
| `average_price` | Market avg rate | `620.00` |
| `price_change_pct` | % change from normal | `+15%` |
| `occupancy_rate` | Market occupancy | `78%` |
| `reasoning` | Why | `"Art Dubai early bookings"` |

### Signal Types

| Signal | Meaning | AI Action |
|--------|---------|-----------|
| `compression` | Demand UP, supply LOW → prices rising | AI suggests raising prices |
| `release` | Demand DOWN, supply HIGH → prices dropping | AI suggests lowering prices |

---

## 🤖 Table 15: CHAT_MESSAGES (User ↔ AI Agent)

**What:** History of conversations between the PriceOS user and the AI assistant.  
**Source:** Internal (PriceOS AI chat)

### Columns

| Column | What it means | Example |
|--------|--------------|---------|
| `id` | Message ID | `1` |
| `session_id` | Chat session | `session-abc123` |
| `role` | Who said it | `user` or `assistant` |
| `content` | The message | `"Why did you suggest raising Marina prices?"` |
| `listing_id` | Property context (if any) | `1` |
| `created_at` | When | `2026-02-18 11:00:00` |

---

## 📝 Table 16: MESSAGE_TEMPLATES (Quick Replies)

**What:** Pre-written message templates for guest communication.  
**Comes from:** Hostaway `GET /v1/messageTemplates`  
**Shows on:** Inbox (template picker)

### Columns

| Column | What it means | Example |
|--------|--------------|---------|
| `id` | Template ID | `1` |
| `name` | Template name | `Check-in Instructions` |
| `content` | Message with placeholders | `"Hi {{guest_name}}! Your code is {{door_code}}"` |
| `category` | When to use it | `check_in` |

---

## 📊 All Tables at a Glance

| Table | Rows (15 properties) | Source | Synced How Often |
|-------|---------------------|--------|-----------------|
| `listings` | 15 | Hostaway API | Every 6 hours |
| `calendar_days` | ~5,500 (365 days × 15) | Hostaway API | Every 4 hours |
| `reservations` | ~100-300/year | Hostaway API + Webhook | Every 15 min + instant |
| `reviews` | ~50-100/year | Hostaway API | Every 24 hours |
| `conversations` | ~100-300/year | Hostaway API + Webhook | Every 5 min + instant |
| `conversation_messages` | ~500-2000/year | Hostaway API + Webhook | Every 5 min + instant |
| `tasks` | ~200-500/year | Hostaway API | Every 10 min |
| `seasonal_rules` | ~5-20 | Hostaway API | Every 6 hours |
| `expenses` | ~200-500/year | Hostaway API | Every 1 hour |
| `owner_statements` | 12-15/year | Hostaway API | Daily |
| `proposals` | ~50,000/year | PriceOS AI (internal) | On each AI run |
| `executions` | ~10,000/year | PriceOS (internal) | On price push |
| `events` | ~20-50 | PriceOS team (manual) | As needed |
| `competitor_signals` | ~100-200/year | Market analysis | As available |
| `chat_messages` | varies | PriceOS AI chat | On each chat |
| `message_templates` | ~10-20 | Hostaway API | Every 24 hours |

---

## 🔗 How Tables Connect (Foreign Keys)

```
listings.id ← calendar_days.listing_id        "Property #1 has 365 calendar days"
listings.id ← reservations.listing_map_id     "Property #1 has 6 bookings this month"
listings.id ← conversations.listing_id        "Property #1 has 3 active chats"
listings.id ← tasks.listing_id                "Property #1 has 2 pending tasks"
listings.id ← seasonal_rules.listing_id       "Property #1 has 'Peak Season' rule"
listings.id ← expenses.listing_id             "Property #1 has AED 4,200 expenses"
listings.id ← owner_statements.listing_id     "Property #1 made AED 24,300 in Jan"
listings.id ← proposals.listing_id            "AI suggests AED 850 for Mar 28"

reservations.id ← reviews.reservation_id      "Booking #1 got a 4.8 star review"
reservations.id ← conversations.reservation_id "Booking #1 has a chat with Sarah"

conversations.id ← conversation_messages.conversation_id  "Chat #1 has 4 messages"

proposals.id ← executions.proposal_id         "Proposal #1 was pushed to Hostaway"
```
