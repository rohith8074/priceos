"use client";

import { Building2, DollarSign, BarChart3, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";

interface DashboardStatsProps {
  totalProperties: number;
  avgBasePrice: number;
  occupancyRate: number;
  monthlyRevenue: number;
}

export function DashboardStats({
  totalProperties,
  avgBasePrice,
  occupancyRate,
  monthlyRevenue,
}: DashboardStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Properties"
        value={totalProperties}
        subtitle="Active listings"
        icon={Building2}
      />
      <StatCard
        title="Avg Base Price"
        value={`${avgBasePrice} AED`}
        subtitle="Per night"
        icon={DollarSign}
      />
      <StatCard
        title="Occupancy Rate"
        value={`${occupancyRate}%`}
        subtitle="90-day average"
        icon={BarChart3}
      />
      <StatCard
        title="30-Day Revenue"
        value={`${monthlyRevenue.toLocaleString()} AED`}
        subtitle="Projected"
        icon={TrendingUp}
      />
    </div>
  );
}
