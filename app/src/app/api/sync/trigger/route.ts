import { NextResponse } from "next/server";
import { HostawayClient } from "@/lib/pms/hostaway-client";
import { db } from "@/lib/db";
import { listings, reservations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { syncListingsToDb, syncReservationsToDb, syncCalendarToDb } from "@/lib/sync-server-utils";

async function performBackgroundSync() {
    try {
        const client = new HostawayClient();
        console.log("------------------------------------------");
        console.log("🚀 Starting Hostaway Synchronization (BACKGROUND)...");
        console.log("------------------------------------------");

        // 1. Fetch & Sync Listings
        const hListings = await client.listListings();
        const existingListings = await db.select({ id: listings.id }).from(listings);
        const existingListingIds = new Set(existingListings.map(l => l.id));

        console.log(`📥 Step 1: Fetched ${hListings.length} total listings from Hostaway.`);

        await syncListingsToDb(hListings);

        // Map Hostaway IDs -> Internal Neon Database IDs
        const dbListings = await db.select({ id: listings.id, hostawayId: listings.hostawayId }).from(listings);
        const hostawayToInternalIdMap = new Map(dbListings.map(l => [Number(l.hostawayId), l.id]));

        let newListingCount = 0;
        dbListings.forEach(l => {
            if (!existingListingIds.has(l.id)) newListingCount++;
        });

        console.log(`✅ Step 1 Complete: ${dbListings.length} listings in DB (${newListingCount} new).`);

        // 2. Fetch & Sync Calendars (for the next 90 days)
        console.log("📥 Step 2: Fetching Calendar data (90-day window)...");
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 90);

        let calendarsSynced = 0;
        let calendarErrors = 0;

        for (let i = 0; i < hListings.length; i++) {
            const hl = hListings[i];
            const internalId = hostawayToInternalIdMap.get(hl.id);
            if (internalId) {
                try {
                    console.log(`   [${i + 1}/${hListings.length}] Syncing calendar for ${hl.name} (${hl.id})...`);
                    await syncCalendarToDb(client, [internalId], startDate, endDate, hl.id);
                    calendarsSynced++;
                } catch (calErr: any) {
                    console.error(`   ❌ Failed calendar for ${hl.id}:`, calErr.message);
                    calendarErrors++;
                }
            }
        }

        console.log(`✅ Step 2 Complete: Synced ${calendarsSynced} property calendars (${calendarErrors} failed).`);

        // 3. Fetch & Sync Reservations
        console.log("📥 Step 3: Fetching Reservations (Limit: 1000)...");
        const hReservations = await client.getReservations({ limit: 1000 } as any);
        console.log(`📥 Fetched ${hReservations.length} reservations from Hostaway.`);

        const existingRes = await db.select({ id: reservations.id }).from(reservations);
        const existingResIds = new Set(existingRes.map(r => r.id));

        const mappedReservations = hReservations.map(r => {
            const internalListingId = hostawayToInternalIdMap.get(r.listingMapId);
            return {
                ...r,
                listingMapId: internalListingId || r.listingMapId,
            };
        }).filter(r => hostawayToInternalIdMap.has(r.listingMapId));

        await syncReservationsToDb(mappedReservations as any, new Date());

        const finalDbReservations = await db.select({ id: reservations.id }).from(reservations);
        let newReservationCount = 0;
        finalDbReservations.forEach(r => {
            if (!existingResIds.has(r.id)) newReservationCount++;
        });

        console.log(`✅ Step 3 Complete: ${finalDbReservations.length} reservations in DB (${newReservationCount} new).`);

        // 4. Fetch & Sync Conversations
        console.log("📥 Step 4: Fetching Conversations...");
        const { syncConversationsToDb } = await import("@/lib/sync-server-utils");
        const convStats = await syncConversationsToDb(hostawayToInternalIdMap);
        console.log(`✅ Step 4 Complete: Synced ${convStats.synced} conversations (${convStats.errors} errors).`);

        console.log("------------------------------------------");
        console.log("🎉 Hostaway Sync Finished Successfully.");
        console.log("------------------------------------------");

    } catch (err: any) {
        console.error("❌ Critical Sync Error in Background Job:", err);
    }
}

export async function POST(req: Request) {
    // Fire the heavy syncing function without awaiting it so it processes totally in the background
    performBackgroundSync()
        .then(() => console.log("Background sync promise resolved."))
        .catch((err) => console.error("Unhandled background sync error:", err));

    // Return immediately to the client to unblock UI
    return NextResponse.json({
        success: true,
        status: "queued",
        message: "Hostaway synchronization queued directly in the background! Please keep the server running."
    }, { status: 202 });
}
