# PriceOS — Real-Time Data Update Strategy (from Hostaway API)

> **Source:** https://api.hostaway.com/documentation  
> **Updated:** 2026-02-18  
> **Goal:** Keep PriceOS portal data in sync with Hostaway with minimum latency

---

## 1. Two Mechanisms for Real-Time Updates

Hostaway provides **two** ways to keep your data current:

| Mechanism | Latency | Effort | Best For |
|-----------|---------|--------|----------|
| **Unified Webhooks** | ~Instant (1-5 sec) | Medium (need public URL) | Reservations, Messages |
| **Polling** | 2-15 min | Low (simple timer) | Calendar, Listings, Tasks, Finance |

### ⭐ Recommended Approach: **Webhooks + Polling Hybrid**

```
REAL-TIME (Webhooks)          SCHEDULED (Polling)
─────────────────────         ──────────────────────
• reservation.created    →    • Calendar: every 4 hours
• reservation.updated    →    • Listings: every 6 hours
• new message received   →    • Tasks: every 10 min
                              • Reviews: every 24 hours
                              • Finance: every 1 hour
```

---

## 2. Unified Webhooks (Instant Updates)

### What Hostaway Sends You

Hostaway supports **3 webhook events** via Unified Webhooks:

| Event | Trigger | Payload |
|-------|---------|---------|
| `reservation created` | New booking from any channel | Full reservation object (~2 KB) |
| `reservation updated` | Any modification to a reservation | Full reservation object (~2 KB) |
| `new message received` | Guest sends a message | Full conversation message object (~500 bytes) |

### How to Set Up

**API Endpoint:**
```
POST https://api.hostaway.com/v1/webhooks/unifiedWebhooks
```

**Python Example:**
```python
import requests

url = "https://api.hostaway.com/v1/webhooks/unifiedWebhooks"
headers = {
    "Authorization": "Bearer YOUR_ACCESS_TOKEN",
    "Content-type": "application/json",
    "Cache-control": "no-cache"
}
payload = {
    "isEnabled": 1,
    "url": "https://your-priceos-domain.com/api/webhooks/hostaway",
    "login": "optional_basic_auth_user",        # optional
    "password": "optional_basic_auth_password",  # optional
    "alertingEmailAddress": "alerts@your-domain.com"  # optional
}
response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

### ⚠️ Critical Rules from Hostaway Docs

1. **No event filtering** – Hostaway sends ALL events. You must filter on your side
2. **Events may arrive out of order** – A message webhook may arrive *before* the reservation webhook. Return error status so Hostaway retries
3. **3 retries** – If your endpoint fails, Hostaway retries 3 times then sends email alert
4. **Respond in 30 seconds** – Queue the webhook, return 200 immediately, process async
5. **Duplicate events possible** – You may receive the same update multiple times. Use `reservationId` / `conversationId` for deduplication
6. **5-day disable** – If webhooks fail for 5 consecutive days, Hostaway auto-disables them

### PriceOS Webhook Handler Blueprint

```
POST /api/webhooks/hostaway  →  Receives webhook
├── Verify auth (Basic Auth header)
├── Return 200 immediately
├── Queue event for async processing
│
├── IF reservation.created:
│   ├── Upsert reservation in DB
│   ├── Update calendar_days (mark booked dates)
│   ├── Recalculate dashboard KPIs
│   └── Trigger AI revenue cycle if threshold met
│
├── IF reservation.updated:
│   ├── Upsert reservation in DB
│   ├── Compare old vs new dates → update calendar
│   ├── If status = 'cancelled' → free up dates
│   └── Recalculate dashboard KPIs
│
└── IF new message received:
    ├── Upsert conversation message in DB
    ├── Update conversation.unread_count
    ├── Send browser notification (SSE/WebSocket)
    └── Optionally trigger AI auto-reply
```

---

## 3. Polling Endpoints — Complete Detail

### 3.1 Reservations (Dashboard, Bookings)

```
GET https://api.hostaway.com/v1/reservations
```

**Query Params for Our Use Case:**

| Param | Type | Our Filter | Why |
|-------|------|-----------|-----|
| `limit` | int | `100` | Fetch in pages (max ~200) |
| `offset` | int | `0`, `100`, `200`... | Pagination |
| `sortOrder` | string | `"latestActivity"` | Most recent first |
| `listingId` | int | specific listing ID | Filter by property |
| `arrivalStartDate` | string | `today - 30d` | Skip ancient bookings |
| `arrivalEndDate` | string | `today + 365d` | Up to 1 year ahead |
| `departureStartDate` | string | `today` | Only active/upcoming |
| `latestActivityStart` | string | `last_sync_time` | **Only changed since last sync** |
| `isArchived` | int | `0` | Skip archived |
| `includeResources` | int | `0` | Don't embed sub-objects (saves bandwidth) |

**Optimal Filter for PriceOS (incremental sync):**
```python
# Only fetch reservations modified since our last sync
params = {
    "limit": 200,
    "offset": 0,
    "sortOrder": "latestActivity",
    "latestActivityStart": "2026-02-18T05:00:00Z",  # last_synced_at
    "isArchived": 0
}
```

**Response Size Estimate:**

| Scenario | Records | JSON Size | Notes |
|----------|---------|-----------|-------|
| 15 properties, all reservations | ~100-300 | ~200-600 KB | Full historical load |
| Incremental (since last 15 min) | ~0-5 | ~2-10 KB | Typical polling result |
| With `includeResources=1` | same | +50% larger | Embeds conversation objects |

**Response Structure:**
```json
{
  "status": "success",
  "result": [ /* array of reservation objects */ ],
  "limit": 200,
  "offset": 0,
  "count": 47,
  "page": 1,
  "totalPages": 1
}
```

Each reservation object is ~2 KB and contains 50+ fields. **Key fields to extract:**

| Field | Type | Why We Need It |
|-------|------|----------------|
| `id` | int | Primary key / dedup |
| `listingMapId` | int | Links to our listing |
| `guestName` | string | Display |
| `channelName` | string | Channel breakdown chart |
| `arrivalDate` | string (YYYY-MM-DD) | Calendar display |
| `departureDate` | string (YYYY-MM-DD) | Calendar display |
| `nights` | int | ADR, occupancy calc |
| `totalPrice` | float | Revenue |
| `status` | string | `new`, `modified`, `cancelled`, `ownerStay`, `pendingPayment` |
| `financeField` | array | Financial breakdown |

**Poll Frequency:** Every 15 min (webhook handles instant updates)

---

### 3.2 Calendar (Bookings, Pricing, Dashboard)

```
GET https://api.hostaway.com/v1/listings/{listingId}/calendar?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

**⚠️ Must call per-listing (no bulk endpoint for calendar)**

**Query Params:**

| Param | Type | Required | Our Value |
|-------|------|----------|-----------|
| `startDate` | string (YYYY-MM-DD) | ✅ Yes | `today` |
| `endDate` | string (YYYY-MM-DD) | ✅ Yes | `today + 90 days` |
| `includeResources` | int (0/1) | No | `0` (saves bandwidth) |

**Response Size Estimate:**

| Date Range | Records per Listing | JSON Size per Listing | 15 Listings Total |
|--------|-----|-----|-----|
| 30 days | 30 calendar days | ~10 KB | ~150 KB |
| 90 days | 90 calendar days | ~30 KB | ~450 KB |
| 365 days | 365 calendar days | ~120 KB | ~1.8 MB |
| 90 days + `includeResources=1` | 90 days + embedded reservations | ~80 KB | ~1.2 MB |

**Calendar Day Statuses (from docs):**

| Status | Meaning | PriceOS Color |
|--------|---------|---------------|
| `available` | Open for booking | 🟢 Green |
| `reserved` | Has confirmed reservation | 🔵 Blue |
| `pending` | Pending confirmation/payment | 🟡 Yellow |
| `blocked` | Manually blocked by host | ⚫ Gray |
| `mblocked` | Multi-calendar blocked | ⚫ Gray |
| `hardBlock` | Cannot be unblocked | 🔴 Red |
| `conflicted` | Double-booking conflict | 🔴 Red |
| `mreserved` | Multi-calendar reserved | 🔵 Blue |

**Optimal Polling Strategy:**
```python
# For dashboard: short range, no resources
for listing_id in listing_ids:
    params = {
        "startDate": today,
        "endDate": today_plus_30,
        "includeResources": 0
    }
    # GET /v1/listings/{listing_id}/calendar

# For pricing engine: longer range
for listing_id in listing_ids:
    params = {
        "startDate": today,
        "endDate": today_plus_90,
        "includeResources": 0
    }
```

**Poll Frequency:** Every 4 hours | **API Calls:** 15 listings × 1 call = 15 calls per sync

---

### 3.3 Listings (Properties Page)

```
GET https://api.hostaway.com/v1/listings
```

**Query Params:**

| Param | Type | Our Value | Purpose |
|-------|------|-----------|---------|
| `limit` | int | `100` | All properties |
| `offset` | int | `0` | Pagination |

**Response Size Estimate:**

| Properties | JSON Size | Notes |
|------------|-----------|-------|
| 15 listings | ~75 KB | Each listing ~5 KB (with images, amenities) |
| 50 listings | ~250 KB | |
| 100 listings | ~500 KB | |

**Poll Frequency:** Every 6 hours (property details rarely change)  
**API Calls:** 1 call per sync

---

### 3.4 Conversations (Inbox)

```
GET https://api.hostaway.com/v1/conversations?limit=50&offset=0&includeResources=1
```

**Query Params:**

| Param | Type | Our Value | Purpose |
|-------|------|-----------|---------|
| `limit` | int | `50` | Page size |
| `offset` | int | `0` | Pagination |
| `reservationId` | int | (optional) | Filter by booking |
| `includeResources` | int | `1` | Include conversation messages |

**Response Size:**

| Conversations | JSON Size |
|---------------|-----------|
| 50 conversations (without messages) | ~50 KB |
| 50 conversations (with `includeResources=1`) | ~200 KB |

**Poll Frequency:** Webhook handles new messages. Poll every 5 min as fallback.

---

### 3.5 Tasks

```
GET https://api.hostaway.com/v1/tasks
```

**Query Params:**

| Param | Type | Our Value | Purpose |
|-------|------|-----------|---------|
| `listingMapId` | int | (optional) | Filter by property |
| `status` | string | (optional) | `pending`, `inProgress` |
| `limit` | int | `100` | Page |
| `offset` | int | `0` | Pagination |

**Response Size:** ~30-50 KB for 100 tasks  
**Poll Frequency:** Every 10 min | **API Calls:** 1

---

### 3.6 Reviews

```
GET https://api.hostaway.com/v1/reviews
```

**Response Size:** ~20-40 KB for 100 reviews  
**Poll Frequency:** Every 24 hours | **API Calls:** 1

---

### 3.7 Finance

```
GET https://api.hostaway.com/v1/finance/expenseAndExtra
GET https://api.hostaway.com/v1/ownerStatements
GET https://api.hostaway.com/v1/finance/report/standard?startDate=X&endDate=Y
```

**Response Size:** ~10-50 KB per endpoint  
**Poll Frequency:** Every 1 hour (expenses), Daily (reports)

---

## 4. API Rate Limits (from Hostaway Docs)

Hostaway enforces rate limits. When exceeded → **HTTP 429** response:

```json
{
  "status": "fail",
  "message": "This error occurs because a server detects that your application 
  has exceeded the rate limits or has made too many requests in a given period."
}
```

### Our Estimated API Usage (15 properties)

| Sync Type | Calls/Cycle | Frequency | Calls/Hour |
|-----------|-------------|-----------|------------|
| Reservations | 1-2 | Every 15 min | 4-8 |
| Calendar | 15 | Every 4 hrs | ~4 |
| Listings | 1 | Every 6 hrs | ~0.2 |
| Conversations | 1 | Every 5 min | 12 |
| Tasks | 1 | Every 10 min | 6 |
| Reviews | 1 | Every 24 hrs | ~0.04 |
| Finance | 3 | Every 1 hr | 3 |
| **Total** | | | **~30 calls/hour** |

**This is well within Hostaway's limits.** Even at 50 properties, we'd be at ~80 calls/hour.

---

## 5. Optimal Filtering for Each PriceOS Page

### Dashboard (`/dashboard`)

```
# 4 API calls total
GET /v1/listings                                           # Count, avg price
GET /v1/reservations?arrivalStartDate=today&limit=200      # Occupancy, revenue
GET /v1/conversations?limit=1&offset=0                     # Unread count from response meta
GET /v1/tasks?status=pending&status=inProgress             # Overdue tasks
```

### Bookings Page (`/bookings`)

```
# 1 + N calls (N = number of visible listings)
GET /v1/reservations?limit=200&sortOrder=latestActivity    # All bookings
GET /v1/listings/{id}/calendar?startDate=today&endDate=today+30  # Per listing
```

### Pricing Engine (`/pricing`)

```
# 1 + N + 1 calls
GET /v1/listings                                           # Base prices
GET /v1/listings/{id}/calendar?startDate=today&endDate=today+90  # Per listing
GET /v1/reservations?arrivalStartDate=today-30&limit=200   # Booking velocity
GET /v1/reviews                                            # Quality score
```

### Inbox (`/inbox`)

```
# 1 call (messages handled by webhook)
GET /v1/conversations?includeResources=1&limit=50          # With embedded messages
```

### Property Detail (`/properties/[id]`)

```
# 4-5 calls for one property
GET /v1/listings/{id}                                      # Full listing detail
GET /v1/listings/{id}/calendar?startDate=today&endDate=today+90
GET /v1/reservations?listingId={id}&limit=100
GET /v1/listings/{id}/seasonalRules                        # Pricing rules
GET /v1/finance/expenseAndExtra?listingMapId={id}          # Property expenses
```

---

## 6. Authentication (Token Management)

```
POST https://api.hostaway.com/v1/accessTokens
Content-Type: application/x-www-form-urlencoded
```

**Python Example:**
```python
import requests

response = requests.post(
    "https://api.hostaway.com/v1/accessTokens",
    data={
        "grant_type": "client_credentials",
        "client_id": "YOUR_ACCOUNT_ID",
        "client_secret": "YOUR_CLIENT_SECRET",
        "scope": "general"
    },
    headers={"Content-type": "application/x-www-form-urlencoded"}
)
token = response.json()["access_token"]
# Token valid for 24 months — store and reuse!
```

**Key Rules from Docs:**
- Token expires in **24 months** (not every call!)
- **Do NOT generate a new token for each request** — store and reuse
- On **HTTP 403** → token expired → refresh it
- Wait **at least 1 second** after generating before using

---

## 7. Data Flow Summary

```
                          HOSTAWAY PLATFORM
                    ┌─────────────┬─────────────┐
                    │   Webhooks  │   REST API   │
                    │  (instant)  │  (polling)   │
                    └──────┬──────┴──────┬───────┘
                           │             │
              ┌────────────▼──┐   ┌──────▼──────────┐
              │  POST /api/   │   │  Cron/Scheduler  │
              │  webhooks/    │   │  (node-cron or   │
              │  hostaway     │   │   Vercel cron)   │
              └──────┬────────┘   └──────┬───────────┘
                     │                   │
              ┌──────▼───────────────────▼───────────┐
              │         NEON POSTGRESQL DB            │
              │  listings | calendar | reservations   │
              │  conversations | tasks | reviews      │
              └──────────────────┬───────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   NEXT.JS SERVER        │
                    │   (reads from DB,       │
                    │    renders pages)        │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   BROWSER (React)       │
                    │   Auto-refresh via       │
                    │   SWR / React Query      │
                    └─────────────────────────┘
```

---

## 8. Pagination Strategy

All list endpoints return:

```json
{
  "status": "success",
  "result": [...],
  "limit": 100,
  "offset": 0,
  "count": 247,      // total matching records
  "page": 1,
  "totalPages": 3
}
```

**Our Approach:**
```python
async def fetch_all_paginated(endpoint, params):
    all_results = []
    offset = 0
    limit = 200  # max safe limit
    
    while True:
        params["limit"] = limit
        params["offset"] = offset
        response = await api_call(endpoint, params)
        
        all_results.extend(response["result"])
        
        if response["page"] >= response["totalPages"]:
            break
        offset += limit
    
    return all_results
```

**For 15 properties:** Most endpoints return < 200 records, so 1 page is enough.
