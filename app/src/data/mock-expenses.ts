import type { Expense, OwnerStatement } from "@/types/operations";

export const MOCK_EXPENSES: Expense[] = [
  // January 2026
  { id: 1, listingMapId: 1001, category: "cleaning", amount: 150, currencyCode: "AED", description: "Standard cleaning", date: "2026-01-05" },
  { id: 2, listingMapId: 1001, category: "cleaning", amount: 150, currencyCode: "AED", description: "Standard cleaning", date: "2026-01-12" },
  { id: 3, listingMapId: 1001, category: "supplies", amount: 85, currencyCode: "AED", description: "Toiletries and coffee restocking", date: "2026-01-10" },
  { id: 4, listingMapId: 1001, category: "commission", amount: 1200, currencyCode: "AED", description: "Airbnb commission (Jan)", date: "2026-01-31" },
  { id: 5, listingMapId: 1002, category: "cleaning", amount: 200, currencyCode: "AED", description: "Deep cleaning after long stay", date: "2026-01-08" },
  { id: 6, listingMapId: 1002, category: "maintenance", amount: 450, currencyCode: "AED", description: "AC filter replacement", date: "2026-01-15" },
  { id: 7, listingMapId: 1002, category: "commission", amount: 1800, currencyCode: "AED", description: "Booking.com commission (Jan)", date: "2026-01-31" },
  { id: 8, listingMapId: 1003, category: "cleaning", amount: 120, currencyCode: "AED", description: "Standard cleaning", date: "2026-01-06" },
  { id: 9, listingMapId: 1003, category: "utilities", amount: 350, currencyCode: "AED", description: "DEWA bill (Jan)", date: "2026-01-25" },
  { id: 10, listingMapId: 1004, category: "cleaning", amount: 350, currencyCode: "AED", description: "Villa deep cleaning", date: "2026-01-10" },
  { id: 11, listingMapId: 1004, category: "maintenance", amount: 800, currencyCode: "AED", description: "Pool service (monthly)", date: "2026-01-15" },
  { id: 12, listingMapId: 1004, category: "maintenance", amount: 1200, currencyCode: "AED", description: "Garden landscaping", date: "2026-01-20" },
  { id: 13, listingMapId: 1004, category: "commission", amount: 3500, currencyCode: "AED", description: "Airbnb commission (Jan)", date: "2026-01-31" },
  { id: 14, listingMapId: 1005, category: "cleaning", amount: 130, currencyCode: "AED", description: "Standard cleaning", date: "2026-01-07" },
  { id: 15, listingMapId: 1005, category: "supplies", amount: 60, currencyCode: "AED", description: "Coffee pods and water", date: "2026-01-14" },
  // February 2026
  { id: 16, listingMapId: 1001, category: "cleaning", amount: 150, currencyCode: "AED", description: "Standard cleaning", date: "2026-02-02" },
  { id: 17, listingMapId: 1001, category: "maintenance", amount: 300, currencyCode: "AED", description: "Plumbing - kitchen faucet", date: "2026-02-05" },
  { id: 18, listingMapId: 1002, category: "cleaning", amount: 200, currencyCode: "AED", description: "Standard cleaning", date: "2026-02-03" },
  { id: 19, listingMapId: 1003, category: "cleaning", amount: 120, currencyCode: "AED", description: "Standard cleaning", date: "2026-02-04" },
  { id: 20, listingMapId: 1003, category: "maintenance", amount: 250, currencyCode: "AED", description: "WiFi router replacement", date: "2026-02-11" },
  { id: 21, listingMapId: 1004, category: "cleaning", amount: 350, currencyCode: "AED", description: "Villa cleaning", date: "2026-02-01" },
  { id: 22, listingMapId: 1004, category: "maintenance", amount: 800, currencyCode: "AED", description: "Pool service (monthly)", date: "2026-02-10" },
  { id: 23, listingMapId: 1005, category: "cleaning", amount: 130, currencyCode: "AED", description: "Standard cleaning", date: "2026-02-06" },
  { id: 24, listingMapId: 1005, category: "maintenance", amount: 180, currencyCode: "AED", description: "Fix bathroom faucet", date: "2026-02-11" },
  { id: 25, listingMapId: 1001, category: "supplies", amount: 95, currencyCode: "AED", description: "Toiletries restocking", date: "2026-02-10" },
  { id: 26, listingMapId: 1002, category: "utilities", amount: 420, currencyCode: "AED", description: "DEWA bill (Feb)", date: "2026-02-12" },
  { id: 27, listingMapId: 1003, category: "commission", amount: 900, currencyCode: "AED", description: "Airbnb commission (Feb est.)", date: "2026-02-12" },
  { id: 28, listingMapId: 1001, category: "other", amount: 500, currencyCode: "AED", description: "Annual insurance premium (monthly)", date: "2026-02-01" },
  { id: 29, listingMapId: 1002, category: "other", amount: 750, currencyCode: "AED", description: "Annual insurance premium (monthly)", date: "2026-02-01" },
  { id: 30, listingMapId: 1004, category: "utilities", amount: 900, currencyCode: "AED", description: "DEWA bill (Feb)", date: "2026-02-12" },
];

export const MOCK_OWNER_STATEMENTS: OwnerStatement[] = [
  { id: 1, listingMapId: 1001, month: "2026-01", totalRevenue: 12100, totalExpenses: 1585, netIncome: 10515, occupancyRate: 73, reservationCount: 5 },
  { id: 2, listingMapId: 1002, month: "2026-01", totalRevenue: 18700, totalExpenses: 2450, netIncome: 16250, occupancyRate: 68, reservationCount: 4 },
  { id: 3, listingMapId: 1003, month: "2026-01", totalRevenue: 8800, totalExpenses: 1370, netIncome: 7430, occupancyRate: 65, reservationCount: 5 },
  { id: 4, listingMapId: 1004, month: "2026-01", totalRevenue: 35000, totalExpenses: 5850, netIncome: 29150, occupancyRate: 58, reservationCount: 3 },
  { id: 5, listingMapId: 1005, month: "2026-01", totalRevenue: 11000, totalExpenses: 1190, netIncome: 9810, occupancyRate: 71, reservationCount: 5 },
  { id: 6, listingMapId: 1001, month: "2026-02", totalRevenue: 9350, totalExpenses: 1045, netIncome: 8305, occupancyRate: 67, reservationCount: 4 },
  { id: 7, listingMapId: 1002, month: "2026-02", totalRevenue: 14450, totalExpenses: 1370, netIncome: 13080, occupancyRate: 60, reservationCount: 3 },
  { id: 8, listingMapId: 1003, month: "2026-02", totalRevenue: 7200, totalExpenses: 1270, netIncome: 5930, occupancyRate: 57, reservationCount: 4 },
  { id: 9, listingMapId: 1004, month: "2026-02", totalRevenue: 28000, totalExpenses: 2050, netIncome: 25950, occupancyRate: 50, reservationCount: 2 },
  { id: 10, listingMapId: 1005, month: "2026-02", totalRevenue: 8500, totalExpenses: 810, netIncome: 7690, occupancyRate: 60, reservationCount: 3 },
];

export function getExpensesForListing(listingMapId: number): Expense[] {
  return MOCK_EXPENSES.filter((e) => e.listingMapId === listingMapId);
}

export function getStatementsForListing(listingMapId: number): OwnerStatement[] {
  return MOCK_OWNER_STATEMENTS.filter((s) => s.listingMapId === listingMapId);
}
