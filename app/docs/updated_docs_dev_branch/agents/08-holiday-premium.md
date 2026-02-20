# HolidayPremiumAgent

## Purpose
Apply structured price premiums to UAE public holidays, school holidays, and international long weekends — ensuring the portfolio captures systematic holiday demand without manual intervention for each date.

## Intelligence Category
Event Detection

## Mode
**Turbo only**

## Inputs

### DB Tables
- `calendar_days` — current pricing; agent checks if holiday premium already applied
- `seasonal_rules` — existing holiday rules defined by property manager
- `listings` — area, bedroom count (family-oriented properties benefit more from school holidays)

### Computed Signals
- Holiday type (national day, religious holiday, school break, international long weekend)
- Historical average occupancy on equivalent holidays in prior years
- Current price vs. expected holiday premium baseline

## External Data Sources
*(Planned — Phase 2)*
- **UAE Government Public Holidays API**: Official annual holiday calendar
- **KHDA (Knowledge and Human Development Authority)**: Dubai school term and holiday dates for school-break demand
- **International calendar**: UK, India, GCC school holidays (major tourist source markets for Dubai)

## Output Format

```json
{
  "agent": "HolidayPremiumAgent",
  "holidaysAnalyzed": [
    {
      "holidayId": "uae_national_day_2026",
      "name": "UAE National Day",
      "dates": ["2026-12-02", "2026-12-03"],
      "bridgeDays": ["2026-11-30", "2026-12-01"],
      "type": "national_holiday",
      "targetedListings": "all",
      "baselinePremium": "+25%",
      "recommendedAdjustments": [
        {
          "listingId": 1004,
          "listingName": "Palm Villa 3BR",
          "suggestedPremium": "+35%",
          "rationale": "3BR family unit; National Day drives family gatherings; historically +40% occupancy"
        }
      ]
    }
  ]
}
```

## Pricing Impact

| Holiday Type | Typical Premium | Notes |
|-------------|----------------|-------|
| UAE National Day (Dec 2–3) | +25–40% | Long weekend; family gatherings |
| Eid Al Fitr | +20–35% | GCC family travel surge |
| Eid Al Adha | +25–40% | Often longer break; higher premium |
| New Year's Eve / Day | +60–100% | Highest demand night of year |
| UAE Founding Day (Dec 30) | +30–50% | NYE adjacent; compound demand |
| Dubai School Holiday | +10–20% | Impacts 2BR+ family units more |
| UK/India school half-term | +5–15% | Marina and Downtown (expat heavy) |

## Implementation Notes

- **Do not overlap with EventDetectionAgent**: If a public holiday coincides with a major event (e.g., National Day concert), EventDetectionAgent takes precedence for that date; HolidayPremiumAgent applies to surrounding bridge days
- **Islamic holidays are date-uncertain**: Eid dates depend on moon sighting — generate preliminary proposals 30 days out and revise within 3 days of confirmation
- **School holiday profiling**: Apply school-holiday premiums only to properties with `bedroomsNumber >= 2` — studios are not the primary beneficiary of family school-break travel
- **Bridge day detection**: Automatically identify "bridge days" (e.g., if a holiday falls on Wednesday, Thu–Fri are likely taken off) and propose modest premiums (+10%) for bridge days
- **Avoid alert fatigue**: Generate one consolidated holiday calendar proposal at the start of each month (covering the next 60 days) rather than individual proposals per holiday
- **Ramadan exception**: Reduce prices during Ramadan for leisure/tourism-focused properties; HolidayPremiumAgent should flag Ramadan dates as `price_reduction` rather than premium
