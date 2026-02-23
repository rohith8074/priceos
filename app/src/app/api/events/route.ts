import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketEvents } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const events = await db
            .select()
            .from(marketEvents)
            .orderBy(desc(marketEvents.startDate))
            .limit(50);

        return NextResponse.json({
            success: true,
            events
        });
    } catch (error) {
        console.error("API /api/events GET Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch market events." },
            { status: 500 }
        );
    }
}
