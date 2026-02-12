"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { usePropertyStore } from "@/stores/property-store";
import type { Listing, CalendarDay } from "@/types/hostaway";

interface CalendarContentProps {
  properties: Listing[];
  initialDays: CalendarDay[];
  defaultPropertyId: number;
}

export function CalendarContent({
  properties,
  initialDays,
  defaultPropertyId,
}: CalendarContentProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    String(defaultPropertyId)
  );
  const [days, setDays] = useState(initialDays);
  const [loading, setLoading] = useState(false);
  const { setActiveProperty } = usePropertyStore();

  useEffect(() => {
    const property = properties.find((p) => p.id === Number(selectedPropertyId));
    if (property) setActiveProperty(property);
  }, [selectedPropertyId, properties, setActiveProperty]);

  const handlePropertyChange = async (value: string) => {
    setSelectedPropertyId(value);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/calendar?propertyId=${value}`
      );
      if (res.ok) {
        const data = await res.json();
        setDays(data);
      }
    } catch {
      // Keep current days on error
    } finally {
      setLoading(false);
    }
  };

  const available = days.filter((d) => d.status === "available").length;
  const booked = days.filter((d) => d.status === "booked").length;
  const blocked = days.filter((d) => d.status === "blocked").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select
          value={selectedPropertyId}
          onValueChange={handlePropertyChange}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select property" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-green-200 dark:bg-green-900" />
            Available ({available})
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-red-200 dark:bg-red-900" />
            Booked ({booked})
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-gray-200 dark:bg-gray-800" />
            Blocked ({blocked})
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Loading calendar...
        </div>
      ) : (
        <CalendarGrid days={days} />
      )}
    </div>
  );
}
