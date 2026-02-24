import { db, listings } from "@/lib/db";
import { sql } from "drizzle-orm";
import { ContextPanel } from "@/components/layout/context-panel";
import { UnifiedChatInterface } from "@/components/chat/unified-chat-interface";
import { MarketEventsTable } from "@/components/events/market-events-table";
import { RightSidebarLayout } from "@/components/layout/right-sidebar-layout";

export default async function DashboardPage() {
  // 1. Fetch all listings (Drizzle returns camelCase objects)
  const allListings = await db.select().from(listings);

  // 2. Fetch aggregation stats for next 30 days using raw SQL
  const statsQuery = sql`
    SELECT
      listing_id,
      COALESCE(
        ROUND(
          100.0 * COUNT(id) FILTER (WHERE status IN ('reserved', 'booked')) / NULLIF(COUNT(id), 0),
          0
        ),
        0
      ) as occupancy,
      COALESCE(
        ROUND(AVG(current_price), 2),
        0
      ) as avg_price
    FROM inventory_master
    WHERE date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
    GROUP BY listing_id
  `;

  const statsResult = await db.execute(statsQuery);

  // 3. Merge stats into listing objects
  const propertiesWithMetrics = allListings.map((listing) => {
    // Determine the type of rows returned by db.execute
    // Drizzle with neon-http usually returns an array of row objects
    const rows = Array.isArray(statsResult) ? statsResult : statsResult.rows || [];
    const stat = rows.find((r: any) => r.listing_id === listing.id);

    return {
      ...listing,
      occupancy: stat ? Number(stat.occupancy) : 0,
      avgPrice: stat && Number(stat.avg_price) > 0 ? Number(stat.avg_price) : Number(listing.price),
    };
  });

  return (
    <div className="flex h-full overflow-hidden">
      <ContextPanel properties={propertiesWithMetrics} />

      {/* Center Chat Panel */}
      <div className="flex-[2] min-w-[500px] border-r flex flex-col h-full bg-background relative z-10 transition-all duration-300">
        <UnifiedChatInterface properties={propertiesWithMetrics} />
      </div>

      {/* Right Side Stack: Events Table on top, Sync status below */}
      <RightSidebarLayout>
        <div className="flex flex-col h-full bg-background overflow-hidden relative">
          <MarketEventsTable />
        </div>
      </RightSidebarLayout>
    </div>
  );
}
