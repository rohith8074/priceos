import { createPMSClient } from "@/lib/pms";
import { CalendarContent } from "./calendar-content";

export default async function CalendarPage() {
  const pms = createPMSClient();
  const allProperties = await pms.listListings();

  const defaultPropertyId = allProperties[0]?.id ?? 0;

  let days: Awaited<ReturnType<typeof pms.getCalendar>> = [];
  if (defaultPropertyId) {
    const today = new Date();
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    days = await pms.getCalendar(defaultPropertyId, today, endDate);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          90-day pricing calendar. Click available dates to get AI pricing advice.
        </p>
      </div>

      <CalendarContent
        properties={allProperties}
        initialDays={days}
        defaultPropertyId={defaultPropertyId}
      />
    </div>
  );
}
