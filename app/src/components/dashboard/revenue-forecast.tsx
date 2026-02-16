"use client";

import {
  Area,
  AreaChart,
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
import { TrendingUp } from "lucide-react";
import type { Reservation } from "@/types/hostaway";

interface RevenueForecastProps {
  reservations: Reservation[];
}

const chartConfig = {
  revenue: {
    label: "Revenue (AED)",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

function buildWeeklyForecast(reservations: Reservation[]) {
  const now = new Date();
  const weeks: { week: string; revenue: number }[] = [];

  for (let w = 0; w < 12; w++) {
    const weekStart = new Date(now.getTime() + w * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const weekRevenue = reservations
      .filter((r) => {
        const arrival = new Date(r.arrivalDate);
        return (
          arrival >= weekStart &&
          arrival < weekEnd &&
          r.status !== "cancelled"
        );
      })
      .reduce((sum, r) => sum + r.totalPrice, 0);

    weeks.push({
      week: `W${w + 1}`,
      revenue: weekRevenue,
    });
  }

  return weeks;
}

export function RevenueForecast({ reservations }: RevenueForecastProps) {
  const chartData = buildWeeklyForecast(reservations);
  const totalRevenue = chartData.reduce((sum, w) => sum + w.revenue, 0);

  return (
    <Card className="relative overflow-hidden group">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-emerald-100/20 to-teal-100/20 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-full blur-3xl" />

      <CardHeader className="relative">
        <div className="space-y-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-2 shadow-md">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            Revenue Forecast
          </CardTitle>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              {totalRevenue.toLocaleString("en-US")} AED
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              next 12 weeks
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="week"
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
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <Area
              dataKey="revenue"
              type="monotone"
              fill="url(#revenueGradient)"
              stroke="#10b981"
              strokeWidth={3}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
