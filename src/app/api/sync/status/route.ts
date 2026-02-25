import { NextRequest, NextResponse } from "next/server";
import { db, listings, reservations, inventoryMaster } from "@/lib/db";
import { eq, max } from "drizzle-orm";

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
      const allListings = await db.select().from(listings);
      const allReservations = await db.select().from(reservations);
      const allCalendar = await db.select().from(inventoryMaster);

      // Get the latest sync timestamp from reservations
      const [latestRes] = await db
        .select({ lastSync: max(reservations.createdAt) })
        .from(reservations);

      const lastSyncedAt = latestRes?.lastSync || null;

      return NextResponse.json({
        listings: {
          count: allListings.length,
          lastSyncedAt: lastSyncedAt,
        },
        reservations: {
          count: allReservations.length,
          lastSyncedAt: lastSyncedAt,
        },
        inventory_master: {
          daysCount: allCalendar.length,
          lastSyncedAt: lastSyncedAt,
        },
      });
    } else {
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
        .where(eq(reservations.listingId, listingId));

      const propertyCalendar = await db
        .select()
        .from(inventoryMaster)
        .where(eq(inventoryMaster.listingId, listingId));

      // Get latest sync (created_at) for this specific property
      const [latestPropertyRes] = await db
        .select({ lastSync: max(reservations.createdAt) })
        .from(reservations)
        .where(eq(reservations.listingId, listingId));

      const lastSyncedAt = latestPropertyRes?.lastSync || null;

      return NextResponse.json({
        listings: {
          count: listing.length,
          lastSyncedAt: lastSyncedAt,
        },
        reservations: {
          count: propertyReservations.length,
          lastSyncedAt: lastSyncedAt,
        },
        inventory_master: {
          daysCount: propertyCalendar.length,
          lastSyncedAt: lastSyncedAt,
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
