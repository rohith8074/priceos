import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listings, inventoryMaster, activityTimeline } from "@/lib/db/schema";
import { sql, desc, count } from "drizzle-orm";

export async function GET() {
    try {
        // Table counts
        const [listingsCount] = await db.select({ count: count() }).from(listings);
        const [inventoryCount] = await db.select({ count: count() }).from(inventoryMaster);
        const [activityCount] = await db.select({ count: count() }).from(activityTimeline);

        // All data
        const listingsData = await db.select().from(listings);
        const inventoryData = await db
            .select()
            .from(inventoryMaster)
            .orderBy(desc(inventoryMaster.date));
        const activityData = await db
            .select()
            .from(activityTimeline)
            .orderBy(desc(activityTimeline.startDate));

        // Date ranges
        const [calendarRange] = await db
            .select({
                min: sql<string>`MIN(date)`,
                max: sql<string>`MAX(date)`,
            })
            .from(inventoryMaster);

        const [reservationRange] = await db
            .select({
                min: sql<string>`MIN(start_date)`,
                max: sql<string>`MAX(start_date)`,
            })
            .from(activityTimeline);

        return NextResponse.json({
            summary: {
                listings: listingsCount.count,
                inventory_master: inventoryCount.count,
                activity_timeline: activityCount.count,
            },
            date_ranges: {
                calendar: calendarRange,
                reservations: reservationRange,
            },
            data: {
                listings: listingsData,
                inventory_master: inventoryData,
                activity_timeline: activityData,
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Database query failed" },
            { status: 500 }
        );
    }
}
