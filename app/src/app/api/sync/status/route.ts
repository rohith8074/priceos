import { NextRequest, NextResponse } from "next/server";
import { db, listings, reservations, calendarDays } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getMaxSyncedAt } from "@/lib/sync-server-utils";

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
      const allReservations = await db.select().from(reservations);
      const allCalendar = await db.select().from(calendarDays);

      return NextResponse.json({
        listings: {
          count: allListings.length,
          lastSyncedAt: getMaxSyncedAt(allListings)?.toISOString() || null,
        },
        reservations: {
          count: allReservations.length,
          lastSyncedAt:
            getMaxSyncedAt(allReservations)?.toISOString() || null,
        },
        calendar: {
          daysCount: allCalendar.length,
          lastSyncedAt: getMaxSyncedAt(allCalendar)?.toISOString() || null,
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
        .from(reservations)
        .where(eq(reservations.listingMapId, listingId));

      const propertyCalendar = await db
        .select()
        .from(calendarDays)
        .where(eq(calendarDays.listingId, listingId));

      return NextResponse.json({
        listings: {
          count: listing.length,
          lastSyncedAt: listing[0]?.syncedAt?.toISOString() || null,
        },
        reservations: {
          count: propertyReservations.length,
          lastSyncedAt:
            getMaxSyncedAt(propertyReservations)?.toISOString() || null,
        },
        calendar: {
          daysCount: propertyCalendar.length,
          lastSyncedAt:
            getMaxSyncedAt(propertyCalendar)?.toISOString() || null,
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
