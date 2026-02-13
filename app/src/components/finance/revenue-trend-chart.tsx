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
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OwnerStatement } from "@/types/operations";

interface RevenueTrendChartProps {
  statements: OwnerStatement[];
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
  expenses: {
    label: "Expenses",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function RevenueTrendChart({ statements }: RevenueTrendChartProps) {
  const chartData = statements
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((s) => ({
      month: s.month,
      revenue: s.totalRevenue,
      expenses: s.totalExpenses,
    }));

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Revenue vs Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
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
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="revenue"
              type="monotone"
              fill="var(--color-revenue)"
              fillOpacity={0.2}
              stroke="var(--color-revenue)"
              strokeWidth={2}
            />
            <Area
              dataKey="expenses"
              type="monotone"
              fill="var(--color-expenses)"
              fillOpacity={0.2}
              stroke="var(--color-expenses)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
