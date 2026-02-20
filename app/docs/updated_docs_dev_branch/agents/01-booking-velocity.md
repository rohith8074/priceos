# BookingVelocityAgent

## Purpose
Monitor the rate at which bookings are accumulating for a property's upcoming dates — detecting whether demand is accelerating (time to raise price) or stalling (time to drop or promote).

## Intelligence Category
Real-Time Pricing

## Mode
**Both** (Simple + Turbo)

## Inputs

### DB Tables
- `reservations` — booking timestamps, check-in dates, listing IDs
- `calendar_days` — current price and availability per day
- `listings` — property metadata (area, bedroom count for market context)

### Computed Signals
- Bookings per day rate for the next 7 / 14 / 30 days
- Same-period booking pace vs. same time last year (if data available)
- Days since last booking for each property

## External Data Sources
*(Planned — Phase 2)*
- **Airbnb API / scrape**: Public availability calendar to estimate competitor booking pace
- **AirDNA**: Market-wide booking velocity benchmarks for Dubai submarkets (Marina, Downtown, JBR, Palm, Business Bay)

## Output Format

```json
{
  "agent": "BookingVelocityAgent",
  "listingId": 1001,
  "window": "next_14_days",
  "bookingsThisWeek": 3,
  "avgDailyBookingRate": 0.43,
  "paceVsLastYear": "+18%",
  "signal": "accelerating",
  "recommendedAction": "raise_price",
  "suggestedAdjustment": "+8%",
  "confidence": 0.82
}
```

`signal` values: `"accelerating"` | `"steady"` | `"stalling"` | `"cold"`

## Pricing Impact

| Signal | Pricing Action |
|--------|---------------|
| `accelerating` | Raise price 5–15% for unfilled dates |
| `steady` | Hold current price |
| `stalling` | Drop price 3–8% or trigger promotion |
| `cold` | Significant drop + flag for human review |

## Implementation Notes

- **Velocity window**: Calculate over rolling 7-day booking count — smooths out single-day spikes
- **Minimum data threshold**: Require at least 3 months of reservation history before producing a confident signal; emit `"insufficient_data"` otherwise
- **Per-area normalization**: JBR and Marina have naturally higher velocity than Business Bay; normalize rates by area before cross-property comparison
- **Seasonality blind spot**: Raw velocity in Jan (peak) will always look "accelerating" — weight signals against seasonal_rules baseline
- **Integration point**: BookingVelocityAgent feeds directly into PricingOptimizerAgent as a primary input signal
