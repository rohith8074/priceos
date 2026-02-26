import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mockHostawayReplies } from "@/lib/db/schema";

export async function POST(request: Request) {
    console.log("🚀 [Shadow DB] Intercepting Hostaway Reply Request...");
    try {
        const body = await request.json();
        const conversationId = String(body.conversationId || "");
        const text = String(body.text || "");

        if (!conversationId || !text) {
            console.error("❌ [Shadow DB] Missing conversationId or text");
            return NextResponse.json({ error: "conversationId and text are required" }, { status: 400 });
        }

        console.log(`📥 [Shadow DB] Saving simulated admin reply for conversation: ${conversationId}`);
        console.log(`💬 [Shadow DB] Message: "${text.substring(0, 100)}..."`);

        await db.insert(mockHostawayReplies).values({
            conversationId,
            text,
        });

        console.log("✅ [Shadow DB] Reply safely saved to 'mock_hostaway_replies'. No POST sent to Hostaway.");

        return NextResponse.json({ success: true, message: "Shadow reply saved" });
    } catch (error) {
        console.error("❌ [Shadow DB] Error saving mock reply:", error);
        return NextResponse.json({ error: "Failed to save mock reply" }, { status: 500 });
    }
}
