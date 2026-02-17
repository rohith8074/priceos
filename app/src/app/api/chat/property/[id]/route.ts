import { NextRequest, NextResponse } from "next/server";
import { db, listings, chatMessages, proposals } from "@/lib/db";
import { eq } from "drizzle-orm";
import { addDays } from "date-fns";
import { DataSyncAgent } from "@/lib/agents/data-sync-agent";
import { EventIntelligenceAgent } from "@/lib/agents/event-intelligence-agent";
import { PricingAnalystAgent } from "@/lib/agents/pricing-analyst-agent";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listingId = parseInt(id);
    const body = await req.json();
    const { message } = body;

    // Verify listing exists
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);

    if (!listing) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Save user message
    await db.insert(chatMessages).values({
      userId: "user-1", // TODO: Get from auth
      sessionId: `property-${listingId}`,
      role: "user",
      content: message,
      listingId: listingId,
      structured: { listingId },
    });

    // Step 1: Ensure fresh data
    const dataSyncAgent = new DataSyncAgent(process.env.HOSTAWAY_API_KEY || "");
    const isCacheStale = await dataSyncAgent.isCacheStale(listingId);

    if (isCacheStale) {
      await dataSyncAgent.syncProperty(listingId);
    }

    // Step 2: Analyze events and generate proposals
    const eventAgent = new EventIntelligenceAgent();
    const pricingAgent = new PricingAnalystAgent();

    const startDate = new Date();
    const endDate = addDays(startDate, 30); // Next 30 days

    const [eventAnalysis, pricingAnalysis] = await Promise.all([
      eventAgent.analyzeEvents(startDate, endDate),
      pricingAgent.generateProposals(listingId, startDate, endDate),
    ]);

    // Step 3: Save proposals to database
    const proposalIds = await pricingAgent.saveProposals(pricingAnalysis);

    // Step 4: Format response
    let responseMessage = "";

    if (pricingAnalysis.proposals.length > 0) {
      responseMessage = `I've analyzed pricing for ${listing.name} for the next 30 days.\n\n`;
      responseMessage += `📊 Found ${pricingAnalysis.proposals.length} pricing opportunities:\n`;
      responseMessage += `• ${eventAnalysis.events.length} events detected\n`;
      responseMessage += `• ${pricingAnalysis.proposals.filter(p => p.riskLevel === "low").length} low-risk proposals\n`;
      responseMessage += `• ${pricingAnalysis.proposals.filter(p => p.riskLevel === "medium").length} medium-risk proposals\n`;
      responseMessage += `• ${pricingAnalysis.proposals.filter(p => p.riskLevel === "high").length} high-risk proposals\n\n`;
      responseMessage += `Review the proposals below and approve the ones you'd like to execute.`;
    } else {
      responseMessage = `I've analyzed pricing for ${listing.name}, but I don't see any strong opportunities right now. The current pricing looks appropriate based on:\n\n`;
      responseMessage += `• Current occupancy trends\n`;
      responseMessage += `• ${eventAnalysis.events.length} upcoming events\n`;
      responseMessage += `• Market conditions\n\n`;
      responseMessage += `I'll continue monitoring and notify you of any changes.`;
    }

    // Save assistant message
    await db.insert(chatMessages).values({
      userId: "user-1", // TODO: Get from auth
      sessionId: `property-${listingId}`,
      role: "assistant",
      content: responseMessage,
      listingId: listingId,
      structured: {
        listingId,
        proposalIds,
      },
    });

    // Fetch the saved proposals from DB to return
    const savedProposals = await db
      .select()
      .from(proposals)
      .where(eq(proposals.listingId, listingId));

    // Format proposals for frontend
    const formattedProposals = savedProposals
      .filter(p => p.status === "pending")
      .map(p => ({
        id: p.id,
        dateRangeStart: p.dateRangeStart,
        dateRangeEnd: p.dateRangeEnd,
        currentPrice: parseFloat(p.currentPrice),
        proposedPrice: parseFloat(p.proposedPrice),
        changePct: p.changePct, // Already a number
        riskLevel: p.riskLevel,
        reasoning: p.reasoning,
      }));

    return NextResponse.json({
      message: responseMessage,
      proposals: formattedProposals,
    });
  } catch (error) {
    console.error("Error in property chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
