# PriceFloorCeilingAgent

## Purpose
Enforce and dynamically adjust per-property price floors and ceilings — preventing the system from proposing prices that damage the brand, undercut sustainable revenue, or exceed what the market will bear — while adapting limits as market conditions evolve.

## Intelligence Category
AI Strategy Builder

## Mode
**Turbo only**

## Inputs

### DB Tables
- `listings` — `priceFloor`, `priceCeiling` (current static limits set by property manager)
- `proposals` — historical proposals that were rejected (often indicates floor/ceiling is wrong)
- `reservations` — actual booking prices (market validation of floor/ceiling appropriateness)
- `calendar_days` — current pricing vs. floor/ceiling constraints

### Computed Signals
- Frequency of proposals hitting the floor (floor may be too high, causing missed bookings)
- Frequency of proposals hitting the ceiling (ceiling may be too low, leaving revenue on table)
- Actual booking prices vs. floor/ceiling (are limits aligned with market reality?)

## External Data Sources
*(Planned — Phase 2)*
- **CompetitorPriceAgent signal**: Market comp set minimum and maximum as calibration anchors
- **PropertyPositioningAgent signal**: Quality-tier-appropriate floor/ceiling ranges
- **AirDNA**: Market-wide floor/ceiling benchmarks by area and bedroom count

## Output Format

```json
{
  "agent": "PriceFloorCeilingAgent",
  "listingId": 1001,
  "currentLimits": {
    "priceFloor": 280,
    "priceCeiling": 650,
    "currency": "AED"
  },
  "analysis": {
    "proposalsHittingFloor": 12,
    "proposalsHittingCeiling": 2,
    "avgBookingPrice": 420,
    "floorUtilizationRate": 0.08,
    "ceilingUtilizationRate": 0.01
  },
  "recommendations": [
    {
      "type": "raise_floor",
      "currentFloor": 280,
      "suggestedFloor": 320,
      "rationale": "Avg booking price is AED 420; floor of 280 is 33% below avg — floor can safely be raised without impacting occupancy",
      "confidence": 0.79
    }
  ],
  "violations": [
    {
      "date": "2026-02-20",
      "proposedPrice": 260,
      "floor": 280,
      "action": "blocked_proposal",
      "blockingAgent": "PriceFloorCeilingAgent"
    }
  ]
}
```

## Pricing Impact

This agent operates as both a **guardian** (real-time enforcement) and a **calibrator** (periodic strategic recommendations):

**Real-time enforcement (every proposal):**
- Any proposal below `priceFloor` → automatically rejected; CRO alerted
- Any proposal above `priceCeiling` → flagged for CRO review (ceiling may be intentionally conservative)

**Strategic calibration (monthly):**

| Pattern | Recommendation |
|---------|---------------|
| Floor hit > 10% of proposals | Floor may be too high; review downward |
| Floor rarely hit (<2%) | Floor may be too low; raise to protect brand |
| Ceiling hit frequently (>5%) | Ceiling is artificially suppressing revenue; raise |
| Bookings consistently at floor | Strong signal: market won't pay above floor; investigate quality/positioning |

## Implementation Notes

- **Floor is sacred**: Never allow automated systems to bypass the floor — it represents the property manager's minimum viable revenue per night. Any floor relaxation requires explicit human approval
- **Ceiling is a guardrail, not a target**: Properties should hit the ceiling only during peak events; if ceiling is hit on ordinary nights, it was set too low
- **Dynamic floor for off-peak**: Property managers may want a lower floor during summer (off-peak) to prevent vacancy — implement seasonal floor variants (e.g., `summerFloor` vs. `peakFloor`) as an enhancement
- **Floor violation logging**: Log every blocked proposal in the `violations` array — this is an audit trail for CRO to review when floor/ceiling limits seem wrong
- **Interaction with other agents**: This agent runs last in the proposal pipeline, after all other agents have generated their suggestions. It validates and gates final prices before they reach CRO for approval
- **Owner alignment**: Floors are often set based on owner cost coverage (mortgage, service fees, management fees). Never recommend a floor below the owner's break-even point — this should be a user-configurable input in settings
- **Dubai regulatory floor**: DTCM short-term rental regulations may impose minimum nightly rates in certain areas — validate floor settings against any applicable regulatory minimums
