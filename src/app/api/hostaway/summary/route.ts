import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guestSummaries, hostawayConversations, mockHostawayReplies, listings } from "@/lib/db/schema";
import { eq, and, lte, gte } from "drizzle-orm";

/**
 * GET /api/hostaway/summary?listingId=X&from=YYYY-MM-DD&to=YYYY-MM-DD
 * 
 * Returns cached summary if it exists for this listing + date range.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");

    if (!listingId || !dateFrom || !dateTo) {
        return NextResponse.json({ error: "listingId, from, to required" }, { status: 400 });
    }

    console.log(`📋 [Summary] Checking cache for listing ${listingId}, ${dateFrom} → ${dateTo}`);

    try {
        const cached = await db.select().from(guestSummaries).where(
            and(
                eq(guestSummaries.listingId, parseInt(listingId)),
                eq(guestSummaries.dateFrom, dateFrom),
                eq(guestSummaries.dateTo, dateTo)
            )
        ).limit(1);

        if (cached.length > 0) {
            console.log(`✅ [Summary] Cache HIT — returning stored summary`);
            return NextResponse.json({ success: true, summary: cached[0], cached: true });
        }

        console.log(`📭 [Summary] Cache MISS — no summary found`);
        return NextResponse.json({ success: true, summary: null, cached: false });
    } catch (error) {
        console.error("❌ [Summary] Error:", error);
        return NextResponse.json({ error: "Failed to check summary" }, { status: 500 });
    }
}

/**
 * POST /api/hostaway/summary (to OUR Neon DB only, NOT to Hostaway)
 * 
 * Generates an AI summary from stored conversations, saves to guest_summaries.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { listingId, dateFrom, dateTo } = body;

        if (!listingId || !dateFrom || !dateTo) {
            return NextResponse.json({ error: "listingId, dateFrom, dateTo required" }, { status: 400 });
        }

        console.log(`🤖 [Summary] Generating AI summary for listing ${listingId}, ${dateFrom} → ${dateTo}`);

        // Step 1: Load cached conversations from our Neon DB
        const conversations = await db.select().from(hostawayConversations).where(
            and(
                eq(hostawayConversations.listingId, listingId),
                lte(hostawayConversations.dateFrom, dateTo),
                gte(hostawayConversations.dateTo, dateFrom)
            )
        );

        // Deduplicate rows by hostawayConversationId
        const uniqueConversationsMap = new Map();
        for (const conv of conversations) {
            if (!uniqueConversationsMap.has(conv.hostawayConversationId)) {
                uniqueConversationsMap.set(conv.hostawayConversationId, conv);
            }
        }
        const uniqueConversations = Array.from(uniqueConversationsMap.values());

        if (uniqueConversations.length === 0) {
            return NextResponse.json(
                { error: "No conversations found. Please sync conversations first." },
                { status: 404 }
            );
        }

        // Step 2: Merge with our shadow admin replies
        const enrichedConversations = await Promise.all(
            uniqueConversations.map(async (conv) => {
                const shadowReplies = await db.select().from(mockHostawayReplies).where(
                    eq(mockHostawayReplies.conversationId, conv.hostawayConversationId)
                );

                const allMessages = [
                    ...(conv.messages as { sender: string; text: string; timestamp: string }[]),
                    ...shadowReplies.map(r => ({
                        sender: "admin" as const,
                        text: r.text,
                        timestamp: r.createdAt.toISOString(),
                    }))
                ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                return {
                    id: conv.hostawayConversationId,
                    guestName: conv.guestName,
                    messages: allMessages,
                };
            })
        );

        // Step 3: Get property name
        const [listing] = await db.select({ name: listings.name }).from(listings)
            .where(eq(listings.id, listingId)).limit(1);

        // Step 4: Build prompt and call agent using CHUNKED MAP-REDUCE pattern
        // Why: LLMs have token limits. 100 conversations × 20 messages × 50 tokens = ~100K tokens.
        // Solution: Split into chunks of 15, summarize each chunk, then merge.

        const CHUNK_SIZE = 15; // conversations per chunk
        const chunks: typeof enrichedConversations[] = [];
        for (let i = 0; i < enrichedConversations.length; i += CHUNK_SIZE) {
            chunks.push(enrichedConversations.slice(i, i + CHUNK_SIZE));
        }

        console.log(`📨 [Summary] ${enrichedConversations.length} conversations → ${chunks.length} chunk(s) of max ${CHUNK_SIZE}`);

        let summaryData: any;

        try {
            const lyzrAgentId = process.env.LYZR_Conversation_Summary_Agent_ID;
            const lyzrApiKey = process.env.LYZR_API_KEY;
            const lyzrApiUrl = process.env.LYZR_API_URL || "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";

            if (!lyzrAgentId || !lyzrApiKey) {
                console.warn("⚠️  [Summary] LYZR agent ID or API key not set, will use fallback");
                throw new Error("Lyzr not configured");
            }

            // Helper: call Lyzr agent with a prompt
            const callLyzr = async (prompt: string, sessionSuffix: string): Promise<string | null> => {
                const res = await fetch(lyzrApiUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": lyzrApiKey,
                    },
                    body: JSON.stringify({
                        user_id: "priceos-system",
                        agent_id: lyzrAgentId,
                        session_id: `summary-${listingId}-${sessionSuffix}`,
                        message: prompt,
                    }),
                });
                const json = await res.json();
                if (res.ok && json.response) {
                    return typeof json.response === 'string'
                        ? json.response
                        : json.response?.message || json.response?.data || JSON.stringify(json.response);
                }
                return null;
            };

            if (chunks.length === 1) {
                // SINGLE CHUNK: Direct summarization (≤15 conversations)
                const conversationText = enrichedConversations.map(conv => {
                    // Limit to last 10 messages per conversation to save tokens
                    const recentMsgs = conv.messages.slice(-10);
                    const msgText = recentMsgs.map(m => `  ${m.sender}: "${m.text}"`).join("\n");
                    return `--- Conversation with ${conv.guestName} ---\n${msgText}`;
                }).join("\n\n");

                const prompt = `You are a hospitality operations analyst. Analyze the following guest conversations for the property "${listing?.name || "Property"}" (Date range: ${dateFrom} to ${dateTo}).

For each conversation, create a one-line bullet point summary.
Identify the overall sentiment: "Positive", "Neutral", or "Needs Attention".
Extract the top recurring themes (max 5).
Generate specific action items for the property manager (max 5).
Count how many conversations still need a reply.

CONVERSATIONS:
${conversationText}

Respond in this exact JSON format:
{
  "sentiment": "Positive" | "Neutral" | "Needs Attention",
  "themes": ["theme1", "theme2"],
  "actionItems": ["action1", "action2"],
  "bulletPoints": ["summary1", "summary2"],
  "totalConversations": number,
  "needsReplyCount": number
}`;

                console.log(`📨 [Summary] Single chunk → calling Lyzr agent ${lyzrAgentId}...`);
                const responseText = await callLyzr(prompt, `${dateFrom}-${dateTo}`);
                if (responseText) {
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        summaryData = JSON.parse(jsonMatch[0]);
                        console.log(`✅ [Summary] Lyzr agent returned structured summary`);
                    }
                }
            } else {
                // MULTI-CHUNK: Map-Reduce pattern
                console.log(`📊 [Summary] Map-Reduce: summarizing ${chunks.length} chunks...`);

                const chunkSummaries: string[] = [];

                for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
                    const chunk = chunks[chunkIdx];
                    const conversationText = chunk.map(conv => {
                        // Limit to last 5 messages per conversation to save tokens
                        const recentMsgs = conv.messages.slice(-5);
                        const msgText = recentMsgs.map(m => `  ${m.sender}: "${m.text}"`).join("\n");
                        return `--- ${conv.guestName} ---\n${msgText}`;
                    }).join("\n\n");

                    const mapPrompt = `Analyze these ${chunk.length} guest conversations for "${listing?.name || "Property"}". 
For each, provide: guest name, one-line summary, sentiment (positive/neutral/negative), needs reply (yes/no).
Also list any recurring themes and action items you notice.

CONVERSATIONS:
${conversationText}

Respond as a simple text summary, NOT JSON. Be concise.`;

                    console.log(`   📄 [Summary] Chunk ${chunkIdx + 1}/${chunks.length} (${chunk.length} conversations)...`);
                    const chunkResult = await callLyzr(mapPrompt, `chunk-${chunkIdx}-${dateFrom}`);
                    if (chunkResult) {
                        chunkSummaries.push(`=== Batch ${chunkIdx + 1} (${chunk.length} conversations) ===\n${chunkResult}`);
                    } else {
                        // Fallback: create a basic summary for this chunk
                        const basicSummary = chunk.map(c => {
                            const lastMsg = c.messages[c.messages.length - 1];
                            return `- ${c.guestName}: last message from ${lastMsg?.sender || "unknown"}`;
                        }).join("\n");
                        chunkSummaries.push(`=== Batch ${chunkIdx + 1} (${chunk.length} conversations) ===\n${basicSummary}`);
                    }
                }

                // REDUCE: Merge all chunk summaries into final summary
                const reducePrompt = `You are a hospitality operations analyst. Below are summaries of ${enrichedConversations.length} guest conversations for the property "${listing?.name || "Property"}" (${dateFrom} to ${dateTo}), analyzed in batches.

Merge these batch summaries into ONE final analysis.

BATCH SUMMARIES:
${chunkSummaries.join("\n\n")}

Respond in this exact JSON format:
{
  "sentiment": "Positive" | "Neutral" | "Needs Attention",
  "themes": ["theme1", "theme2", ...up to 5],
  "actionItems": ["action1", "action2", ...up to 5],
  "bulletPoints": ["guestName: summary — status", ...one per conversation],
  "totalConversations": ${enrichedConversations.length},
  "needsReplyCount": number
}`;

                console.log(`   🔗 [Summary] Reduce: merging ${chunkSummaries.length} chunk summaries...`);
                const reduceResult = await callLyzr(reducePrompt, `reduce-${dateFrom}-${dateTo}`);
                if (reduceResult) {
                    const jsonMatch = reduceResult.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        summaryData = JSON.parse(jsonMatch[0]);
                        console.log(`✅ [Summary] Map-Reduce complete → final summary generated`);
                    }
                }
            }
        } catch (agentErr) {
            console.warn("⚠️  [Summary] Lyzr agent call failed, generating local summary...", agentErr);
        }

        // Fallback: generate summary locally if agent fails
        if (!summaryData) {
            const needsReply = enrichedConversations.filter(c => {
                const lastMsg = c.messages[c.messages.length - 1];
                return lastMsg && lastMsg.sender === "guest";
            }).length;

            summaryData = {
                sentiment: needsReply > enrichedConversations.length / 2 ? "Needs Attention" : "Positive",
                themes: [...new Set(enrichedConversations.flatMap(c =>
                    c.messages.filter(m => m.sender === "guest").map(m => {
                        const t = m.text.toLowerCase();
                        if (t.includes("pool") || t.includes("swim")) return "Pool / Amenities";
                        if (t.includes("check") && t.includes("in")) return "Check-in";
                        if (t.includes("park")) return "Parking";
                        if (t.includes("clean")) return "Cleanliness";
                        if (t.includes("ac") || t.includes("air")) return "AC / Maintenance";
                        if (t.includes("price") || t.includes("cost")) return "Pricing";
                        return "General Inquiry";
                    })
                ))].slice(0, 5),
                actionItems: [
                    needsReply > 0 ? `Reply to ${needsReply} pending guest message(s)` : null,
                    "Review recurring guest questions and update listing FAQ",
                    "Ensure amenity information is up-to-date in the listing",
                ].filter(Boolean),
                bulletPoints: enrichedConversations.map(c => {
                    const lastGuestMsg = [...c.messages].reverse().find(m => m.sender === "guest");
                    const lastAdminMsg = [...c.messages].reverse().find(m => m.sender === "admin");
                    const resolved = lastAdminMsg && c.messages.indexOf(lastAdminMsg) > c.messages.indexOf(lastGuestMsg!);
                    return `${c.guestName}: "${lastGuestMsg?.text || "No message"}" — ${resolved ? "Resolved" : "NEEDS REPLY"}`;
                }),
                totalConversations: enrichedConversations.length,
                needsReplyCount: needsReply,
            };
        }

        // Step 5: Save to guest_summaries (upsert pattern: delete old + insert new)
        await db.delete(guestSummaries).where(
            and(
                eq(guestSummaries.listingId, listingId),
                eq(guestSummaries.dateFrom, dateFrom),
                eq(guestSummaries.dateTo, dateTo)
            )
        );

        await db.insert(guestSummaries).values({
            listingId,
            dateFrom,
            dateTo,
            sentiment: summaryData.sentiment,
            themes: summaryData.themes,
            actionItems: summaryData.actionItems,
            bulletPoints: summaryData.bulletPoints,
            totalConversations: summaryData.totalConversations,
            needsReplyCount: summaryData.needsReplyCount,
        });

        console.log(`✅ [Summary] AI summary generated and saved to DB`);

        return NextResponse.json({
            success: true,
            summary: summaryData,
            cached: false,
        });
    } catch (error) {
        console.error("❌ [Summary] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate summary" },
            { status: 500 }
        );
    }
}
