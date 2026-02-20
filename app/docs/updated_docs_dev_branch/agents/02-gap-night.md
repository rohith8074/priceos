# GapNightAgent

## Purpose
Detect orphaned 1–3 night gaps between existing reservations and propose discounts or minimum-stay relaxations to fill them — preventing revenue from slipping through the cracks.

## Intelligence Category
Real-Time Pricing

## Mode
**Both** (Simple + Turbo)

## Inputs

### DB Tables
- `reservations` — check-in and check-out dates per listing
- `calendar_days` — current price, availability, minimum stay per day
- `listings` — `minimumStay`, `maximumStay` settings

### Computed Signals
- Gap size (nights) between consecutive reservations
- Days until the gap starts (urgency)
- Effective nightly rate of adjacent bookings (reference price)

## External Data Sources
*(Planned — Phase 2)*
- No external sources needed; this is a pure internal data optimization
- **Airbnb listing API**: Verify if minimum stay restrictions are preventing guests from booking the gap on the platform side

## Output Format

```json
{
  "agent": "GapNightAgent",
  "listingId": 1002,
  "gaps": [
    {
      "gapId": "gap_2026-03-14_2026-03-16",
      "startDate": "2026-03-14",
      "endDate": "2026-03-16",
      "nights": 2,
      "daysUntilGap": 23,
      "currentPrice": 420,
      "suggestedPrice": 357,
      "discountPercent": 15,
      "action": "discount_and_relax_min_stay",
      "urgency": "medium"
    }
  ]
}
```

`urgency` values: `"low"` (>30 days) | `"medium"` (8–30 days) | `"high"` (<7 days)

## Pricing Impact

| Gap Size | Urgency | Recommended Discount |
|----------|---------|---------------------|
| 1 night | High | 20–25% off + relax min stay |
| 2 nights | High | 15–20% off |
| 3 nights | Medium | 10% off |
| 1–3 nights | Low | 5% off, monitor |

## Implementation Notes

- **Definition of a gap**: A sequence of available `calendar_days` with `isAvailable = true` flanked by reservations on both sides (or end of bookable window on one side)
- **Minimum gap threshold**: Only flag gaps ≤ 3 nights — longer gaps are normal availability, not orphans
- **Urgency escalation**: Re-evaluate urgency daily; gaps that remain unfilled as check-in approaches escalate from `low` → `high`
- **Min stay conflict**: If a 2-night gap exists but `minimumStay = 3`, the agent must also recommend a min-stay relaxation for those specific dates via RestrictionsAgent signal
- **Do not double-count**: If a gap is already priced below the agent's suggested floor, mark as `already_discounted` and skip
- **Revenue loss estimate**: Include projected lost revenue if gap stays empty to give CRO context for approval
