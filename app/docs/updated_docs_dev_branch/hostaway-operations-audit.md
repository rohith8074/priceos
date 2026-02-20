# PriceOS — Hostaway Operations Audit

## Purpose

Map every Hostaway API capability to PriceOS application features. Identify what the current MWB (Minimum Working Build) supports vs. what's missing for a complete property management + AI pricing experience.

---

## Hostaway API Operations — Full Catalog

### 1. Authentication

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| Get Access Token | POST | `/v1/accessTokens` | OAuth 2.0 client credentials flow |
| Revoke Token | DELETE | `/v1/accessTokens` | Revoke an existing token |

### 2. Listings (Property Management)

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| List Listings | GET | `/v1/listings` | Retrieve all listings with filters/pagination |
| Get Listing | GET | `/v1/listings/{id}` | Get single listing details |
| Create Listing | POST | `/v1/listings` | Create a new listing |
| Update Listing | PUT | `/v1/listings/{id}` | Update listing details (name, description, amenities, capacity, etc.) |
| Add Listing Images | POST | `/v1/listings/{id}/images` | Upload images via external URLs |

### 3. Calendar & Availability

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| Get Calendar | GET | `/v1/listings/{id}/calendar` | Retrieve calendar days with availability + pricing |
| Update Calendar | PUT | `/v1/listings/{id}/calendar` | Batch update pricing + availability for date ranges |
| Block Dates | POST | `/v1/listings/{id}/calendar/block` | Block calendar dates (owner stays, maintenance) |
| Unblock Dates | POST | `/v1/listings/{id}/calendar/unblock` | Unblock previously blocked dates |

### 4. Reservations

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| List Reservations | GET | `/v1/reservations` | List all reservations with filters |
| Get Reservation | GET | `/v1/reservations/{id}` | Get single reservation details |
| Create Reservation | POST | `/v1/reservations` | Create a new reservation (direct bookings) |
| Update Reservation | PUT | `/v1/reservations/{id}` | Update reservation details |
| Calculate Price | POST | `/v1/reservations/{id}/price` | Calculate reservation pricing |
| Calculate Price + Extras | POST | `/v1/reservations/{id}/price-with-extras` | Calculate price including add-ons |
| Update Finance | PUT | `/v1/reservations/{id}/finance` | Update financial fields (payments, adjustments) |
| List Coupons | GET | `/v1/reservations/{id}/coupons` | Get reservation coupons |
| Create Coupon | POST | `/v1/reservations/{id}/coupons` | Apply coupon to reservation |

### 5. Seasonal Rules (Pricing Rules)

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| List Seasonal Rules | GET | `/v1/listings/{id}/seasonalRules` | Get pricing rules for a listing |
| Create Seasonal Rule | POST | `/v1/listings/{id}/seasonalRules` | Create a new pricing rule (date range, min stay, rates) |
| Update Seasonal Rule | PUT | `/v1/listings/{id}/seasonalRules/{ruleId}` | Update an existing rule |
| Delete Seasonal Rule | DELETE | `/v1/listings/{id}/seasonalRules/{ruleId}` | Remove a pricing rule |
| Get Rule Intervals | GET | `/v1/seasonalRuleIntervals` | Get computed intervals from rules |

### 6. Messaging & Conversations

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| List Conversations | GET | `/v1/conversations` | Get all guest conversations |
| Get Conversation | GET | `/v1/conversations/{id}` | Get conversation details |
| Get Messages | GET | `/v1/conversations/{id}/messages` | Get messages in a conversation |
| Send Message | POST | `/v1/conversations/{id}/messages` | Send a message to guest |
| List Templates | GET | `/v1/messageTemplates` | Get saved message templates |
| Create Template | POST | `/v1/messageTemplates` | Create reusable message template |

### 7. Guest Payments & Finance

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| Create Offline Charge | POST | `/v1/reservations/{id}/offlineCharges` | Record a manual charge |
| Update Offline Charge | PUT | `/v1/reservations/{id}/offlineCharges/{chargeId}` | Update a charge |
| List Payment Rules | GET | `/v1/guestPaymentAutoRules` | Get auto-payment rules |
| Create Payment Rule | POST | `/v1/guestPaymentAutoRules` | Set up automatic payment collection |

### 8. Tasks (Operations)

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| List Tasks | GET | `/v1/listings/{id}/tasks` | Get tasks for a listing (cleaning, maintenance) |
| Create Task | POST | `/v1/listings/{id}/tasks` | Create a new task |
| Update Task | PUT | `/v1/listings/{id}/tasks/{taskId}` | Update task status/details |
| Delete Task | DELETE | `/v1/listings/{id}/tasks/{taskId}` | Remove a task |

### 9. Expenses

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| List Expenses | GET | `/v1/listings/{id}/expenses` | Get expenses for a listing |
| Create Expense | POST | `/v1/listings/{id}/expenses` | Record a new expense |
| Update Expense | PUT | `/v1/listings/{id}/expenses/{expenseId}` | Update an expense entry |

### 10. Custom Fields

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| List Custom Fields | GET | `/v1/customFields` | Get all custom field definitions |
| Create Custom Field | POST | `/v1/customFields` | Define a new custom field |
| Update Custom Field | PUT | `/v1/customFields/{id}` | Modify a custom field |
| Delete Custom Field | DELETE | `/v1/customFields/{id}` | Remove a custom field |

### 11. Cancellation Policies

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| Airbnb Policies | GET | `/v1/cancellationPolicies/airbnb` | List Airbnb cancellation policies |
| Booking.com Policies | GET | `/v1/cancellationPolicies/booking` | List Booking.com policies |
| Marriott Policies | GET | `/v1/cancellationPolicies/marriott` | List Marriott policies |
| VRBO Policies | GET | `/v1/cancellationPolicies/vrbo` | List VRBO policies |

### 12. Owner Statements & Reporting

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| List Statements | GET | `/v1/ownerStatements` | Get owner financial statements |
| Get Statement | GET | `/v1/ownerStatements/{id}` | Get individual statement |

### 13. Webhooks

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| List Webhooks | GET | `/v1/webhooks` | List configured webhooks |
| Create Webhook | POST | `/v1/webhooks` | Subscribe to events (reservation created, updated, etc.) |
| Update Webhook | PUT | `/v1/webhooks/{id}` | Update webhook config |
| Delete Webhook | DELETE | `/v1/webhooks/{id}` | Remove a webhook |

### 14. Reference Data

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| Countries | GET | `/v1/common/countries` | List of countries |
| Currencies | GET | `/v1/common/currencies` | List of currencies |
| Languages | GET | `/v1/common/languages` | Supported languages |
| Timezones | GET | `/v1/common/timezones` | Timezone data |

### 15. Users & Misc

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| Get User | GET | `/v1/users/{id}` | Get user details |
| Create Rental Agreement | POST | `/v1/rentalAgreements` | Generate rental agreement |

---

## PriceOS Feature Coverage

### Legend

| Status | Meaning |
|--------|---------|
| **Supported** | Implemented in current MWB (mock or live) |
| **Read-only** | Data is displayed but not editable |
| **Missing** | Not implemented at all |
| **N/A** | Not relevant for PriceOS |

---

### Operational Layer (Property Management)

| Feature Area | Hostaway API | PriceOS MWB Status | Notes |
|---|---|---|---|
| **Listings — View all** | `GET /listings` | **Supported** | Properties page, property cards |
| **Listings — View detail** | `GET /listings/{id}` | **Supported** | Property detail page |
| **Listings — Create** | `POST /listings` | **Missing** | No "Add Property" flow |
| **Listings — Edit** | `PUT /listings/{id}` | **Missing** | No edit form for name, description, amenities, capacity |
| **Listings — Images** | `POST /listings/{id}/images` | **Missing** | No image management |
| **Calendar — View** | `GET /listings/{id}/calendar` | **Supported** | Calendar page with grid |
| **Calendar — Update prices** | `PUT /listings/{id}/calendar` | **Supported** | Via proposal approval (mock) |
| **Calendar — Block dates** | `POST .../calendar/block` | **Missing** | No UI to block dates (owner stays, maintenance) |
| **Calendar — Unblock dates** | `POST .../calendar/unblock` | **Missing** | No UI to unblock dates |
| **Reservations — List all** | `GET /reservations` | **Missing** | No reservations page at all |
| **Reservations — View detail** | `GET /reservations/{id}` | **Missing** | No reservation detail view |
| **Reservations — Create** | `POST /reservations` | **Missing** | No "Add Direct Booking" flow |
| **Reservations — Edit** | `PUT /reservations/{id}` | **Missing** | No edit reservation flow |
| **Reservations — Pricing calc** | `POST .../price` | **Missing** | No price calculator |
| **Reservations — Finance** | `PUT .../finance` | **Missing** | No payment/finance management |
| **Reservations — Coupons** | GET/POST `.../coupons` | **Missing** | No coupon management |
| **Conversations — List** | `GET /conversations` | **Missing** | No inbox / messaging |
| **Conversations — Messages** | GET/POST `.../messages` | **Missing** | No guest messaging |
| **Message Templates** | GET/POST `/messageTemplates` | **Missing** | No template management |
| **Seasonal Rules — View** | `GET .../seasonalRules` | **Missing** | No pricing rules UI |
| **Seasonal Rules — CRUD** | POST/PUT/DELETE | **Missing** | No rule creation/editing |
| **Tasks — List** | `GET .../tasks` | **Missing** | No task/operations board |
| **Tasks — CRUD** | POST/PUT/DELETE | **Missing** | No task management |
| **Expenses — List** | `GET .../expenses` | **Missing** | No expense tracking |
| **Expenses — CRUD** | POST/PUT | **Missing** | No expense management |
| **Guest Payments** | offlineCharges, autoRules | **Missing** | No payment tracking |
| **Owner Statements** | `GET /ownerStatements` | **Missing** | No financial reports |
| **Cancellation Policies** | GET per channel | **Missing** | No policy display |
| **Webhooks** | CRUD | **Missing** | No webhook management (backend concern) |

### AI Intelligence Layer (PriceOS Value-Add)

| Feature Area | PriceOS MWB Status | Notes |
|---|---|---|
| **Dashboard / Overview** | **Supported** | KPI cards, property grid |
| **AI Price Proposals** | **Supported** | Revenue cycle generates proposals |
| **Proposal Review (approve/reject)** | **Supported** | Proposal cards with actions |
| **Event Intelligence** | **Supported** | Dubai events with demand impact |
| **Competitor Signals** | **Supported** | Market compression/release signals |
| **AI Chat Assistant** | **Supported** | Slide-out panel, context-aware |
| **Risk Assessment** | **Supported** | Risk badges on proposals |
| **Insights Page** | **Supported** | Events + market signals combined |

---

## Gap Summary

### What PriceOS MWB has (6 of ~30 feature areas):
1. Listing browse + detail (read-only)
2. Calendar view + AI price updates
3. AI pricing proposals with approve/reject
4. Event intelligence
5. Competitor market signals
6. AI chat assistant

### Critical gaps for a usable property management tool:

**Tier 1 — Core PM Operations (daily use)**
- Reservations page (list, view, filter by property/channel/status)
- Reservation detail (guest info, dates, financials)
- Calendar block/unblock (owner stays, maintenance)
- Listing edit (update details, amenities, capacity)
- Guest messaging / inbox

**Tier 2 — Revenue Operations (weekly use)**
- Seasonal pricing rules (view/create/edit)
- Expense tracking per listing
- Channel performance breakdown
- Direct booking creation

**Tier 3 — Financial & Reporting (monthly use)**
- Owner statements / P&L
- Payment tracking
- Revenue reports by property/channel/period

**Tier 4 — Advanced Operations**
- Task management (cleaning, maintenance schedules)
- Message templates
- Custom fields
- Cancellation policy management

---

## Current Architecture Problem

```
CURRENT (disjointed):
┌─────────────────────────────┐
│   AI Intelligence Layer     │  ← This is what PriceOS built
│   (Proposals, Insights,     │
│    Chat, Dashboard)         │
└─────────────────────────────┘
         ❌ GAP
┌─────────────────────────────┐
│   Operational Layer          │  ← This is mostly missing
│   (Reservations, Calendar   │
│    Mgmt, Messaging, Tasks)  │
└─────────────────────────────┘
         ↕
┌─────────────────────────────┐
│   Hostaway API              │
└─────────────────────────────┘
```

```
TARGET (integrated):
┌─────────────────────────────────────────┐
│              PriceOS UI                  │
│  ┌───────────────┐  ┌────────────────┐  │
│  │  Operational   │  │ AI Intelligence│  │
│  │  Layer         │←→│ Layer          │  │
│  │  (PM daily     │  │ (Proposals,    │  │
│  │   workflow)    │  │  Insights,     │  │
│  │               │  │  Chat)         │  │
│  └───────┬───────┘  └───────┬────────┘  │
│          └────────┬─────────┘           │
│                   ↕                      │
│          ┌────────────────┐              │
│          │  PMS Client    │              │
│          │  (mock / live) │              │
│          └────────┬───────┘              │
│                   ↕                      │
│          ┌────────────────┐              │
│          │  Hostaway API  │              │
│          └────────────────┘              │
└─────────────────────────────────────────┘
```

AI intelligence is contextual and woven into operational views — not a separate silo.
