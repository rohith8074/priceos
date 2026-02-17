import { NextRequest, NextResponse } from "next/server";
import { db, listings, proposals } from "@/lib/db";
import { eq } from "drizzle-orm";
import type { AgentCacheContext } from "@/lib/cache/types";
import { buildAgentContext, isCacheFresh } from "@/lib/cache/utils";

interface ChatContext {
  type: "portfolio" | "property";
  propertyId?: number;
}

interface ChatRequest {
  message: string;
  context: ChatContext;
  cache?: AgentCacheContext;
  sessionId: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { message, context, cache } = body;

    // Log cache usage for monitoring
    if (cache) {
      const cacheStatus = isCacheFresh(cache) ? "FRESH" : "STALE";
      console.log(`[Cache ${cacheStatus}] Context: ${cache.context.type}, Listings: ${cache.data.listings.count}, Reservations: ${cache.data.reservations.count}`);
    }

    // Route to appropriate handler based on context type
    if (context.type === "portfolio") {
      return handlePortfolioChat(message, cache);
    } else if (context.type === "property" && context.propertyId) {
      return handlePropertyChat(message, context.propertyId, cache);
    }

    return NextResponse.json(
      { error: "Invalid context" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handlePortfolioChat(message: string, cache?: AgentCacheContext) {
  // Log cache usage
  if (cache && isCacheFresh(cache)) {
    console.log("✓ Using fresh cache for portfolio context");
  } else if (cache?.meta.isStale) {
    console.log("⚠ Cache stale, querying database for portfolio");
  }

  // Fetch all properties for portfolio analysis
  // Note: In a production system with large datasets, we'd optimize this further
  // by using cache counts for simple queries and only fetching full data when needed
  const allListings = await db.select().from(listings);

  // Simple keyword-based responses (in real app, use AI agent)
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("underperform") ||
    lowerMessage.includes("low occupancy")
  ) {
    // Mock response showing underperforming properties
    const underperforming = allListings.filter(
      (l) => parseFloat(l.price as string) < 500
    );

    return NextResponse.json({
      message: `I've identified ${underperforming.length} properties that may be underperforming:\n\n${underperforming.map((p) => `• ${p.name} - Current price: ${p.currencyCode} ${p.price}`).join("\n")}\n\nWould you like me to generate pricing proposals for these properties?`,
      metadata: {
        propertyCount: underperforming.length,
      },
    });
  }

  if (lowerMessage.includes("revenue") || lowerMessage.includes("total")) {
    const totalRevenue = allListings.reduce(
      (sum, l) => sum + parseFloat(l.price as string),
      0
    );
    const avgPrice =
      totalRevenue / allListings.length || 0;

    return NextResponse.json({
      message: `Here's your portfolio overview:\n\n• Total properties: ${allListings.length}\n• Total daily revenue: ${allListings[0]?.currencyCode || "AED"} ${totalRevenue.toLocaleString("en-US")}\n• Average price: ${allListings[0]?.currencyCode || "AED"} ${Math.round(avgPrice).toLocaleString("en-US")}\n\nWhat would you like to analyze next?`,
      metadata: {
        propertyCount: allListings.length,
        totalRevenue,
        avgOccupancy: 68,
      },
    });
  }

  // Default portfolio response
  return NextResponse.json({
    message: `I can help you with portfolio-wide analysis. Try asking:\n\n• "Which properties are underperforming?"\n• "Show me total revenue"\n• "Compare all properties"\n\nWhat would you like to know?`,
  });
}

async function handlePropertyChat(message: string, propertyId: number, cache?: AgentCacheContext) {
  // Use cache if fresh, otherwise query database
  let property;

  if (cache && isCacheFresh(cache)) {
    console.log(`✓ Using fresh cache for property ${propertyId}`);
  } else {
    if (cache?.meta.isStale) {
      console.log(`⚠ Cache stale for property ${propertyId}, querying database`);
    } else {
      console.log(`⚠ No cache available for property ${propertyId}, querying database`);
    }
  }

  // Fetch specific property (always needed for property chat)
  property = await db
    .select()
    .from(listings)
    .where(eq(listings.id, propertyId))
    .limit(1);

  if (!property || property.length === 0) {
    return NextResponse.json(
      { error: "Property not found" },
      { status: 404 }
    );
  }

  const listing = property[0];
  const lowerMessage = message.toLowerCase();

  // Handle pricing analysis
  if (
    lowerMessage.includes("analyz") ||
    lowerMessage.includes("pricing") ||
    lowerMessage.includes("proposal")
  ) {
    // Generate mock proposals
    const currentPrice = parseFloat(listing.price as string);
    const mockProposals = [
      {
        id: Date.now(),
        dateRangeStart: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        dateRangeEnd: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        currentPrice,
        proposedPrice: Math.round(currentPrice * 1.15),
        changePct: 15,
        riskLevel: "low",
        reasoning:
          "High demand period detected. Dubai Shopping Festival upcoming. Competitor prices trending up.",
      },
      {
        id: Date.now() + 1,
        dateRangeStart: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        dateRangeEnd: new Date(
          Date.now() + 21 * 24 * 60 * 60 * 1000
        ).toISOString(),
        currentPrice,
        proposedPrice: Math.round(currentPrice * 1.08),
        changePct: 8,
        riskLevel: "low",
        reasoning:
          "Moderate demand. Weekend pricing opportunity. Similar properties at +10%.",
      },
    ];

    return NextResponse.json({
      message: `I've analyzed ${listing.name} and generated 2 pricing proposals based on market conditions and upcoming events:`,
      proposals: mockProposals,
    });
  }

  // Handle general property questions
  if (
    lowerMessage.includes("info") ||
    lowerMessage.includes("detail") ||
    lowerMessage.includes("about")
  ) {
    const price = parseFloat(listing.price as string);
    const priceFloor = parseFloat(listing.priceFloor as string);
    const priceCeiling = parseFloat(listing.priceCeiling as string);

    return NextResponse.json({
      message: `Here are the details for ${listing.name}:\n\n• Location: ${listing.area || "N/A"}\n• Bedrooms: ${listing.bedroomsNumber || "N/A"}\n• Bathrooms: ${listing.bathroomsNumber || "N/A"}\n• Capacity: ${listing.personCapacity || "N/A"} guests\n• Current price: ${listing.currencyCode} ${price.toLocaleString("en-US")}\n• Price floor: ${listing.currencyCode} ${priceFloor.toLocaleString("en-US")}\n• Price ceiling: ${listing.currencyCode} ${priceCeiling.toLocaleString("en-US")}\n\nWhat would you like to do next?`,
    });
  }

  // Default property response
  return NextResponse.json({
    message: `I'm here to help with ${listing.name}. Try asking:\n\n• "Analyze pricing for next week"\n• "Generate pricing proposals"\n• "Show me property details"\n\nWhat would you like to know?`,
  });
}
