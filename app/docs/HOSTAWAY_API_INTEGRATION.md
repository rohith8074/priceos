# Hostaway API Integration Strategy

This document outlines the specific Hostaway APIs selected for the PriceOS Revenue Management System. 

## 1. Listings (Property Sync)
**Endpoint**: `GET /v1/listings`
**Purpose**: Sync property inventory, location data, and base configurations.
**Frequency**: Daily

### Key Fields Used:
- `id`: Internal Hostaway ID (Primary Key)
- `name`: Property Title
- `address`, `city`, `zipcode`, `country`: Location for market analysis
- `lat`, `lng`: Geolocation for map-based compsets
- `currencyCode`: For price normalization
- `listingImages`: Array of `url` and `caption` for UI display
- `priceFloor`, `priceCeiling`: (Derived/Internal) - Base limits for pricing

---

## 2. Calendar (Availability & Pricing)
**Endpoint**: `GET /v1/listings/{listingId}/calendar`
**Purpose**: Retrieve availability, blocking, and current prices for the next 365 days.
**Frequency**: Every 4 hours (or on specific triggers)

### Key Fields Used:
- `date`: Valid date string (YYYY-MM-DD)
- `status`: `available`, `blocked`, `reserved`
- `price`: Current nightly rate
- `minimumStay`: Min nights restriction
- `isProcessed`: Sync status flag

---

## 3. Reservations (Occupancy & Revenue)
**Endpoint**: `GET /v1/reservations`
**Purpose**: Calculate occupancy rates, revenue pacing, and financial reporting.
**Frequency**: Every 15-30 minutes

### Key Fields Used:
- `hostawayReservationId`: Unique ID
- `listingMapId`: Links to Listing
- `guestName`, `guestEmail`: Guest Identity
- `channelName`: Source (Airbnb, Booking.com, VRBO, Direct)
- `arrivalDate`, `departureDate`: Stay duration
- `totalPrice`: Gross booking value
- `status`: `new`, `modified`, `cancelled`
- `financeField`: Detailed breakdown (cleaning fee, taxes) - stored as JSON

---

## 4. Pricing Updates (The Action Layer)
**Endpoint**: `PUT /v1/listings/{listingId}/calendar`
**Purpose**: Push AI-generated price recommendations back to Hostaway.
**Payload Example**:
```json
{
  "startDate": "2026-12-30",
  "endDate": "2027-01-02",
  "price": 1500,
  "minimumStay": 3,
  "isAvailable": 1
}
```

---

## 5. Reviews (Quality Monitoring)
**Endpoint**: `GET /v1/reviews`
**Purpose**: Analyze guest sentiment to adjust "Quality Score" in pricing algorithm.
**Frequency**: Weekly

### Key Fields Used:
- `msg`: Review content
- `listingMapId`: Property link
- `channelName`: Source
- `isPublic`: Visibility flag

---

## 6. Conversations (Guest Communication)
**Endpoint**: `GET /v1/conversations`
**Purpose**: Feeds the AI Agent for guest inquiries and sentiment analysis.
**Frequency**: Real-time (Webhook preferred) or 5-min Polling

### Key Fields Used:
- `reservationId`: Context link
- `conversationMessages`: Array of message objects
  - `body`: Message text
  - `isIncoming`: User vs Host direction
  - `insertedOn`: Timestamp
