# LastMinuteDemandAgent

## Purpose
Detect surges in last-minute search and booking activity for properties within a 0–7 day window, enabling dynamic price raises when urgent demand is high — capturing the premium that spontaneous travelers pay.

## Intelligence Category
Real-Time Pricing

## Mode
**Turbo only**

## Inputs

### DB Tables
- `reservations` — booking timestamps vs. check-in date (lead time at booking)
- `calendar_days` — current price and availability for next 7 days

### Computed Signals
- Percentage of recent bookings made within 3 days of check-in (trailing 60 days)
- Current open availability for next 0–7 days
- Rate of same-day / next-day booking conversions

## External Data Sources
*(Planned — Phase 2)*
- **Google Trends API**: Search interest for "Dubai short term rental" or area-specific queries, filtered to last 7 days
- **Airbnb Search Visibility API** (if available): How often a listing appears in last-minute search results
- **Meta search impression data**: Click-through rate signals from Airbnb/Booking.com partner APIs

## Output Format

```json
{
  "agent": "LastMinuteDemandAgent",
  "listingId": 1003,
  "window": "next_7_days",
  "lastMinuteBookingShare": 0.34,
  "openDates": ["2026-02-20", "2026-02-21", "2026-02-23"],
  "demandSignal": "elevated",
  "recommendedAction": "raise_price",
  "suggestedAdjustment": "+12%",
  "applyUntil": "2026-02-22",
  "confidence": 0.71
}
```

`demandSignal` values: `"elevated"` | `"normal"` | `"weak"`

## Pricing Impact

| Demand Signal | Open Dates | Pricing Action |
|---------------|------------|---------------|
| `elevated` | 1–2 dates | Raise 10–20% for remaining dates |
| `elevated` | 3+ dates | Raise 5–10% to balance fill rate |
| `normal` | Any | Hold price |
| `weak` | Any | GapNightAgent handles discounts |

## Implementation Notes

- **Last-minute definition**: Booking made ≤ 3 days before check-in
- **Don't confuse with gap filling**: This agent is about *demand* signals, not calendar structure — GapNightAgent handles the structural problem; this agent handles the demand spike opportunity
- **Dubai-specific pattern**: Dubai sees heavy Friday–Saturday last-minute bookings from regional visitors (GCC tourists); weight weekend dates higher
- **Confidence decay**: Confidence drops sharply after 5 days of open availability — if dates haven't filled, demand may not be as elevated as signals suggest
- **Interaction with GapNightAgent**: If GapNightAgent recommends a discount on same dates, LastMinuteDemand signal takes precedence when `demandSignal = "elevated"`; CRO reconciles conflict
