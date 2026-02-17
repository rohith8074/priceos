"use client";

import { Building2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListingRow } from "@/lib/db";

interface Props {
  property: ListingRow;
  isActive: boolean;
  onClick: () => void;
  occupancy?: number;
}

export function CompactPropertyCard({
  property,
  isActive,
  onClick,
  occupancy = 0,
}: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border p-3 transition-all",
        "hover:bg-accent/50 active:scale-[0.98]",
        isActive
          ? "bg-primary/10 border-primary shadow-sm"
          : "bg-card border-border hover:border-primary/50"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <div
            className={cn(
              "rounded-md p-1.5 shrink-0",
              isActive ? "bg-primary/20" : "bg-muted"
            )}
          >
            <Building2
              className={cn(
                "h-3.5 w-3.5",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-sm font-medium truncate",
                isActive ? "text-primary" : "text-foreground"
              )}
            >
              {property.name}
            </p>
            {property.area && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{property.area}</span>
              </div>
            )}
          </div>
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Occupancy
          </p>
          <p
            className={cn(
              "text-xs font-semibold",
              occupancy >= 70
                ? "text-green-600"
                : occupancy >= 50
                  ? "text-yellow-600"
                  : "text-red-600"
            )}
          >
            {occupancy}%
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Price
          </p>
          <p className="text-xs font-semibold">
            {property.currencyCode}{" "}
            {parseFloat(property.price as string).toLocaleString("en-US")}
          </p>
        </div>
      </div>
    </button>
  );
}
