import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventoryMaster } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const { proposals, dateRange } = await req.json();

        if (!proposals || !Array.isArray(proposals)) {
            return NextResponse.json({ error: "Invalid proposals format" }, { status: 400 });
        }

        // Track covered dates and fallbacks PER LISTING
        const coveredDatesByListing = new Map<number, Set<string>>();
        const fallbacksByListing = new Map<number, any>();
        const proposalsToSave: { date: string, prop: any }[] = [];

        for (const prop of proposals) {
            const lid = Number(prop.listing_id);
            if (!lid || !prop.date || !prop.proposed_price || prop.guard_verdict !== "APPROVED") {
                continue;
            }

            if (!coveredDatesByListing.has(lid)) {
                coveredDatesByListing.set(lid, new Set());
            }
            const coveredDates = coveredDatesByListing.get(lid)!;
            const dateStr = prop.date.trim().toLowerCase();

            // Check for generic strings like "Other Available Dates"
            if (dateStr.includes("other") || dateStr.includes("shoulder") || dateStr.includes("remaining")) {
                fallbacksByListing.set(lid, prop);
                continue;
            }

            // Handle date ranges like "2026-04-01 to 2026-04-09"
            if (prop.date.includes(" to ")) {
                const [startStr, endStr] = prop.date.split(" to ");
                const startDate = new Date(startStr);
                const endDate = new Date(endStr);
                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                        const isoDate = d.toISOString().split('T')[0];
                        coveredDates.add(isoDate);
                        proposalsToSave.push({ date: isoDate, prop });
                    }
                }
            } else {
                // Handle single dates
                const parsedDate = new Date(prop.date);
                if (!isNaN(parsedDate.getTime())) {
                    const isoDate = parsedDate.toISOString().split('T')[0];
                    coveredDates.add(isoDate);
                    proposalsToSave.push({ date: isoDate, prop });
                }
            }
        }

        // Handle fallback generic dates per listing to cover gaps
        if (dateRange?.from && dateRange?.to) {
            const startDate = new Date(dateRange.from);
            const endDate = new Date(dateRange.to);

            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                for (const [lid, fallbackProposal] of fallbacksByListing.entries()) {
                    const coveredDates = coveredDatesByListing.get(lid) || new Set();

                    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                        const isoDate = d.toISOString().split('T')[0];
                        if (!coveredDates.has(isoDate)) {
                            proposalsToSave.push({ date: isoDate, prop: fallbackProposal });
                        }
                    }
                }
            }
        }

        let savedCount = 0;
        // Save all parsed individual dates
        for (const item of proposalsToSave) {
            const { date, prop } = item;
            try {
                await db.update(inventoryMaster)
                    .set({
                        proposedPrice: prop.proposed_price.toString(),
                        // Auto-calculate the delta percentage based on the actual current price in the DB
                        changePct: sql`ROUND(((${prop.proposed_price} - CAST(current_price AS NUMERIC)) / NULLIF(CAST(current_price AS NUMERIC), 0)) * 100)`,
                        proposalStatus: "pending",
                        reasoning: prop.reasoning || null
                    })
                    .where(
                        and(
                            eq(inventoryMaster.listingId, prop.listing_id),
                            eq(inventoryMaster.date, date)
                        )
                    );
                savedCount++;
                console.log(`  💾 Saved PROPOSAL for listing ${prop.listing_id} on ${date}: AED ${prop.proposed_price}`);
            } catch (updateErr) {
                console.error("Failed to update proposal in inventory_master:", updateErr);
            }
        }

        return NextResponse.json({ success: true, savedCount });
    } catch (error) {
        console.error("Error bulk saving proposals:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
