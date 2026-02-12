import { createPMSClient } from "@/lib/pms";
import { runFullRevenueCycle } from "@/lib/agents";
import { PropertyList } from "@/components/properties/property-list";
import { DashboardStats } from "./dashboard-stats";

export default async function DashboardPage() {
  const pms = createPMSClient();

  const [allProperties, cycle] = await Promise.all([
    pms.listListings(),
    runFullRevenueCycle(),
  ]);

  const avgBasePrice =
    allProperties.length > 0
      ? Math.round(
          allProperties.reduce((sum, p) => sum + p.basePrice, 0) /
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

      {/* KPI Cards */}
      <DashboardStats
        totalProperties={allProperties.length}
        avgBasePrice={avgBasePrice}
        occupancyRate={occupancyRate}
        monthlyRevenue={monthlyRevenue}
      />

      {/* Properties Grid */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Properties</h2>
        <PropertyList properties={allProperties} />
      </div>
    </div>
  );
}
