import { NextRequest, NextResponse } from "next/server";
import { db, listings, activityTimeline, inventoryMaster } from "@/lib/db";
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
      // Query all data
      const allListings = await db.select().from(listings);
      const allReservations = await db.select().from(activityTimeline).where(eq(activityTimeline.type, "reservation"));
      const allCalendar = await db.select().from(inventoryMaster);

      return NextResponse.json({
        listings: {
          count: allListings.length,
          lastSyncedAt: null, // syncedAt removed from schema
        },
        activity_timeline: {
          count: allReservations.length,
          lastSyncedAt: null,
        },
        inventory_master: {
          daysCount: allCalendar.length,
          lastSyncedAt: null,
        },
      });
    } else {
      // Query property-specific data
      if (!propertyId) {
        return NextResponse.json(
          { error: "Missing propertyId for property context" },
          { status: 400 }
        );
      }

      const listingId = parseInt(propertyId);

      const listing = await db
        .select()
        .from(listings)
        .where(eq(listings.id, listingId));

      const propertyReservations = await db
        .select()
        .from(activityTimeline)
        .where(
          and(
            eq(activityTimeline.listingId, listingId),
            eq(activityTimeline.type, "reservation")
          )
        );

      const propertyCalendar = await db
        .select()
        .from(inventoryMaster)
        .where(eq(inventoryMaster.listingId, listingId));

      return NextResponse.json({
        listings: {
          count: listing.length,
          lastSyncedAt: null, // syncedAt removed from schema
        },
        activity_timeline: {
          count: propertyReservations.length,
          lastSyncedAt: null,
        },
        inventory_master: {
          daysCount: propertyCalendar.length,
          lastSyncedAt: null,
        },
      });
    }
  } catch (error) {
    console.error("Failed to get sync status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
