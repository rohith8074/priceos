import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventoryMaster } from "@/lib/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const { proposals, dateRange } = await req.json();

        if (!proposals || !Array.isArray(proposals)) {
            return NextResponse.json({ error: "Invalid proposals format" }, { status: 400 });
        }

        // ── STEP 1: Parse all proposals into flat rows ──────────────────────────
        const coveredDatesByListing = new Map<number, Set<string>>();
        const fallbacksByListing = new Map<number, any>();
        const proposalsToSave: {
            listingId: number;
            date: string;
            price: number;
            minStay?: number | null;
            reasoning?: string | null;
        }[] = [];

        for (const prop of proposals) {
            const lid = Number(prop.listing_id);
            if (!lid || !prop.date || !prop.proposed_price || prop.guard_verdict !== "APPROVED") continue;

            if (!coveredDatesByListing.has(lid)) coveredDatesByListing.set(lid, new Set());
            const coveredDates = coveredDatesByListing.get(lid)!;
            const dateStr = prop.date.trim().toLowerCase();

            const addDate = (isoDate: string) => {
                coveredDates.add(isoDate);
                proposalsToSave.push({
                    listingId: lid,
                    date: isoDate,
                    price: Number(prop.proposed_price),
                    minStay: prop.proposed_min_stay ? Number(prop.proposed_min_stay) : null,
                    reasoning: prop.reasoning || null,
                });
            };

            // Generic fallbacks — handle after covering specific dates
            if (dateStr.includes("other") || dateStr.includes("shoulder") || dateStr.includes("remaining")) {
                fallbacksByListing.set(lid, prop);
                continue;
            }

            // Date ranges like "2026-04-01 to 2026-04-30"
            if (prop.date.includes(" to ")) {
                const [startStr, endStr] = prop.date.split(" to ");
                const startDate = new Date(startStr);
                const endDate = new Date(endStr);
                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                        addDate(d.toISOString().split("T")[0]);
                    }
                }
            } else {
                const parsedDate = new Date(prop.date);
                if (!isNaN(parsedDate.getTime())) addDate(parsedDate.toISOString().split("T")[0]);
            }
        }

        // Expand fallback generic proposals to cover uncovered dates in range
        if (dateRange?.from && dateRange?.to) {
            const startDate = new Date(dateRange.from);
            const endDate = new Date(dateRange.to);
            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                for (const [lid, fallbackProposal] of fallbacksByListing.entries()) {
                    const covered = coveredDatesByListing.get(lid) || new Set();
                    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                        const isoDate = d.toISOString().split("T")[0];
                        if (!covered.has(isoDate)) {
                            proposalsToSave.push({
                                listingId: lid,
                                date: isoDate,
                                price: Number(fallbackProposal.proposed_price),
                                minStay: fallbackProposal.proposed_min_stay ? Number(fallbackProposal.proposed_min_stay) : null,
                                reasoning: fallbackProposal.reasoning || null,
                            });
                        }
                    }
                }
            }
        }

        if (proposalsToSave.length === 0) {
            return NextResponse.json({ success: true, savedCount: 0 });
        }

        // ── STEP 2: Group by listingId — ONE batch UPDATE per listing ───────────
        // Instead of N sequential await db.update() calls, we build a single
        // UPDATE with CASE WHEN ... END expressions covering all dates at once.
        const byListing = new Map<number, typeof proposalsToSave>();
        for (const row of proposalsToSave) {
            if (!byListing.has(row.listingId)) byListing.set(row.listingId, []);
            byListing.get(row.listingId)!.push(row);
        }

        let savedCount = 0;

        for (const [listingId, rows] of byListing.entries()) {
            const dates = rows.map(r => r.date);

            const priceCase = sql.join(
                rows.map(r => sql`WHEN date = ${r.date} THEN ${r.price.toString()}`),
                sql` `
            );
            const changePctCase = sql.join(
                rows.map(r => sql`WHEN date = ${r.date} THEN ROUND(((${r.price} - CAST(current_price AS NUMERIC)) / NULLIF(CAST(current_price AS NUMERIC), 0)) * 100)`),
                sql` `
            );
            const reasoningCase = sql.join(
                rows.map(r => sql`WHEN date = ${r.date} THEN ${r.reasoning}`),
                sql` `
            );

            const hasMinStay = rows.some(r => r.minStay != null);
            const minStayCase = hasMinStay
                ? sql.join(
                    rows.map(r => sql`WHEN date = ${r.date} THEN ${r.minStay ?? null}`),
                    sql` `
                )
                : null;

            await db.update(inventoryMaster)
                .set({
                    proposedPrice: sql`CASE ${priceCase} ELSE proposed_price END`,
                    changePct: sql`CASE ${changePctCase} ELSE change_pct END`,
                    proposalStatus: "pending",
                    reasoning: sql`CASE ${reasoningCase} ELSE reasoning END`,
                    ...(minStayCase ? { minStay: sql`CASE ${minStayCase} ELSE min_stay END` } : {}),
                })
                .where(
                    and(
                        eq(inventoryMaster.listingId, listingId),
                        inArray(inventoryMaster.date, dates)
                    )
                );

            savedCount += rows.length;
            console.log(`  ✅ Batch saved ${rows.length} proposals for listing ${listingId} in ONE query`);
        }

        return NextResponse.json({ success: true, savedCount });
    } catch (error) {
        console.error("Error bulk saving proposals:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
