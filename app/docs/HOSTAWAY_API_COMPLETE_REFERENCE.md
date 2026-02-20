# PriceOS ↔ Hostaway API — Complete Integration Reference

> **Document Version:** 1.0  
> **Last Updated:** 2026-02-18  
> **Source:** https://api.hostaway.com/documentation  
> **Purpose:** Maps every PriceOS dashboard section to the exact Hostaway API endpoints, fields, query parameters, and sync frequencies required.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Dashboard Page (`/dashboard`)](#2-dashboard-page)
3. [Properties Page (`/properties`)](#3-properties-page)
4. [Property Detail Page (`/properties/[id]`)](#4-property-detail-page)
5. [Bookings / Calendar Page (`/bookings`)](#5-bookings--calendar-page)
6. [Pricing / Proposals Page (`/pricing`)](#6-pricing--proposals-page)
7. [Inbox / Conversations Page (`/inbox`)](#7-inbox--conversations-page)
8. [Tasks Page (`/tasks`)](#8-tasks-page)
9. [Finance Page (`/finance`)](#9-finance-page)
10. [Settings Page (`/settings`)](#10-settings-page)
11. [Write-Back Endpoints (PriceOS → Hostaway)](#11-write-back-endpoints)
12. [Webhook Events](#12-webhook-events)
13. [Complete Endpoint Summary Table](#13-complete-endpoint-summary-table)
14. [Rate Limits & Best Practices](#14-rate-limits--best-practices)

---

## 1. Authentication

All Hostaway API calls require an OAuth 2.0 Bearer token obtained via the Client Credentials Grant.

### Endpoint

| Method | URL | Content-Type |
|--------|-----|-------------|
| `POST` | `https://api.hostaway.com/v1/accessTokens` | `application/x-www-form-urlencoded` |

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `grant_type` | string | ✅ | Always `client_credentials` |
| `client_id` | string | ✅ | Your Hostaway Account ID |
| `client_secret` | string | ✅ | Your API Client Secret |
| `scope` | string | ✅ | Always `general` |

### cURL Example

```bash
curl -X POST https://api.hostaway.com/v1/accessTokens \
  -H 'Content-type: application/x-www-form-urlencoded' \
  -d 'grant_type=client_credentials&client_id=YOUR_ACCOUNT_ID&client_secret=YOUR_SECRET&scope=general'
```

### Response

```json
{
  "token_type": "Bearer",
  "expires_in": 31536000,
  "access_token": "eyJ0eXAiOiJKV1Qi..."
}
```

### PriceOS Implementation Notes

- Store `access_token` in environment variable `HOSTAWAY_ACCESS_TOKEN`
- Token expires in ~1 year; implement auto-refresh logic
- All subsequent requests use header: `Authorization: Bearer {access_token}`

### Token Revocation

| Method | URL |
|--------|-----|
| `POST` | `https://api.hostaway.com/v1/accessTokens/revoke` |

---

## 2. Dashboard Page (`/dashboard`)

The dashboard aggregates data from **4 different API calls** to compute KPIs.

### Data Requirements

| Dashboard Widget | Data Source | Hostaway Endpoint |
|------------------|------------|-------------------|
| Total Properties | Listing count | `GET /v1/listings` |
| Avg Base Price | Listing prices | `GET /v1/listings` |
| Occupancy Rate | Calendar + Reservations | `GET /v1/listings/{id}/calendar` + `GET /v1/reservations` |
| Monthly Revenue | Reservation totals | `GET /v1/reservations` |
| Channel Breakdown | Reservation `channelName` | `GET /v1/reservations` |
| Revenue Forecast | Reservations by future dates | `GET /v1/reservations` |
| Check-ins Today | Reservations with today's `arrivalDate` | `GET /v1/reservations` |
| Check-outs Today | Reservations with today's `departureDate` | `GET /v1/reservations` |
| Pending Proposals | Internal (PriceOS DB) | N/A |
| Overdue Tasks | Tasks with past `shouldEndBy` | `GET /v1/tasks` |
| Unread Messages | Conversations `hasUnreadMessages` | `GET /v1/conversations` |

### API Call #1: List Listings

```
GET https://api.hostaway.com/v1/listings
```

**Fields needed for Dashboard:**

| Hostaway Field | PriceOS Usage | Type |
|----------------|---------------|------|
| `id` | Primary key, linking | integer |
| `name` | Display name | string |
| `price` | Average base price KPI | float |
| `currencyCode` | Price display | string |
| `city` | Location grouping | string |
| `countryCode` | Location | string |
| `bedroomsNumber` | Property card display | integer |
| `bathroomsNumber` | Property card display | integer |
| `propertyTypeId` | Property type classification | integer |

### API Call #2: List Reservations

```
GET https://api.hostaway.com/v1/reservations?limit=100&offset=0
```

**Query Parameters:**

| Parameter | Type | Purpose |
|-----------|------|---------|
| `limit` | integer | Pagination (max 200) |
| `offset` | integer | Pagination offset |
| `listingId` | integer | Filter by property |
| `arrivalStartDate` | string (YYYY-MM-DD) | Filter arrivals from |
| `arrivalEndDate` | string (YYYY-MM-DD) | Filter arrivals until |
| `departureStartDate` | string (YYYY-MM-DD) | Filter departures from |
| `departureEndDate` | string (YYYY-MM-DD) | Filter departures until |
| `channelId` | integer | Filter by channel |
| `hasUnreadConversationMessages` | integer (0/1) | Filter unread |
| `order` | string | Sort order |

**Fields needed for Dashboard:**

| Hostaway Field | PriceOS Usage | Type |
|----------------|---------------|------|
| `id` | Unique reservation ID | integer |
| `hostawayReservationId` | Internal reference | integer |
| `listingMapId` | Links to listing | integer |
| `guestName` | Today's check-in/out display | string |
| `guestFirstName` | Guest greeting | string |
| `guestLastName` | Guest greeting | string |
| `guestEmail` | Contact info | string |
| `channelName` | Channel breakdown chart (airbnb, booking.com, etc.) | string |
| `channelId` | Channel identification | integer |
| `arrivalDate` | Check-in date (YYYY-MM-DD) | string |
| `departureDate` | Check-out date | string |
| `nights` | Stay duration | integer |
| `totalPrice` | Revenue calculation | float |
| `currency` | Price normalization | string |
| `status` | Filter active bookings (`new`, `modified`, `cancelled`) | string |
| `checkInTime` | Check-in hour | integer |
| `checkOutTime` | Check-out hour | integer |
| `numberOfGuests` | Occupancy tracking | integer |
| `adults` | Guest breakdown | integer |
| `children` | Guest breakdown | integer |
| `confirmationCode` | Booking reference | string |
| `taxAmount` | Financial reporting | float |
| `channelCommissionAmount` | Net revenue calculation | float |
| `hostawayCommissionAmount` | Net revenue calculation | float |
| `cleaningFee` | Expense tracking | float |
| `securityDepositFee` | Deposit tracking | float |
| `financeField` | Full financial breakdown (array of fee objects) | array |
| `reservationDate` | When booking was made | datetime |
| `isStarred` | Priority bookings | integer |
| `isArchived` | Archive filtering | integer |

### API Call #3: List Conversations (for unread count)

```
GET https://api.hostaway.com/v1/conversations?includeResources=1
```

**Fields needed:**

| Hostaway Field | PriceOS Usage | Type |
|----------------|---------------|------|
| `id` | Conversation identifier | integer |
| `listingMapId` | Links to property | integer |
| `reservationId` | Links to booking | integer |
| `hasUnreadMessages` | Unread badge count | integer (0/1) |
| `messageSentOn` | Last message timestamp | datetime |

### API Call #4: List Tasks (for overdue count)

```
GET https://api.hostaway.com/v1/tasks
```

**Fields needed:**

| Hostaway Field | PriceOS Usage | Type |
|----------------|---------------|------|
| `id` | Task identifier | integer |
| `status` | Filter non-completed (pending, inProgress) | string |
| `shouldEndBy` | Due date for overdue calculation | datetime |
| `listingMapId` | Links to property | integer |

### Sync Frequency: Every 5 minutes (dashboard auto-refresh)

---

## 3. Properties Page (`/properties`)

Displays all property cards with key details.

### Endpoint

```
GET https://api.hostaway.com/v1/listings?limit=100&offset=0
```

**Query Parameters:**

| Parameter | Type | Purpose |
|-----------|------|---------|
| `limit` | integer | Pagination |
| `offset` | integer | Skip rows |
| `sortOrder` | string | Sort direction |
| `city` | string | Filter by city |
| `country` | string | Filter by country |
| `contactName` | string | Filter by contact |
| `propertyTypeId` | integer | Filter by property type |
| `match` | string | Search by name/description |

**Complete Fields Required:**

| Hostaway Field | PriceOS Field | Type | Description |
|----------------|---------------|------|-------------|
| `id` | `id` | integer | Primary key |
| `name` | `name` | string | Property title |
| `internalListingName` | — | string | Internal reference name |
| `description` | — | string | Public description |
| `city` | `city` | string | City name |
| `countryCode` | `countryCode` | string | ISO country code |
| `state` | — | string | State/Province |
| `street` | — | string | Street address |
| `address` | — | string | Full address |
| `publicAddress` | — | string | Guest-facing address |
| `zipcode` | — | string | Postal code |
| `lat` | — | float | Latitude (for map compsets) |
| `lng` | — | float | Longitude |
| `price` | `price` | float | Base nightly price |
| `currencyCode` | `currencyCode` | string | Currency (AED, USD) |
| `bedroomsNumber` | `bedroomsNumber` | integer | Number of bedrooms |
| `bathroomsNumber` | `bathroomsNumber` | integer | Number of bathrooms |
| `guestBathroomsNumber` | — | integer | Guest bathrooms |
| `propertyTypeId` | `propertyTypeId` | integer | Property type reference |
| `personCapacity` | `personCapacity` | integer | Max guests |
| `squareMeters` | — | integer | Property size |
| `roomType` | — | string | entire_home, private_room, etc. |
| `bathroomType` | — | string | private, shared |
| `bedsNumber` | — | integer | Number of beds |
| `bedType` | — | string | real_bed, sofa_bed, etc. |
| `minNights` | — | integer | Minimum stay requirement |
| `maxNights` | — | integer | Maximum stay |
| `cleaningFee` | — | float | Fixed cleaning charge |
| `priceForExtraPerson` | — | float | Extra guest surcharge |
| `guestsIncluded` | — | integer | Guests included in base price |
| `weeklyDiscount` | — | float | Weekly stay discount (0-1) |
| `monthlyDiscount` | — | float | Monthly stay discount (0-1) |
| `checkInTimeStart` | — | integer | Check-in window start (hour) |
| `checkInTimeEnd` | — | integer | Check-in window end |
| `checkOutTime` | — | integer | Check-out hour |
| `instantBookable` | — | integer (0/1) | Instant booking enabled |
| `starRating` | — | float | Property star rating |
| `averageReviewRating` | — | float | Average guest review score |
| `listingAmenities` | `amenities` | array | Amenity IDs |
| `listingImages` | — | array | `[{ url, caption, sortOrder }]` |
| `listingBedTypes` | — | array | Bed configurations |
| `timeZoneName` | — | string | Timezone |
| `wifiUsername` | — | string | WiFi credentials |
| `wifiPassword` | — | string | WiFi credentials |
| `houseRules` | — | string | House rules text |
| `specialInstruction` | — | string | Special instructions |
| `doorSecurityCode` | — | string | Door/lock code |
| `cancellationPolicy` | — | string | Policy type |
| `airbnbListingUrl` | — | string | Airbnb listing URL |
| `vrboListingUrl` | — | string | VRBO listing URL |

### Sync Frequency: Every 6 hours (properties rarely change)

---

## 4. Property Detail Page (`/properties/[id]`)

Shows comprehensive view of a single property with calendar, reservations, rules, expenses, and statements.

### 4.1 Get Single Listing

```
GET https://api.hostaway.com/v1/listings/{listingId}
```

Returns the same listing object as Section 3, but for a single property.

### 4.2 Get Calendar (90 days)

```
GET https://api.hostaway.com/v1/listings/{listingId}/calendar?startDate=2026-02-18&endDate=2026-05-19&includeResources=1
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string (YYYY-MM-DD) | ✅ | Calendar range start |
| `endDate` | string (YYYY-MM-DD) | ✅ | Calendar range end |
| `includeResources` | integer (0/1) | Optional | Embed reservation data in calendar days |

**Calendar Day Object Fields:**

| Hostaway Field | PriceOS Field | Type | Description |
|----------------|---------------|------|-------------|
| `id` | — | integer | Calendar day ID |
| `date` | `date` | string (YYYY-MM-DD) | The date |
| `isAvailable` | — | integer (0/1) | Availability flag |
| `isProcessed` | — | integer (0/1) | Sync processing flag |
| `status` | `status` | string | `available`, `blocked`, `reserved`, `pending`, `mblocked`, `hardBlock`, `conflicted`, `mreserved` |
| `price` | `price` | float | Nightly rate for this date |
| `minimumStay` | `minimumStay` | integer | Min nights from this date |
| `maximumStay` | `maximumStay` | integer | Max nights from this date |
| `closedOnArrival` | — | integer/null | Block check-ins this day |
| `closedOnDeparture` | — | integer/null | Block check-outs this day |
| `note` | `notes` | string/null | Internal note |
| `countAvailableUnits` | — | integer/null | Multi-unit: available units |
| `availableUnitsToSell` | — | integer/null | Multi-unit: sellable units |
| `countPendingUnits` | — | integer/null | Multi-unit: pending |
| `countBlockingReservations` | — | integer/null | Multi-unit: blocked |
| `reservations` | — | array | Embedded reservation objects (when `includeResources=1`) |

### 4.3 Get Reservations for Property

```
GET https://api.hostaway.com/v1/reservations?listingId={listingId}&limit=100
```

Uses same fields as Section 2, filtered by `listingId`.

### 4.4 Get Seasonal Rules

```
GET https://api.hostaway.com/v1/listings/{listingId}/seasonalRules
```

**Seasonal Rule Object Fields:**

| Hostaway Field | PriceOS Field | Type | Description |
|----------------|---------------|------|-------------|
| `id` | `id` | integer | Rule ID |
| `title` | `name` | string | Rule name |
| `channelId` | — | integer | Channel-specific rule |
| `closedForCheckin` | — | string/array | Days closed for check-in |
| `closedForCheckout` | — | string/array | Days closed for check-out |
| `color` | — | string | UI color tag |
| `minNightsSunday` | — | integer/null | Sunday minimum nights |
| `minNightsMonday` | — | integer/null | Monday minimum nights |
| `minNightsTuesday` | — | integer/null | Tuesday minimum nights |
| `minNightsWednesday` | — | integer/null | Wednesday minimum nights |
| `minNightsThursday` | — | integer/null | Thursday minimum nights |
| `minNightsFriday` | — | integer/null | Friday minimum nights |
| `minNightsSaturday` | — | integer/null | Saturday minimum nights |
| `maxNightsSunday` | — | integer/null | Sunday maximum nights |
| `maxNightsMonday` | — | integer/null | Monday maximum nights |
| `maxNightsTuesday` | — | integer/null | Tuesday maximum nights |
| `maxNightsWednesday` | — | integer/null | Wednesday maximum nights |
| `maxNightsThursday` | — | integer/null | Thursday maximum nights |
| `maxNightsFriday` | — | integer/null | Friday maximum nights |
| `maxNightsSaturday` | — | integer/null | Saturday maximum nights |
| `minNightsUnspecified` | `minimumStay` | integer/null | Default minimum nights |
| `maxNightsUnspecified` | `maximumStay` | integer/null | Default maximum nights |
| `pricingRules` | `priceModifier` | object/null | Price adjustments |

### 4.5 Get Seasonal Rule Intervals (Date Ranges)

```
GET https://api.hostaway.com/v1/listings/{listingId}/seasonalRules/{seasonalRuleId}/intervals
```

Returns the specific date ranges when each seasonal rule applies.

### 4.6 Get Listing Price Settings

```
GET https://api.hostaway.com/v1/listing/pricingSettings/{listingId}
```

**Response Fields:**

| Hostaway Field | PriceOS Usage | Type |
|----------------|---------------|------|
| `listingMapId` | Listing reference | integer |
| `isAirbnbLOSActive` | Airbnb Length-of-Stay pricing active | integer (0/1) |
| `isBookingLOSActive` | Booking.com LOS active | integer (0/1) |
| `isVrboLOSActive` | VRBO LOS active | integer (0/1) |
| `isExpediaLOSActive` | Expedia LOS active | integer (0/1) |

### Sync Frequency: Every 4 hours (calendar data), Every 6 hours (listing/rules)

---

## 5. Bookings / Calendar Page (`/bookings`)

Displays a combined calendar + reservation table view across all properties.

### Endpoints Required

| Purpose | Method & URL | Frequency |
|---------|-------------|-----------|
| All properties | `GET /v1/listings` | Every 6 hours |
| All reservations | `GET /v1/reservations?limit=200` | Every 15 min |
| 30-day calendar per property | `GET /v1/listings/{id}/calendar?startDate=X&endDate=Y` | Every 4 hours |
| 90-day calendar for selected property | `GET /v1/listings/{id}/calendar?startDate=X&endDate=Y` | On property selection |

### Reservation Fields Used on This Page

| Hostaway Field | Display Location | Description |
|----------------|-----------------|-------------|
| `guestName` | Reservation row | Full guest name |
| `guestFirstName` | Guest detail | First name |
| `guestLastName` | Guest detail | Last name |
| `guestEmail` | Guest contact | Email address |
| `guestPicture` | Avatar | Guest photo URL |
| `guestCity` | Guest origin | City |
| `guestCountry` | Guest origin | Country code |
| `phone` | Guest contact | Phone number |
| `channelName` | Channel badge | airbnb, booking.com, direct, vrbo |
| `arrivalDate` | Calendar highlight | Start date |
| `departureDate` | Calendar highlight | End date |
| `nights` | Stay summary | Duration |
| `totalPrice` | Revenue column | Total booking value |
| `status` | Status badge | new, modified, cancelled |
| `confirmationCode` | Reference | Booking confirmation |
| `numberOfGuests` | Occupancy | Total guest count |
| `adults` | Guest breakdown | Adults |
| `children` | Guest breakdown | Children |
| `infants` | Guest breakdown | Infants |
| `pets` | Guest breakdown | Pets |
| `hostNote` | Internal note | Host's private note |
| `doorCode` | Operations | Door/lock code |
| `financeField` | Revenue detail | Financial breakdown array |

### Calendar Day Fields Used

| Hostaway Field | Display Location | Description |
|----------------|-----------------|-------------|
| `date` | Calendar cell | Date |
| `status` | Cell color | available (green), reserved (blue), blocked (gray) |
| `price` | Cell overlay | Nightly rate |
| `minimumStay` | Tooltip | Min nights restriction |
| `note` | Tooltip | Internal notes |

### Sync Frequency: Every 15 minutes (reservations), Every 4 hours (calendar)

---

## 6. Pricing / Proposals Page (`/pricing`)

This is the **core AI engine** of PriceOS. It uses data from multiple sources to generate price proposals.

### Endpoints Required

| Purpose | Method & URL | Data Used For |
|---------|-------------|---------------|
| All listings | `GET /v1/listings` | Property base prices, price floors/ceilings |
| Calendar per listing | `GET /v1/listings/{id}/calendar?startDate=X&endDate=Y` | Current prices, occupancy gaps |
| All reservations | `GET /v1/reservations` | Booking velocity, revenue pacing |
| Reviews | `GET /v1/reviews` | Quality score (affects pricing power) |
| Price settings per listing | `GET /v1/listing/pricingSettings/{id}` | LOS pricing status |

### Review Object Fields (Quality Score Input)

```
GET https://api.hostaway.com/v1/reviews
```

| Hostaway Field | PriceOS Usage | Type | Description |
|----------------|---------------|------|-------------|
| `id` | Unique review ID | integer | Primary key |
| `listingMapId` | Link to property | integer | Maps to listing |
| `reservationId` | Link to booking | integer | Which stay |
| `channelId` | Source channel | integer | Airbnb, Booking.com, etc. |
| `type` | Review direction | string | `guest-to-host`, `host-to-guest` |
| `status` | Review state | string | `awaiting`, `submitted`, `expired` |
| `rating` | **Quality score** | float/null | Numeric rating |
| `publicReview` | Sentiment analysis input | string/null | Public review text |
| `privateFeedback` | Internal quality alerts | string/null | Private feedback |
| `revieweeResponse` | Host response | string/null | Response text |
| `isRevieweeRecommended` | Recommendation flag | integer/null | 0 or 1 |
| `isCancelled` | Filter cancelled | integer | 0 or 1 |
| `reviewCategory` | Category breakdown | array | Rating categories |
| `departureDate` | Review timing | datetime | Stay end date |
| `arrivalDate` | Review timing | datetime | Stay start date |
| `listingName` | Display | string | Property name |
| `guestName` | Display | string | Reviewer name |

### How Data Feeds the Pricing AI

```
                 ┌──────────────┐
                 │  GET /listings│ → base price, floor, ceiling
                 └──────┬───────┘
                        │
┌──────────────┐        ▼         ┌──────────────────┐
│ GET /calendar │ → occupancy  →  │  PRICING ENGINE   │
│ (per listing) │   gaps, current │  (Revenue Cycle)  │
└──────────────┘   prices         │                   │
                        │         │  Outputs:          │
┌──────────────┐        │         │  - proposed_price  │
│GET /reservations│→ booking    │  - change_pct      │
│               │  velocity     │  - risk_level      │
└──────────────┘        │         │  - reasoning       │
                        ▼         └────────┬───────────┘
┌──────────────┐                           │
│ GET /reviews  │ → quality     ┌──────────▼──────────┐
│               │   score       │ PUT /calendar        │
└──────────────┘               │ (push approved price)│
                                └─────────────────────┘
```

### Sync Frequency: Every 4 hours (for revenue cycle), On-demand (manual trigger)

---

## 7. Inbox / Conversations Page (`/inbox`)

Real-time guest messaging portal.

### 7.1 List Conversations

```
GET https://api.hostaway.com/v1/conversations?limit=50&offset=0&includeResources=1
```

**Query Parameters:**

| Parameter | Type | Purpose |
|-----------|------|---------|
| `reservationId` | integer | Filter by booking |
| `limit` | integer | Pagination |
| `offset` | integer | Pagination |
| `includeResources` | integer (0/1) | Embed reservation data |

**Conversation Object Fields:**

| Hostaway Field | PriceOS Field | Type | Description |
|----------------|---------------|------|-------------|
| `id` | `id` | integer | Conversation ID |
| `accountId` | — | integer | Account reference |
| `listingMapId` | `listingMapId` | integer | Property link |
| `reservationId` | `reservationId` | integer | Booking link |
| `type` | — | string | `host-guest-email`, `host-guest-sms` |
| `recipientEmail` | `guestEmail` | string | Guest email |
| `recipientName` | `guestName` | string | Guest name |
| `recipientPicture` | — | string/null | Guest avatar URL |
| `hostEmail` | — | string | Host proxy email |
| `guestEmail` | — | string | Guest proxy email |
| `hasUnreadMessages` | `unreadCount` | integer (0/1) | Unread flag |
| `messageSentOn` | `lastMessageAt` | datetime | Last outgoing message |
| `messageReceivedOn` | — | datetime/null | Last incoming message |
| `conversationMessages` | — | array | Embedded messages (when `includeResources=1`) |
| `Reservation` | — | object | Embedded reservation (when `includeResources=1`) |

### 7.2 Get Conversation Messages

```
GET https://api.hostaway.com/v1/conversations/{conversationId}/messages
```

**ConversationMessage Object Fields:**

| Hostaway Field | PriceOS Field | Type | Description |
|----------------|---------------|------|-------------|
| `id` | `id` | integer | Message ID |
| `conversationId` | `conversationId` | integer | Parent conversation |
| `listingMapId` | — | integer | Property link |
| `reservationId` | — | integer | Booking link |
| `body` | `content` | string | **Message text** |
| `communicationType` | — | string | `email`, `sms`, `airbnb`, etc. |
| `status` | — | string | `sent`, `delivered`, `failed` |
| `isIncoming` | `sender` | integer (0/1) | 0 = host, 1 = guest → maps to `sender: "guest"/"host"` |
| `isSeen` | — | integer (0/1) | Read receipt |
| `sentUsingHostaway` | — | integer (0/1) | Sent via Hostaway |
| `date` | `sentAt` | datetime | Message timestamp |
| `sentChannelDate` | — | datetime | Channel-side timestamp |
| `attachments` | — | array | File attachments `[{ name, url, mimeType }]` |
| `insertedOn` | — | datetime | DB insert time |

### 7.3 Send a Message

```
POST https://api.hostaway.com/v1/conversations/{conversationId}/messages
```

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `body` | string | ✅ | Message content |

### 7.4 Get Message Templates

```
GET https://api.hostaway.com/v1/messageTemplates
```

**Message Template Object Fields:**

| Hostaway Field | PriceOS Field | Type | Description |
|----------------|---------------|------|-------------|
| `id` | `id` | integer | Template ID |
| `listingMapId` | — | string | Listing filter |
| `channelId` | — | string | Channel filter |
| `messageTemplateGroupId` | — | string | Group ID |
| `name` | `name` | string | Template name (e.g., "greeting") |
| `description` | — | string | Template description |
| `message` | `content` | string | Template body with `{{placeholders}}` |
| `color` | `category` | string | Visual category |

**Available Placeholders in Templates:**

- `{{guest_name}}`
- `{{guest_first_name}}`
- `{{listing_name}}`
- `{{check_in_date}}`
- `{{check_out_date}}`
- `{{door_code}}`
- `{{wifi_username}}`
- `{{wifi_password}}`
- `{{confirmation_code}}`

### 7.5 Get Reservation-Specific Filled Templates

```
GET https://api.hostaway.com/v1/reservations/{reservationId}/messageTemplates
```

Returns templates with placeholders already filled with the reservation's data.

### Sync Frequency: Every 2 minutes (polling) or Real-time via Webhooks

---

## 8. Tasks Page (`/tasks`)

Operational task management for cleaning, maintenance, and inspections.

### 8.1 List Tasks

```
GET https://api.hostaway.com/v1/tasks
```

**Query Parameters:**

| Parameter | Type | Purpose |
|-----------|------|---------|
| `listingMapId` | integer | Filter by property |
| `status` | string | `pending`, `confirmed`, `inProgress`, `completed`, `cancelled` |
| `assigneeUserId` | integer | Filter by assignee |
| `limit` | integer | Pagination |
| `offset` | integer | Pagination |

**Task Object Fields:**

| Hostaway Field | PriceOS Field | Type | Description |
|----------------|---------------|------|-------------|
| `id` | `id` | integer | Task ID |
| `listingMapId` | `listingMapId` | integer | Property link |
| `reservationId` | `reservationId` | integer/null | Booking link |
| `channelId` | — | integer/null | Channel reference |
| `assigneeUserId` | `assignee` | integer/null | Assigned user |
| `supervisorUserId` | — | integer/null | Supervisor |
| `createdByUserId` | — | integer/null | Creator |
| `title` | `title` | string | Task name |
| `description` | `description` | string/null | Task details |
| `canStartFrom` | — | datetime | Earliest start time |
| `canStartFromEvent` | — | string | `arrival`, `departure`, `previousArrival`, `previousDeparture` |
| `canStartFromEventDelta` | — | integer | Hours offset from event |
| `shouldEndBy` | `dueDate` | datetime | **Due date/time** |
| `shouldEndByEvent` | — | string | Relative end event |
| `shouldEndByEventDelta` | — | integer | Hours offset |
| `status` | `status` | string | `pending`→`todo`, `inProgress`→`in_progress`, `completed`→`done` |
| `priority` | `priority` | string/null | Priority level |
| `cost` | — | float/null | Task cost |
| `costCurrency` | — | string/null | Cost currency |
| `costDescription` | — | string/null | Cost breakdown |
| `resolutionNote` | — | string/null | Completion note |
| `feedbackScore` | — | integer/null | Quality feedback |
| `feedbackNote` | — | string/null | Feedback details |
| `startedAt` | — | datetime/null | Actual start |
| `confirmedAt` | — | datetime/null | Confirmed time |
| `completedAt` | — | datetime/null | Completed time |
| `color` | — | string/null | UI color |
| `expense` | — | object/null | Linked expense |
| `checklistItems` | — | array | Subtask checklist |
| `customFieldValue` | — | array | Custom fields |
| `categoriesMap` | `category` | object/null | Task categories |

### 8.2 Create Task

```
POST https://api.hostaway.com/v1/tasks
```

**Request Body:**

| Parameter | Type | Required |
|-----------|------|----------|
| `title` | string | ✅ |
| `description` | string | Optional |
| `listingMapId` | integer | Optional |
| `reservationId` | integer | Optional |
| `assigneeUserId` | integer | Optional |
| `canStartFrom` | datetime | Optional |
| `shouldEndBy` | datetime | Optional |
| `status` | string | Optional |
| `priority` | string | Optional |

### 8.3 Update Task

```
PUT https://api.hostaway.com/v1/tasks/{taskId}
```

Same body as Create.

### 8.4 Delete Task

```
DELETE https://api.hostaway.com/v1/tasks/{taskId}
```

### 8.5 Get Users List (for task assignment)

```
GET https://api.hostaway.com/v1/users
```

Returns team members for the `assigneeUserId` dropdown.

| Hostaway Field | Purpose |
|----------------|---------|
| `id` | User ID |
| `firstName` | Display name |
| `lastName` | Display name |
| `email` | Contact |
| `role` | Access level |

### 8.6 Get Groups (for team assignment)

```
GET https://api.hostaway.com/v1/groups
```

Returns teams/groups for `canBePickedByGroupId`.

### Sync Frequency: Every 10 minutes

---

## 9. Finance Page (`/finance`)

Financial tracking: expenses, owner statements, and P&L reporting.

### 9.1 Get Expenses & Extras

```
GET https://api.hostaway.com/v1/finance/expenseAndExtra
```

**Query Parameters:**

| Parameter | Type | Purpose |
|-----------|------|---------|
| `listingMapId` | integer | Filter by property |
| `ownerStatementId` | integer | Filter by statement |
| `type` | string | `expense` or `extra` |
| `limit` | integer | Pagination |
| `offset` | integer | Pagination |

**Expense Object Fields:**

| Hostaway Field | PriceOS Field | Type | Description |
|----------------|---------------|------|-------------|
| `id` | `id` | integer | Expense ID |
| `listingMapId` | `listingMapId` | integer | Property link |
| `reservationId` | `reservationId` | integer/null | Booking link |
| `ownerStatementId` | — | integer/null | Statement link |
| `expenseDate` | `date` | string (YYYY-MM-DD) | Expense date |
| `concept` | `description` | string | What the expense is for |
| `type` | — | string | `expense` or `extra` (income) |
| `amount` | `amount` | float | Amount value |
| `isDeleted` | — | integer (0/1) | Soft delete flag |
| `categories` | `category` | array | Category IDs |
| `categoriesNames` | — | array | Category display names |
| `attachments` | — | array | Receipt files |
| `listingName` | — | string | Property name |
| `guestName` | — | string | Guest name |
| `ownerStatementNames` | — | array | Linked statement names |

### 9.2 Create Expense

```
POST https://api.hostaway.com/v1/finance/expenseAndExtra
```

**Request Body:**

| Parameter | Type | Required |
|-----------|------|----------|
| `listingMapId` | integer | ✅ |
| `expenseDate` | string | ✅ |
| `concept` | string | ✅ |
| `type` | string | ✅ (`expense` or `extra`) |
| `amount` | float | ✅ |
| `reservationId` | integer | Optional |

### 9.3 Get Owner Statements

```
GET https://api.hostaway.com/v1/ownerStatements
```

**Response Fields:**

| Hostaway Field | PriceOS Field | Type | Description |
|----------------|---------------|------|-------------|
| `id` | `id` | integer | Statement ID |
| `statementName` | `month` | string | Statement name/period |

### 9.4 Get Owner Statement by ID

```
GET https://api.hostaway.com/v1/ownerStatements/{statementId}
```

Returns detailed breakdown including:
- Revenue totals per listing
- Expense summaries
- Net income calculations
- Reservation counts

### 9.5 Finance Standard Report

```
GET https://api.hostaway.com/v1/finance/report/standard?startDate=2026-01-01&endDate=2026-01-31
```

Returns standardized financial data for all listings.

### 9.6 Finance Consolidated Report

```
GET https://api.hostaway.com/v1/finance/report/consolidated?startDate=2026-01-01&endDate=2026-01-31
```

Returns consolidated (aggregated) financial reports across listings.

### 9.7 Listing Financials Report

```
GET https://api.hostaway.com/v1/finance/report/listing?startDate=2026-01-01&endDate=2026-01-31
```

Per-listing financial breakdown with revenue and expense details.

### 9.8 Finance Standard Fields

```
GET https://api.hostaway.com/v1/finance/standardFields
```

Returns the list of configurable financial fields in the account.

### 9.9 Finance Calculated Fields

```
GET https://api.hostaway.com/v1/finance/calculatedFields
```

Returns formula-based computed financial metrics.

### 9.10 Reservation Price Calculation

```
POST https://api.hostaway.com/v2/reservations/{listingId}/calculatePrice
```

**Request Body:**

| Parameter | Type | Required |
|-----------|------|----------|
| `arrivalDate` | string | ✅ |
| `departureDate` | string | ✅ |
| `numberOfGuests` | integer | Optional |

**Response includes:** Price breakdown with base price, cleaning fee, taxes, discounts.

### Sync Frequency: Every 1 hour (expenses), Daily (reports/statements)

---

## 10. Settings Page (`/settings`)

Configuration management for Hostaway API connection and automation rules.

### Required Data

| Setting | Hostaway Source |
|---------|----------------|
| API Connection Status | `POST /v1/accessTokens` (test connection) |
| Property Types | `GET /v1/propertyTypes` |
| Amenities List | `GET /v1/amenities` |
| Bed Types List | `GET /v1/bedTypes` |
| Cancellation Policies | `GET /v1/cancellationPolicies` |
| Countries | `GET /v1/countries` |
| Currencies | `GET /v1/currencies` |
| Timezones | `GET /v1/timezones` |
| Languages | `GET /v1/languages` |

### Sync Frequency: On page load (reference data rarely changes)

---

## 11. Write-Back Endpoints (PriceOS → Hostaway)

These are the endpoints PriceOS calls when **pushing approved changes back** to Hostaway.

### 11.1 Update Calendar (Push Price Changes)

```
PUT https://api.hostaway.com/v1/listings/{listingId}/calendar
```

**Request Body:**

```json
{
  "startDate": "2026-12-30",
  "endDate": "2027-01-02",
  "isAvailable": 1,
  "price": 1500,
  "minimumStay": 3,
  "maximumStay": 30,
  "closedOnArrival": null,
  "closedOnDeparture": null,
  "note": "AI price update - Dubai Shopping Festival surge"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `startDate` | string | Start of date range |
| `endDate` | string | End of date range |
| `isAvailable` | integer (0/1) | Set availability |
| `price` | float | **New nightly price** |
| `minimumStay` | integer | Minimum stay override |
| `maximumStay` | integer | Maximum stay override |
| `closedOnArrival` | integer/null | Block check-ins |
| `closedOnDeparture` | integer/null | Block check-outs |
| `note` | string | Audit trail note |

### 11.2 Batch Calendar Update (Multi-Property)

```
PUT https://api.hostaway.com/v1/listings/calendar
```

**Request Body:**

```json
{
  "listings": [
    {
      "listingId": 1001,
      "startDate": "2026-12-30",
      "endDate": "2027-01-02",
      "price": 1500
    },
    {
      "listingId": 1002,
      "startDate": "2026-12-30",
      "endDate": "2027-01-02",
      "price": 2200
    }
  ]
}
```

### 11.3 Block/Unblock Dates

```
PUT https://api.hostaway.com/v1/listings/{listingId}/calendar
```

```json
{
  "startDate": "2026-03-15",
  "endDate": "2026-03-20",
  "isAvailable": 0,
  "note": "Owner stay"
}
```

### 11.4 Create Reservation (Manual Booking)

```
POST https://api.hostaway.com/v1/reservations
```

Full reservation creation with guest details, pricing, and dates.

### 11.5 Update Reservation

```
PUT https://api.hostaway.com/v1/reservations/{reservationId}
```

### 11.6 Cancel Reservation

```
POST https://api.hostaway.com/v1/reservations/{reservationId}/cancel
```

### 11.7 Send Guest Message

```
POST https://api.hostaway.com/v1/conversations/{conversationId}/messages
```

### 11.8 Update Listing

```
PUT https://api.hostaway.com/v1/listings/{listingId}
```

Update property details, amenities, pricing settings, etc.

---

## 12. Webhook Events

Instead of polling, Hostaway can push real-time events to your server.

### Setup

```
POST https://api.hostaway.com/v1/webhooks/unified
```

**Supported Events:**

| Event | Trigger | PriceOS Action |
|-------|---------|----------------|
| `reservation.created` | New booking | Update calendar, recalculate revenue |
| `reservation.modified` | Booking changed | Update dates, reprice |
| `reservation.cancelled` | Booking cancelled | Free up dates, recalculate |
| `conversationMessage.created` | New guest message | Show notification, AI auto-reply |
| `listing.updated` | Property details changed | Re-sync listing data |
| `calendar.updated` | Availability changed externally | Re-sync calendar |

### Webhook Payload Structure

```json
{
  "event": "reservation.created",
  "data": { /* Full reservation/message object */ },
  "timestamp": "2026-02-18T10:00:00Z"
}
```

### Webhook URL to register: `https://your-priceos-domain.com/api/webhooks/hostaway`

---

## 13. Complete Endpoint Summary Table

| # | Endpoint | Method | PriceOS Section | Sync Frequency |
|---|----------|--------|-----------------|----------------|
| 1 | `/v1/accessTokens` | POST | Auth | On startup / Token expiry |
| 2 | `/v1/listings` | GET | Dashboard, Properties | Every 6 hours |
| 3 | `/v1/listings/{id}` | GET | Property Detail | On page load |
| 4 | `/v1/listings/{id}` | PUT | Property Edit | On user action |
| 5 | `/v1/listings/{id}/calendar` | GET | Bookings, Dashboard, Pricing | Every 4 hours |
| 6 | `/v1/listings/{id}/calendar` | PUT | **Price Push** | On proposal approval |
| 7 | `/v1/listings/calendar` | PUT | **Batch Price Push** | On bulk approval |
| 8 | `/v1/reservations` | GET | Dashboard, Bookings, Finance | Every 15 min |
| 9 | `/v1/reservations/{id}` | GET | Reservation Detail | On page load |
| 10 | `/v1/reservations` | POST | Manual Booking | On user action |
| 11 | `/v1/reservations/{id}` | PUT | Update Booking | On user action |
| 12 | `/v1/reservations/{id}/cancel` | POST | Cancel Booking | On user action |
| 13 | `/v1/conversations` | GET | Inbox, Dashboard | Every 2 min / Webhook |
| 14 | `/v1/conversations/{id}/messages` | GET | Inbox Detail | On conversation open |
| 15 | `/v1/conversations/{id}/messages` | POST | Send Message | On user action |
| 16 | `/v1/messageTemplates` | GET | Inbox | Every 24 hours |
| 17 | `/v1/reservations/{id}/messageTemplates` | GET | Inbox (filled templates) | On conversation open |
| 18 | `/v1/tasks` | GET | Tasks, Dashboard | Every 10 min |
| 19 | `/v1/tasks` | POST | Create Task | On user action |
| 20 | `/v1/tasks/{id}` | PUT | Update Task | On user action |
| 21 | `/v1/tasks/{id}` | DELETE | Delete Task | On user action |
| 22 | `/v1/reviews` | GET | Pricing (quality score) | Every 24 hours |
| 23 | `/v1/listings/{id}/seasonalRules` | GET | Property Rules | Every 6 hours |
| 24 | `/v1/listing/pricingSettings/{id}` | GET | Property Pricing Settings | Every 6 hours |
| 25 | `/v1/finance/expenseAndExtra` | GET | Finance | Every 1 hour |
| 26 | `/v1/finance/expenseAndExtra` | POST | Create Expense | On user action |
| 27 | `/v1/ownerStatements` | GET | Finance | Daily |
| 28 | `/v1/ownerStatements/{id}` | GET | Statement Detail | On page load |
| 29 | `/v1/finance/report/standard` | GET | Finance Reports | Daily |
| 30 | `/v1/finance/report/consolidated` | GET | Finance Reports | Daily |
| 31 | `/v1/finance/report/listing` | GET | Finance Reports | Daily |
| 32 | `/v1/users` | GET | Task Assignment | On page load |
| 33 | `/v1/groups` | GET | Task Assignment | On page load |
| 34 | `/v1/propertyTypes` | GET | Settings | Once (reference) |
| 35 | `/v1/amenities` | GET | Settings | Once (reference) |
| 36 | `/v1/cancellationPolicies` | GET | Settings | Once (reference) |
| 37 | `/v1/webhooks/unified` | POST | Setup | Once (configuration) |
| 38 | `/v2/reservations/{id}/calculatePrice` | POST | Pricing Simulation | On demand |

**Total: 38 endpoint operations across 15 unique API resources**

---

## 14. Rate Limits & Best Practices

### Rate Limits (from Hostaway docs)

| Tier | Limit |
|------|-------|
| Standard | 20 requests per second |
| Burst | 50 requests in 5 seconds |
| Daily | No published daily limit |

### Best Practices for PriceOS

1. **Cache aggressively**: Listings and reference data change rarely → cache for 6+ hours
2. **Use webhooks over polling**: For reservations and messages, webhooks give instant updates
3. **Batch calendar updates**: Use the batch endpoint (`PUT /v1/listings/calendar`) when updating multiple properties
4. **Paginate large datasets**: Always use `limit` and `offset` for reservations (could be thousands)
5. **Store raw responses**: Save Hostaway's full JSON in `externalData` column for debugging
6. **Implement exponential backoff**: If rate-limited, wait 1s, 2s, 4s, 8s before retrying
7. **Track `syncedAt`**: Record when each entity was last synced to avoid re-fetching unchanged data
