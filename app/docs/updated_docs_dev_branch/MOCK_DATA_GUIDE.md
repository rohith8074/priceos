# Mock Data Store Implementation - PriceOS POC

## Overview

This document describes the mock data layer implemented for the PriceOS revenue management system. The mock data enables full POC development without external dependencies (Hostaway API, AI agents).

**Status:** ✅ Complete implementation

## Architecture

### PMSClient Adapter Pattern

```
┌─────────────────────────────────┐
│   PriceOS Components            │
│   (Dashboard, Analytics, etc.)  │
└──────────────┬──────────────────┘
               │
        ┌──────▼──────┐
        │ createPMSClient()
        │  factory
        └──────┬──────┘
               │
        ┌──────┴─────────┐
        │                │
   ┌────▼────┐    ┌─────▼─────┐
   │MockPMS  │    │HostawayPMS│
   │Client   │    │Client      │
   └────┬────┘    └─────┬──────┘
        │               │
   HOSTAWAY_MODE=mock   HOSTAWAY_MODE=live
   (Default)            (Future)
```

**Configuration:**
```bash
# .env.local
HOSTAWAY_MODE=mock  # Switch to "live" when ready
```

## File Structure

```
frontend/src/
├── types/
│   ├── hostaway.ts           # Hostaway API type definitions
│   └── index.ts              # Re-exports
├── data/
│   ├── mock-properties.ts    # 5 Dubai properties
│   ├── mock-calendar.ts      # Calendar generation (90 days)
│   ├── mock-reservations.ts  # ~20 bookings
│   ├── mock-events.ts        # 2026 Dubai events
│   └── mock-competitors.ts   # Market signals
├── lib/
│   ├── pms/
│   │   ├── types.ts          # PMSClient interface
│   │   ├── mock-client.ts    # MockPMSClient
│   │   ├── hostaway-client.ts # Stub (future)
│   │   └── index.ts          # Factory
│   ├── agents/
│   │   ├── types.ts          # Agent output types
│   │   ├── mock-agents.ts    # Optimizer & Reviewer
│   │   └── index.ts          # Orchestration
│   └── utils/
│       ├── date.ts           # Date helpers
│       └── pricing.ts        # Pricing helpers
└── .env.local
    HOSTAWAY_MODE=mock
```

## Core Components

### 1. Mock Properties

**File:** `data/mock-properties.ts`

5 diverse Dubai properties for realistic testing:

```typescript
{
  id: 1001,
  name: "Marina Heights 1BR",
  area: "Dubai Marina",
  bedrooms: 1,
  basePrice: 550,      // AED
  priceFloor: 400,
  priceCeiling: 800,
}
```

**Access:**
```typescript
import { MOCK_PROPERTIES, getMockProperty, getMockPropertiesByArea } from "@/data/mock-properties";

const property = getMockProperty(1001);
const marina = getMockPropertiesByArea("Dubai Marina");
```

### 2. Calendar Generation

**File:** `data/mock-calendar.ts`

Generates realistic 90-day calendars with:
- ~65% occupancy across portfolio
- Seasonal pricing (20% variation)
- Day-of-week premium (Thu-Fri = 1.15x for Dubai weekend)
- Owner blocks (~2% of days)

```typescript
import { generateMockCalendar, calculateOccupancyRate } from "@/data/mock-calendar";

const calendar = generateMockCalendar(
  1001,                          // Property ID
  new Date(),                    // Start
  new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
);

const occupancy = calculateOccupancyRate(calendar); // ~65%
```

**Pricing Formula:**

```
price = basePrice × seasonalMultiplier × dayOfWeekMultiplier × randomVariation
```

Where:
- **Seasonal:** 0.85x (Jul-Oct) to 1.2x (Jan-Apr)
- **Day-of-week:** 1.15x (Thu-Fri) or 1.0x (other)
- **Random:** ±5% variation

### 3. Reservations

**File:** `data/mock-reservations.ts`

~20 bookings distributed across 5 properties, next 90 days:
- Distribution: Airbnb 50%, Booking.com 30%, Direct 20%
- Average stay: 3-5 nights
- Lead times: 3-60 days

```typescript
import { MOCK_RESERVATIONS, getReservationsForProperty } from "@/data/mock-reservations";

const allReservations = MOCK_RESERVATIONS;
const marina = getReservationsForProperty(1001);
```

### 4. Events & Demand Signals

**File:** `data/mock-events.ts`

13 major 2026 Dubai events with demand impact scores:

| Event | Dates | Impact |
|-------|-------|--------|
| Dubai Shopping Festival | Dec 5 - Jan 11 | **Extreme** |
| Dubai World Cup | Mar 28 | **Extreme** |
| Dubai Marathon | Jan 23-24 | **High** |
| Art Dubai | Apr 15-19 | **High** |
| Ramadan | Feb 26 - Mar 27 | **Medium** |
| Islamic Fashion Week | Jun 10-15 | **High** |
| Dubai Design Week | Nov 8-15 | **High** |

```typescript
import { getEventsInRange, getEventsByImpact, MOCK_EVENTS } from "@/data/mock-events";

const q1Events = getEventsInRange(
  new Date(2026, 0, 1),
  new Date(2026, 2, 31)
);

const extremeImpact = getEventsByImpact("extreme");
```

### 5. Competitor Signals

**File:** `data/mock-competitors.ts`

10 market compression/release signals showing:
- Area-specific demand patterns
- Price changes (-28% to +35%)
- Confidence scores (0.75-0.92)
- Data sources (market_analysis, scraping, booking_velocity)

```typescript
import { getSignalsInRange, getHighConfidenceSignals } from "@/data/mock-competitors";

const marina = getSignalsByArea("Dubai Marina");
const compression = getSignalsByType("compression");
const reliable = getHighConfidenceSignals(0.85);
```

## PMSClient API

### Interface: `lib/pms/types.ts`

```typescript
export interface PMSClient {
  // Read operations
  listListings(): Promise<Listing[]>;
  getListing(id: string | number): Promise<Listing>;
  getCalendar(id, startDate, endDate): Promise<CalendarDay[]>;
  getReservations(filters?): Promise<Reservation[]>;

  // Write operations
  updateCalendar(id, intervals): Promise<UpdateResult>;
  verifyCalendar(id, dates): Promise<VerificationResult>;

  // Utility
  getMode(): "mock" | "live";
}
```

### Usage

```typescript
import { createPMSClient } from "@/lib/pms";

const pmsClient = createPMSClient(); // Returns MockPMSClient if HOSTAWAY_MODE=mock

// List all properties
const listings = await pmsClient.listListings();

// Get 90-day calendar
const calendar = await pmsClient.getCalendar(
  1001,
  new Date(),
  new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
);

// Get reservations with filters
const reservations = await pmsClient.getReservations({
  listingId: 1001,
  status: "confirmed",
});

// Update calendar prices
const result = await pmsClient.updateCalendar(1001, [
  { startDate: "2026-03-01", endDate: "2026-03-05", price: 650 }
]);

// Verify prices were updated
const verification = await pmsClient.verifyCalendar(1001, ["2026-03-01"]);
```

## Agent Orchestration

### Revenue Cycle

**File:** `lib/agents/index.ts`

Full pricing cycle implementation:

```typescript
import { runRevenueCycle, runFullRevenueCycle } from "@/lib/agents";

// Run for specific properties and date range
const result = await runRevenueCycle(
  [1001, 1002, 1003],
  {
    start: new Date(),
    end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  }
);

// Run for all properties
const fullResult = await runFullRevenueCycle();
```

**Output:**

```typescript
RevenueCycleResult = {
  cycleId: "CYCLE-1707418320000",
  timestamp: "2026-02-09T...",
  properties: [1001, 1002, 1003, 1004, 1005],
  aggregatedData: {
    totalProperties: 5,
    bookedDays: 287,
    availableDays: 163,
    occupancyRate: 64,
    averagePrice: 742
  },
  events: [...13 events...],
  competitorSignals: [...10 signals...],
  allProposals: [...proposals...],
  approvedProposals: [...reviewed...],
  rejectedProposals: [...rejected...],
  stats: {
    totalProposals: 324,
    approvedCount: 289,
    rejectedCount: 35,
    avgPriceChange: 8,
    highRiskCount: 12
  }
}
```

### Pricing Optimizer Agent

**File:** `lib/agents/mock-agents.ts`

Generates proposals considering:
1. **Event Impact** - Demand multiplier from event signals
2. **Competitor Signals** - Market compression/release
3. **Booking Velocity** - Days remaining & current occupancy
4. **Risk Classification** - Low/Medium/High based on % change

```typescript
const proposals = generatePriceProposals([{
  propertyId: 1001,
  calendar: [...90 days...],
  dateRange: { start, end },
  events: [...relevant events...],
  competitorSignals: [...market signals...]
}]);

// Returns ~70 proposals (90 days × 5 days per proposal on average)
```

### Adjustment Reviewer Agent

Reviews proposals and applies guardrails:

- ✅ Low-risk auto-approve (±0-10% within bounds)
- ⚠️ Medium-risk escalate (±10-20%)
- ❌ High-risk reject (±20%+) unless exceptional

```typescript
const reviewed = reviewProposals(proposals);

reviewed.forEach(r => {
  if (r.approved) {
    console.log(`✅ Approve: ${r.proposal.proposedPrice}`);
  } else {
    console.log(`❌ Reject: ${r.vetoReason}`);
  }
});
```

## Utility Functions

### Date Utilities

**File:** `lib/utils/date.ts`

```typescript
import {
  isHighSeason,
  isDubaiWeekend,
  getSeasonMultiplier,
  getDayOfWeekMultiplier,
  isRamadan,
  getRamadanDates,
  daysUntilFull
} from "@/lib/utils/date";

const high = isHighSeason(new Date(2026, 0, 15)); // true
const weekend = isDubaiWeekend(new Date(2026, 0, 16)); // false (Fri)
const seasonal = getSeasonMultiplier(new Date(2026, 0, 15)); // 1.2
const dayRate = getDayOfWeekMultiplier(new Date(2026, 0, 16)); // 1.15 (Fri)

const ramadan2026 = getRamadanDates(2026); // Feb 26 - Mar 27
```

### Pricing Utilities

**File:** `lib/utils/pricing.ts`

```typescript
import {
  clampPrice,
  calculatePercentageChange,
  isSafePriceChange,
  applyMultipliers,
  calculateRevenueImpact,
  getPricePosition
} from "@/lib/utils/pricing";

const clamped = clampPrice(750, 400, 800); // 750
const change = calculatePercentageChange(500, 600); // 20
const safe = isSafePriceChange(500, 600, 30); // true

const revenue = calculateRevenueImpact(
  500,    // basePrice
  600,    // proposedPrice
  65,     // occupancyRate %
  90      // days
);
// { baseRevenue: 29250, projectedRevenue: 35100, impact: 5850 }
```

## Testing & Verification

### Test 1: PMSClient Mock

```typescript
const client = createPMSClient();
const listings = await client.listListings();

console.assert(listings.length === 5);
console.assert(listings[0].id === 1001);
console.assert(listings[0].name === "Marina Heights 1BR");
```

### Test 2: Calendar Generation

```typescript
const calendar = await client.getCalendar(
  1001,
  new Date(),
  new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
);

console.assert(calendar.length === 90);
console.assert(calendar.some(d => d.status === "booked"));
console.assert(calendar.some(d => d.status === "available"));

const occupancy = calendar.filter(d => d.status === "booked").length / 90;
console.assert(occupancy >= 0.6 && occupancy <= 0.7); // ~65%
```

### Test 3: Calendar Updates

```typescript
const result = await client.updateCalendar(1001, [
  { startDate: "2026-03-01", endDate: "2026-03-05", price: 750 }
]);

console.assert(result.success);
console.assert(result.updatedCount === 5);

const verification = await client.verifyCalendar(1001, ["2026-03-01"]);
console.assert(verification.matches);
```

### Test 4: Revenue Cycle

```typescript
const result = await runFullRevenueCycle();

console.assert(result.properties.length === 5);
console.assert(result.events.length > 0);
console.assert(result.competitorSignals.length > 0);
console.assert(result.allProposals.length > 0);
console.assert(result.stats.approvedCount > 0);
```

## Environment Variables

### Development (.env.local)

```bash
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=https://mmgybsiqjdpsjypaahee.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# PMS Mode
HOSTAWAY_MODE=mock

# For live mode (future)
# HOSTAWAY_MODE=live
# HOSTAWAY_ACCOUNT_ID=your_account_id
# HOSTAWAY_CLIENT_SECRET=your_secret
```

## Migration to Live API

When Hostaway API credentials are available:

1. **Update .env.local:**
   ```bash
   HOSTAWAY_MODE=live
   HOSTAWAY_ACCOUNT_ID=your_id
   HOSTAWAY_CLIENT_SECRET=your_secret
   ```

2. **Implement HostawayClient:**
   - Update `lib/pms/hostaway-client.ts`
   - Implement OAuth authentication flow
   - Map Hostaway responses to PMSClient interface

3. **No frontend changes needed:**
   - PMSClient interface remains the same
   - Factory pattern handles switching

## Performance Characteristics

### MockPMSClient

- **listListings():** ~100ms
- **getCalendar():** ~150ms
- **getReservations():** ~200ms
- **updateCalendar():** ~200ms
- **verifyCalendar():** ~150ms

All delays are simulated with `setTimeout` - production implementation will use real network calls.

### Memory Usage

- Mock data (properties): < 1KB
- Calendar (90 days × 5 properties): ~50KB
- Reservations (~20): ~20KB
- Events (13): ~10KB
- Competitor signals (10): ~20KB

**Total:** ~100KB in-memory

## Key Design Decisions

### 1. Mock-First Architecture

✅ **Pros:**
- Zero external dependencies
- Parallel frontend/backend development
- Fully testable
- Predictable, seeded randomness
- Fast iteration cycles

✅ **Cons:**
- Data not 100% realistic
- No real API rate limits
- Manual sync with actual API format

### 2. Factory Pattern

Uses `createPMSClient()` factory to switch implementations:

```typescript
const mode = process.env.HOSTAWAY_MODE || "mock";
return mode === "live" ? new HostawayClient() : new MockPMSClient();
```

✅ **Allows:** Single codebase, multiple implementations

### 3. Seeded Randomness

Calendar generation uses deterministic seeding `(listingId * 1000 + dayIndex)` to ensure:
- Same property always has same pattern
- Reproducible for debugging
- ~65% occupancy is stable
- Prices vary realistically but predictably

### 4. Agent Orchestration

Full revenue cycle in `runRevenueCycle()`:
1. Data Aggregator (calendar + reservations)
2. Event Intelligence (event data)
3. Competitor Scanner (market signals)
4. Pricing Optimizer (generate proposals)
5. Adjustment Reviewer (apply guardrails)

Output provides end-to-end validation of the pricing loop.

## Debugging Tips

### Check Mode

```typescript
const client = createPMSClient();
console.log(client.getMode()); // "mock" or "live"
```

### Inspect Overrides (MockPMSClient only)

```typescript
const client = createPMSClient() as MockPMSClient;
const overrides = client.getOverrides(1001);
client.clearOverrides(); // Reset
```

### View Raw Calendar

```typescript
const calendar = await client.getCalendar(1001, start, end);
console.table(calendar);
```

### Validate Revenue Cycle

```typescript
const result = await runFullRevenueCycle();
console.log(`Properties: ${result.properties.length}`);
console.log(`Events: ${result.events.length}`);
console.log(`Proposals: ${result.allProposals.length}`);
console.log(`Approved: ${result.approvedProposals.length}`);
console.log(`Avg change: ${result.stats.avgPriceChange}%`);
```

## Next Steps

1. **Integrate with Dashboard:**
   - Use `createPMSClient()` in API routes
   - Display calendar data
   - Show event impacts

2. **Build Approval UI:**
   - Show proposals with reasoning
   - Manual override capability
   - Execution tracking

3. **Add Real Hostaway API:**
   - Implement HostawayClient methods
   - Handle OAuth authentication
   - Test against live account

4. **Enhance AI Agents:**
   - Replace mock logic with actual model calls
   - Add more nuanced decision logic
   - Track performance metrics

## References

- Architecture: `/priceos/architecture.md` (Section 8: PMSClient Pattern)
- Roadmap: `/priceos/roadmap.md` (Section 5.2: 2026 Dubai Events)
- API Docs: https://api.hostaway.com/documentation
