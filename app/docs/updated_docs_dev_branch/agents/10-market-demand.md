# MarketDemandAgent

## Purpose
Measure overall market-level demand health for each Dubai submarket — tracking citywide occupancy rates, search volumes, and demand trends to provide macro context for portfolio pricing decisions.

## Intelligence Category
Market Insights

## Mode
**Turbo only**

## Inputs

### DB Tables
- `listings` — area groupings for market-level aggregation
- `calendar_days` — portfolio occupancy rates as a local demand proxy
- `reservations` — booking pace as a market proxy (until external data available)

### Computed Signals
- Portfolio occupancy rate for next 30 days (proxy for local market demand)
- Booking pace trend vs. same period last year
- Area-level demand distribution across the portfolio

## External Data Sources
*(Planned — Phase 2)*
- **AirDNA**: Dubai submarket-level occupancy rates, RevPAR, and demand indices
- **STR (Smith Travel Research)**: Official STR market data for Dubai if accessible
- **Google Travel Trends**: Search interest in "Dubai accommodation" by source market
- **DTCM (Dubai Tourism)**: Official visitor arrival statistics and hotel occupancy benchmarks
- **Mastercard SpendingPulse**: Consumer spending in hospitality category for Dubai (proxy for overall demand)

## Output Format

```json
{
  "agent": "MarketDemandAgent",
  "marketSnapshot": {
    "asOf": "2026-02-19",
    "areas": [
      {
        "area": "Dubai Marina",
        "marketOccupancyRate": 0.81,
        "demandTrend": "increasing",
        "revPAR": 485,
        "currency": "AED",
        "vsLastYear": "+12%"
      },
      {
        "area": "Business Bay",
        "marketOccupancyRate": 0.68,
        "demandTrend": "flat",
        "revPAR": 380,
        "currency": "AED",
        "vsLastYear": "+3%"
      }
    ]
  },
  "portfolioOccupancy": 0.74,
  "marketSignal": "strong",
  "recommendation": "Market conditions support +5–10% price increases across Marina and Downtown listings"
}
```

`marketSignal` values: `"strong"` | `"healthy"` | `"soft"` | `"weak"`

## Pricing Impact

| Market Signal | Occupancy | Portfolio Action |
|---------------|-----------|-----------------|
| `strong` | >85% | Raise prices across-the-board; market can absorb |
| `healthy` | 70–85% | Hold or modest raises for high-demand properties |
| `soft` | 55–70% | Hold; focus on gap filling and restrictions |
| `weak` | <55% | Defensive pricing; prioritize occupancy over rate |

## Implementation Notes

- **Macro vs. micro context**: MarketDemandAgent provides the macro backdrop; CompetitorPriceAgent handles specific comp-set positioning. CRO synthesizes both in Turbo Mode
- **Portfolio as proxy**: In Phase 1 (no external data), the portfolio's own occupancy rate is the best available proxy for market demand — useful but biased by the portfolio's own pricing decisions
- **Area aggregation**: With 5 properties across different areas, per-area market signals will be sparse; aggregate to "Dubai overall" until AirDNA integration provides submarket granularity
- **Seasonality context**: Dubai's peak season (Oct–Jan) naturally shows high occupancy — `strong` signal in November is expected; `strong` signal in August is genuinely meaningful
- **Feed to RevenueForecastAgent**: MarketDemandAgent's trend signals are a primary input for RevenueForecastAgent's 30/60/90-day projections
- **DTCM data lag**: Official Dubai Tourism statistics are typically published 2 months after the period — useful for historical calibration but not real-time pricing
