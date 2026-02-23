import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

        const message = `${propertyInfo}
Date Range: ${dateRange.from} to ${dateRange.to}

Please execute market research for this property matching the exact date range above. Return your analysis formatted exactly as specified in your system instructions.`;

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
                    eventType: 'event',
                    location: "Dubai",
                    expectedImpact: ev.impact || "medium",
                    confidence: typeof ev.confidence === 'number'
                        ? (ev.confidence <= 1 ? Math.round(ev.confidence * 100) : ev.confidence)
                        : 50,
                    description: ev.description || "",
                    source: ev.source || null,
                    suggestedPremium: ev.suggested_premium_pct ? String(ev.suggested_premium_pct) : null,
                    // No metadata needed — all fields are in dedicated columns
                    metadata: null,
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
                    eventType: 'holiday',
                    location: "Dubai",
                    expectedImpact: hol.impact?.toLowerCase().includes('high') ? 'high' :
                        hol.impact?.toLowerCase().includes('med') ? 'medium' : 'low',
                    confidence: 95,
                    description: hol.impact || "",
                    source: hol.source || null,
                    suggestedPremium: hol.premium_pct ? String(hol.premium_pct) : null,
                    // No metadata needed — all fields are in dedicated columns
                    metadata: null,
                });
            });
        }

        // 4c. Save Competitor Intelligence as a special record
        if (structuredData.competitors) {
            recordsToInsert.push({
                name: `Competitor Intelligence: ${structuredData.area || "Dubai"}`,
                startDate: dateRange.from,
                endDate: dateRange.to,
                eventType: 'competitor_intel',
                location: "Dubai",
                expectedImpact: "medium",
                confidence: 70,
                description: `Sample: ${structuredData.competitors.sample_size} properties. Rates: AED ${structuredData.competitors.min_rate}-${structuredData.competitors.max_rate} (median ${structuredData.competitors.median_rate}).`,
                source: null,
                suggestedPremium: null,
                competitorMedian: String(structuredData.competitors.median_rate),
                // Metadata: only overflow data NOT in dedicated columns
                metadata: {
                    examples: structuredData.competitors.examples,
                    sample_size: structuredData.competitors.sample_size,
                    min_rate: structuredData.competitors.min_rate,
                    max_rate: structuredData.competitors.max_rate,
                },
            });
        }

        // 4d. Save Positioning Analysis as a special record
        if (structuredData.positioning) {
            recordsToInsert.push({
                name: `Market Positioning: ${structuredData.area || "Dubai"}`,
                startDate: dateRange.from,
                endDate: dateRange.to,
                eventType: 'positioning',
                location: "Dubai",
                expectedImpact: structuredData.positioning.verdict === "UNDERPRICED" ? "high" :
                    structuredData.positioning.verdict === "OVERPRICED" ? "high" : "medium",
                confidence: 75,
                description: structuredData.positioning.insight || "",
                source: null,
                suggestedPremium: null,
                // Metadata: only overflow data NOT in dedicated columns
                metadata: {
                    percentile: structuredData.positioning.percentile,
                    verdict: structuredData.positioning.verdict,
                },
            });
        }

        // 4e. Save Demand Outlook as a special record (tourism trends, weather, supply)
        if (structuredData.demand_outlook) {
            recordsToInsert.push({
                name: `Demand Outlook: ${dateRange.from} to ${dateRange.to}`,
                startDate: dateRange.from,
                endDate: dateRange.to,
                eventType: 'demand_outlook',
                location: "Dubai",
                expectedImpact: structuredData.demand_outlook.trend === 'strong' ? 'high' :
                    structuredData.demand_outlook.trend === 'weak' ? 'low' : 'medium',
                confidence: 70,
                description: structuredData.demand_outlook.reason || "",
                source: null,
                suggestedPremium: null,
                // Metadata: overflow data (weather, supply notes)
                metadata: {
                    trend: structuredData.demand_outlook.trend,
                    weather: structuredData.demand_outlook.weather,
                    supply_notes: structuredData.demand_outlook.supply_notes,
                },
            });
        }

        // 4f. Save Market Summary as a special record
        if (structuredData.summary) {
            recordsToInsert.push({
                name: `Market Summary: ${dateRange.from} to ${dateRange.to}`,
                startDate: dateRange.from,
                endDate: dateRange.to,
                eventType: 'market_summary',
                location: "Dubai",
                expectedImpact: "medium",
                confidence: 80,
                description: structuredData.summary,
                source: null,
                suggestedPremium: null,
                // Metadata: only overflow (area name)
                metadata: {
                    area: structuredData.area,
                },
            });
        }

        // Delete previous signals to ensure UI and DB only show the latest info
        await db.delete(marketEvents);
        console.log(`  🗑️ Cleared previous market events.`);

        if (recordsToInsert.length > 0) {
            // Records are already in final shape — insert directly
            const finalRecords = recordsToInsert.map(r => ({
                title: r.name,
                startDate: r.startDate,
                endDate: r.endDate,
                eventType: r.eventType,
                location: r.location,
                expectedImpact: r.expectedImpact,
                confidence: r.confidence,
                description: r.description,
                source: r.source || null,
                suggestedPremium: r.suggestedPremium || null,
                competitorMedian: r.competitorMedian || null,
                metadata: r.metadata || null,
            }));
            await db.insert(marketEvents).values(finalRecords);
        }

        console.log(`  💾 Saved ${recordsToInsert.length} records to market_events`);

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
