import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventoryMaster } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const { proposalIds } = await req.json();

        if (!proposalIds || !Array.isArray(proposalIds) || proposalIds.length === 0) {
            return NextResponse.json({ error: "Invalid proposal IDs" }, { status: 400 });
        }

        // Reject selected proposals:
        // clear proposedPrice & changePct, set to "rejected" so it drops from pending list
        await db.update(inventoryMaster)
            .set({
                proposedPrice: null,
                changePct: null,
                proposalStatus: "rejected"
            })
            .where(inArray(inventoryMaster.id, proposalIds));

        return NextResponse.json({ success: true, count: proposalIds.length });
    } catch (error) {
        console.error("Error bulk rejecting proposals:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
