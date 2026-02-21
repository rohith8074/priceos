import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activityTimeline } from "@/lib/db/schema";
import { desc, eq, isNull, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const context = searchParams.get("context");
        const propertyIdStr = searchParams.get("propertyId");

        let conditions = [];

        // We only want to show market events in this table (fetched by the marketing agent)
        conditions.push(eq(activityTimeline.type, 'market_event'));

        if (context === "portfolio") {
            // Typically market events are null for listingId if they affect the whole city
            // We'll show all global events
            conditions.push(isNull(activityTimeline.listingId));
        } else if (context === "property" && propertyIdStr) {
            // For a single property we show global events AND property-specific events
            // For now, most marketing agent events are global (listingId = null) 
            // but we allow future expansion.
            // We'll just show the market events which apply to this specific property
            conditions.push(isNull(activityTimeline.listingId)); // Fetch Global City-Wide Events
        }

        const events = await db
            .select()
            .from(activityTimeline)
            .where(and(...conditions))
            .orderBy(desc(activityTimeline.startDate))
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
