"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Building2, Calendar, CalendarRange } from "lucide-react";
import { DataTypeCard } from "./data-type-card";
import { useContextStore } from "@/stores/context-store";
import { cn } from "@/lib/utils";

interface SyncStatus {
  listings: {
    count: number;
    lastSyncedAt: Date | null;
    isLoading: boolean;
    error?: string;
  };
  reservations: {
    count: number;
    lastSyncedAt: Date | null;
    isLoading: boolean;
    error?: string;
  };
  calendar: {
    daysCount: number;
    lastSyncedAt: Date | null;
    isLoading: boolean;
    error?: string;
  };
}

export function SyncStatusSidebar() {
  const { contextType, propertyId, propertyName } = useContextStore();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    listings: { count: 0, lastSyncedAt: null, isLoading: false },
    reservations: { count: 0, lastSyncedAt: null, isLoading: false },
    calendar: { daysCount: 0, lastSyncedAt: null, isLoading: false },
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch sync status from DB
  const fetchSyncStatus = async () => {
    try {
      const params = new URLSearchParams({
        context: contextType,
        ...(contextType === "property" && propertyId
          ? { propertyId: propertyId.toString() }
          : {}),
      });

      const response = await fetch(`/api/sync/status?${params}`);
      if (!response.ok) throw new Error("Failed to fetch sync status");

      const data = await response.json();

      setSyncStatus({
        listings: {
          count: data.listings.count,
          lastSyncedAt: data.listings.lastSyncedAt
            ? new Date(data.listings.lastSyncedAt)
            : null,
          isLoading: false,
        },
        reservations: {
          count: data.activity_timeline.count,
          lastSyncedAt: data.activity_timeline.lastSyncedAt
            ? new Date(data.activity_timeline.lastSyncedAt)
            : null,
          isLoading: false,
        },
        calendar: {
          daysCount: data.inventory_master.daysCount,
          lastSyncedAt: data.inventory_master.lastSyncedAt
            ? new Date(data.inventory_master.lastSyncedAt)
            : null,
          isLoading: false,
        },
      });
    } catch (error) {
      console.error("Failed to fetch sync status:", error);
    }
  };

  // Fetch on mount and when context changes
  useEffect(() => {
    fetchSyncStatus();
  }, [contextType, propertyId]);

  // Handle manual sync — re-fetch data counts from DB
  const handleSyncAll = async () => {
    setIsSyncing(true);

    // Set loading state for all data types
    setSyncStatus((prev) => ({
      listings: { ...prev.listings, isLoading: true, error: undefined },
      reservations: { ...prev.reservations, isLoading: true, error: undefined },
      calendar: { ...prev.calendar, isLoading: true, error: undefined },
    }));

    try {
      // Re-fetch current counts from the database
      const params = new URLSearchParams({
        context: contextType,
        ...(contextType === "property" && propertyId
          ? { propertyId: propertyId.toString() }
          : {}),
      });

      const response = await fetch(`/api/sync/status?${params}`);
      if (!response.ok) throw new Error("Sync failed");

      const data = await response.json();
      const timestamp = new Date();

      setSyncStatus({
        listings: {
          count: data.listings.count,
          lastSyncedAt: timestamp,
          isLoading: false,
        },
        reservations: {
          count: data.activity_timeline.count,
          lastSyncedAt: timestamp,
          isLoading: false,
        },
        calendar: {
          daysCount: data.inventory_master.daysCount,
          lastSyncedAt: timestamp,
          isLoading: false,
        },
      });

      console.log(
        `Sync complete: ${data.listings.count} listing(s), ${data.activity_timeline.count} reservation(s), ${data.inventory_master.daysCount} calendar day(s)`
      );
    } catch (error) {
      console.error("Sync failed:", error);

      // Set error state for all data types
      setSyncStatus((prev) => ({
        listings: { ...prev.listings, isLoading: false, error: "Sync failed" },
        reservations: {
          ...prev.reservations,
          isLoading: false,
          error: "Sync failed",
        },
        calendar: { ...prev.calendar, isLoading: false, error: "Sync failed" },
      }));
    } finally {
      setIsSyncing(false);
    }
  };

  // Context-aware subtitle label
  const listingsSubLabel =
    contextType === "property"
      ? syncStatus.listings.count === 1
        ? "property"
        : "properties"
      : "properties";
  const reservationsSubLabel =
    syncStatus.reservations.count === 1 ? "booking" : "bookings";
  const calendarSubLabel =
    syncStatus.calendar.daysCount === 1 ? "day" : "days";

  return (
    <aside className="shrink-0 bg-background flex flex-col relative w-full pb-4">
      {/* Header */}
      <div className="border-b p-4">
        <h3 className="font-semibold mb-2">Hostaway Data</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Agent context for{" "}
          {contextType === "portfolio" ? "portfolio" : propertyName}
        </p>
        <Button
          onClick={handleSyncAll}
          disabled={isSyncing}
          className="w-full"
          variant="outline"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", isSyncing && "animate-spin")} />
          Sync Now
        </Button>
      </div>

      {/* Data Types */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <DataTypeCard
          icon={Building2}
          label="Listings"
          count={syncStatus.listings.count}
          countLabel={listingsSubLabel}
          lastSynced={syncStatus.listings.lastSyncedAt}
          isLoading={syncStatus.listings.isLoading}
          error={syncStatus.listings.error}
        />

        <DataTypeCard
          icon={Calendar}
          label="Reservations"
          count={syncStatus.reservations.count}
          countLabel={reservationsSubLabel}
          lastSynced={syncStatus.reservations.lastSyncedAt}
          isLoading={syncStatus.reservations.isLoading}
          error={syncStatus.reservations.error}
        />

        <DataTypeCard
          icon={CalendarRange}
          label="Calendar"
          count={syncStatus.calendar.daysCount}
          countLabel={calendarSubLabel}
          lastSynced={syncStatus.calendar.lastSyncedAt}
          isLoading={syncStatus.calendar.isLoading}
          error={syncStatus.calendar.error}
        />
      </div>
    </aside>
  );
}
