import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listings, inventoryMaster, activityTimeline, chatMessages, userSettings } from "@/lib/db/schema";
import { sql, desc, count, eq } from "drizzle-orm";

export async function GET() {
    try {
        // Table counts
        const [listingsCount] = await db.select({ count: count() }).from(listings);
        const [inventoryCount] = await db.select({ count: count() }).from(inventoryMaster);
        const [activityCount] = await db.select({ count: count() }).from(activityTimeline);
        const [eventsCount] = await db.select({ count: count() }).from(activityTimeline).where(eq(activityTimeline.type, "market_event"));
        const [chatMessagesCount] = await db.select({ count: count() }).from(chatMessages);
        const [userSettingsCount] = await db.select({ count: count() }).from(userSettings);

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
        const eventsData = activityData.filter((a) => a.type === "market_event");

        const chatMessagesData = await db
            .select()
            .from(chatMessages)
            .orderBy(desc(chatMessages.createdAt));

        const userSettingsData = await db.select().from(userSettings);

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
                events: eventsCount.count,
                chat_messages: chatMessagesCount.count,
                user_settings: userSettingsCount.count,
            },
            date_ranges: {
                calendar: calendarRange,
                reservations: reservationRange,
            },
            data: {
                listings: listingsData,
                inventory_master: inventoryData,
                activity_timeline: activityData,
                events: eventsData,
                chat_messages: chatMessagesData,
                user_settings: userSettingsData,
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Database query failed" },
            { status: 500 }
        );
    }
}
