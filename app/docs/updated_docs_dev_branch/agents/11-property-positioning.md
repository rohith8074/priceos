# PropertyPositioningAgent

## Purpose
Evaluate where each property sits within its competitive tier — assessing rating, amenities, reviews, and price relative to comp set — to determine whether pricing is appropriate for the property's quality level and identify repositioning opportunities.

## Intelligence Category
Market Insights

## Mode
**Turbo only**

## Inputs

### DB Tables
- `listings` — area, `bedroomsNumber`, `personCapacity`, `price`, `priceFloor`, `priceCeiling`
- `reservations` — repeat guest rate, average booking value (quality proxies)
- `proposals` — historical acceptance rate of price increase proposals (demand signal)

### Computed Signals
- Price-per-bedroom vs. area average
- Booking acceptance rate at current price (inferred from occupancy)
- Repeat guest rate (strong loyalty signal = price premium justified)

## External Data Sources
*(Planned — Phase 2)*
- **Airbnb listing data**: Star rating, review count, Superhost status, amenity tags (pool, sea view, gym)
- **Booking.com property score**: Guest review score as objective quality measure
- **Google Maps reviews**: Sentiment analysis for location quality (walkability, proximity to attractions)
- **Hostaway listing metadata**: Full amenity list from connected PMS

## Output Format

```json
{
  "agent": "PropertyPositioningAgent",
  "listingId": 1004,
  "listingName": "Palm Villa 3BR",
  "area": "Palm Jumeirah",
  "qualityScore": 4.8,
  "qualityTier": "premium",
  "priceTier": "mid-market",
  "positioning": "underpriced_for_quality",
  "keyStrengths": ["sea_view", "private_pool", "superhost", "palm_location"],
  "pricingGap": {
    "currentPrice": 1200,
    "suggestedFloor": 1450,
    "rationale": "4.8-star Palm villa with private pool; comp set median for equivalent quality is AED 1,600"
  },
  "recommendation": "Reposition to premium tier; raise floor by 20% and ceiling by 15%",
  "confidence": 0.83
}
```

`qualityTier` values: `"budget"` | `"mid-market"` | `"premium"` | `"luxury"`
`positioning` values: `"underpriced_for_quality"` | `"correctly_positioned"` | `"overpriced_for_quality"`

## Pricing Impact

This agent operates at the **strategic level** — it recommends adjustments to `priceFloor` and `priceCeiling` rather than daily prices. These are structural changes that affect all future proposals.

| Positioning | Action |
|-------------|--------|
| `underpriced_for_quality` | Raise `priceFloor` and daily prices; communicate value in listing |
| `correctly_positioned` | No action; hold current tier |
| `overpriced_for_quality` | Lower prices to match quality expectation; or identify amenity upgrades |

## Implementation Notes

- **Floor/ceiling adjustment**: Changes to `priceFloor` and `priceCeiling` have portfolio-wide implications — always require CRO approval and should be proposed as strategic quarterly reviews, not daily adjustments
- **Quality signals without external data (Phase 1)**: Use repeat guest rate and consistent occupancy at current price as quality proxies. High repeat rate = guests perceive value; low rate despite discounts = quality issue
- **Amenity discovery**: Until Airbnb API integration, amenity data must be manually seeded into a listing metadata table or inferred from listing description text
- **Repositioning is slow**: Repositioning a property upmarket takes 60–90 days for the market to respond — recommendations should include an execution timeline, not just a price change
- **Interaction with PriceFloorCeilingAgent**: PropertyPositioningAgent recommends strategic floor/ceiling changes; PriceFloorCeilingAgent enforces the operational floor/ceiling on a daily basis
