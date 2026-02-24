import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listings, inventoryMaster, reservations, marketEvents, chatMessages, userSettings, guestSummaries, mockHostawayReplies, hostawayConversations } from "@/lib/db/schema";
import { sql, desc, count } from "drizzle-orm";

export async function GET() {
    try {
        // Table counts
        const [listingsCount] = await db.select({ count: count() }).from(listings);
        const [inventoryCount] = await db.select({ count: count() }).from(inventoryMaster);
        const [reservationsCount] = await db.select({ count: count() }).from(reservations);
        const [marketEventsCount] = await db.select({ count: count() }).from(marketEvents);
        const [chatMessagesCount] = await db.select({ count: count() }).from(chatMessages);
        const [userSettingsCount] = await db.select({ count: count() }).from(userSettings);
        const [guestSummariesCount] = await db.select({ count: count() }).from(guestSummaries);
        const [mockRepliesCount] = await db.select({ count: count() }).from(mockHostawayReplies);
        const [hwConversationsCount] = await db.select({ count: count() }).from(hostawayConversations);

        // All data
        const listingsData = await db.select().from(listings);
        const inventoryData = await db
            .select()
            .from(inventoryMaster)
            .orderBy(desc(inventoryMaster.date));
        const reservationsData = await db
            .select()
            .from(reservations)
            .orderBy(desc(reservations.startDate));
        const marketEventsData = await db
            .select()
            .from(marketEvents)
            .orderBy(desc(marketEvents.startDate));

        const chatMessagesData = await db
            .select()
            .from(chatMessages)
            .orderBy(desc(chatMessages.createdAt));

        const userSettingsData = await db.select().from(userSettings);

        const guestSummariesData = await db.select().from(guestSummaries)
            .orderBy(desc(guestSummaries.createdAt));

        const mockRepliesData = await db.select().from(mockHostawayReplies)
            .orderBy(desc(mockHostawayReplies.createdAt));

        const hwConversationsData = await db.select().from(hostawayConversations)
            .orderBy(desc(hostawayConversations.syncedAt));

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
            .from(reservations);

        return NextResponse.json({
            summary: {
                listings: listingsCount.count,
                inventory_master: inventoryCount.count,
                reservations: reservationsCount.count,
                market_events: marketEventsCount.count,
                chat_messages: chatMessagesCount.count,
                user_settings: userSettingsCount.count,
                guest_summaries: guestSummariesCount.count,
                mock_hostaway_replies: mockRepliesCount.count,
                hostaway_conversations: hwConversationsCount.count,
            },
            date_ranges: {
                calendar: calendarRange,
                reservations: reservationRange,
            },
            data: {
                listings: listingsData,
                inventory_master: inventoryData,
                reservations: reservationsData,
                market_events: marketEventsData,
                chat_messages: chatMessagesData,
                user_settings: userSettingsData,
                guest_summaries: guestSummariesData,
                mock_hostaway_replies: mockRepliesData,
                hostaway_conversations: hwConversationsData,
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Database query failed" },
            { status: 500 }
        );
    }
}
