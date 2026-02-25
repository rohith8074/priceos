/**
 * Cache Utilities
 * Helper functions for agent cache operations
 */

import type { AgentCacheContext } from "./types";

/**
 * Check if a timestamp is within 15 minutes
 */
export function isWithin15Minutes(timestamp: string | null): boolean {
  if (!timestamp) return false;
  const now = Date.now();
  const syncTime = new Date(timestamp).getTime();
  return now - syncTime < 15 * 60 * 1000;
}

/**
 * Check if cache is fresh (all data types <15 mins)
 */
export function isCacheFresh(cache: AgentCacheContext): boolean {
  return !cache.meta.isStale;
}

/**
 * Format relative time for display
 */
export function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) return "never";

  const now = Date.now();
  const syncTime = new Date(timestamp).getTime();
  const diffMs = now - syncTime;
  const diffMins = Math.floor(diffMs / (60 * 1000));

  if (diffMins < 1) return "just now";
  if (diffMins === 1) return "1 minute ago";
  if (diffMins < 60) return `${diffMins} minutes ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

/**
 * Build agent context string with cache metadata
 */
export function buildAgentContext(params: {
  cache: AgentCacheContext;
  message: string;
}): string {
  const { cache, message } = params;

  const freshnessIndicator = (isFresh: boolean) => (isFresh ? "✓" : "⚠ STALE");

  return `
You are analyzing a ${cache.context.type} ${cache.context.propertyName ? `(${cache.context.propertyName})` : ""} with the following data snapshot:

Data Summary:
- Listings: ${cache.data.listings.count} ${cache.data.listings.count === 1 ? "property" : "properties"}
- Reservations: ${cache.data.reservations.count} ${cache.data.reservations.count === 1 ? "booking" : "bookings"}
- Calendar: ${cache.data.calendar.daysCount} days

Data Freshness:
- Listings: Last synced ${formatRelativeTime(cache.data.listings.lastSyncedAt)} ${freshnessIndicator(cache.data.listings.isFresh)}
- Reservations: Last synced ${formatRelativeTime(cache.data.reservations.lastSyncedAt)} ${freshnessIndicator(cache.data.reservations.isFresh)}
- Calendar: Last synced ${formatRelativeTime(cache.data.calendar.lastSyncedAt)} ${freshnessIndicator(cache.data.calendar.isFresh)}

${cache.meta.isStale ? "⚠ WARNING: Some data is stale (>15 minutes old). Consider suggesting the user refresh data via the sidebar." : ""}

User Query: ${message}
`;
}

/**
 * Format cache metadata for logging
 */
export function formatCacheMetadata(cache: AgentCacheContext): string {
  return JSON.stringify(
    {
      context: cache.context.type,
      propertyId: cache.context.propertyId,
      isStale: cache.meta.isStale,
      listings: {
        count: cache.data.listings.count,
        isFresh: cache.data.listings.isFresh,
      },
      reservations: {
        count: cache.data.reservations.count,
        isFresh: cache.data.reservations.isFresh,
      },
      calendar: {
        daysCount: cache.data.calendar.daysCount,
        isFresh: cache.data.calendar.isFresh,
      },
    },
    null,
    2
  );
}
