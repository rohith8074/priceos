/**
 * Pricing Utility Functions
 * Helpers for price calculations and bound checks
 */

/**
 * Clamp price within floor and ceiling
 */
export function clampPrice(
  price: number,
  floor: number,
  ceiling: number
): number {
  return Math.max(floor, Math.min(ceiling, price));
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(
  oldValue: number,
  newValue: number
): number {
  if (oldValue === 0) return 0;
  return Math.round(((newValue - oldValue) / oldValue) * 100);
}

/**
 * Check if price change is safe
 */
export function isSafePriceChange(
  oldPrice: number,
  newPrice: number,
  maxChangePercent: number = 30
): boolean {
  const changePercent = Math.abs(calculatePercentageChange(oldPrice, newPrice));
  return changePercent <= maxChangePercent;
}

/**
 * Calculate price with multiple multipliers
 */
export function applyMultipliers(
  basePrice: number,
  multipliers: number[]
): number {
  return Math.round(
    basePrice * multipliers.reduce((a, b) => a * b, 1)
  );
}

/**
 * Validate price range
 */
export function isValidPrice(
  price: number,
  floor: number,
  ceiling: number
): boolean {
  return price >= floor && price <= ceiling;
}

/**
 * Calculate price position relative to market
 */
export function getPricePosition(
  price: number,
  marketPrice: number
): "above" | "at" | "below" {
  const ratio = price / marketPrice;
  if (ratio > 1.05) return "above";
  if (ratio < 0.95) return "below";
  return "at";
}

/**
 * Recommend price adjustment
 */
export function recommendAdjustment(
  currentPrice: number,
  targetPrice: number,
  maxChangePercent: number = 30
): number {
  const maxChange = (currentPrice * maxChangePercent) / 100;
  const difference = targetPrice - currentPrice;

  if (Math.abs(difference) <= maxChange) {
    return targetPrice;
  }

  return difference > 0
    ? currentPrice + maxChange
    : currentPrice - maxChange;
}

/**
 * Calculate revenue impact
 */
export function calculateRevenueImpact(
  basePrice: number,
  proposedPrice: number,
  occupancyRate: number,
  days: number
): { baseRevenue: number; projectedRevenue: number; impact: number } {
  const bookedDays = Math.round(days * (occupancyRate / 100));

  const baseRevenue = basePrice * bookedDays;
  const projectedRevenue = proposedPrice * bookedDays;
  const impact = projectedRevenue - baseRevenue;

  return {
    baseRevenue,
    projectedRevenue,
    impact,
  };
}

/**
 * Tier prices by percentage brackets
 */
export function tierPrice(
  price: number,
  tiers: number[]
): { tier: number; index: number } {
  const sorted = [...tiers].sort((a, b) => a - b);

  for (let i = 0; i < sorted.length; i++) {
    if (price <= sorted[i]) {
      return { tier: sorted[i], index: i };
    }
  }

  return { tier: sorted[sorted.length - 1], index: sorted.length - 1 };
}

/**
 * Calculate price elasticity (simplified)
 * How much demand changes with price
 */
export function calculateElasticity(
  priceChange: number,
  demandChange: number
): number {
  if (priceChange === 0) return 0;
  return demandChange / priceChange;
}
