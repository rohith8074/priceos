"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Building2, Calendar, CalendarRange, ChevronRight, ChevronLeft } from "lucide-react";
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Fetch sync status
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
          count: data.reservations.count,
          lastSyncedAt: data.reservations.lastSyncedAt
            ? new Date(data.reservations.lastSyncedAt)
            : null,
          isLoading: false,
        },
        calendar: {
          daysCount: data.calendar.daysCount,
          lastSyncedAt: data.calendar.lastSyncedAt
            ? new Date(data.calendar.lastSyncedAt)
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

  // Handle manual sync
  const handleSyncAll = async () => {
    setIsSyncing(true);

    // Set loading state for all data types
    setSyncStatus((prev) => ({
      listings: { ...prev.listings, isLoading: true, error: undefined },
      reservations: { ...prev.reservations, isLoading: true, error: undefined },
      calendar: { ...prev.calendar, isLoading: true, error: undefined },
    }));

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: contextType,
          propertyId: contextType === "property" ? propertyId : undefined,
        }),
      });

      if (!response.ok) throw new Error("Sync failed");

      const data = await response.json();

      if (data.success) {
        const timestamp = new Date(data.timestamp);

        setSyncStatus({
          listings: {
            count: data.synced.listings,
            lastSyncedAt: timestamp,
            isLoading: false,
          },
          reservations: {
            count: data.synced.reservations,
            lastSyncedAt: timestamp,
            isLoading: false,
          },
          calendar: {
            daysCount: data.synced.calendar,
            lastSyncedAt: timestamp,
            isLoading: false,
          },
        });

        console.log(
          `Sync complete: ${data.synced.listings} properties, ${data.synced.reservations} reservations, ${data.synced.calendar} calendar days`
        );
      } else {
        throw new Error(data.error || "Sync failed");
      }
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

      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <aside
      className={cn(
        "shrink-0 border-l bg-background flex flex-col transition-all duration-300 ease-in-out relative",
        isCollapsed ? "w-12" : "w-[300px]"
      )}
    >
      {/* Collapse Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-3 top-4 z-10 h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-accent"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {!isCollapsed && (
        <>
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
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <DataTypeCard
              icon={Building2}
              label="Listings"
              count={syncStatus.listings.count}
              lastSynced={syncStatus.listings.lastSyncedAt}
              isLoading={syncStatus.listings.isLoading}
              error={syncStatus.listings.error}
            />

            <DataTypeCard
              icon={Calendar}
              label="Reservations"
              count={syncStatus.reservations.count}
              lastSynced={syncStatus.reservations.lastSyncedAt}
              isLoading={syncStatus.reservations.isLoading}
              error={syncStatus.reservations.error}
            />

            <DataTypeCard
              icon={CalendarRange}
              label="Calendar"
              count={syncStatus.calendar.daysCount}
              lastSynced={syncStatus.calendar.lastSyncedAt}
              isLoading={syncStatus.calendar.isLoading}
              error={syncStatus.calendar.error}
            />
          </div>
        </>
      )}

      {/* Collapsed State - Show Icons Only */}
      {isCollapsed && (
        <div className="flex flex-col items-center gap-4 p-2 pt-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSyncAll}
            disabled={isSyncing}
            title="Sync Now"
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
          </Button>
          <div className="h-px w-full bg-border" />
          <Building2 className="h-4 w-4 text-muted-foreground" title="Listings" />
          <Calendar className="h-4 w-4 text-muted-foreground" title="Reservations" />
          <CalendarRange className="h-4 w-4 text-muted-foreground" title="Calendar" />
        </div>
      )}
    </aside>
  );
}
