# PriceOS Mock Data - Quick Start

## 30-Second Setup

### 1. Install Dependencies
```bash
cd frontend
npm install date-fns
```

### 2. Verify Environment
```bash
# Already configured in .env.local
HOSTAWAY_MODE=mock
```

### 3. Test It Works
```typescript
// In any component or route handler
import { createPMSClient } from "@/lib/pms";
import { runFullRevenueCycle } from "@/lib/agents";

const client = createPMSClient();
const listings = await client.listListings();
console.log(listings); // 5 Dubai properties
```

Done! Mock data is ready to use.

---

## Common Usage Patterns

### Get All Properties
```typescript
const listings = await pmsClient.listListings();
// Returns 5 properties: Marina, Downtown, JBR, Palm, Business Bay
```

### Get 90-Day Calendar
```typescript
const calendar = await pmsClient.getCalendar(
  1001,
  new Date(),
  addDays(new Date(), 90)
);
// Returns calendar with:
// - Available, booked, blocked status
// - Seasonal prices (400-800 AED)
// - ~65% occupancy
```

### Get Bookings
```typescript
const reservations = await pmsClient.getReservations({
  listingId: 1001,
  status: "confirmed"
});
// Returns ~3-5 bookings per property
```

### Run Pricing Analysis
```typescript
const result = await runFullRevenueCycle({
  start: new Date(2026, 2, 1),
  end: new Date(2026, 2, 31)
});

console.log(result.stats);
// {
//   totalProposals: 324,
//   approvedCount: 289,
//   rejectedCount: 35,
//   avgPriceChange: 8,
//   highRiskCount: 12
// }
```

### Update Calendar Prices
```typescript
const result = await pmsClient.updateCalendar(1001, [
  {
    startDate: "2026-03-01",
    endDate: "2026-03-07",
    price: 750
  }
]);

if (result.success) {
  console.log(`Updated ${result.updatedCount} dates`);
}
```

---

## Data Overview

### 5 Properties
| ID | Name | Area | Beds | Base Price |
|----|------|------|------|------------|
| 1001 | Marina Heights | Dubai Marina | 1 | 550 AED |
| 1002 | Downtown Residences | Downtown | 2 | 850 AED |
| 1003 | JBR Beach Studio | JBR | Studio | 400 AED |
| 1004 | Palm Villa | Palm Jumeirah | 3 | 2000 AED |
| 1005 | Bay View | Business Bay | 1 | 500 AED |

### 13 Major Events
- Dubai Shopping Festival (Dec-Jan) - **Extreme** impact
- Dubai World Cup (Mar 28) - **Extreme** impact
- Dubai Marathon (Jan 23-24) - **High** impact
- Art Dubai (Apr 15-19) - **High** impact
- Ramadan (Feb 26 - Mar 27) - **Medium** impact
- And 8 more...

### ~20 Reservations
- 50% from Airbnb
- 30% from Booking.com
- 20% Direct
- 3-5 per property
- 3-7 night stays

### 10 Market Signals
- Dubai Marina: Compression (15-16% increase)
- Downtown: Compression (22-32% increase)
- JBR: Release (-28% decrease)
- Business Bay: Compression (14-18% increase)
- And more by date/area...

---

## Key Features

✅ **Zero External Dependencies** - No API needed
✅ **Realistic Data** - 65% occupancy, seasonal pricing
✅ **Full Revenue Cycle** - Events → Proposals → Approval
✅ **Risk Classification** - Low/Medium/High proposals
✅ **Easy Switching** - Change `HOSTAWAY_MODE=live` when ready
✅ **Well Documented** - 600+ line guide + 9 examples

---

## File Locations

```
frontend/src/
├── types/hostaway.ts           # Types
├── data/                        # Mock data
│   ├── mock-properties.ts
│   ├── mock-calendar.ts
│   ├── mock-reservations.ts
│   ├── mock-events.ts
│   └── mock-competitors.ts
├── lib/
│   ├── pms/                     # PMS Client (mock & live)
│   │   ├── types.ts
│   │   ├── mock-client.ts
│   │   ├── hostaway-client.ts
│   │   └── index.ts
│   ├── agents/                  # AI agents
│   │   ├── types.ts
│   │   ├── mock-agents.ts
│   │   └── index.ts
│   └── utils/                   # Helpers
│       ├── date.ts
│       └── pricing.ts
└── lib/examples.ts              # 9 examples
```

---

## Running Examples

```typescript
import * as examples from "@/lib/examples";

// Run any example
await examples.example1_ListProperties();
await examples.example2_GetCalendar();
await examples.example7_RunRevenueCycle();
```

---

## Switch to Live API

When ready:

1. Get Hostaway API credentials
2. Update `.env.local`:
   ```bash
   HOSTAWAY_MODE=live
   HOSTAWAY_ACCOUNT_ID=xxx
   HOSTAWAY_CLIENT_SECRET=xxx
   ```
3. No code changes needed - `createPMSClient()` auto-switches

---

## Architecture

```
Your App
  ↓
createPMSClient() [Factory]
  ├→ MockPMSClient (dev)
  └→ HostawayClient (prod)
```

Both implement same `PMSClient` interface.

---

## Pricing Formula

```
price = basePrice × season × dayOfWeek × random ± bounds
```

- **Season:** 0.85x (Jul-Oct) to 1.2x (Jan-Apr)
- **Day-of-week:** 1.15x (Thu-Fri) or 1.0x
- **Random:** ±5%
- **Bounds:** floor to ceiling

Example:
```
550 (base) × 1.2 (winter) × 1.15 (Friday) × 0.97 (random) = 755 AED
```

---

## Next Steps

1. **Display Calendar** - Show availability in UI
2. **Show Proposals** - Display pricing recommendations
3. **Build Approval** - Manual override interface
4. **Track Execution** - Log price updates

See `MOCK_DATA_GUIDE.md` for detailed integration guide.

---

## Troubleshooting

**Q: Data looks the same every time?**
A: Yes! Data is seeded for reproducibility. That's a feature.

**Q: How do I test with different data?**
A: Dates change daily (calendar is 90 days forward). Adjust date range to see different events/signals.

**Q: Can I modify mock data?**
A: Yes, edit files in `src/data/`. Changes are immediate (hot reload).

**Q: How do I use real Hostaway API?**
A: Change `HOSTAWAY_MODE=live` in `.env.local` (after implementing HostawayClient).

---

## Support

- **Full Guide:** `MOCK_DATA_GUIDE.md` (600+ lines)
- **Examples:** `src/lib/examples.ts` (9 runnable samples)
- **Architecture:** `architecture.md` (Section 8)
- **Types:** `src/types/hostaway.ts` (inline comments)

---

**Ready to integrate? Start with `MOCK_DATA_GUIDE.md` for detailed API docs.**
