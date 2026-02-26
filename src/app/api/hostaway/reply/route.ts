import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

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

        // Use direct SQL to avoid any Drizzle mapping issues
        await sql`
            INSERT INTO mock_hostaway_replies (conversation_id, text)
            VALUES (${conversationId}, ${text})
        `;

        console.log("✅ [Shadow DB] Reply safely saved to 'mock_hostaway_replies'.");

        return NextResponse.json({ success: true, message: "Shadow reply saved" });
    } catch (error: any) {
        console.error("❌ [Shadow DB] Error saving mock reply:", error);
        return NextResponse.json({ error: error.message || "Failed to save mock reply" }, { status: 500 });
    }
}
