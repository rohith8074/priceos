"use client";

import { Card } from "@/components/ui/card";
import { Check, Loader2, AlertTriangle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime, isStale, getDataTypeLabel } from "@/lib/sync-utils";

interface DataTypeCardProps {
  icon: LucideIcon;
  label: string;
  count: number;
  lastSynced: Date | null;
  isLoading: boolean;
  error?: string;
}

export function DataTypeCard({
  icon: Icon,
  label,
  count,
  lastSynced,
  isLoading,
  error,
}: DataTypeCardProps) {
  const stale = isStale(lastSynced);

  return (
    <Card
      className={cn(
        "p-3 transition-colors",
        isLoading && "bg-muted/50",
        error && "border-destructive"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        {isLoading && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        )}
        {!isLoading && !error && (
          <Check className="h-3 w-3 text-green-600" />
        )}
        {error && <AlertTriangle className="h-3 w-3 text-destructive" />}
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Syncing...</p>
      ) : error ? (
        <>
          <p className="text-xs text-destructive font-medium">Sync failed</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatRelativeTime(lastSynced)}
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold">
            {count} {getDataTypeLabel(label, count)}
          </p>
          <p
            className={cn(
              "text-xs mt-1",
              stale ? "text-amber-600 font-medium" : "text-muted-foreground"
            )}
          >
            {formatRelativeTime(lastSynced)}
            {stale && " (stale)"}
          </p>
        </>
      )}
    </Card>
  );
}
