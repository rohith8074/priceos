import type { SeasonalRule } from "@/types/operations";

export const MOCK_SEASONAL_RULES: SeasonalRule[] = [
  // Property 1001 - Marina Horizon Studio
  { id: 1, listingMapId: 1001, name: "Dubai High Season", startDate: "2025-12-15", endDate: "2026-03-31", priceModifier: 25, minimumStay: 3, enabled: true },
  { id: 2, listingMapId: 1001, name: "Summer Low Season", startDate: "2026-06-01", endDate: "2026-08-31", priceModifier: -15, enabled: true },
  { id: 3, listingMapId: 1001, name: "Eid Al Fitr", startDate: "2026-03-30", endDate: "2026-04-05", priceModifier: 30, minimumStay: 2, enabled: true },
  // Property 1002 - JBR Beachfront Suite
  { id: 4, listingMapId: 1002, name: "Dubai High Season", startDate: "2025-12-15", endDate: "2026-03-31", priceModifier: 20, minimumStay: 3, enabled: true },
  { id: 5, listingMapId: 1002, name: "Summer Low Season", startDate: "2026-06-01", endDate: "2026-08-31", priceModifier: -20, enabled: true },
  // Property 1003 - Downtown View Apartment
  { id: 6, listingMapId: 1003, name: "Dubai High Season", startDate: "2025-12-15", endDate: "2026-03-31", priceModifier: 20, minimumStay: 2, enabled: true },
  { id: 7, listingMapId: 1003, name: "Ramadan", startDate: "2026-02-28", endDate: "2026-03-29", priceModifier: -10, enabled: true },
  // Property 1004 - Palm Villa Royale
  { id: 8, listingMapId: 1004, name: "NYE Premium", startDate: "2025-12-28", endDate: "2026-01-03", priceModifier: 50, minimumStay: 5, enabled: true },
  { id: 9, listingMapId: 1004, name: "Dubai High Season", startDate: "2025-12-15", endDate: "2026-03-31", priceModifier: 30, minimumStay: 4, enabled: true },
  { id: 10, listingMapId: 1004, name: "Summer Low Season", startDate: "2026-06-01", endDate: "2026-08-31", priceModifier: -25, enabled: true },
  // Property 1005 - Business Bay Executive
  { id: 11, listingMapId: 1005, name: "Dubai High Season", startDate: "2025-12-15", endDate: "2026-03-31", priceModifier: 15, minimumStay: 2, enabled: true },
  { id: 12, listingMapId: 1005, name: "GITEX Week", startDate: "2026-10-12", endDate: "2026-10-18", priceModifier: 35, minimumStay: 3, enabled: true },
];

export function getRulesForListing(listingMapId: number): SeasonalRule[] {
  return MOCK_SEASONAL_RULES.filter((r) => r.listingMapId === listingMapId);
}
