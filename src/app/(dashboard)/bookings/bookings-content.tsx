"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarContent } from "@/app/(dashboard)/calendar/calendar-content";
import { BookingsDataTable } from "@/components/bookings/bookings-data-table";
import { List, CalendarDays, CalendarSearch } from "lucide-react";
import { format } from "date-fns";
import type { Listing, Reservation, CalendarDay } from "@/types/hostaway";

interface BookingsContentProps {
  properties: Listing[];
  reservations: Reservation[];
  initialDays: CalendarDay[];
  defaultPropertyId: number;
  allCalendars: Record<number, CalendarDay[]>;
}

export function BookingsContent({
  properties,
  reservations,
  initialDays,
  defaultPropertyId,
  allCalendars,
}: BookingsContentProps) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant={view === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("list")}
        >
          <List className="mr-2 h-4 w-4" />
          List
        </Button>
        <Button
          variant={view === "calendar" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("calendar")}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          Calendar
        </Button>

        {view === "calendar" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="ml-2">
                <CalendarSearch className="mr-2 h-4 w-4" />
                {selectedDate
                  ? format(selectedDate, "MMM d, yyyy")
                  : "Jump to date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      {view === "list" ? (
        <BookingsDataTable
          reservations={reservations}
          properties={properties}
        />
      ) : (
        <CalendarContent
          properties={properties}
          initialDays={initialDays}
          defaultPropertyId={defaultPropertyId}
          allCalendars={allCalendars}
        />
      )}
    </div>
  );
}
