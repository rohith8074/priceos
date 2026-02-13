export const dynamic = "force-dynamic";

import { createPMSClient } from "@/lib/pms";
import { runFullRevenueCycle } from "@/lib/agents";
import { mapCycleToProposals } from "@/types/proposal";
import { DashboardStats } from "./dashboard-stats";
import { ActionCards } from "@/components/dashboard/action-cards";
import { TodayActivity } from "@/components/dashboard/today-activity";
import { ChannelBreakdown } from "@/components/dashboard/channel-breakdown";
import { RevenueForecast } from "@/components/dashboard/revenue-forecast";
import { format } from "date-fns";

export default async function DashboardPage() {
  const pms = createPMSClient();

  const [allProperties, allReservations, allTasks, allConversations, cycle] =
    await Promise.all([
      pms.listListings(),
      pms.getReservations(),
      pms.getTasks(),
      pms.getConversations(),
      runFullRevenueCycle(),
    ]);

  const allProposals = mapCycleToProposals(cycle);

  // Action card counts
  const pendingProposals = allProposals.filter(
    (p) => p.status === "pending"
  ).length;
  const today = format(new Date(), "yyyy-MM-dd");
  const overdueTasks = allTasks.filter(
    (t) => t.status !== "done" && t.dueDate && t.dueDate < today
  ).length;
  const unreadMessages = allConversations.reduce(
    (sum, c) => sum + c.unreadCount,
    0
  );
  const checkInsToday = allReservations.filter(
    (r) => r.arrivalDate === today && r.status === "confirmed"
  );
  const checkOutsToday = allReservations.filter(
    (r) => r.departureDate === today && r.status === "confirmed"
  );

  // KPI stats
  const avgBasePrice =
    allProperties.length > 0
      ? Math.round(
          allProperties.reduce((sum, p) => sum + p.price, 0) /
            allProperties.length
        )
      : 0;

  const { occupancyRate, bookedDays, averagePrice } = cycle.aggregatedData;
  const monthlyRevenue = Math.round((bookedDays * averagePrice) / 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          AI-powered revenue overview for your Dubai properties
        </p>
      </div>

      {/* Action Cards */}
      <ActionCards
        pendingProposals={pendingProposals}
        overdueTasks={overdueTasks}
        unreadMessages={unreadMessages}
        checkInsToday={checkInsToday.length}
      />

      {/* Today's Activity */}
      <TodayActivity
        checkIns={checkInsToday}
        checkOuts={checkOutsToday}
        properties={allProperties}
      />

      {/* KPI Cards */}
      <DashboardStats
        totalProperties={allProperties.length}
        avgBasePrice={avgBasePrice}
        occupancyRate={occupancyRate}
        monthlyRevenueFormatted={monthlyRevenue.toLocaleString("en-US")}
      />

      {/* Channel Breakdown & Revenue Forecast */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChannelBreakdown reservations={allReservations} />
        <RevenueForecast reservations={allReservations} />
      </div>
    </div>
  );
}
