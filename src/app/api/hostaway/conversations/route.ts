import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hostawayConversations, listings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/hostaway/conversations
 * 
 * Fetches conversations from Hostaway API (GET only, never POST!)
 * 
 * IMPORTANT: Hostaway's GET /v1/conversations does NOT support
 * listingMapId or date filtering. We must:
 * 1. Fetch ALL conversations with includeResources=1
 * 2. Filter client-side by Reservation.listingMapId matching our property
 * 3. Filter client-side by reservation dates within our date range
 * 4. Extract guestName from conv.recipientName or conv.Reservation.guestName
 * 
 * Query params: listingId, from, to
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");

    console.log(`🚀 [Hostaway Sync] GET /api/hostaway/conversations`);
    console.log(`   ├─ listingId: ${listingId}`);
    console.log(`   ├─ dateFrom: ${dateFrom}`);
    console.log(`   └─ dateTo: ${dateTo}`);

    if (!listingId || !dateFrom || !dateTo) {
        return NextResponse.json(
            { error: "listingId, from, and to query params are required" },
            { status: 400 }
        );
    }

    try {
        const token = process.env.Hostaway_Authorization_token;
        if (!token) {
            throw new Error("Hostaway_Authorization_token is not set in .env");
        }

        const numericListingId = parseInt(listingId);

        // Get the hostaway ID for this listing
        const [listing] = await db
            .select({ id: listings.id, hostawayId: listings.hostawayId })
            .from(listings)
            .where(eq(listings.id, numericListingId))
            .limit(1);

        if (!listing) {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }

        const hostawayListingId = listing.hostawayId;
        console.log(`📥 [Hostaway Sync] Fetching ALL conversations with includeResources=1...`);
        console.log(`   └─ Will filter for hostawayId: ${hostawayListingId}`);

        // Step 1: GET all conversations with includeResources=1
        // Hostaway does NOT support listingMapId or date filters on conversations
        const convRes = await fetch(
            `https://api.hostaway.com/v1/conversations?limit=100&offset=0&includeResources=1`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                cache: "no-store",
            }
        );

        if (!convRes.ok) {
            throw new Error(`Hostaway API returned ${convRes.status}: ${convRes.statusText}`);
        }

        const convJson = await convRes.json();
        const rawConversations = convJson.result || [];

        console.log(`📋 [Hostaway Sync] Total conversations from Hostaway: ${rawConversations.length}`);

        // Step 2: Filter by listing ID (using Reservation.listingMapId)
        const filteredByListing = hostawayListingId
            ? rawConversations.filter((conv: any) => {
                const reservationListingId = conv.Reservation?.listingMapId?.toString();
                const convListingMapId = conv.listingMapId?.toString();
                return reservationListingId === hostawayListingId || convListingMapId === hostawayListingId;
            })
            : rawConversations; // If no hostawayId, show all

        console.log(`🔍 [Hostaway Sync] After listing filter: ${filteredByListing.length} conversations`);

        // Step 3: Filter by date range (using reservation arrival/departure dates)
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);

        const filteredByDate = filteredByListing.filter((conv: any) => {
            const arrivalDate = conv.Reservation?.arrivalDate;
            const departureDate = conv.Reservation?.departureDate;

            // If no reservation dates, include it (it might be a pre-booking inquiry)
            if (!arrivalDate && !departureDate) return true;

            const arrival = arrivalDate ? new Date(arrivalDate) : fromDate;
            const departure = departureDate ? new Date(departureDate) : toDate;

            // Include if reservation overlaps with our date range
            return arrival <= toDate && departure >= fromDate;
        });

        console.log(`📅 [Hostaway Sync] After date filter: ${filteredByDate.length} conversations`);

        // Step 4: For each conversation, GET messages (all GET, no POST!)
        const fullConversations = [];

        for (const conv of filteredByDate) {
            const convId = conv.id.toString();

            // Extract guest name from the correct Hostaway fields
            const guestName = conv.recipientName
                || conv.Reservation?.guestName
                || conv.Reservation?.guestFirstName
                || "Guest";

            try {
                console.log(`   📨 GET messages for conv ${convId} (${guestName})...`);
                const msgRes = await fetch(
                    `https://api.hostaway.com/v1/conversations/${convId}/messages?limit=50`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        cache: "no-store",
                    }
                );

                let messages: { sender: string; text: string; timestamp: string }[] = [];

                if (msgRes.ok) {
                    const msgJson = await msgRes.json();
                    const rawMsgs = msgJson.result || [];
                    messages = rawMsgs
                        .filter((m: any) => m.body && m.body.trim()) // Skip empty messages
                        .map((m: any) => ({
                            sender: m.isIncoming ? "guest" : "admin",
                            text: m.body || "",
                            timestamp: m.insertedOn || m.updatedOn || "",
                        }));
                }

                fullConversations.push({
                    hostawayConversationId: convId,
                    guestName,
                    guestEmail: conv.guestEmail || conv.recipientEmail || null,
                    reservationId: conv.reservationId?.toString() || null,
                    messages,
                });
            } catch (msgErr) {
                console.warn(`   ⚠️  Failed to fetch messages for conv ${convId}, skipping...`);
                fullConversations.push({
                    hostawayConversationId: convId,
                    guestName,
                    guestEmail: conv.guestEmail || conv.recipientEmail || null,
                    reservationId: conv.reservationId?.toString() || null,
                    messages: [],
                });
            }
        }

        // Step 5: Clear old cached conversations for this listing+daterange, then save new
        console.log(`💾 [Hostaway Sync] Saving ${fullConversations.length} conversations to Neon DB...`);

        await db.delete(hostawayConversations).where(
            and(
                eq(hostawayConversations.listingId, numericListingId),
                eq(hostawayConversations.dateFrom, dateFrom),
                eq(hostawayConversations.dateTo, dateTo)
            )
        );

        for (const conv of fullConversations) {
            await db.insert(hostawayConversations).values({
                listingId: numericListingId,
                hostawayConversationId: conv.hostawayConversationId,
                guestName: conv.guestName,
                guestEmail: conv.guestEmail,
                reservationId: conv.reservationId,
                messages: conv.messages,
                dateFrom,
                dateTo,
            });
        }

        console.log(`✅ [Hostaway Sync] Synced ${fullConversations.length} conversations (GET only, zero POST to Hostaway)`);

        // Step 6: Format for the UI
        const uiConversations = fullConversations.map(conv => ({
            id: conv.hostawayConversationId,
            guestName: conv.guestName,
            lastMessage: conv.messages.length > 0
                ? conv.messages[conv.messages.length - 1].text.substring(0, 80) + (conv.messages[conv.messages.length - 1].text.length > 80 ? "..." : "")
                : "No messages",
            status: conv.messages.length > 0 && conv.messages[conv.messages.length - 1].sender === "guest"
                ? "needs_reply"
                : "resolved",
            messages: conv.messages.map((m, idx) => ({
                id: `${conv.hostawayConversationId}_${idx}`,
                sender: m.sender as "guest" | "admin",
                text: m.text,
                time: m.timestamp
                    ? new Date(m.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                    : "",
            })),
        }));

        return NextResponse.json({
            success: true,
            message: `Synced ${uiConversations.length} conversations for this property`,
            conversations: uiConversations,
            cached: false,
        });
    } catch (error) {
        console.error("❌ [Hostaway Sync] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to sync" },
            { status: 500 }
        );
    }
}
