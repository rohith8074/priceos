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
import type { Reservation } from "@/types/hostaway";

interface RevenueForecastProps {
  reservations: Reservation[];
}

const chartConfig = {
  revenue: {
    label: "Revenue (AED)",
    color: "var(--chart-1)",
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Revenue Forecast{" "}
          <span className="text-sm font-normal text-muted-foreground">
            (AED {totalRevenue.toLocaleString("en-US")} next 12 weeks)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="week"
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
            <Area
              dataKey="revenue"
              type="monotone"
              fill="var(--color-revenue)"
              fillOpacity={0.2}
              stroke="var(--color-revenue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
