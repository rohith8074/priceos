# EventDetectionAgent

## Purpose
Identify upcoming events in Dubai that will drive short-term accommodation demand spikes — sports events, concerts, exhibitions, conferences — and flag the impacted dates for price increases before competitors react.

## Intelligence Category
Event Detection

## Mode
**Both** (Simple + Turbo)

## Inputs

### DB Tables
- `calendar_days` — current pricing for impacted dates
- `proposals` — previous event-driven proposals (to avoid duplicate proposals)
- `listings` — area (to map event location → impacted neighborhoods)

### Computed Signals
- Days until event (urgency)
- Historical demand lift from comparable past events (if data available)
- Whether current price already reflects the event premium

## External Data Sources
*(Planned — Phase 2)*
- **Dubai Calendar API** (`dubaicalendar.ae`): Official events feed — GITEX, Dubai Shopping Festival, New Year, Eid, Ramadan
- **Eventbrite API**: Large concerts and international events at venues (Coca-Cola Arena, Expo City)
- **UAE National Events Calendar**: Public holidays and national celebrations
- **Dubai Tourism events feed**: Major sporting events (Dubai World Cup horse racing, tennis, golf)
- **Scrape**: Dubai Airshow schedule (Nov, biennial; major corporate demand driver)

## Output Format

```json
{
  "agent": "EventDetectionAgent",
  "eventsDetected": [
    {
      "eventId": "gitex_2026",
      "name": "GITEX Global 2026",
      "dates": ["2026-10-13", "2026-10-17"],
      "venue": "Dubai World Trade Centre",
      "impactedAreas": ["Downtown Dubai", "Business Bay", "DIFC"],
      "estimatedDemandLift": "+35%",
      "proposedPriceAdjustment": "+30%",
      "impactedListings": [1002, 1005],
      "urgency": "low",
      "daysUntilEvent": 237,
      "confidence": 0.91
    }
  ]
}
```

`urgency`: `"critical"` (<3 days) | `"high"` (3–14 days) | `"medium"` (15–60 days) | `"low"` (60+ days)

## Pricing Impact

| Event Type | Expected Demand Lift | Pricing Window |
|------------|---------------------|----------------|
| Major exhibition (GITEX, Cityscape) | +25–45% | Event dates + 2 days before/after |
| Major concert (Coca-Cola Arena) | +15–30% | Event night only |
| New Year's Eve / NYE fireworks | +60–100% | Dec 30 – Jan 1 |
| Public holiday (Eid, National Day) | +20–40% | Holiday + long-weekend bridge days |
| Dubai Shopping Festival | +10–20% | Entire DSF period (Jan–Feb) |

## Implementation Notes

- **Area-to-listing mapping**: Events impact specific neighborhoods; use `listings.area` field to scope impact (e.g., GITEX impacts Business Bay and Downtown, not JBR)
- **Lead time matters**: Raise prices for confirmed events 3–6 months out; don't wait until the last week
- **Avoid double-counting**: If HolidayPremiumAgent has already proposed a price for a public holiday event, EventDetectionAgent should not generate a conflicting proposal for the same dates
- **Confidence scoring**: Recurring annual events (GITEX, DSF) score high confidence; one-off events or unconfirmed dates score lower
- **Ramadan nuance**: Dubai demand *drops* during Ramadan for leisure stays but increases for religious tourism — flag as a mixed signal requiring human judgment
- **Cross-property batching**: For a portfolio-wide event (e.g., NYE), generate a single batch proposal rather than one per listing to reduce CRO review burden
