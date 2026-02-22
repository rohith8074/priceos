import { NextRequest, NextResponse } from "next/server";
import { db, activityTimeline } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const context = searchParams.get("context") as "portfolio" | "property";
    const propertyId = searchParams.get("propertyId");

    if (!context) {
      return NextResponse.json(
        { error: "Missing context parameter" },
        { status: 400 }
      );
    }

    if (context === "portfolio") {
      const allReservations = await db.select().from(activityTimeline).where(eq(activityTimeline.type, "reservation"));
      return NextResponse.json({ reservations: allReservations });
    } else {
      if (!propertyId) {
        return NextResponse.json(
          { error: "Missing propertyId for property context" },
          { status: 400 }
        );
      }

      const listingId = parseInt(propertyId);
      const propertyReservations = await db
        .select()
        .from(activityTimeline)
        .where(
          and(
            eq(activityTimeline.listingId, listingId),
            eq(activityTimeline.type, "reservation")
          )
        );

      return NextResponse.json({ reservations: propertyReservations });
    }
  } catch (error) {
    console.error("Failed to fetch reservations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
