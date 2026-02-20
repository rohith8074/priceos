# LengthOfStayAgent

## Purpose
Analyze actual booking length-of-stay (LOS) patterns to recommend LOS-based pricing adjustments — discounting extended stays to improve occupancy or applying premiums to high-value short stays.

## Intelligence Category
Smart Restrictions

## Mode
**Turbo only**

## Inputs

### DB Tables
- `reservations` — `nights` field, booking value, check-in month
- `listings` — property type, area, bedroom count
- `seasonal_rules` — existing LOS-based rules

### Computed Signals
- LOS distribution: 1-night, 2–3 nights, 4–7 nights, 7–14 nights, 14+ nights
- Revenue per night by LOS bracket (do longer stays yield more or less per night?)
- LOS trends over time (is the market shifting toward shorter or longer stays?)

## External Data Sources
*(Planned — Phase 2)*
- **AirDNA**: LOS benchmarks by area and season for Dubai market
- **Airbnb search trends**: Average requested stay length in Dubai submarkets

## Output Format

```json
{
  "agent": "LengthOfStayAgent",
  "listingId": 1002,
  "analysisWindow": "trailing_180_days",
  "losDistribution": {
    "1_night": 0.05,
    "2_3_nights": 0.32,
    "4_7_nights": 0.41,
    "7_14_nights": 0.18,
    "14_plus_nights": 0.04
  },
  "revenuePerNightByLOS": {
    "2_3_nights": 520,
    "4_7_nights": 480,
    "7_14_nights": 430
  },
  "recommendations": [
    {
      "type": "los_discount",
      "bracket": "7_plus_nights",
      "discount": "10%",
      "rationale": "7+ night bookings yield AED 90/night less but dramatically improve occupancy"
    }
  ]
}
```

## Pricing Impact

| LOS Bracket | Pattern | Recommended Action |
|-------------|---------|-------------------|
| 1–2 nights | High revenue/night | Premium pricing; enforce via min stay if needed |
| 4–7 nights | Core segment | Standard pricing; optimize for volume |
| 7–14 nights | Moderate discount | 5–15% off to attract weekly bookings |
| 14+ nights | Significant discount | 15–25% off; target corporate / digital nomad segment |

## Implementation Notes

- **Revenue per night is misleading alone**: A 14-night booking at AED 350/night beats three 4-night bookings at AED 450/night if the alternative is calendar gaps — always compute total revenue impact, not just nightly rate
- **Property-type context**: Studios and 1BRs in Business Bay attract more long-stay corporate guests; 3BR villas on Palm attract short-stay leisure guests — LOS strategy must match the property's natural audience
- **Feeds RestrictionsAgent**: LOS recommendations translate into min/max stay rule changes executed by RestrictionsAgent
- **LOS pricing tiers**: Output should be structured so PricingOptimizerAgent can apply tiered pricing (e.g., "if reservation.nights >= 7, apply -10% to calendar_days.price")
- **Seasonal variation**: LOS patterns in Dubai shift significantly by season — winter sees shorter leisure stays, summer sees longer GCC family stays; segment analysis by season
