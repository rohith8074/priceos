import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventoryMaster } from "@/lib/db/schema";
import { inArray, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const { proposalIds } = await req.json();

        if (!proposalIds || !Array.isArray(proposalIds) || proposalIds.length === 0) {
            return NextResponse.json({ error: "Invalid proposal IDs" }, { status: 400 });
        }

        // Approve selected proposals:
        // Move proposedPrice -> currentPrice, clear proposedPrice & proposalStatus
        await db.update(inventoryMaster)
            .set({
                currentPrice: sql`${inventoryMaster.proposedPrice}`,
                proposedPrice: null,
                proposalStatus: "approved"
            })
            .where(inArray(inventoryMaster.id, proposalIds));

        // Notice: Background sync logic to Hostaway would trigger here (omitted for speed / sandbox)

        return NextResponse.json({ success: true, count: proposalIds.length });
    } catch (error) {
        console.error("Error bulk approving proposals:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
