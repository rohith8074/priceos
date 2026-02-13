import { createPMSClient } from "@/lib/pms";
import { CalendarContent } from "./calendar-content";
import type { CalendarDay } from "@/types/hostaway";

export default async function CalendarPage() {
  const pms = createPMSClient();
  const allProperties = await pms.listListings();

  const defaultPropertyId = allProperties[0]?.id ?? 0;

  const today = new Date();
  const endDate90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  const endDate30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Fetch default property's 90-day calendar for single-property view
  let days: CalendarDay[] = [];
  if (defaultPropertyId) {
    days = await pms.getCalendar(defaultPropertyId, today, endDate90);
  }

  // Fetch 30-day calendars for all properties (for Gantt view)
  const allCalendarsEntries = await Promise.all(
    allProperties.map(async (p) => {
      const cal = await pms.getCalendar(p.id, today, endDate30);
      return [p.id, cal] as [number, CalendarDay[]];
    })
  );
  const allCalendars: Record<number, CalendarDay[]> = Object.fromEntries(allCalendarsEntries);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Manage availability and pricing across all properties.
        </p>
      </div>

      <CalendarContent
        properties={allProperties}
        initialDays={days}
        defaultPropertyId={defaultPropertyId}
        allCalendars={allCalendars}
      />
    </div>
  );
}
