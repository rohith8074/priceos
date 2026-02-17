import { NextRequest, NextResponse } from "next/server";
import { db, proposals } from "@/lib/db";
import { eq } from "drizzle-orm";
import { ChannelSyncAgent } from "@/lib/agents/channel-sync-agent";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const proposalId = parseInt(id);

    // Verify proposal exists and is pending
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId))
      .limit(1);

    if (!proposal) {
      return NextResponse.json(
        { success: false, message: "Proposal not found" },
        { status: 404 }
      );
    }

    if (proposal.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          message: `Proposal already ${proposal.status}`,
        },
        { status: 400 }
      );
    }

    // Update proposal status to approved
    await db
      .update(proposals)
      .set({ status: "approved" })
      .where(eq(proposals.id, proposalId));

    // Execute via Channel Sync Agent
    const channelSyncAgent = new ChannelSyncAgent(
      process.env.HOSTAWAY_API_KEY || ""
    );

    const result = await channelSyncAgent.executeProposal(proposalId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Price updated from AED ${parseFloat(proposal.currentPrice).toLocaleString("en-US")} to AED ${parseFloat(proposal.proposedPrice).toLocaleString("en-US")} for ${proposal.dateRangeStart} - ${proposal.dateRangeEnd}. Updated ${result.updatedDays} days${result.verified ? " (verified)" : ""}.`,
      });
    } else {
      // Revert proposal status if execution failed
      await db
        .update(proposals)
        .set({ status: "pending" })
        .where(eq(proposals.id, proposalId));

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
