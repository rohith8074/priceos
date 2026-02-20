# RevenueForecastAgent

## Purpose
Project 30, 60, and 90-day revenue and occupancy for each property and the portfolio — combining current bookings, pricing, historical patterns, and market signals into actionable forward-looking estimates.

## Intelligence Category
ForecastIQ

## Mode
**Both** (Simple + Turbo)

## Inputs

### DB Tables
- `reservations` — confirmed bookings with revenue value for upcoming dates
- `calendar_days` — current pricing and availability for open dates
- `seasonal_rules` — seasonal baseline expectations
- `listings` — portfolio-level aggregation
- `proposals` — pending proposals that would change pricing (optimistic vs. conservative scenario)

### Computed Signals
- Confirmed revenue (booked dates × rate)
- Projected revenue (open dates × current price × expected occupancy rate)
- Occupancy rate trend vs. same period prior year
- Revenue-at-risk from cancellations (from CancellationRiskAgent in Turbo Mode)

## External Data Sources
*(Planned — Phase 2)*
- **MarketDemandAgent signal**: Market occupancy trend as occupancy rate input for open dates
- **AirDNA forward-looking demand**: 90-day demand forecast by Dubai submarket
- **EventDetectionAgent**: Upcoming events that would lift projected occupancy on specific dates

## Output Format

```json
{
  "agent": "RevenueForecastAgent",
  "generatedAt": "2026-02-19",
  "portfolioForecast": {
    "next30Days": {
      "confirmedRevenue": 48200,
      "projectedRevenue": 71500,
      "bestCase": 82000,
      "worstCase": 61000,
      "projectedOccupancy": 0.79,
      "currency": "AED"
    },
    "next60Days": {
      "confirmedRevenue": 52400,
      "projectedRevenue": 138000,
      "projectedOccupancy": 0.71
    },
    "next90Days": {
      "confirmedRevenue": 52400,
      "projectedRevenue": 201000,
      "projectedOccupancy": 0.67
    }
  },
  "perPropertyForecasts": [
    {
      "listingId": 1001,
      "listingName": "Marina Heights 1BR",
      "next30DaysRevenue": 14200,
      "next30DaysOccupancy": 0.84,
      "alert": null
    },
    {
      "listingId": 1003,
      "listingName": "JBR Beach Studio",
      "next30DaysRevenue": 8100,
      "next30DaysOccupancy": 0.55,
      "alert": "below_target_occupancy"
    }
  ],
  "keyInsights": [
    "JBR Beach Studio is tracking 24% below target for next 30 days — consider price reduction or promotion",
    "Portfolio peak revenue window: March 1–15 (GITEX satellite events + school holiday)"
  ]
}
```

## Pricing Impact

The forecast itself doesn't generate price proposals. It provides the financial context CRO uses to prioritize other agent recommendations:
- Below-target properties → trigger GapNightAgent, CompetitorPriceAgent, RestrictionsAgent
- Above-target properties → may support raising prices further (BookingVelocityAgent signal)
- Portfolio-level forecast → used in owner statements and strategic planning

## Implementation Notes

- **Confirmed vs. projected split**: Always clearly separate confirmed revenue (locked bookings) from projected revenue (estimates for open dates) — never present projections as booked revenue
- **Occupancy rate for open dates**: In Phase 1, use historical seasonal occupancy rate for the same period as the projection multiplier. Blend with market signal in Phase 2
- **Best/worst case bounds**: Best case = all open dates fill at current price. Worst case = confirmed revenue only (zero new bookings). Present the range to set realistic expectations
- **Forecast refresh cadence**: Refresh daily (not just on-demand) since calendar_days changes daily
- **Owner statement alignment**: The 30-day forecast should align with the format used in `owner_statements` table — same revenue categorization so actuals vs. forecast comparison is straightforward
- **Interaction with CancellationRiskAgent**: In Turbo Mode, subtract high-risk booking revenue from "confirmed" and move to "at-risk" bucket for a more honest forecast
- **Forecast accuracy tracking**: Log forecast vs. actual revenue monthly to calibrate the model over time — track MAE (mean absolute error) and surface it in the insights UI
