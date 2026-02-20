# Price Intelligence Agents

PriceOS uses 15 specialized price intelligence agents, grouped into two operating modes. Each agent is inspired by [Pricepoint.co](https://pricepoint.co) features, adapted for the Dubai short-term rental market.

---

## Operating Modes

### Simple Mode (5 agents)

Fast and focused. These five agents cover the highest-impact daily signals. Ideal for quick morning reviews.

| # | Agent | File | Category |
|---|-------|------|----------|
| 1 | BookingVelocityAgent | `01-booking-velocity.md` | Real-Time Pricing |
| 2 | GapNightAgent | `02-gap-night.md` | Real-Time Pricing |
| 3 | RestrictionsAgent | `05-restrictions.md` | Smart Restrictions |
| 4 | EventDetectionAgent | `07-event-detection.md` | Event Detection |
| 5 | RevenueForecastAgent | `14-revenue-forecast.md` | ForecastIQ |

### Turbo Mode (all 15 agents)

All agents run in parallel. CRO (Chief Revenue Officer) manager agent compiles a synthesized recommendation from all signals. Use for weekly strategy reviews or deep dives.

---

## All 15 Agents

| # | Agent | File | Category | Mode |
|---|-------|------|----------|------|
| 1 | BookingVelocityAgent | `01-booking-velocity.md` | Real-Time Pricing | Both |
| 2 | GapNightAgent | `02-gap-night.md` | Real-Time Pricing | Both |
| 3 | LastMinuteDemandAgent | `03-last-minute-demand.md` | Real-Time Pricing | Turbo |
| 4 | LeadTimeAgent | `04-lead-time.md` | AI Strategy Builder | Turbo |
| 5 | RestrictionsAgent | `05-restrictions.md` | Smart Restrictions | Both |
| 6 | LengthOfStayAgent | `06-length-of-stay.md` | Smart Restrictions | Turbo |
| 7 | EventDetectionAgent | `07-event-detection.md` | Event Detection | Both |
| 8 | HolidayPremiumAgent | `08-holiday-premium.md` | Event Detection | Turbo |
| 9 | CompetitorPriceAgent | `09-competitor-price.md` | Market Insights | Both |
| 10 | MarketDemandAgent | `10-market-demand.md` | Market Insights | Turbo |
| 11 | PropertyPositioningAgent | `11-property-positioning.md` | Market Insights | Turbo |
| 12 | SeasonalPatternAgent | `12-seasonal-pattern.md` | AI Strategy Builder | Both |
| 13 | CancellationRiskAgent | `13-cancellation-risk.md` | AI Strategy Builder | Turbo |
| 14 | RevenueForecastAgent | `14-revenue-forecast.md` | ForecastIQ | Both |
| 15 | PriceFloorCeilingAgent | `15-price-floor-ceiling.md` | AI Strategy Builder | Turbo |

---

## Intelligence Categories

| Category | Description | Agents |
|----------|-------------|--------|
| **Real-Time Pricing** | Immediate demand signals affecting today's price | 1, 2, 3 |
| **Smart Restrictions** | Minimum stay, gap filling, booking rules | 5, 6 |
| **Event Detection** | Dubai events, public holidays, seasonal demand spikes | 7, 8 |
| **Market Insights** | Competitor pricing, market occupancy, positioning | 9, 10, 11 |
| **AI Strategy Builder** | Lead time patterns, seasonality, risk, floor/ceiling | 4, 12, 13, 15 |
| **ForecastIQ** | 30/60/90-day revenue and occupancy projections | 14 |

---

## Toggle UI Concept

Each intelligence category maps to a chat toggle in the PriceOS sidebar. Users select which "lens" they want to consult:

```
[Real-Time]  [Restrictions]  [Events]  [Market]  [Strategy]  [Forecast]
     ↑ selected → routes chat to relevant agent(s)
```

In **Simple Mode**, only the 5 core agents respond. In **Turbo Mode**, the CRO synthesizes all 15 agent outputs before responding.

---

## Agent File Structure

Each agent file follows this template:

```
# [Agent Name]

## Purpose
## Intelligence Category
## Mode
## Inputs
## External Data Sources
## Output Format
## Pricing Impact
## Implementation Notes
```

---

## Implementation Status

All agents are **defined** (spec complete). External data integrations are planned for Phase 2+.

Current data sources (Phase 1):
- DB: `listings`, `calendar_days`, `reservations`, `proposals`, `seasonal_rules`
- No external API integrations yet

Planned external sources: Airbnb/VRBO scrape, Dubai Calendar API, AirDNA, PriceLabs signals.
