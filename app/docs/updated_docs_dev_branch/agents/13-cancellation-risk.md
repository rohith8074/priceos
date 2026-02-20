# CancellationRiskAgent

## Purpose
Assess the probability of a confirmed booking being cancelled based on lead time, cancellation policy, historical patterns, and booking source — enabling proactive overbooking strategy, dynamic cancellation policies, or re-pricing of high-risk bookings.

## Intelligence Category
AI Strategy Builder

## Mode
**Turbo only**

## Inputs

### DB Tables
- `reservations` — historical cancellation data (if tracked), channel, lead time, booking value
- `listings` — cancellation policy settings (strict/moderate/flexible)
- `calendar_days` — gap risk created by cancellation on specific dates

### Computed Signals
- Cancellation rate by channel (Airbnb vs. Booking.com vs. direct)
- Cancellation rate by lead time bracket (>60 days has higher cancellation risk)
- "At-risk revenue" = sum of high-risk booking values for upcoming dates

## External Data Sources
*(Planned — Phase 2)*
- **Airbnb Resolution Center data**: Cancellation patterns by booking type (instant book vs. request to book)
- **Booking.com Extranet API**: Cancellation rate by property and rate plan
- **Hostaway Analytics**: Cross-channel cancellation benchmarks

## Output Format

```json
{
  "agent": "CancellationRiskAgent",
  "listingId": 1002,
  "riskAssessment": {
    "upcomingBookings": 4,
    "atRiskBookings": [
      {
        "reservationId": "RES-2026-0312",
        "guestName": "Ahmed K.",
        "checkIn": "2026-04-15",
        "nights": 7,
        "bookingValue": 3360,
        "leadTimeDays": 55,
        "cancellationPolicy": "moderate",
        "channel": "airbnb",
        "cancellationProbability": 0.31,
        "riskLevel": "medium",
        "recommendedAction": "monitor"
      }
    ],
    "totalAtRiskRevenue": 3360,
    "portfolioCancellationRate": 0.09
  }
}
```

`riskLevel` values: `"low"` (<15% probability) | `"medium"` (15–35%) | `"high"` (>35%)
`recommendedAction` values: `"monitor"` | `"request_confirmation"` | `"enable_overbooking"` | `"tighten_policy"`

## Pricing Impact

Cancellation risk doesn't directly change prices, but informs:
- **Non-refundable rate creation**: Offer 5–10% discount for non-refundable bookings to reduce cancellation risk
- **Overbooking strategy**: For high-risk periods, accept one extra booking on adjacent dates with a plan to relocate if both confirm
- **Policy tightening**: If cancellation rate exceeds 15% on a property, recommend switching from "moderate" to "strict" policy
- **Gap risk pricing**: If a cancellation would create a hard-to-fill gap, raise the adjacent dates' prices preemptively

## Implementation Notes

- **Cancellation data gap (Phase 1)**: PriceOS may not currently track cancellations explicitly in the `reservations` table — add a `cancelledAt` or `status` field to enable this agent's core function
- **Channel-specific risk**: Booking.com "free cancellation" listings attract high-risk bookings; Airbnb instant-book with strict policy has lower risk — weight accordingly
- **Lead time is the strongest predictor**: Bookings made 60+ days out have 2–3x higher cancellation probability than bookings made <14 days out
- **Regulatory note**: Explicit overbooking must be handled carefully — Dubai's STR regulations require accurate reporting; never actually double-book; only use as a contingency strategy with clear relocation plans
- **Interaction with GapNightAgent**: If a cancellation is detected, immediately trigger a GapNightAgent re-run to assess the resulting availability gap and price accordingly
- **Privacy**: Cancellation probability scores should not be surfaced to guests — internal operational data only
