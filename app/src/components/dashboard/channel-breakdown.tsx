"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Reservation } from "@/types/hostaway";

interface ChannelBreakdownProps {
  reservations: Reservation[];
}

const channelColors: Record<string, { bg: string; bar: string }> = {
  Airbnb: { bg: "bg-rose-100 dark:bg-rose-950", bar: "bg-rose-500" },
  "Booking.com": { bg: "bg-blue-100 dark:bg-blue-950", bar: "bg-blue-500" },
  Direct: { bg: "bg-green-100 dark:bg-green-950", bar: "bg-green-500" },
  Other: { bg: "bg-gray-100 dark:bg-gray-950", bar: "bg-gray-500" },
};

interface ChannelStats {
  channel: string;
  bookings: number;
  revenue: number;
  avgNightlyRate: number;
  totalNights: number;
}

export function ChannelBreakdown({ reservations }: ChannelBreakdownProps) {
  // Compute stats per channel
  const channelMap = new Map<
    string,
    { bookings: number; revenue: number; totalNights: number }
  >();

  reservations.forEach((r) => {
    const existing = channelMap.get(r.channelName) ?? {
      bookings: 0,
      revenue: 0,
      totalNights: 0,
    };
    existing.bookings += 1;
    existing.revenue += r.totalPrice;
    existing.totalNights += r.nights;
    channelMap.set(r.channelName, existing);
  });

  const stats: ChannelStats[] = Array.from(channelMap.entries())
    .map(([channel, data]) => ({
      channel,
      bookings: data.bookings,
      revenue: data.revenue,
      avgNightlyRate:
        data.totalNights > 0
          ? Math.round(data.revenue / data.totalNights)
          : 0,
      totalNights: data.totalNights,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const maxRevenue = Math.max(...stats.map((s) => s.revenue), 1);
  const totalRevenue = stats.reduce((sum, s) => sum + s.revenue, 0);

  if (stats.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Channel Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((s) => {
          const colors = channelColors[s.channel] ?? channelColors.Other;
          const pct =
            totalRevenue > 0
              ? Math.round((s.revenue / totalRevenue) * 100)
              : 0;
          return (
            <div key={s.channel} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{s.channel}</span>
                <span className="text-muted-foreground">
                  {pct}% of revenue
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${colors.bar} transition-all`}
                  style={{ width: `${(s.revenue / maxRevenue) * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  {s.bookings} booking{s.bookings !== 1 ? "s" : ""}
                </span>
                <span>{s.revenue.toLocaleString("en-US")} AED</span>
                <span>
                  Avg {s.avgNightlyRate.toLocaleString("en-US")} AED/night
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
