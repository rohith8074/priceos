# LeadTimeAgent

## Purpose
Analyze how far in advance guests typically book each property and use that pattern to set optimal pricing windows — charging premiums for early bookings when demand is strong, or creating early-bird discounts when demand is weak.

## Intelligence Category
AI Strategy Builder

## Mode
**Turbo only**

## Inputs

### DB Tables
- `reservations` — booking creation timestamps, check-in dates (compute lead time per booking)
- `listings` — property type, area, bedroom count (lead time varies by property profile)
- `seasonal_rules` — existing lead-time-based pricing rules

### Computed Signals
- Median lead time (days between booking and check-in) by month
- Lead time distribution (P25, P50, P75, P90)
- Correlation between lead time and booking price (do early bookers pay more or less?)

## External Data Sources
*(Planned — Phase 2)*
- **AirDNA Market Data**: Market-wide lead time benchmarks by property type and Dubai area
- **Hostaway Analytics API**: Aggregate lead time trends across PMS portfolio (when live mode enabled)

## Output Format

```json
{
  "agent": "LeadTimeAgent",
  "listingId": 1004,
  "analysisWindow": "trailing_90_days",
  "medianLeadTimeDays": 18,
  "leadTimeDistribution": {
    "p25": 7,
    "p50": 18,
    "p75": 35,
    "p90": 62
  },
  "earlyBookingShare": 0.28,
  "recommendation": {
    "type": "early_bird_premium",
    "applyFor": "bookings_made_30plus_days_ahead",
    "adjustment": "+5%",
    "rationale": "28% of guests book 30+ days out; these bookings have higher average value"
  },
  "confidence": 0.76
}
```

## Pricing Impact

| Pattern | Action |
|---------|--------|
| High early-booking share (>30%) | Add 5–10% early-booking premium (30+ days out) |
| Low lead time (median <10 days) | Focus on last-minute demand; don't lock in low prices early |
| Declining lead times vs. last year | Indicates softening demand; raise prices earlier to secure bookings |
| Long lead times with high cancellations | Cross-reference CancellationRiskAgent; require stricter policies |

## Implementation Notes

- **Minimum data requirement**: Requires ≥ 20 reservations for meaningful distribution analysis; emit `"insufficient_data"` for new listings
- **Seasonal segmentation**: Lead times for peak season (Oct–Jan in Dubai) differ from summer; compute separately by season
- **New listing cold start**: For properties with < 3 months of history, inherit lead-time benchmarks from comparable properties in the same area and bedroom count
- **Strategy rule generation**: This agent's output feeds into `seasonal_rules` table — recommended lead-time windows should be expressed as rules the PricingOptimizerAgent can apply automatically
- **Interaction with SeasonalPatternAgent**: Lead time patterns shift by season; coordinate signals to avoid conflicting rules for the same date range
