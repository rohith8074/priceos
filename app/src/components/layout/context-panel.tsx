"use client";

import { LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompactPropertyCard } from "./compact-property-card";
import { useContextStore } from "@/stores/context-store";
import { useChatStore } from "@/stores/chat-store";
import type { ListingRow } from "@/lib/db";

interface Props {
  properties: ListingRow[];
}

// Mock occupancy data - in real app, fetch from API
function getOccupancy(propertyId: number): number {
  const occupancies: Record<number, number> = {
    1: 68,
    2: 72,
    3: 55,
    4: 85,
    5: 63,
  };
  return occupancies[propertyId] || 0;
}

export function ContextPanel({ properties }: Props) {
  const {
    contextType,
    propertyId,
    setPortfolioContext,
    setPropertyContext,
  } = useContextStore();
  const { switchContext } = useChatStore();

  const handlePortfolioClick = () => {
    setPortfolioContext();
    switchContext({ type: "portfolio" });
  };

  const handlePropertyClick = (property: ListingRow) => {
    setPropertyContext(property.id, property.name);
    switchContext({ type: "property", propertyId: property.id });
  };

  return (
    <aside className="flex h-full w-[280px] flex-col border-r bg-background shrink-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Portfolio View Button */}
          <Button
            variant={contextType === "portfolio" ? "default" : "outline"}
            className="w-full justify-start gap-2"
            onClick={handlePortfolioClick}
          >
            <LayoutGrid className="h-4 w-4" />
            Portfolio Chat
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Properties
              </span>
            </div>
          </div>

          {/* Properties List */}
          <div className="space-y-2">
            {properties.map((property) => (
              <CompactPropertyCard
                key={property.id}
                property={property}
                isActive={
                  contextType === "property" && propertyId === property.id
                }
                onClick={() => handlePropertyClick(property)}
                occupancy={getOccupancy(property.id)}
              />
            ))}
          </div>
        </div>
      </aside>
  );
}
