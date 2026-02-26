import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = 'force-dynamic';

const LYZR_API_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";
const LYZR_API_KEY = process.env.LYZR_API_KEY!;
const MARKETING_AGENT_ID = process.env.Marketing_Agent_ID!;
const BENCHMARK_AGENT_ID = process.env.LYZR_Competitor_Benchmark_Agent_ID!;

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { dateRange, context } = body;
        const listingId = context?.listingId ? Number(context.listingId) : null;

        if (!dateRange?.from || !dateRange?.to) {
            return NextResponse.json({ error: "Date range is required" }, { status: 400 });
        }

        const callLyzrAgent = async (agentId: string, message: string, label: string): Promise<any> => {
            try {
                const res = await fetch(LYZR_API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-api-key": LYZR_API_KEY },
                    body: JSON.stringify({
                        user_id: "priceos-setup",
                        agent_id: agentId,
                        session_id: `market-setup-${label}-${Date.now()}`,
                        message,
                    }),
                });
                if (!res.ok) return null;
                const raw = await res.json();
                const reply = raw.response?.message || raw.response || raw.message;
                if (typeof reply === "string") {
                    const match = reply.match(/\{[\s\S]*\}/);
                    return match ? JSON.parse(match[0]) : JSON.parse(reply);
                }
                return reply ?? null;
            } catch (err) {
                console.error(`❌ ${label} agent failed:`, err);
                return null;
            }
        };

        // --- Execute Agents ---
        console.log(`📡 Calling Marketing Agent...`);
        const marketingMessage = `Property: ${context?.propertyName || "Dubai Property"} (Area: ${context?.area || "Dubai"}, Bedrooms: ${context?.bedrooms || "unknown"})
Date Range: ${dateRange.from} to ${dateRange.to}
Execute market research and return JSON with events, holidays, competitors, positioning, demand_outlook, and summary.`;

        const structuredData = await callLyzrAgent(MARKETING_AGENT_ID, marketingMessage, "marketing");
        if (!structuredData) return NextResponse.json({ error: "Agent analysis failed" }, { status: 502 });

        console.log(`🔍 Calling Benchmark Agent...`);
        const benchmarkMessage = `Property: ${context?.propertyName || "Property"} in ${context?.area || "Dubai"}. Get real-time rates for ${dateRange.from} to ${dateRange.to}.`;
        const benchmarkData = await callLyzrAgent(BENCHMARK_AGENT_ID, benchmarkMessage, "benchmark");

        // --- Data Preparation Helpers ---
        const toNumeric = (v: any) => {
            if (v == null || v === '') return null;
            const n = parseFloat(v);
            return isNaN(n) ? null : n;
        };
        const toInt = (v: any) => {
            if (v == null || v === '') return null;
            const n = parseInt(v);
            return isNaN(n) ? null : n;
        };
        const isValidDate = (d: any) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ""));

        const eventsToInsert: any[] = [];

        // Events
        (structuredData.events || []).forEach((ev: any) => {
            if (isValidDate(ev.date_start) && isValidDate(ev.date_end)) {
                eventsToInsert.push({
                    listing_id: listingId,
                    title: ev.title || "Event",
                    start_date: ev.date_start,
                    end_date: ev.date_end,
                    event_type: 'event',
                    expected_impact: ev.impact || 'medium',
                    confidence: toInt(ev.confidence) || 50,
                    description: ev.description || '',
                    suggested_premium: toNumeric(ev.suggested_premium_pct),
                    metadata: ev.metadata || {}
                });
            }
        });

        // Holidays
        (structuredData.holidays || []).forEach((hol: any) => {
            if (isValidDate(hol.date_start) && isValidDate(hol.date_end)) {
                eventsToInsert.push({
                    listing_id: listingId,
                    title: hol.name || "Holiday",
                    start_date: hol.date_start,
                    end_date: hol.date_end,
                    event_type: 'holiday',
                    expected_impact: hol.impact?.toLowerCase().includes('high') ? 'high' : 'medium',
                    confidence: 95,
                    description: hol.impact || '',
                    suggested_premium: toNumeric(hol.premium_pct),
                    metadata: hol.metadata || {}
                });
            }
        });

        // Comps Intel
        if (structuredData.competitors) {
            eventsToInsert.push({
                listing_id: listingId,
                title: `Competitor Intelligence: ${structuredData.area || "Area"}`,
                start_date: dateRange.from,
                end_date: dateRange.to,
                event_type: 'competitor_intel',
                expected_impact: 'medium',
                confidence: 70,
                description: `Sample: ${structuredData.competitors.sample_size} properties. Rates: AED ${structuredData.competitors.min_rate}–${structuredData.competitors.max_rate}.`,
                comp_sample_size: toInt(structuredData.competitors.sample_size),
                comp_min_rate: toNumeric(structuredData.competitors.min_rate),
                comp_max_rate: toNumeric(structuredData.competitors.max_rate),
                comp_median_rate: toNumeric(structuredData.competitors.median_rate),
                metadata: {}
            });
        }

        // Positioning
        if (structuredData.positioning) {
            eventsToInsert.push({
                listing_id: listingId,
                title: `Market Positioning: ${structuredData.area || "Area"}`,
                start_date: dateRange.from,
                end_date: dateRange.to,
                event_type: 'positioning',
                expected_impact: 'medium',
                confidence: 75,
                description: structuredData.positioning.insight || '',
                positioning_verdict: structuredData.positioning.verdict || 'FAIR',
                positioning_percentile: toInt(structuredData.positioning.percentile),
                metadata: {}
            });
        }

        // Demand Outlook
        if (structuredData.demand_outlook) {
            eventsToInsert.push({
                listing_id: listingId,
                title: `Demand Outlook: ${dateRange.from} to ${dateRange.to}`,
                start_date: dateRange.from,
                end_date: dateRange.to,
                event_type: 'demand_outlook',
                expected_impact: structuredData.demand_outlook.trend === 'strong' ? 'high' : 'medium',
                confidence: 70,
                description: [structuredData.demand_outlook.reason, structuredData.demand_outlook.weather].filter(Boolean).join(' | '),
                demand_trend: structuredData.demand_outlook.trend || 'stable',
                metadata: {}
            });
        }

        // Summary
        if (structuredData.summary) {
            eventsToInsert.push({
                listing_id: listingId,
                title: `Market Summary: ${dateRange.from} to ${dateRange.to}`,
                start_date: dateRange.from,
                end_date: dateRange.to,
                event_type: 'market_summary',
                expected_impact: 'medium',
                confidence: 80,
                description: structuredData.summary,
                metadata: {}
            });
        }

        // --- Database Operations ---
        console.log(`💾 Executing database updates...`);

        // Delete old records for overlap
        if (listingId) {
            await sql`DELETE FROM market_events WHERE listing_id = ${listingId} AND start_date >= ${dateRange.from} AND end_date <= ${dateRange.to}`;
        } else {
            await sql`DELETE FROM market_events WHERE listing_id IS NULL AND start_date >= ${dateRange.from} AND end_date <= ${dateRange.to}`;
        }

        // Insert new records one by one to prevent batch param alignment issues
        let savedCount = 0;
        for (const item of eventsToInsert) {
            try {
                await sql`
                    INSERT INTO market_events (
                        listing_id, title, start_date, end_date, event_type, 
                        expected_impact, confidence, suggested_premium, source, 
                        description, location, metadata, comp_sample_size, 
                        comp_min_rate, comp_max_rate, comp_median_rate, 
                        positioning_verdict, positioning_percentile, demand_trend
                    ) VALUES (
                        ${item.listing_id}, ${item.title}, ${item.start_date}, ${item.end_date}, ${item.event_type},
                        ${item.expected_impact || null}, ${item.confidence || null}, ${item.suggested_premium || null}, ${item.source || null},
                        ${item.description || null}, ${item.location || null}, ${JSON.stringify(item.metadata || {})}, ${item.comp_sample_size || null},
                        ${item.comp_min_rate || null}, ${item.comp_max_rate || null}, ${item.comp_median_rate || null},
                        ${item.positioning_verdict || null}, ${item.positioning_percentile || null}, ${item.demand_trend || null}
                    )
                `;
                savedCount++;
            } catch (err) {
                console.error(`❌ Failed to insert market event: ${item.title}`, err);
            }
        }

        // Handle benchmark data separately
        if (benchmarkData && listingId) {
            try {
                const bd = benchmarkData;
                const compsJson = JSON.stringify(Array.isArray(bd.comps) ? bd.comps : []);
                const dist = bd.rate_distribution || {};
                const verdict = bd.pricing_verdict || {};

                await sql`DELETE FROM benchmark_data WHERE listing_id = ${listingId} AND date_from = ${dateRange.from} AND date_to = ${dateRange.to}`;
                await sql`
                    INSERT INTO benchmark_data (
                        listing_id, date_from, date_to, p25_rate, p50_rate, p75_rate, p90_rate,
                        your_price, percentile, verdict, comps
                    ) VALUES (
                        ${listingId}, ${dateRange.from}, ${dateRange.to}, 
                        ${toNumeric(dist.p25)}, ${toNumeric(dist.p50)}, ${toNumeric(dist.p75)}, ${toNumeric(dist.p90)},
                        ${toNumeric(verdict.your_price)}, ${toInt(verdict.percentile)}, ${verdict.verdict || null}, ${compsJson}
                    )
                `;
            } catch (err) {
                console.error(`❌ Failed to save benchmark data`, err);
            }
        }

        return NextResponse.json({
            success: true,
            summary: structuredData.summary,
            savedCount,
            benchmarkFound: !!benchmarkData
        });

    } catch (error: any) {
        console.error("Market Setup Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
