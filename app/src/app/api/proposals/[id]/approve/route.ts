import { NextRequest, NextResponse } from "next/server";
import { db, inventoryMaster } from "@/lib/db";
import { eq } from "drizzle-orm";
import { ChannelSyncAgent } from "@/lib/agents/channel-sync-agent";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const proposalId = parseInt(id);

    // Verify proposal exists
    const [proposal] = await db
      .select()
      .from(inventoryMaster)
      .where(eq(inventoryMaster.id, proposalId))
      .limit(1);

    if (!proposal) {
      return NextResponse.json(
        { success: false, message: "Proposal matching inventory record not found" },
        { status: 404 }
      );
    }

    if (!proposal.proposedPrice) {
      return NextResponse.json(
        {
          success: false,
          message: `No proposed price pending for this date`,
        },
        { status: 400 }
      );
    }

    const proposedPriceStr = proposal.proposedPrice;

    // Update proposal status to approved (which means clearing proposedPrice and updating currentPrice)
    await db
      .update(inventoryMaster)
      .set({
        currentPrice: proposedPriceStr,
        proposedPrice: null,
      })
      .where(eq(inventoryMaster.id, proposalId));

    // Execute via Channel Sync Agent
    const channelSyncAgent = new ChannelSyncAgent(
      process.env.HOSTAWAY_API_KEY || ""
    );

    const result = await channelSyncAgent.executeProposal(proposalId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Price updated from AED ${parseFloat(proposal.currentPrice).toLocaleString("en-US")} to AED ${parseFloat(proposedPriceStr).toLocaleString("en-US")} for ${proposal.date}. Updated ${result.updatedDays} days${result.verified ? " (verified)" : ""}.`,
      });
    } else {
      // Revert proposal status if execution failed
      await db
        .update(inventoryMaster)
        .set({
          currentPrice: proposal.currentPrice,
          proposedPrice: proposedPriceStr
        })
        .where(eq(inventoryMaster.id, proposalId));

      return NextResponse.json(
        {
          success: false,
          message: result.error || "Failed to execute proposal",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error approving proposal:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
