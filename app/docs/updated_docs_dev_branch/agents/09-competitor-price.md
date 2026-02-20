# CompetitorPriceAgent

## Purpose
Track competitor pricing for comparable properties in the same Dubai submarket and flag when the portfolio is priced significantly above or below the competitive range — keeping properties competitive without underselling.

## Intelligence Category
Market Insights

## Mode
**Both** (Simple + Turbo)

## Inputs

### DB Tables
- `listings` — area, `bedroomsNumber`, `personCapacity`, `price` (current price)
- `calendar_days` — current price per day

### Computed Signals
- Positioning: how each listing's price compares to comparable comp set (pMin, pMedian, pMax)
- Price gap percentage vs. median comp
- Days where portfolio is an outlier (>20% above or below comp median)

## External Data Sources
*(Planned — Phase 2 — highest priority integration)*
- **Airbnb scraping / unofficial API**: Nightly prices for comparable listings within 1km by bedrooms and rating
- **Booking.com Partner API**: Competitor rates for comparable apartment-style properties
- **PriceLabs Market Dashboard API**: Aggregated competitor price index for Dubai submarkets
- **AirDNA**: Historical competitive pricing benchmarks
- **Vrbo**: Prices for comparable properties (less relevant in Dubai but applicable for luxury villas)

## Output Format

```json
{
  "agent": "CompetitorPriceAgent",
  "listingId": 1001,
  "area": "Dubai Marina",
  "bedroomsNumber": 1,
  "dateRange": "next_30_days",
  "compSetSize": 12,
  "competitorPricing": {
    "pMin": 310,
    "pMedian": 420,
    "pMax": 680,
    "currency": "AED"
  },
  "currentPrice": 390,
  "positioning": "below_median",
  "gapVsMedian": "-7.1%",
  "signal": "underpriced",
  "recommendation": {
    "action": "raise_price",
    "suggestedPrice": 415,
    "adjustment": "+6.4%",
    "rationale": "Property is 7% below market median with 85% rating; no justification for discount"
  },
  "confidence": 0.74
}
```

`signal` values: `"underpriced"` | `"competitive"` | `"overpriced"` | `"premium_justified"`

## Pricing Impact

| Positioning | Gap vs. Median | Action |
|------------|---------------|--------|
| `underpriced` | <-10% | Raise price toward median |
| `underpriced` | -5% to -10% | Minor raise or hold; monitor |
| `competitive` | ±5% | Hold; no action needed |
| `overpriced` | +10–20% | Review; may be justified by amenities |
| `overpriced` | >+20% | Flag for human review; likely causing low occupancy |

## Implementation Notes

- **Comp set definition**: Match on: same area, ±1 bedroom, ±1 star rating, similar amenities (pool, parking). Minimum 5 comps required for reliable signal; emit `"insufficient_comp_set"` otherwise
- **Quality adjustment**: A 5-star rated property should naturally price above the median for its bedroom count — `premium_justified` signal prevents inappropriate downward pressure
- **Freshness requirement**: Competitor prices must be < 24 hours old to be actionable; stale comp data should be flagged but not used for proposals
- **Dubai area segmentation**: Marina, JBR, Downtown, Palm, Business Bay, and DIFC are distinct comp pools — never compare across areas
- **No race to bottom**: Agent should never recommend pricing below `listings.priceFloor` — PriceFloorCeilingAgent enforces the hard floor
- **Phase 1 workaround**: Without live competitor data, use historical seasonal averages from `seasonal_rules` as a proxy comp set; mark as `"simulated_comp_data"` in confidence metadata
