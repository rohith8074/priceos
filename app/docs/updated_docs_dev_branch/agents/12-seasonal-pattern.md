# SeasonalPatternAgent

## Purpose
Learn and codify the demand seasonality curve for each property and submarket — translating historical patterns into proactive pricing rules that the system applies automatically as seasons shift.

## Intelligence Category
AI Strategy Builder

## Mode
**Both** (Simple + Turbo)

## Inputs

### DB Tables
- `reservations` — historical booking data: dates, `nights`, price, lead time (minimum 12 months preferred)
- `calendar_days` — historical occupancy and pricing per day
- `seasonal_rules` — existing manual rules defined by property manager
- `listings` — area and property type for market-level pattern matching

### Computed Signals
- Occupancy rate by week-of-year (52-week heatmap per property)
- Average nightly rate by week-of-year
- RevPAR (Revenue Per Available Night) by week and season
- Year-over-year trend (is this year's peak stronger or weaker?)

## External Data Sources
*(Planned — Phase 2)*
- **AirDNA seasonal demand index**: Dubai market-wide demand by week (validates portfolio-specific patterns against market)
- **DTCM tourism arrivals by month**: Macro seasonality anchor for Dubai
- **Weather API (OpenWeatherMap)**: Summer heat correlation with demand drops (Dubai summer = June–Sept)

## Output Format

```json
{
  "agent": "SeasonalPatternAgent",
  "listingId": 1001,
  "seasonalProfile": {
    "peakSeason": {
      "months": ["October", "November", "December", "January", "February"],
      "avgOccupancyRate": 0.88,
      "avgNightlyRate": 520,
      "revPAR": 458
    },
    "shoulderSeason": {
      "months": ["March", "April", "September"],
      "avgOccupancyRate": 0.71,
      "revPAR": 335
    },
    "offSeason": {
      "months": ["May", "June", "July", "August"],
      "avgOccupancyRate": 0.48,
      "revPAR": 196
    }
  },
  "recommendedRules": [
    {
      "name": "Peak Season Premium",
      "dateRange": "Oct 1 – Feb 28",
      "priceMultiplier": 1.25,
      "minimumStay": 3
    },
    {
      "name": "Summer Survival Mode",
      "dateRange": "Jun 1 – Aug 31",
      "priceMultiplier": 0.75,
      "minimumStay": 5,
      "rationale": "Extended stays from regional visitors; sacrifice nightly rate for occupancy"
    }
  ]
}
```

## Pricing Impact

| Season | Dubai Pattern | Typical Strategy |
|--------|-------------|-----------------|
| Peak (Oct–Feb) | High demand, cool weather, major events | +20–40% vs. base price |
| Shoulder (Mar–Apr, Sep) | Moderate demand, pleasant weather | Base price; event-aware |
| Off-Peak (Jun–Aug) | Low demand, extreme heat (45°C+) | -20–30%; target regional markets |
| Ramadan | Variable; leisure demand drops | -10–20% for leisure; +5% for religious tourism |

## Implementation Notes

- **Minimum history requirement**: Seasonal patterns require ≥ 12 months of data to be meaningful. For new listings, inherit patterns from the closest comparable property in the same area and bedroom count
- **Automated rule generation**: SeasonalPatternAgent's output should translate directly into `seasonal_rules` DB entries, pre-populated for CRO approval — reduces manual rule creation work
- **Dubai's inverted season**: Unlike European markets, Dubai's peak is winter (Oct–Feb) and off-peak is summer — don't apply generic seasonality templates
- **Ramadan nuance**: Ramadan timing shifts each year (Islamic calendar); agent must dynamically compute Ramadan dates for the current year using a calendar library
- **Year-over-year drift**: If year 2 peak is 15% stronger than year 1, the seasonal multipliers should drift upward accordingly — static rules get stale
- **Interaction with EventDetectionAgent**: Events during shoulder/off-peak seasons are high-value — SeasonalPatternAgent should flag these as "event premium on soft base" rather than treating them as pure seasonal adjustments
