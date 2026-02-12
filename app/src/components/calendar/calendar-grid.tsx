"use client";

import { cn } from "@/lib/utils";
import type { CalendarDay } from "@/types/hostaway";
import { useChatStore } from "@/stores/chat-store";
import { usePropertyStore } from "@/stores/property-store";

interface CalendarGridProps {
  days: CalendarDay[];
}

export function CalendarGrid({ days }: CalendarGridProps) {
  const { open } = useChatStore();
  const { activeProperty } = usePropertyStore();

  const handleDateClick = (day: CalendarDay) => {
    if (day.status !== "available") return;
    const propertyName = activeProperty?.name ?? "this property";
    open(
      `What should I price ${propertyName} for ${new Date(day.date + "T00:00:00").toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}?`
    );
  };

  // Group days by week for grid layout
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="space-y-1">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="py-1 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const date = new Date(day.date + "T00:00:00");
          const isAvailable = day.status === "available";
          const isBooked = day.status === "booked";

          return (
            <button
              key={day.date}
              onClick={() => handleDateClick(day)}
              disabled={!isAvailable}
              className={cn(
                "flex flex-col items-center rounded-lg border p-1.5 text-xs transition-colors",
                isAvailable &&
                  "cursor-pointer border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-900 dark:bg-green-950 dark:hover:bg-green-900",
                isBooked &&
                  "cursor-default border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950",
                day.status === "blocked" &&
                  "cursor-default border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
              )}
            >
              <span className="font-medium">{date.getDate()}</span>
              <span className="text-[10px] text-muted-foreground">
                {date.toLocaleDateString("en", { month: "short" })}
              </span>
              {isAvailable && (
                <span className="mt-0.5 font-medium text-green-700 dark:text-green-400">
                  {day.price}
                </span>
              )}
              {isBooked && (
                <span className="mt-0.5 text-red-600 dark:text-red-400">
                  Booked
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
