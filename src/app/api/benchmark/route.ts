import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { benchmarkData } from "@/lib/db/schema";
import { eq, and, lte, gte } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const listingId = searchParams.get("listingId") ? Number(searchParams.get("listingId")) : null;
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");

        if (!listingId) {
            return NextResponse.json({ error: "listingId is required" }, { status: 400 });
        }

        // Build exact-match conditions. If no date range, return the most recent row.
        const conditions = [eq(benchmarkData.listingId, listingId)];
        if (dateFrom && dateTo) {
            conditions.push(lte(benchmarkData.dateFrom, dateTo));
            conditions.push(gte(benchmarkData.dateTo, dateFrom));
        }

        const rows = await db
            .select()
            .from(benchmarkData)
            .where(and(...conditions))
            .limit(1);

        const row = rows[0] ?? null;

        return NextResponse.json({
            success: true,
            hasData: !!row,
            summary: row,                     // The full row IS the summary
            comps: row?.comps ?? [],           // JSONB array embedded in the single row
            totalComps: row?.comps?.length ?? 0,
        });
    } catch (error) {
        console.error("API /api/benchmark GET Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch benchmark data." },
            { status: 500 }
        );
    }
}
