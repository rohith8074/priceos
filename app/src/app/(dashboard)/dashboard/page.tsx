import { db, listings } from "@/lib/db";
import { sql } from "drizzle-orm";
import { OverviewClient } from "./overview-client";

export default async function OverviewPage() {
  // 1. Fetch all listings
  const allListings = await db.select().from(listings);

  // 2. Fetch aggregation stats for next 30 days
  const statsQuery = sql`
    SELECT
      listing_id,
      COALESCE(
        ROUND(
          100.0 * COUNT(id) FILTER (WHERE status IN ('reserved', 'booked')) / (COUNT(id) - COUNT(id) FILTER (WHERE status = 'blocked') + 0.0001),
          0
        ),
        0
      ) as occupancy,
      COALESCE(
        ROUND(AVG(current_price), 2),
        0
      ) as avg_price,
      COALESCE(
        SUM(current_price) FILTER (WHERE status IN ('reserved', 'booked')),
        0
      ) as total_revenue
    FROM inventory_master
    WHERE date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
    GROUP BY listing_id
  `;

  const statsResult = await db.execute(statsQuery);
  const rows = Array.isArray(statsResult) ? statsResult : statsResult.rows || [];

  let totalPortfolioRevenue = 0;
  let totalOccupancySum = 0;
  let totalAvgPriceSum = 0;
  let activePropertiesCount = 0;

  // 2.5 Fetch total historical revenue (all dates before today)
  const historicalQuery = sql`
    SELECT
      COALESCE(
        SUM(current_price) FILTER (WHERE status IN ('reserved', 'booked')),
        0
      ) as total_historical_revenue
    FROM inventory_master
    WHERE date < CURRENT_DATE
  `;
  const historicalResult = await db.execute(historicalQuery);
  const totalHistoricalRevenue = Array.isArray(historicalResult)
    ? Number(historicalResult[0]?.total_historical_revenue || 0)
    : Number(historicalResult.rows?.[0]?.total_historical_revenue || 0);

  const calendarQuery = sql`
      SELECT listing_id, date, status, current_price
      FROM inventory_master
      WHERE date BETWEEN CURRENT_DATE AND CURRENT_DATE + 29
      ORDER BY listing_id, date
    `;
  const calendarResult = await db.execute(calendarQuery);
  const calRows = Array.isArray(calendarResult) ? calendarResult : calendarResult.rows || [];

  const reservationsQuery = sql`
      SELECT listing_id, title, start_date, end_date, financials
      FROM activity_timeline
      WHERE type = 'reservation' 
        AND start_date <= CURRENT_DATE + 29 
        AND end_date >= CURRENT_DATE
    `;
  const reservationsResult = await db.execute(reservationsQuery);
  const resRows = Array.isArray(reservationsResult) ? reservationsResult : reservationsResult.rows || [];

  // 3. Merge stats into listing objects
  const propertiesWithMetrics = allListings.map((listing) => {
    const stat = rows.find((r: any) => r.listing_id === listing.id);
    const occupancy = stat ? Number(stat.occupancy) : 0;
    const avgPrice = stat && Number(stat.avg_price) > 0 ? Number(stat.avg_price) : Number(listing.price);
    const revenue = stat ? Number(stat.total_revenue) : 0;

    totalPortfolioRevenue += revenue;
    if (occupancy > 0) {
      totalOccupancySum += occupancy;
      totalAvgPriceSum += avgPrice;
      activePropertiesCount++;
    }

    const listingCal = calRows.filter((r: any) => r.listing_id === listing.id).map(r => ({
      date: new Date(r.date).toISOString().split('T')[0],
      status: r.status,
      price: Number(r.current_price)
    }));

    const listingRes = resRows.filter((r: any) => r.listing_id === listing.id).map(r => ({
      title: r.title,
      startDate: new Date(r.start_date).toISOString().split('T')[0],
      endDate: new Date(r.end_date).toISOString().split('T')[0],
      financials: r.financials
    }));

    return {
      ...listing,
      occupancy,
      avgPrice,
      revenue,
      calendarDays: listingCal,
      reservations: listingRes
    };
  });

  const avgPortfolioOccupancy = activePropertiesCount > 0 ? Math.round(totalOccupancySum / activePropertiesCount) : 0;
  const avgPortfolioPrice = activePropertiesCount > 0 ? Math.round(totalAvgPriceSum / activePropertiesCount) : 0;

  return (
    <OverviewClient
      properties={propertiesWithMetrics}
      totalProperties={allListings.length}
      avgPortfolioOccupancy={avgPortfolioOccupancy}
      avgPortfolioPrice={avgPortfolioPrice}
      totalPortfolioRevenue={totalPortfolioRevenue}
      totalHistoricalRevenue={totalHistoricalRevenue}
    />
  );
}
