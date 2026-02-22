import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventoryMaster } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const { proposals, dateRange } = await req.json();

        if (!proposals || !Array.isArray(proposals)) {
            return NextResponse.json({ error: "Invalid proposals format" }, { status: 400 });
        }

        const coveredDates = new Set<string>();
        const proposalsToSave: { date: string, prop: any }[] = [];
        let fallbackProposal: any = null;

        for (const prop of proposals) {
            if (prop.listing_id && prop.date && prop.proposed_price && prop.guard_verdict === "APPROVED") {
                const dateStr = prop.date.trim().toLowerCase();

                // Check for generic strings like "Other Available Dates"
                if (dateStr.includes("other") || dateStr.includes("shoulder") || dateStr.includes("remaining")) {
                    fallbackProposal = prop;
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
        }

        // Handle fallback generic dates to cover gaps
        if (fallbackProposal && dateRange?.from && dateRange?.to) {
            const startDate = new Date(dateRange.from);
            const endDate = new Date(dateRange.to);
            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    const isoDate = d.toISOString().split('T')[0];
                    if (!coveredDates.has(isoDate)) {
                        proposalsToSave.push({ date: isoDate, prop: fallbackProposal });
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
                        changePct: prop.change_pct,
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
