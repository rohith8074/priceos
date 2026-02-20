import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activityTimeline } from "@/lib/db/schema";

const LYZR_API_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";
const LYZR_API_KEY = process.env.LYZR_API_KEY || "";
const MARKETING_AGENT_ID = process.env.Marketing_Agent_ID || "";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { dateRange, context } = body;

        if (!dateRange?.from || !dateRange?.to) {
            return NextResponse.json({ error: "Date range is required" }, { status: 400 });
        }

        if (!MARKETING_AGENT_ID || !LYZR_API_KEY) {
            return NextResponse.json({ error: "Marketing Agent not configured" }, { status: 500 });
        }

        // 1. Build property context for the Marketing Agent
        const propertyInfo = context?.propertyName
            ? `Property: ${context.propertyName} (Area: ${context.area || "Dubai"}, Bedrooms: ${context.bedrooms || "unknown"}, Base Price: AED ${context.basePrice || "unknown"})`
            : "Portfolio level analysis (all Dubai properties)";

        const message = `You are a Dubai short-term rental market researcher with internet search capabilities.

${propertyInfo}
Date Range: ${dateRange.from} to ${dateRange.to}

TASK — Return ALL of the following for DUBAI:

1. **EVENTS**: Search for ALL major events happening in Dubai during this period — conferences, exhibitions, sports events, concerts, cultural festivals, etc. For each event provide: title, exact dates, impact level (high/medium/low), confidence (0-100), description, source URL, and suggested_premium_pct (integer, e.g. 15 means +15% price premium). If no events found, return an empty array.

2. **HOLIDAYS**: Find ALL UAE public holidays and school breaks in this period. For each: name, dates, impact description, premium_pct (integer), source. If no holidays found, return an empty array.

3. **COMPETITORS**: Search Airbnb, Booking.com for similar properties in the same Dubai area. Return: sample_size, min_rate (AED/night), max_rate, median_rate, and 3-5 specific competitor examples with name, price, and source.

4. **POSITIONING**: Given the property's base price, calculate its percentile vs competitors. Return: percentile (0-100), verdict (UNDERPRICED/FAIR/SLIGHTLY_ABOVE/OVERPRICED), and a 1-sentence insight.

5. **SUMMARY**: A 2-3 sentence executive summary of market conditions for this period. If no events, focus on competitor pricing and seasonality.

RESPONSE FORMAT — Return ONLY this JSON, no other text:
{
  "area": "string",
  "date_range": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" },
  "events": [
    {
      "title": "string",
      "date_start": "YYYY-MM-DD",
      "date_end": "YYYY-MM-DD",
      "impact": "high|medium|low",
      "confidence": 85,
      "description": "string",
      "source": "https://...",
      "suggested_premium_pct": 15
    }
  ],
  "holidays": [
    {
      "name": "string",
      "date_start": "YYYY-MM-DD",
      "date_end": "YYYY-MM-DD",
      "impact": "string",
      "premium_pct": 10,
      "source": "https://..."
    }
  ],
  "competitors": {
    "sample_size": 45,
    "min_rate": 280,
    "max_rate": 950,
    "median_rate": 490,
    "examples": [
      { "name": "Similar 1BR Marina", "price": 480, "source": "Airbnb" }
    ]
  },
  "positioning": {
    "percentile": 58,
    "verdict": "FAIR",
    "insight": "At AED 550, property sits at 58th percentile with room to push during events."
  },
  "summary": "string"
}`;

        // 2. Call Marketing Agent (Sonar LLM with internet search)
        console.log(`\n📡 MARKET SETUP — Calling Marketing Agent`);
        console.log(`  Agent ID: ${MARKETING_AGENT_ID}`);
        console.log(`  Range: ${dateRange.from} to ${dateRange.to}`);
        console.log(`  Context: ${context?.propertyName || 'Portfolio'}`);

        const payload = {
            user_id: "priceos-setup",
            agent_id: MARKETING_AGENT_ID,
            session_id: `market-setup-${Date.now()}`,
            message: message,
        };

        const response = await fetch(LYZR_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": LYZR_API_KEY,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Lyzr API error: ${errorText}`);
        }

        const rawData = await response.json();

        // 3. Parse structured response
        let structuredData: any = null;
        try {
            const agentReply = rawData.response?.message || rawData.response || rawData.message;
            if (typeof agentReply === "string") {
                const jsonMatch = agentReply.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    structuredData = JSON.parse(jsonMatch[0]);
                } else {
                    structuredData = JSON.parse(agentReply);
                }
            } else {
                structuredData = agentReply;
            }
        } catch (e) {
            console.error("Failed to parse agent structured response:", e);
            return NextResponse.json({
                error: "Invalid agent response format",
                rawReply: rawData.response || rawData
            }, { status: 502 });
        }

        console.log(`  ✅ Parsed response: ${structuredData?.events?.length || 0} events, ${structuredData?.holidays?.length || 0} holidays`);

        // Validate: empty events/holidays is OK (quiet period), but response must be a valid object
        if (!structuredData || typeof structuredData !== 'object') {
            return NextResponse.json({
                error: "Invalid agent response — expected a JSON object",
                rawReply: rawData.response || rawData
            }, { status: 502 });
        }

        // 4. Save ALL data to event_signals table
        const recordsToInsert: any[] = [];

        // 4a. Process Events (may be empty — that's OK)
        if (Array.isArray(structuredData.events)) {
            structuredData.events.forEach((ev: any) => {
                // Safety Filter: Skip events that are entirely outside the requested range
                if (ev.date_end < dateRange.from || ev.date_start > dateRange.to) {
                    console.log(`  ⚠️ Skipping out-of-range event: ${ev.title} (${ev.date_start} to ${ev.date_end})`);
                    return;
                }

                recordsToInsert.push({
                    name: ev.title || "Unnamed Event",
                    startDate: ev.date_start,
                    endDate: ev.date_end,
                    location: "Dubai",
                    expectedImpact: ev.impact || "medium",
                    confidence: typeof ev.confidence === 'number'
                        ? (ev.confidence <= 1 ? Math.round(ev.confidence * 100) : ev.confidence)
                        : 50,
                    description: ev.description || "",
                    metadata: {
                        source: ev.source,
                        suggested_premium_pct: ev.suggested_premium_pct,
                        type: 'event'
                    }
                });
            });
        }

        // 4b. Process Holidays (may be empty — that's OK)
        if (Array.isArray(structuredData.holidays)) {
            structuredData.holidays.forEach((hol: any) => {
                // Safety Filter: Skip holidays that are entirely outside the requested range
                if (hol.date_end < dateRange.from || hol.date_start > dateRange.to) {
                    console.log(`  ⚠️ Skipping out-of-range holiday: ${hol.name} (${hol.date_start} to ${hol.date_end})`);
                    return;
                }

                recordsToInsert.push({
                    name: hol.name || "Holiday",
                    startDate: hol.date_start,
                    endDate: hol.date_end,
                    location: "Dubai",
                    expectedImpact: hol.impact?.toLowerCase().includes('high') ? 'high' :
                        hol.impact?.toLowerCase().includes('med') ? 'medium' : 'low',
                    confidence: 95,
                    description: hol.impact || "",
                    metadata: {
                        source: hol.source,
                        premium_pct: hol.premium_pct,
                        type: 'holiday'
                    }
                });
            });
        }

        // 4c. Save Competitor Intelligence as a special record
        if (structuredData.competitors) {
            recordsToInsert.push({
                name: `Competitor Intelligence: ${structuredData.area || "Dubai"}`,
                startDate: dateRange.from,
                endDate: dateRange.to,
                location: "Dubai",
                expectedImpact: "medium",
                confidence: 70,
                description: `Sample: ${structuredData.competitors.sample_size} properties. Rates: AED ${structuredData.competitors.min_rate}-${structuredData.competitors.max_rate} (median ${structuredData.competitors.median_rate}).`,
                metadata: {
                    type: 'competitor_intel',
                    ...structuredData.competitors
                }
            });
        }

        // 4d. Save Positioning Analysis as a special record
        if (structuredData.positioning) {
            recordsToInsert.push({
                name: `Market Positioning: ${structuredData.area || "Dubai"}`,
                startDate: dateRange.from,
                endDate: dateRange.to,
                location: "Dubai",
                expectedImpact: structuredData.positioning.verdict === "UNDERPRICED" ? "high" :
                    structuredData.positioning.verdict === "OVERPRICED" ? "high" : "medium",
                confidence: 75,
                description: structuredData.positioning.insight || "",
                metadata: {
                    type: 'positioning',
                    percentile: structuredData.positioning.percentile,
                    verdict: structuredData.positioning.verdict,
                    insight: structuredData.positioning.insight
                }
            });
        }

        // 4e. Save Market Summary as a special record
        if (structuredData.summary) {
            recordsToInsert.push({
                name: `Market Summary: ${dateRange.from} to ${dateRange.to}`,
                startDate: dateRange.from,
                endDate: dateRange.to,
                location: "Dubai",
                expectedImpact: "medium",
                confidence: 80,
                description: structuredData.summary,
                metadata: {
                    type: 'market_summary',
                    area: structuredData.area
                }
            });
        }

        if (recordsToInsert.length > 0) {
            const finalRecords = recordsToInsert.map(r => ({
                listingId: null,
                type: 'market_event',
                title: r.name,
                description: r.description,
                startDate: r.startDate,
                endDate: r.endDate,
                marketContext: {
                    expectedImpact: r.expectedImpact,
                    confidence: r.confidence,
                    location: r.location,
                    ...r.metadata
                }
            }));
            await db.insert(activityTimeline).values(finalRecords);
        }

        console.log(`  💾 Saved ${recordsToInsert.length} records to activity_timeline`);

        return NextResponse.json({
            success: true,
            summary: structuredData.summary,
            eventsCount: structuredData.events?.length || 0,
            holidaysCount: structuredData.holidays?.length || 0,
            hasCompetitors: !!structuredData.competitors,
            hasPositioning: !!structuredData.positioning,
            totalRecords: recordsToInsert.length,
            area: structuredData.area
        });

    } catch (error) {
        console.error("Market Setup Route Error:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Internal Server Error"
        }, { status: 500 });
    }
}
