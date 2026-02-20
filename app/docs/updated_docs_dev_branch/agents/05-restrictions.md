# RestrictionsAgent

## Purpose
Evaluate and recommend minimum stay, maximum stay, and booking window restrictions per property and date range — balancing revenue optimization with platform discoverability.

## Intelligence Category
Smart Restrictions

## Mode
**Both** (Simple + Turbo)

## Inputs

### DB Tables
- `listings` — `minimumStay`, `maximumStay` current settings
- `calendar_days` — availability gaps, pricing per day
- `reservations` — rejected booking patterns (if tracked), average stay length
- `proposals` — previous restriction change proposals and outcomes

### Computed Signals
- Current average booking length vs. minimumStay setting
- Gap nights created by current minimumStay
- Booking conversion rate (estimated from availability patterns)

## External Data Sources
*(Planned — Phase 2)*
- **Airbnb listing insights**: Impressions-to-booking conversion rate drop-offs correlated with min stay length
- **Hostaway channel analytics**: Which channels are most impacted by restriction changes

## Output Format

```json
{
  "agent": "RestrictionsAgent",
  "listingId": 1001,
  "currentSettings": {
    "minimumStay": 3,
    "maximumStay": 30
  },
  "recommendations": [
    {
      "type": "reduce_minimum_stay",
      "targetDates": "2026-03-14 to 2026-03-16",
      "currentMin": 3,
      "suggestedMin": 1,
      "rationale": "2-night gap created by current min stay; relaxation enables fill",
      "revenueImpact": "+AED 840",
      "risk": "low"
    },
    {
      "type": "increase_minimum_stay",
      "targetDates": "2026-12-24 to 2026-01-05",
      "currentMin": 3,
      "suggestedMin": 5,
      "rationale": "Peak holiday period; enforce minimum to avoid underselling premium dates",
      "risk": "medium"
    }
  ]
}
```

## Pricing Impact

Restrictions don't change prices directly but control *which* bookings can occur:
- Reducing min stay → enables gap fills → direct revenue recovery
- Increasing min stay during peaks → forces longer bookings → higher total revenue per booking
- Removing max stay restriction in off-peak → captures long-stay travelers (digital nomads)

## Implementation Notes

- **Gap detection handoff**: RestrictionsAgent receives gap data from GapNightAgent and determines if a min-stay relaxation (not just a price cut) is the correct fix
- **Turbo interaction**: In Turbo Mode, LengthOfStayAgent provides LOSRecommendations that RestrictionsAgent uses to refine specific min/max values
- **Override safety**: Never recommend min stay < 1 or max stay > 365
- **Platform-specific restrictions**: Airbnb and Booking.com have different minimum stay enforcement rules; tag recommendations with platform context when known
- **Dubai long-stay market**: Dubai has a growing digital nomad segment seeking 14–30 night stays in Marina/Business Bay; RestrictionsAgent should flag properties where removing max stay limits could unlock this segment
- **Human approval required**: All restriction changes route through CRO for authorization before Channel Sync applies them
