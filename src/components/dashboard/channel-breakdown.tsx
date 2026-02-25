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
import { BarChart3 } from "lucide-react";
import type { Reservation } from "@/types/hostaway";

interface ChannelBreakdownProps {
  reservations: Reservation[];
}

const chartConfig = {
  revenue: {
    label: "Revenue (AED)",
    color: "hsl(var(--chart-1))",
  },
  bookings: {
    label: "Bookings",
    color: "hsl(var(--chart-2))",
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
    <Card className="relative overflow-hidden group">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-100/20 to-cyan-100/20 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-full blur-3xl" />

      <CardHeader className="relative">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <div className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 p-2 shadow-md">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          Channel Performance
        </CardTitle>
      </CardHeader>

      <CardContent className="relative">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="channel"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              className="text-xs font-medium"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              className="text-xs font-medium"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="revenue"
              fill="url(#blueGradient)"
              radius={[8, 8, 0, 0]}
            />
            <defs>
              <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.3}/>
              </linearGradient>
            </defs>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
