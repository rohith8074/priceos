import { db, listings } from "@/lib/db";
import { sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, TrendingUp, DollarSign, CalendarCheck } from "lucide-react";

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

        return {
            ...listing,
            occupancy,
            avgPrice,
            revenue
        };
    });

    const avgPortfolioOccupancy = activePropertiesCount > 0 ? Math.round(totalOccupancySum / activePropertiesCount) : 0;
    const avgPortfolioPrice = activePropertiesCount > 0 ? Math.round(totalAvgPriceSum / activePropertiesCount) : 0;

    return (
        <div className="flex flex-col h-full overflow-y-auto w-full p-8 bg-muted/20">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Portfolio Overview</h1>
                <p className="text-muted-foreground mt-2">
                    Your 30-day forward-looking property performance metrics.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{allListings.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Active in portfolio</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Avg Portfolio Occupancy</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgPortfolioOccupancy}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Next 30 days average</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Avg Daily Rate (ADR)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgPortfolioPrice} AED</div>
                        <p className="text-xs text-muted-foreground mt-1">Across booked properties</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Est. 30-Day Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPortfolioRevenue.toLocaleString()} AED</div>
                        <p className="text-xs text-muted-foreground mt-1">Confirmed booking revenue</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="flex-1 min-h-0 flex flex-col shadow-sm">
                <CardHeader className="border-b bg-muted/5 py-4">
                    <CardTitle>Property Performance Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                    <ScrollArea className="h-full rounded-b-xl border-t-0 p-4">
                        <Table>
                            <TableHeader className="bg-muted/10">
                                <TableRow>
                                    <TableHead>Property</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Target Baseline</TableHead>
                                    <TableHead>Next 30D Occupancy</TableHead>
                                    <TableHead>Next 30D Avg Rate</TableHead>
                                    <TableHead className="text-right">Projected Revenue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {propertiesWithMetrics.sort((a, b) => b.revenue - a.revenue).map((property) => (
                                    <TableRow key={property.id}>
                                        <TableCell className="font-medium">{property.name}</TableCell>
                                        <TableCell>{property.area}</TableCell>
                                        <TableCell className="text-muted-foreground">{property.price} AED</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${property.occupancy >= 70 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' :
                                                    property.occupancy >= 40 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                                                        'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                                                }`}>
                                                {property.occupancy}%
                                            </span>
                                        </TableCell>
                                        <TableCell>{property.avgPrice.toFixed(0)} AED</TableCell>
                                        <TableCell className="text-right font-bold">{property.revenue.toLocaleString()} AED</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
