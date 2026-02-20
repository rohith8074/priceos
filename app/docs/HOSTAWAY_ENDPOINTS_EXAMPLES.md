# Hostaway API — Every Endpoint with Examples

> Simple guide: What to call, what you get back, how to filter, how to save it.

---

## 🔐 Step 0: Get Your Access Token

**What:** Get a Bearer token to use in all other API calls.  
**Call once, reuse for 24 months.**

```bash
curl -X POST https://api.hostaway.com/v1/accessTokens \
  -H "Content-type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=12345&client_secret=abc123secret&scope=general"
```

**Response:**
```json
{
  "token_type": "Bearer",
  "expires_in": 63072000,
  "access_token": "eyJ0eXAiOiJKV1Qi..."
}
```

**Save this token.** Use it in every request below as:
```
Authorization: Bearer eyJ0eXAiOiJKV1Qi...
```

---

## 📋 Endpoint 1: GET All Listings (Properties)

**What it does:** Returns all your properties with names, prices, locations, images.  
**PriceOS pages:** Dashboard, Properties, Pricing  
**How often:** Every 6 hours

### Request
```bash
curl -X GET "https://api.hostaway.com/v1/listings?limit=100&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Cache-control: no-cache"
```

### Filtering Options
| Param | Example | What it does |
|-------|---------|-------------|
| `limit` | `100` | Max results per page |
| `offset` | `0` | Skip N results (pagination) |
| `city` | `Dubai` | Only Dubai properties |
| `propertyTypeId` | `1` | Only apartments (1=apt, 2=house, etc.) |
| `match` | `Marina` | Search by name/description |

### Sample Response (shortened)
```json
{
  "status": "success",
  "result": [
    {
      "id": 1001,
      "name": "Luxury Marina View 2BR",
      "internalListingName": "MARINA-2BR-01",
      "description": "Stunning 2-bedroom apartment...",
      "propertyTypeId": 1,
      "roomType": "entire_home",
      "city": "Dubai",
      "state": "Dubai",
      "countryCode": "AE",
      "address": "Marina Walk, Tower 5, Unit 1204",
      "lat": 25.0800,
      "lng": 55.1400,
      "price": 650.00,
      "currencyCode": "AED",
      "bedroomsNumber": 2,
      "bathroomsNumber": 2,
      "personCapacity": 6,
      "minNights": 2,
      "maxNights": 30,
      "cleaningFee": 200,
      "checkInTimeStart": 15,
      "checkOutTime": 11,
      "starRating": 4.5,
      "averageReviewRating": 4.8,
      "cancellationPolicy": "moderate",
      "listingAmenities": [1, 5, 8, 12, 44],
      "listingImages": [
        {
          "url": "https://img.hostaway.com/listing1001/photo1.jpg",
          "caption": "Living Room",
          "sortOrder": 1
        }
      ],
      "listingBedTypes": [
        { "bedTypeId": 1, "quantity": 1 }
      ]
    },
    {
      "id": 1002,
      "name": "Downtown Studio near Burj Khalifa",
      "city": "Dubai",
      "price": 400.00,
      "bedroomsNumber": 0,
      "bathroomsNumber": 1,
      "personCapacity": 2
    }
  ],
  "count": 15,
  "limit": 100,
  "offset": 0,
  "page": 1,
  "totalPages": 1
}
```

### Save to Database
```sql
INSERT INTO listings (hostaway_id, name, city, country_code, area, bedrooms_number,
  bathrooms_number, property_type, price, currency_code, price_floor, price_ceiling,
  person_capacity, amenities, images, lat, lng, last_synced_at)
VALUES (1001, 'Luxury Marina View 2BR', 'Dubai', 'AE', 'Dubai Marina', 2,
  2, 'apartment', 650.00, 'AED', 450.00, 950.00,
  6, '["wifi","pool","gym"]', '[{"url":"...","caption":"Living Room"}]',
  25.0800, 55.1400, NOW())
ON CONFLICT (hostaway_id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, last_synced_at = NOW();
```

### Update UI
```
Dashboard  →  "15 Properties" count  |  "AED 525 avg price"
Properties →  Property cards with name, beds, baths, price, image
```

---

## 📅 Endpoint 2: GET Calendar (Availability & Prices)

**What it does:** Returns daily availability & nightly price for one property.  
**PriceOS pages:** Bookings, Pricing Engine, Property Detail  
**How often:** Every 4 hours  
**⚠️ Must call once per property (no bulk calendar endpoint)**

### Request
```bash
curl -X GET "https://api.hostaway.com/v1/listings/1001/calendar?startDate=2026-02-18&endDate=2026-05-19" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Cache-control: no-cache"
```

### Filtering Options
| Param | Example | What it does |
|-------|---------|-------------|
| `startDate` | `2026-02-18` | Start of date range (REQUIRED) |
| `endDate` | `2026-05-19` | End of date range (REQUIRED) |
| `includeResources` | `0` or `1` | Set to `1` to embed reservation details in each day |

**Our filter:** `startDate=today`, `endDate=today+90days`, `includeResources=0`

### Sample Response
```json
{
  "status": "success",
  "result": [
    {
      "id": 500001,
      "date": "2026-02-18",
      "isAvailable": 1,
      "status": "available",
      "price": 650,
      "minimumStay": 2,
      "maximumStay": 30,
      "closedOnArrival": null,
      "closedOnDeparture": null,
      "note": null
    },
    {
      "id": 500002,
      "date": "2026-02-19",
      "isAvailable": 0,
      "status": "reserved",
      "price": 700,
      "minimumStay": 2,
      "maximumStay": 30,
      "note": null
    },
    {
      "id": 500003,
      "date": "2026-02-20",
      "isAvailable": 0,
      "status": "blocked",
      "price": 650,
      "minimumStay": 2,
      "maximumStay": 30,
      "note": "Owner stay"
    }
  ]
}
```

**Status meanings:**
- `available` → Open for booking (🟢)
- `reserved` → Guest has booked (🔵)
- `blocked` → Host blocked it (⚫)
- `pending` → Awaiting confirmation (🟡)
- `hardBlock` → Cannot be unblocked (🔴)

### Save to Database
```sql
INSERT INTO calendar_days (listing_id, date, status, price, minimum_stay,
  maximum_stay, is_available, notes, synced_at)
VALUES
  (1, '2026-02-18', 'available', 650, 2, 30, true, null, NOW()),
  (1, '2026-02-19', 'reserved', 700, 2, 30, false, null, NOW()),
  (1, '2026-02-20', 'blocked', 650, 2, 30, false, 'Owner stay', NOW())
ON CONFLICT (listing_id, date) DO UPDATE SET
  status = EXCLUDED.status, price = EXCLUDED.price,
  is_available = EXCLUDED.is_available, synced_at = NOW();
```

### Update UI
```
Bookings   →  Calendar grid: green/blue/gray cells
Pricing    →  AI reads available dates + current prices → generates proposals
Dashboard  →  Occupancy rate = (reserved days / total days) × 100
```

---

## 🏨 Endpoint 3: GET Reservations (Bookings)

**What it does:** Returns all guest bookings with prices, dates, guest info, channels.  
**PriceOS pages:** Dashboard, Bookings, Finance  
**How often:** Every 15 min (webhook handles instant)

### Request — Full Sync
```bash
curl -X GET "https://api.hostaway.com/v1/reservations?limit=200&offset=0&sortOrder=latestActivity&isArchived=0" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Cache-control: no-cache"
```

### Request — Incremental Sync (only changes since last check)
```bash
curl -X GET "https://api.hostaway.com/v1/reservations?limit=200&latestActivityStart=2026-02-18T06:00:00Z&isArchived=0" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Cache-control: no-cache"
```

### All Filtering Options
| Param | Example | What it does |
|-------|---------|-------------|
| `limit` | `200` | Results per page |
| `offset` | `0` | Pagination |
| `listingId` | `1001` | Only booking for this property |
| `channelId` | `2001` | Only Airbnb bookings |
| `arrivalStartDate` | `2026-02-01` | Arrivals from this date |
| `arrivalEndDate` | `2026-03-31` | Arrivals until this date |
| `departureStartDate` | `2026-02-01` | Departures from |
| `departureEndDate` | `2026-03-31` | Departures until |
| `latestActivityStart` | `2026-02-18T06:00:00Z` | **Only changed since this time** ⭐ |
| `hasUnreadConversationMessages` | `1` | Only bookings with unread messages |
| `isStarred` | `1` | Only starred bookings |
| `isArchived` | `0` | Exclude archived |
| `match` | `John` | Search guest name |
| `sortOrder` | `latestActivity` | Sort by most recent activity |

### Sample Response
```json
{
  "status": "success",
  "result": [
    {
      "id": 5001,
      "listingMapId": 1001,
      "channelId": 2001,
      "channelName": "airbnb",
      "reservationId": "HMABCDEF123",
      "confirmationCode": "HMABCDEF123",

      "guestName": "Sarah Johnson",
      "guestFirstName": "Sarah",
      "guestLastName": "Johnson",
      "guestEmail": "sarah@gmail.com",
      "guestPicture": "https://img.airbnb.com/users/sarah.jpg",
      "guestCity": "London",
      "guestCountry": "GB",
      "phone": "+447911123456",
      "numberOfGuests": 3,
      "adults": 2,
      "children": 1,
      "infants": 0,
      "pets": 0,

      "arrivalDate": "2026-03-15",
      "departureDate": "2026-03-20",
      "checkInTime": 15,
      "checkOutTime": 11,
      "nights": 5,

      "totalPrice": 3750.00,
      "currency": "AED",
      "taxAmount": 187.50,
      "channelCommissionAmount": 112.50,
      "hostawayCommissionAmount": 0,
      "cleaningFee": 200,
      "securityDepositFee": 500,
      "isPaid": 1,
      "status": "new",

      "hostNote": "VIP guest - returning customer",
      "reservationDate": "2026-02-10 14:30:00",
      "isStarred": 1,
      "isArchived": 0,

      "financeField": [
        { "name": "Accommodation", "value": 3250, "isIncludedInTotalPrice": 1 },
        { "name": "Cleaning Fee", "value": 200, "isIncludedInTotalPrice": 1 },
        { "name": "Service Fee", "value": 300, "isIncludedInTotalPrice": 0 }
      ]
    },
    {
      "id": 5002,
      "listingMapId": 1002,
      "channelName": "booking.com",
      "guestName": "Ahmed Al-Rashid",
      "arrivalDate": "2026-03-22",
      "departureDate": "2026-03-25",
      "nights": 3,
      "totalPrice": 1350.00,
      "status": "modified",
      "channelCommissionAmount": 202.50
    }
  ],
  "count": 47,
  "limit": 200,
  "offset": 0,
  "page": 1,
  "totalPages": 1
}
```

**Reservation statuses:**
- `new` → Fresh booking
- `modified` → Guest changed dates/details
- `cancelled` → Cancelled by guest or host
- `ownerStay` → Owner using the property
- `pendingPayment` → Awaiting payment

### Save to Database
```sql
INSERT INTO reservations (hostaway_id, listing_map_id, guest_name, guest_email,
  channel_name, arrival_date, departure_date, nights, total_price, price_per_night,
  status, number_of_guests, channel_commission, finance_breakdown, synced_at)
VALUES (5001, 1, 'Sarah Johnson', 'sarah@gmail.com',
  'airbnb', '2026-03-15', '2026-03-20', 5, 3750.00, 750.00,
  'new', 3, 112.50, '{"accommodation":3250,"cleaning":200}', NOW())
ON CONFLICT (hostaway_id) DO UPDATE SET
  status = EXCLUDED.status, total_price = EXCLUDED.total_price, synced_at = NOW();
```

### Update UI
```
Dashboard  → "AED 47,250 Monthly Revenue"  |  "82% Occupancy"
Dashboard  → Channel chart: Airbnb 60%, Booking.com 25%, Direct 15%
Bookings   → Reservation rows: guest name, dates, amount, status badge
Finance    → Revenue totals, commission deductions
```

---

## 💬 Endpoint 4: GET Conversations (Guest Messages)

**What it does:** Returns guest conversations linked to bookings.  
**PriceOS pages:** Inbox, Dashboard (unread count)  
**How often:** Webhook is primary. Poll every 5 min as backup.

### Request
```bash
curl -X GET "https://api.hostaway.com/v1/conversations?limit=50&offset=0&includeResources=1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Cache-control: no-cache"
```

### Filtering Options
| Param | Example | What it does |
|-------|---------|-------------|
| `limit` | `50` | Page size |
| `offset` | `0` | Pagination |
| `reservationId` | `5001` | Only messages for this booking |
| `includeResources` | `1` | Include message text + reservation data |

### Sample Response
```json
{
  "status": "success",
  "result": [
    {
      "id": 8001,
      "listingMapId": 1001,
      "reservationId": 5001,
      "recipientName": "Sarah Johnson",
      "recipientEmail": "sarah@gmail.com",
      "type": "host-guest-email",
      "hasUnreadMessages": 1,
      "messageSentOn": "2026-02-18T10:30:00",
      "messageReceivedOn": "2026-02-18T09:15:00",

      "conversationMessages": [
        {
          "id": 9001,
          "body": "Hi! What time can I check in early?",
          "isIncoming": 1,
          "date": "2026-02-18T09:15:00",
          "status": "delivered"
        },
        {
          "id": 9002,
          "body": "Hello Sarah! Early check-in at 1 PM is available for AED 100.",
          "isIncoming": 0,
          "date": "2026-02-18T10:30:00",
          "status": "sent"
        }
      ]
    }
  ],
  "count": 12,
  "page": 1,
  "totalPages": 1
}
```

**Key fields:**
- `isIncoming: 1` = guest sent it | `isIncoming: 0` = host sent it
- `hasUnreadMessages: 1` = unread messages exist

### Save to Database
```sql
-- Save conversation
INSERT INTO conversations (hostaway_id, listing_id, reservation_id, guest_name,
  guest_email, unread_count, last_message, last_message_at)
VALUES (8001, 1, 1, 'Sarah Johnson', 'sarah@gmail.com', 1,
  'Hello Sarah! Early check-in...', '2026-02-18T10:30:00')
ON CONFLICT (hostaway_id) DO UPDATE SET
  unread_count = EXCLUDED.unread_count, last_message = EXCLUDED.last_message;

-- Save messages
INSERT INTO conversation_messages (hostaway_id, conversation_id, sender, content, sent_at)
VALUES (9001, 1, 'guest', 'Hi! What time can I check in early?', '2026-02-18T09:15:00');
```

### Update UI
```
Dashboard → "3 Unread Messages" badge
Inbox     → Conversation list with guest name, last message preview, unread dot
```

---

## 📝 Endpoint 5: GET/POST/PUT Tasks

**What it does:** Manage cleaning, maintenance, inspection tasks.  
**PriceOS pages:** Tasks, Dashboard (overdue count)

### GET Tasks
```bash
curl -X GET "https://api.hostaway.com/v1/tasks?limit=100&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filtering Options
| Param | Example | What it does |
|-------|---------|-------------|
| `listingMapId` | `1001` | Tasks for this property only |
| `status` | `pending` | Filter by status |
| `assigneeUserId` | `42` | Tasks assigned to this person |
| `limit` | `100` | Page size |

### Sample Response
```json
{
  "status": "success",
  "result": [
    {
      "id": 3001,
      "listingMapId": 1001,
      "reservationId": 5001,
      "title": "Deep cleaning after checkout",
      "description": "Full apartment clean including linens",
      "status": "pending",
      "assigneeUserId": 42,
      "canStartFrom": "2026-03-20T11:00:00",
      "shouldEndBy": "2026-03-20T15:00:00",
      "cost": 150.00,
      "costCurrency": "AED",
      "checklistItems": [
        { "id": 1, "title": "Kitchen cleaned", "isCompleted": 0 },
        { "id": 2, "title": "Linens changed", "isCompleted": 0 }
      ]
    }
  ],
  "count": 8
}
```

### CREATE a Task
```bash
curl -X POST "https://api.hostaway.com/v1/tasks" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-type: application/json" \
  -d '{
    "title": "Fix AC unit",
    "description": "Guest reported AC not cooling properly",
    "listingMapId": 1001,
    "reservationId": 5001,
    "status": "pending",
    "shouldEndBy": "2026-02-19T12:00:00"
  }'
```

### UPDATE a Task
```bash
curl -X PUT "https://api.hostaway.com/v1/tasks/3001" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-type: application/json" \
  -d '{ "status": "completed" }'
```

### Update UI
```
Tasks     → Kanban board: To Do | In Progress | Done
Dashboard → "2 Overdue Tasks" (where shouldEndBy < now AND status != completed)
```

---

## ⭐ Endpoint 6: GET Reviews

**What it does:** Returns guest reviews with ratings.  
**PriceOS pages:** Pricing Engine (quality score input)  
**How often:** Every 24 hours

### Request
```bash
curl -X GET "https://api.hostaway.com/v1/reviews" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Sample Response
```json
{
  "status": "success",
  "result": [
    {
      "id": 7001,
      "listingMapId": 1001,
      "reservationId": 5001,
      "channelId": 2001,
      "type": "guest-to-host",
      "status": "submitted",
      "rating": 4.8,
      "publicReview": "Amazing apartment with stunning marina views! Very clean.",
      "privateFeedback": "WiFi was a bit slow in the bedroom.",
      "guestName": "Sarah Johnson",
      "arrivalDate": "2026-01-10",
      "departureDate": "2026-01-15",
      "reviewCategory": [
        { "category": "cleanliness", "rating": 5.0 },
        { "category": "communication", "rating": 5.0 },
        { "category": "accuracy", "rating": 4.5 },
        { "category": "value", "rating": 4.5 }
      ]
    }
  ],
  "count": 23
}
```

### Update UI
```
Pricing Engine → Quality Score = AVG(all ratings) → higher score = AI can price higher
Property Detail → Display reviews with star ratings
```

---

## 💰 Endpoint 7: GET Expenses & Financial Reports

**What it does:** Returns expenses, extras, and owner statements.  
**PriceOS pages:** Finance

### GET Expenses
```bash
curl -X GET "https://api.hostaway.com/v1/finance/expenseAndExtra?limit=100&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filtering Options
| Param | Example | What it does |
|-------|---------|-------------|
| `listingMapId` | `1001` | Expenses for one property |
| `type` | `expense` | Only expenses (not extras/income) |
| `limit` | `100` | Page size |

### Sample Response
```json
{
  "status": "success",
  "result": [
    {
      "id": 6001,
      "listingMapId": 1001,
      "reservationId": null,
      "expenseDate": "2026-02-15",
      "concept": "Monthly internet bill",
      "type": "expense",
      "amount": 350.00,
      "categories": [5],
      "categoriesNames": ["Utilities"]
    }
  ]
}
```

### GET Owner Statements
```bash
curl -X GET "https://api.hostaway.com/v1/ownerStatements" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET Financial Report (date range)
```bash
curl -X GET "https://api.hostaway.com/v1/finance/report/standard?startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update UI
```
Finance → Expense list with date, category, amount
Finance → Monthly P&L: Revenue - Expenses = Net Income
Finance → Owner statements with per-property breakdown
```

---

## 📐 Endpoint 8: GET Seasonal Rules

**What it does:** Returns pricing rules (min stay, price adjustments) by date range.  
**PriceOS pages:** Property Detail, Pricing Engine

### Request
```bash
curl -X GET "https://api.hostaway.com/v1/listings/1001/seasonalRules" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Sample Response
```json
{
  "status": "success",
  "result": [
    {
      "id": 4001,
      "title": "Peak Season - Winter",
      "minNightsUnspecified": 3,
      "maxNightsUnspecified": 30,
      "minNightsFriday": 2,
      "minNightsSaturday": 2,
      "pricingRules": { "priceModifier": 15 },
      "color": "#FF6B35"
    }
  ]
}
```

### Update UI
```
Property Detail → Rules tab: "Peak Season: +15% price, min 3 nights"
Pricing Engine  → AI considers seasonal rules when proposing prices
```

---

## ✏️ Endpoint 9: PUT Calendar (Push Price Changes)

**What it does:** Updates prices and availability on Hostaway (WRITE operation).  
**When:** After user approves an AI price proposal

### Update Price for Date Range
```bash
curl -X PUT "https://api.hostaway.com/v1/listings/1001/calendar" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-type: application/json" \
  -d '{
    "startDate": "2026-03-28",
    "endDate": "2026-03-30",
    "price": 850,
    "minimumStay": 3,
    "note": "AI price update - Dubai World Cup surge"
  }'
```

### Block Dates
```bash
curl -X PUT "https://api.hostaway.com/v1/listings/1001/calendar" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-type: application/json" \
  -d '{
    "startDate": "2026-04-01",
    "endDate": "2026-04-05",
    "isAvailable": 0,
    "note": "Owner stay"
  }'
```

### Batch Update (Multiple Properties at Once)
```bash
curl -X PUT "https://api.hostaway.com/v1/listings/calendar" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-type: application/json" \
  -d '{
    "listings": [
      { "listingId": 1001, "startDate": "2026-03-28", "endDate": "2026-03-30", "price": 850 },
      { "listingId": 1002, "startDate": "2026-03-28", "endDate": "2026-03-30", "price": 550 }
    ]
  }'
```

### Response
```json
{ "status": "success", "result": null }
```

### Update Database after Push
```sql
-- Log the execution
INSERT INTO executions (proposal_id, listing_id, date_range_start, date_range_end,
  old_price, new_price, sync_status)
VALUES (101, 1, '2026-03-28', '2026-03-30', 650, 850, 'synced');

-- Update local calendar
UPDATE calendar_days SET price = 850, synced_at = NOW()
WHERE listing_id = 1 AND date BETWEEN '2026-03-28' AND '2026-03-30';
```

---

## 💬 Endpoint 10: POST Send Message

**What it does:** Send a reply to a guest conversation.  
**PriceOS pages:** Inbox

### Request
```bash
curl -X POST "https://api.hostaway.com/v1/conversations/8001/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-type: application/json" \
  -d '{ "body": "Welcome Sarah! Your check-in code is 4521." }'
```

### Response
```json
{
  "status": "success",
  "result": {
    "id": 9003,
    "body": "Welcome Sarah! Your check-in code is 4521.",
    "isIncoming": 0,
    "status": "sent",
    "date": "2026-02-18T11:45:00"
  }
}
```

---

## 📋 Endpoint 11: GET Message Templates

**What it does:** Pre-written message templates with placeholder variables.

### Request
```bash
curl -X GET "https://api.hostaway.com/v1/messageTemplates" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Sample Response
```json
{
  "status": "success",
  "result": [
    {
      "id": 201,
      "name": "Check-in Instructions",
      "message": "Hi {{guest_first_name}}! Your check-in for {{listing_name}} is on {{check_in_date}} at {{check_in_time}}. Door code: {{door_code}}"
    },
    {
      "id": 202,
      "name": "Thank You",
      "message": "Thanks for staying at {{listing_name}}, {{guest_first_name}}! Hope you enjoyed your stay."
    }
  ]
}
```

### Get Templates with Placeholders Filled (per reservation)
```bash
curl -X GET "https://api.hostaway.com/v1/reservations/5001/messageTemplates" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
This returns templates with `{{guest_first_name}}` already replaced with `Sarah`, etc.

---

## 🔔 Endpoint 12: POST Create Webhook (One-Time Setup)

**What it does:** Tells Hostaway to push instant updates to your server.  
**When:** Call once during initial setup.

### Request
```bash
curl -X POST "https://api.hostaway.com/v1/webhooks/unifiedWebhooks" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-type: application/json" \
  -d '{
    "isEnabled": 1,
    "url": "https://your-priceos-domain.com/api/webhooks/hostaway",
    "login": null,
    "password": null,
    "alertingEmailAddress": "alerts@your-domain.com"
  }'
```

### What Hostaway Sends to Your URL
```json
// When a new booking comes in:
{
  "event": "reservationCreated",
  "data": {
    "id": 5003,
    "listingMapId": 1001,
    "guestName": "Michael Brown",
    "arrivalDate": "2026-04-10",
    "departureDate": "2026-04-14",
    "totalPrice": 2800.00,
    "channelName": "booking.com",
    "status": "new"
  }
}

// When a guest sends a message:
{
  "event": "conversationMessageCreated",
  "data": {
    "conversationId": 8005,
    "body": "Is airport pickup available?",
    "isIncoming": 1,
    "date": "2026-02-18T11:42:00"
  }
}
```

---

## 📊 Complete Endpoint Cheat Sheet

| # | Endpoint | Method | Returns | Size | Filter By | Frequency |
|---|----------|--------|---------|------|-----------|-----------|
| 1 | `/v1/listings` | GET | All properties | ~75 KB | city, type, match | 6 hrs |
| 2 | `/v1/listings/{id}/calendar` | GET | Daily prices + availability | ~30 KB/listing | startDate, endDate | 4 hrs |
| 3 | `/v1/reservations` | GET | All bookings | ~200 KB | latestActivityStart, listingId, dates | 15 min |
| 4 | `/v1/conversations` | GET | Guest messages | ~200 KB | reservationId, includeResources | 5 min |
| 5 | `/v1/tasks` | GET | Operational tasks | ~50 KB | status, listingMapId | 10 min |
| 6 | `/v1/reviews` | GET | Guest reviews | ~40 KB | — | 24 hrs |
| 7 | `/v1/finance/expenseAndExtra` | GET | Expenses | ~30 KB | listingMapId, type | 1 hr |
| 8 | `/v1/ownerStatements` | GET | Monthly statements | ~10 KB | — | Daily |
| 9 | `/v1/listings/{id}/seasonalRules` | GET | Pricing rules | ~5 KB | — | 6 hrs |
| 10 | `/v1/listings/{id}/calendar` | PUT | Push price changes | — | — | On approval |
| 11 | `/v1/conversations/{id}/messages` | POST | Send reply | — | — | On action |
| 12 | `/v1/webhooks/unifiedWebhooks` | POST | Register webhook | — | — | Once |
| 13 | `/v1/messageTemplates` | GET | Reply templates | ~10 KB | — | 24 hrs |
| 14 | `/v1/users` | GET | Team members | ~5 KB | — | On load |
| 15 | `/v1/finance/report/standard` | GET | Financial report | ~50 KB | startDate, endDate | Daily |









Tables Galnce:


#	What	Endpoint	You Send →	← You Get Back	Saves Where
1	Properties	GET /v1/listings	?limit=100	15 listings with name, price, beds, images (~75 KB)	listings table → Properties page cards
2	Calendar	GET /v1/listings/{id}/calendar	?startDate=today&endDate=+90d	90 day objects with price + status per day (~30 KB)	calendar_days table → Calendar grid
3	Bookings	GET /v1/reservations	?latestActivityStart=last_sync_time	Changed reservations with guest, price, channel (~2-10 KB incremental)	reservations table → Bookings list, revenue
4	Messages	GET /v1/conversations	?includeResources=1	Conversations with embedded messages (~200 KB)	conversations table → Inbox
5	Tasks	GET /v1/tasks	?status=pending	Task list with checklists (~50 KB)	tasks table → Task board
6	Reviews	GET /v1/reviews	—	Ratings + review text (~40 KB)	reviews table → AI quality score
7	Expenses	GET /v1/finance/...	?listingMapId=1001	Expenses + reports (~30 KB)	expenses table → Finance page
8	Rules	GET /v1/listings/{id}/seasonalRules	—	Min stay, price modifiers (~5 KB)	seasonal_rules table → Pricing engine
9	Push Prices	PUT /v1/listings/{id}/calendar	{price: 850, startDate, endDate}	{"status":"success"}	executions table → audit log
10	Send Reply	POST /v1/conversations/{id}/messages	{body: "Welcome!"}	Sent message object	conversation_messages table
11	Templates	GET /v1/messageTemplates	—	Templates with {{placeholders}}	message_templates table
12	Webhook	POST /v1/webhooks/unifiedWebhooks	{url: "your-server/api/webhooks"}	Webhook ID	One-time setup