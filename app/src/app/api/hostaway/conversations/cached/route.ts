import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hostawayConversations, mockHostawayReplies } from "@/lib/db/schema";
import { eq, and, lte, gte } from "drizzle-orm";

/**
 * GET /api/hostaway/conversations/cached
 * 
 * Returns previously synced conversations from our Neon DB.
 * No Hostaway API calls — purely reads from our cache.
 * 
 * Query params: listingId, from, to
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");

    if (!listingId || !dateFrom || !dateTo) {
        return NextResponse.json({ error: "listingId, from, to required" }, { status: 400 });
    }

    try {
        const rows = await db.select().from(hostawayConversations).where(
            and(
                eq(hostawayConversations.listingId, parseInt(listingId)),
                lte(hostawayConversations.dateFrom, dateTo),
                gte(hostawayConversations.dateTo, dateFrom)
            )
        );

        if (rows.length === 0) {
            return NextResponse.json({ success: true, conversations: [] });
        }

        // Deduplicate rows by hostawayConversationId
        const uniqueRowsMap = new Map();
        for (const row of rows) {
            if (!uniqueRowsMap.has(row.hostawayConversationId)) {
                uniqueRowsMap.set(row.hostawayConversationId, row);
            }
        }
        const uniqueRows = Array.from(uniqueRowsMap.values());

        // Merge with shadow replies from our DB
        const uiConversations = await Promise.all(uniqueRows.map(async (conv) => {
            const dbMessages = conv.messages as { sender: string; text: string; timestamp: string }[];

            // Get shadow admin replies for this conversation
            const shadowReplies = await db.select().from(mockHostawayReplies).where(
                eq(mockHostawayReplies.conversationId, conv.hostawayConversationId)
            );

            // Merge all messages and sort by timestamp
            const allMessages = [
                ...dbMessages.map((m, idx) => ({
                    id: `${conv.hostawayConversationId}_${idx}`,
                    sender: m.sender as "guest" | "admin",
                    text: m.text,
                    time: m.timestamp
                        ? new Date(m.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                        : "",
                    _ts: m.timestamp ? new Date(m.timestamp).getTime() : idx,
                })),
                ...shadowReplies.map((r, idx) => ({
                    id: `shadow_${r.id}_${idx}`,
                    sender: "admin" as const,
                    text: r.text,
                    time: r.createdAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
                    _ts: r.createdAt.getTime(),
                })),
            ].sort((a, b) => a._ts - b._ts);

            const lastMsg = allMessages[allMessages.length - 1];

            return {
                id: conv.hostawayConversationId,
                guestName: conv.guestName,
                lastMessage: lastMsg?.text || "No messages",
                status: lastMsg?.sender === "guest" ? "needs_reply" : "resolved",
                messages: allMessages.map(({ _ts, ...rest }) => rest), // Remove _ts helper
            };
        }));

        return NextResponse.json({
            success: true,
            conversations: uiConversations,
            cached: true,
        });
    } catch (error) {
        console.error("❌ [Cached Conversations] Error:", error);
        return NextResponse.json({ error: "Failed to load cached conversations" }, { status: 500 });
    }
}
