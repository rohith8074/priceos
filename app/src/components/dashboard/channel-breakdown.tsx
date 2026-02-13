"use client";

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Reservation } from "@/types/hostaway";

interface ChannelBreakdownProps {
  reservations: Reservation[];
}

const chartConfig = {
  revenue: {
    label: "Revenue (AED)",
    color: "var(--chart-1)",
  },
  bookings: {
    label: "Bookings",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function ChannelBreakdown({ reservations }: ChannelBreakdownProps) {
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

  const chartData = Array.from(channelMap.entries())
    .map(([channel, data]) => ({
      channel,
      revenue: data.revenue,
      bookings: data.bookings,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  if (chartData.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Channel Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="channel"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="revenue"
              fill="var(--color-revenue)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
