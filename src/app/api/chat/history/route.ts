import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatMessages } from "@/lib/db/schema";
import { eq, isNull, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");

    try {
        let history;
        if (propertyId && propertyId !== "null") {
            history = await db.select()
                .from(chatMessages)
                .where(eq(chatMessages.listingId, Number(propertyId)))
                .orderBy(asc(chatMessages.createdAt));
        } else {
            history = await db.select()
                .from(chatMessages)
                .where(isNull(chatMessages.listingId))
                .orderBy(asc(chatMessages.createdAt));
        }

        // Map to the frontend Message format
        const messages = history.map((msg: any) => ({
            id: msg.id.toString(),
            role: msg.role,
            content: msg.content,
            proposals: msg.structured?.proposals || undefined, // need to check exact path
            proposalStatus: msg.structured?.proposals ? "pending" : undefined,
        }));

        return NextResponse.json({ messages, rawHistory: history });
    } catch (err) {
        console.error("Failed to fetch chat history:", err);
        return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 });
    }
}
