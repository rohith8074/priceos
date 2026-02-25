import { db, listings, reservations, inventoryMaster } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const context = searchParams.get("context") || "portfolio";
  const propertyId = searchParams.get("propertyId");

  try {
    // 1. Get Global Status (for the "Sync Hostaway" button)
    const globalSyncStatus = (globalThis as any).syncStatus || { status: 'idle', message: '' };

    // Auto-reset global status to idle after 30 seconds of being complete/error
    if ((globalSyncStatus.status === 'complete' || globalSyncStatus.status === 'error') && globalSyncStatus.startedAt) {
      const elapsed = Date.now() - globalSyncStatus.startedAt;
      if (elapsed > 30000) {
        (globalThis as any).syncStatus = { status: 'idle', message: '' };
      }
    }

    // 2. Prepare database queries for counts and last synced timestamps
    let listingsCount = 0;
    let reservationsCount = 0;
    let calendarCount = 0;
    let listingsLastSynced: Date | null = null;
    let reservationsLastSynced: Date | null = null;
    let calendarLastSynced: Date | null = null;

    if (context === "portfolio") {
      // Total counts for portfolio
      const lResult = await db.select({ count: sql<number>`count(*)` }).from(listings);
      listingsCount = Number(lResult[0]?.count || 0);

      const rResult = await db.select({ count: sql<number>`count(*)` }).from(reservations);
      reservationsCount = Number(rResult[0]?.count || 0);

      const cResult = await db.select({ count: sql<number>`count(*)` }).from(inventoryMaster);
      calendarCount = Number(cResult[0]?.count || 0);

      // We don't have a specific syncedAt column, so we use the most recent createdAt/updatedAt 
      // or just the latest record's creation time as a proxy for the last data change.
      // For reservations, we have createdAt which is set during sync.
      const lastRes = await db.query.reservations.findFirst({
        orderBy: (r, { desc }) => [desc(r.createdAt)]
      });
      reservationsLastSynced = lastRes?.createdAt || null;
      listingsLastSynced = lastRes?.createdAt || null; // Share proxy
      calendarLastSynced = lastRes?.createdAt || null; // Share proxy
    } else if (propertyId) {
      const id = parseInt(propertyId);

      // Filtered counts for specific property
      const lResult = await db.select({ count: sql<number>`count(*)` }).from(listings).where(eq(listings.id, id));
      listingsCount = Number(lResult[0]?.count || 0);

      const rResult = await db.select({ count: sql<number>`count(*)` }).from(reservations).where(eq(reservations.listingId, id));
      reservationsCount = Number(rResult[0]?.count || 0);

      const cResult = await db.select({ count: sql<number>`count(*)` }).from(inventoryMaster).where(eq(inventoryMaster.listingId, id));
      calendarCount = Number(cResult[0]?.count || 0);

      const lastRes = await db.query.reservations.findFirst({
        where: eq(reservations.listingId, id),
        orderBy: (r, { desc }) => [desc(r.createdAt)]
      });
      reservationsLastSynced = lastRes?.createdAt || null;
      listingsLastSynced = lastRes?.createdAt || null;
      calendarLastSynced = lastRes?.createdAt || null;
    }

    // 3. Return combined response
    return NextResponse.json({
      ...globalSyncStatus,
      listings: {
        count: listingsCount,
        lastSyncedAt: listingsLastSynced?.toISOString() || null
      },
      reservations: {
        count: reservationsCount,
        lastSyncedAt: reservationsLastSynced?.toISOString() || null
      },
      inventory_master: {
        daysCount: calendarCount,
        lastSyncedAt: calendarLastSynced?.toISOString() || null
      }
    });

  } catch (error: any) {
    console.error("Status check failed:", error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Failed to fetch status'
    }, { status: 500 });
  }
}
