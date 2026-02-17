import { differenceInMinutes, formatDistanceToNow } from "date-fns";

/**
 * Check if data is stale (>15 minutes old)
 */
export function isStale(lastSyncedAt: Date | null): boolean {
  if (!lastSyncedAt) return true;
  const now = new Date();
  const diffMinutes = differenceInMinutes(now, lastSyncedAt);
  return diffMinutes > 15;
}

/**
 * Format relative time (e.g., "2m ago", "1h ago")
 */
export function formatRelativeTime(date: Date | null): string {
  if (!date) return "Never synced";
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Get appropriate label based on count
 */
export function getDataTypeLabel(
  label: string,
  count: number
): string {
  const labels: Record<string, { singular: string; plural: string }> = {
    Listings: { singular: "property", plural: "properties" },
    Reservations: { singular: "booking", plural: "bookings" },
    Calendar: { singular: "day", plural: "days" },
  };

  const labelConfig = labels[label];
  if (!labelConfig) return label.toLowerCase();

  return count === 1 ? labelConfig.singular : labelConfig.plural;
}

