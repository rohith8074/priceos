import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketEvents, benchmarkData } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

const LYZR_API_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";
const LYZR_API_KEY = process.env.LYZR_API_KEY!;
const MARKETING_AGENT_ID = process.env.Marketing_Agent_ID!;
const BENCHMARK_AGENT_ID = process.env.LYZR_Competitor_Benchmark_Agent_ID!;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { dateRange, context } = body;
        const listingId: number | null = context?.listingId
            ? Number(context.listingId)
            : context?.propertyId
                ? Number(context.propertyId)
                : null;

        if (!dateRange?.from || !dateRange?.to) {
            return NextResponse.json({ error: "Date range is required" }, { status: 400 });
        }

        if (!MARKETING_AGENT_ID || !LYZR_API_KEY) {
            return NextResponse.json({ error: "Marketing Agent not configured" }, { status: 500 });
        }

        // 1. Build messages for both agents
        // Helper: call Lyzr and parse JSON response (non-throwing — returns null on any failure)
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
                if (!res.ok) {
                    console.error(`  ❌ ${label} HTTP ${res.status}`);
                    return null;
                }
                const raw = await res.json();
                const reply = raw.response?.message || raw.response || raw.message;
                if (typeof reply === "string") {
                    const match = reply.match(/\{[\s\S]*\}/);
                    return match ? JSON.parse(match[0]) : JSON.parse(reply);
                }
                return reply ?? null;
            } catch (err) {
                console.error(`  ❌ ${label} failed:`, err);
                return null;
            }
        };

        // ─── STEP 1: Marketing Agent ─────────────────────────────────────────
        const marketingMessage = `${context?.propertyName
            ? `Property: ${context.propertyName} (Area: ${context.area || "Dubai"}, Bedrooms: ${context.bedrooms || "unknown"}, Base Price: AED ${context.basePrice || "unknown"})`
            : "Portfolio level analysis (all Dubai properties)"}
Date Range: ${dateRange.from} to ${dateRange.to}

Please execute market research for this property matching the exact date range above. Return your analysis formatted exactly as specified in your system instructions.`;

        console.log(`\n📡 STEP 1 — Marketing Agent (${MARKETING_AGENT_ID})`);
        const structuredData = await callLyzrAgent(MARKETING_AGENT_ID, marketingMessage, "marketing");
        console.log(`  ✅ Marketing: ${structuredData?.events?.length ?? 0} events, ${structuredData?.holidays?.length ?? 0} holidays`);

        // ─── STEP 2: Benchmark Agent ─────────────────────────────────────────
        const benchmarkMessage = `${context?.propertyName
            ? `Property: ${context.propertyName} (Area: ${context.area || "Dubai"}, Bedrooms: ${context.bedrooms || "unknown"}, Base Price: AED ${context.basePrice || "unknown"})`
            : "Dubai property"}
Date Range: ${dateRange.from} to ${dateRange.to}

Search for 10-15 comparable properties on Airbnb, Booking.com, and Vrbo in the exact same area with the same bedroom count. Extract real rates and return ONLY valid JSON as specified in your system instructions.`;

        console.log(`\n🔍 STEP 2 — Benchmark Agent (${BENCHMARK_AGENT_ID})`);
        const benchmarkData_raw = BENCHMARK_AGENT_ID
            ? await callLyzrAgent(BENCHMARK_AGENT_ID, benchmarkMessage, "benchmark")
            : null;
        console.log(`  ✅ Benchmark: ${benchmarkData_raw?.comps?.length ?? 0} comps found`);

        // 3. Validate Marketing Agent response (Benchmark failure is non-fatal)

        if (!structuredData || typeof structuredData !== 'object') {
            return NextResponse.json({
                error: "Invalid marketing agent response",
                rawBenchmark: benchmarkData_raw,
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
                    expectedImpact: ev.impact || "medium",
                    confidence: typeof ev.confidence === 'number'
                        ? (ev.confidence <= 1 ? Math.round(ev.confidence * 100) : ev.confidence)
                        : 50,
                    description: ev.description || "",
                    source: ev.source || null,
                    suggestedPremium: ev.suggested_premium_pct ? String(ev.suggested_premium_pct) : null,
                    location: ev.location || null,
                    metadata: ev.metadata || {},
                    listingId,
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
                    expectedImpact: hol.impact?.toLowerCase().includes('high') ? 'high' :
                        hol.impact?.toLowerCase().includes('med') ? 'medium' : 'low',
                    confidence: 95,
                    description: hol.impact || "",
                    source: hol.source || null,
                    suggestedPremium: hol.premium_pct ? String(hol.premium_pct) : null,
                    location: hol.location || "Dubai",
                    metadata: hol.metadata || {},
                    listingId,
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
                expectedImpact: "medium",
                confidence: 70,
                description: `Sample: ${structuredData.competitors.sample_size} properties. Rates: AED ${structuredData.competitors.min_rate}–${structuredData.competitors.max_rate} (median ${structuredData.competitors.median_rate}).`,
                compSampleSize: structuredData.competitors.sample_size ?? null,
                compMinRate: structuredData.competitors.min_rate != null ? String(structuredData.competitors.min_rate) : null,
                compMaxRate: structuredData.competitors.max_rate != null ? String(structuredData.competitors.max_rate) : null,
                compMedianRate: structuredData.competitors.median_rate != null ? String(structuredData.competitors.median_rate) : null,
                listingId,
            });
        }

        // 4d. Save Positioning Analysis as a special record
        if (structuredData.positioning) {
            recordsToInsert.push({
                name: `Market Positioning: ${structuredData.area || "Dubai"}`,
                startDate: dateRange.from,
                endDate: dateRange.to,
                eventType: 'positioning',
                expectedImpact: structuredData.positioning.verdict === "UNDERPRICED" ? "high" :
                    structuredData.positioning.verdict === "OVERPRICED" ? "high" : "medium",
                confidence: 75,
                description: structuredData.positioning.insight || "",
                positioningVerdict: structuredData.positioning.verdict ?? null,
                positioningPercentile: structuredData.positioning.percentile ?? null,
                listingId,
            });
        }

        // 4e. Save Demand Outlook as a special record (tourism trends, weather, supply)
        if (structuredData.demand_outlook) {
            recordsToInsert.push({
                name: `Demand Outlook: ${dateRange.from} to ${dateRange.to}`,
                startDate: dateRange.from,
                endDate: dateRange.to,
                eventType: 'demand_outlook',
                expectedImpact: structuredData.demand_outlook.trend === 'strong' ? 'high' :
                    structuredData.demand_outlook.trend === 'weak' ? 'low' : 'medium',
                confidence: 70,
                description: [
                    structuredData.demand_outlook.reason,
                    structuredData.demand_outlook.weather,
                    structuredData.demand_outlook.supply_notes,
                ].filter(Boolean).join(' | ') || "",
                demandTrend: structuredData.demand_outlook.trend ?? null,
                listingId,
            });
        }

        // 4f. Save Market Summary as a special record
        if (structuredData.summary) {
            recordsToInsert.push({
                name: `Market Summary: ${dateRange.from} to ${dateRange.to}`,
                startDate: dateRange.from,
                endDate: dateRange.to,
                eventType: 'market_summary',
                expectedImpact: "medium",
                confidence: 80,
                description: structuredData.summary,
                listingId,
            });
        }

        // Scoped delete: only remove records for this listing + date range (preserves other data)
        const deleteConditions = listingId
            ? and(eq(marketEvents.listingId, listingId), gte(marketEvents.startDate, dateRange.from), lte(marketEvents.endDate, dateRange.to))
            : and(gte(marketEvents.startDate, dateRange.from), lte(marketEvents.endDate, dateRange.to));
        await db.delete(marketEvents).where(deleteConditions);
        console.log(`  🗑️ Cleared previous market events for this scope.`);

        const isValidDate = (d: any): boolean => {
            if (!d) return false;
            const str = String(d);
            return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
        };

        const finalRecords = recordsToInsert
            .filter(r => {
                // Skip records with malformed dates (LLM sometimes returns truncated dates)
                if (!isValidDate(r.startDate) || !isValidDate(r.endDate)) {
                    console.warn(`  ⚠️ Skipping record with invalid date: ${r.name} (${r.startDate} to ${r.endDate})`);
                    return false;
                }
                return true;
            })
            .map(r => ({
                listingId: r.listingId ?? null,
                title: r.name,
                startDate: r.startDate,
                endDate: r.endDate,
                eventType: r.eventType,
                expectedImpact: r.expectedImpact ?? null,
                confidence: r.confidence != null ? Number(r.confidence) || null : null,
                description: r.description ?? null,
                source: r.source ?? null,
                suggestedPremium: r.suggestedPremium != null && !isNaN(Number(r.suggestedPremium)) ? String(r.suggestedPremium) : null,
                compSampleSize: r.compSampleSize != null ? Number(r.compSampleSize) || null : null,
                compMinRate: r.compMinRate != null && !isNaN(Number(r.compMinRate)) ? String(r.compMinRate) : null,
                compMaxRate: r.compMaxRate != null && !isNaN(Number(r.compMaxRate)) ? String(r.compMaxRate) : null,
                compMedianRate: r.compMedianRate != null && !isNaN(Number(r.compMedianRate)) ? String(r.compMedianRate) : null,
                positioningVerdict: r.positioningVerdict ?? null,
                positioningPercentile: r.positioningPercentile != null ? Number(r.positioningPercentile) || null : null,
                demandTrend: r.demandTrend ?? null,
                location: r.location ?? null,
                metadata: r.metadata ?? {},
            }));
        if (finalRecords.length > 0) {
            await db.insert(marketEvents).values(finalRecords);
        }

        console.log(`  💾 Saved ${recordsToInsert.length} records to market_events`);

        // ─── 5. Save Benchmark Data ───────────────────────────────────────────
        let benchmarkCompsCount = 0;
        let benchmarkSaved = false;

        if (benchmarkData_raw && listingId) {
            try {
                const bd = benchmarkData_raw;
                const rawComps = Array.isArray(bd.comps) ? bd.comps : [];
                const dist = bd.rate_distribution ?? {};
                const verdict = bd.pricing_verdict ?? {};
                const trend = bd.rate_trend ?? {};
                const rates = bd.recommended_rates ?? {};

                // Map comps to the JSONB shape
                const compsJson = rawComps.map((c: any) => ({
                    name: c.name ?? "Unknown",
                    source: c.source ?? "OTA",
                    sourceUrl: c.source_url ?? null,
                    rating: c.rating ?? null,
                    reviews: c.reviews ?? null,
                    avgRate: c.avg_nightly_rate ?? 0,
                    weekdayRate: c.weekday_rate ?? null,
                    weekendRate: c.weekend_rate ?? null,
                    minRate: c.min_rate ?? null,
                    maxRate: c.max_rate ?? null,
                }));

                // Upsert: delete existing row for this listing+range, then insert fresh
                await db.delete(benchmarkData).where(
                    and(
                        eq(benchmarkData.listingId, listingId),
                        eq(benchmarkData.dateFrom, dateRange.from),
                        eq(benchmarkData.dateTo, dateRange.to)
                    )
                );

                await db.insert(benchmarkData).values({
                    listingId,
                    dateFrom: dateRange.from,
                    dateTo: dateRange.to,
                    p25Rate: dist.p25 != null ? String(dist.p25) : null,
                    p50Rate: dist.p50 != null ? String(dist.p50) : null,
                    p75Rate: dist.p75 != null ? String(dist.p75) : null,
                    p90Rate: dist.p90 != null ? String(dist.p90) : null,
                    avgWeekday: dist.avg_weekday != null ? String(dist.avg_weekday) : null,
                    avgWeekend: dist.avg_weekend != null ? String(dist.avg_weekend) : null,
                    yourPrice: verdict.your_price != null ? String(verdict.your_price) : null,
                    percentile: verdict.percentile ?? null,
                    verdict: verdict.verdict ?? null,
                    rateTrend: trend.direction ?? null,
                    trendPct: trend.pct_change != null ? String(trend.pct_change) : null,
                    recommendedWeekday: rates.weekday != null ? String(rates.weekday) : null,
                    recommendedWeekend: rates.weekend != null ? String(rates.weekend) : null,
                    recommendedEvent: rates.event_peak != null ? String(rates.event_peak) : null,
                    reasoning: rates.reasoning ?? null,
                    comps: compsJson,
                });

                benchmarkSaved = true;
                console.log(`  💾 Saved 1 benchmark row (${compsJson.length} comps in JSONB) to benchmark_data`);

            } catch (benchmarkErr) {
                // Benchmark save failure is non-fatal — log and continue
                console.error(`  ⚠️ Benchmark save failed (non-fatal):`, benchmarkErr);
            }
        } else if (benchmarkData_raw && !listingId) {
            console.warn(`  ⚠️ Benchmark data received but no listingId — skipped saving`);
        }

        return NextResponse.json({
            success: true,
            summary: structuredData.summary,
            eventsCount: structuredData.events?.length || 0,
            holidaysCount: structuredData.holidays?.length || 0,
            hasCompetitors: !!structuredData.competitors,
            hasPositioning: !!structuredData.positioning,
            totalRecords: recordsToInsert.length,
            area: structuredData.area,
            benchmark: {
                saved: benchmarkSaved,
                compsFound: benchmarkData_raw?.comps?.length ?? 0,
                compsSaved: benchmarkCompsCount,
                verdict: benchmarkData_raw?.pricing_verdict?.verdict ?? null,
                p50: benchmarkData_raw?.rate_distribution?.p50 ?? null,
            },
        });

    } catch (error) {
        console.error("Market Setup Route Error:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Internal Server Error"
        }, { status: 500 });
    }
}
