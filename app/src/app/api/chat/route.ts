import { NextRequest, NextResponse } from "next/server";
import { MANAGER_AGENT_ID } from "@/lib/agents/constants";
import { db } from "@/lib/db";
import { chatMessages, inventoryMaster } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * POST /api/chat
 *
 * Unified chat API that forwards user messages to the Lyzr pricing agent.
 * Follows the exact calling pattern from lyzr_client.py:
 *
 *   POST https://agent-prod.studio.lyzr.ai/v3/inference/chat/
 *   Headers: { "Content-Type": "application/json", "x-api-key": <key> }
 *   Body:    { user_id, agent_id, session_id, message }
 */

const LYZR_API_URL =
  process.env.LYZR_API_URL ||
  "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";
const LYZR_API_KEY = process.env.LYZR_API_KEY || "";
const AGENT_ID = process.env.AGENT_ID || MANAGER_AGENT_ID;

interface ChatContext {
  type: "portfolio" | "property";
  propertyId?: number;
  propertyName?: string;
  metrics?: {
    occupancy: number;
    bookedDays: number;
    bookableDays: number;
  };
}

interface ChatRequest {
  message: string;
  context: ChatContext;
  sessionId?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  isChatActive?: boolean;
}

export async function POST(req: NextRequest) {
  const requestTimestamp = new Date().toISOString();
  const startTime = performance.now();

  try {
    const body: ChatRequest = await req.json();
    const { message, context, sessionId, dateRange, isChatActive } = body;

    // ═══════════════════════════════════════════
    // 📩 LOG: USER INPUT RECEIVED
    // ═══════════════════════════════════════════
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📩 USER INPUT — ${requestTimestamp}`);
    console.log(`${'═'.repeat(60)}`);
    console.log(`  Context:     ${context.type}`);
    console.log(`  Property:    ${context.propertyName || '(portfolio)'}`);
    console.log(`  Range:       ${dateRange ? `${dateRange.from} to ${dateRange.to}` : '(none)'}`);
    console.log(`  Active:      ${isChatActive ? 'YES' : 'NO'}`);
    console.log(`  Message:     "${message}"`);
    console.log(`${'─'.repeat(60)}`);

    if (!message?.trim() && !isChatActive) {
      console.log(`  ❌ REJECTED: Empty message`);
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!LYZR_API_KEY) {
      console.log(`  ❌ REJECTED: LYZR_API_KEY not configured`);
      return NextResponse.json(
        {
          error: "LYZR_API_KEY not configured",
          message:
            "The AI agent is not configured. Please add your LYZR_API_KEY in Settings or .env file.",
        },
        { status: 500 }
      );
    }

    if (!AGENT_ID) {
      console.log(`  ❌ REJECTED: AGENT_ID not configured`);
      return NextResponse.json(
        {
          error: "AGENT_ID not configured",
          message:
            "The AI agent ID is not configured. Please add AGENT_ID to your .env file.",
        },
        { status: 500 }
      );
    }

    // Build the message to send to the agent
    let agentMessage = message;
    const rangeTag = dateRange ? `Analysis Range: ${dateRange.from} to ${dateRange.to}` : "";

    if (context.type === "property" && context.propertyName) {
      let metricStr = "";
      if (context.metrics) {
        metricStr = `\nCRITICAL CONTEXT - USE THESE EXACT METRICS IN YOUR RESPONSE:\n- Date Range Occupancy: ${context.metrics.occupancy}% (${context.metrics.bookedDays} booked / ${context.metrics.bookableDays} bookable days)\n`;
      }
      agentMessage = `Property ID: ${context.propertyId}\nProperty: ${context.propertyName}\n${rangeTag}${metricStr}\nUser query: ${message || "Please analyze this property for the selected dates."}`;
    } else if (context.type === "portfolio") {
      agentMessage = `Portfolio view (all properties)\n${rangeTag}\nUser query: ${message || "Please analyze my portfolio for the selected dates."}`;
    }

    // Generate a stable session ID per context
    const lyzrSessionId =
      sessionId ||
      (context.type === "portfolio"
        ? "portfolio-session"
        : `property-${context.propertyId}-session`);

    // Save user message to database
    try {
      if (message?.trim()) {
        await db.insert(chatMessages).values({
          userId: "user-1",
          sessionId: lyzrSessionId,
          role: "user",
          content: message,
          listingId: context.propertyId || null,
          structured: { context, dateRange },
        });
      }
    } catch (err) {
      console.error("Failed to save user message to DB:", err);
    }

    // Prepare the Lyzr request payload
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": LYZR_API_KEY,
    };

    const payload = {
      user_id: "priceos-user",
      agent_id: AGENT_ID,
      session_id: lyzrSessionId,
      message: agentMessage,
    };

    // Mask API key for logging
    const maskedKey =
      LYZR_API_KEY.length > 8
        ? `${LYZR_API_KEY.slice(0, 4)}...${LYZR_API_KEY.slice(-4)}`
        : "****";

    // ═══════════════════════════════════════════
    // 📤 LOG: API REQUEST TO LYZR AGENT
    // ═══════════════════════════════════════════
    console.log(`\n📤 LYZR CHAT REQUEST — Sending to agent`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`  URL:         ${LYZR_API_URL}`);
    console.log(`  API Key:     ${maskedKey}`);
    console.log(`  Agent ID:    ${AGENT_ID}`);
    console.log(`  Session ID:  ${lyzrSessionId}`);
    console.log(`  Payload:     ${JSON.stringify({ ...payload, message: payload.message.substring(0, 100) + '...' })}`);
    console.log(`${'─'.repeat(60)}`);

    // Call the Lyzr inference chat endpoint
    const response = await fetch(LYZR_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const rawText = await response.text();
      const duration = Math.round(performance.now() - startTime);
      console.error(`\n❌ LYZR API ERROR — ${response.status}`);
      console.error(`${'─'.repeat(60)}`);
      console.error(`  Error Body:  ${rawText.substring(0, 500)}`);
      console.error(`${'─'.repeat(60)}`);

      return NextResponse.json(
        {
          message: "I'm having trouble connecting to the AI agent right now. Please try again in a moment.",
          error: `Lyzr API returned ${response.status}`,
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    const duration = Math.round(performance.now() - startTime);

    const { text: agentReply, parsedJson } = extractAgentMessage(data);

    // Save assistant message and any proposals to database
    try {
      if (agentReply) {
        await db.insert(chatMessages).values({
          userId: "user-1",
          sessionId: lyzrSessionId,
          role: "assistant",
          content: agentReply,
          listingId: context.propertyId || null,
          structured: { context, dateRange, proposals: parsedJson?.proposals || null },
        });
        console.log(`\n✅ AGENT REPLY RECEIVED & SAVED — ${duration}ms`);
      }
    } catch (err) {
      console.error("Failed to save assistant message & proposals to DB:", err);
    }

    return NextResponse.json({
      message: agentReply || "No message received from agent",
      proposals: parsedJson?.proposals || null
    });

  } catch (error) {
    const duration = Math.round(performance.now() - startTime);

    // ═══════════════════════════════════════════
    // 💥 LOG: UNHANDLED ERROR
    // ═══════════════════════════════════════════
    console.error(`\n💥 UNHANDLED ERROR — ${requestTimestamp}`);
    console.error(`${'─'.repeat(60)}`);
    console.error(`  Error:       ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(`  Stack:       ${error instanceof Error ? error.stack?.substring(0, 300) : 'N/A'}`);
    console.error(`  Duration:    ${duration}ms`);
    console.error(`${'═'.repeat(60)}\n`);

    return NextResponse.json(
      {
        message: "Sorry, something went wrong. Please try again.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Extract the agent's text message from the Lyzr response and parse JSON if needed.
 */
function extractAgentMessage(response: any): { text: string; parsedJson: any | null } {
  let rawStr = "";

  // Format 1: Direct response string (common from Lyzr chat endpoint)
  if (typeof response.response === "string") {
    rawStr = response.response;
  }
  // Format 2: Response with nested message
  else if (response.response?.message) {
    rawStr = response.response.message;
  }
  // Format 3: Response with nested result containing message
  else if (response.response?.result?.message) {
    rawStr = response.response.result.message;
  }
  // Format 4: Response with nested result containing text
  else if (response.response?.result?.text) {
    rawStr = response.response.result.text;
  }
  // Format 5: Response with nested result containing answer
  else if (response.response?.result?.answer) {
    rawStr = response.response.result.answer;
  }
  // Format 6: Direct message field
  else if (typeof response.message === "string") {
    rawStr = response.message;
  }
  // Format 7: OpenAI-style choices (from the /chat/completions variant)
  else if (response.choices?.[0]?.message?.content) {
    rawStr = response.choices[0].message.content;
  }
  // Format 8: Direct result string
  else if (typeof response.result === "string") {
    rawStr = response.result;
  }

  if (!rawStr) {
    console.warn(
      "[Chat API] Unknown Lyzr response format:",
      JSON.stringify(response).substring(0, 500)
    );
    return { text: "I received your message but couldn't parse my response. Please try again.", parsedJson: null };
  }

  // Strip markdown json formatting if present
  let cleanStr = rawStr;
  if (cleanStr.startsWith("```json")) {
    cleanStr = cleanStr.replace(/```json\s*/, "").replace(/\s*```$/, "");
  }

  // Try parsing to see if it's the structured CRO router or agent response
  try {
    const parsed = JSON.parse(cleanStr);

    // Log the parsed JSON to the terminal so we can see what the agent actually returned!
    console.log(`\n🤖 LYZR AGENT PARSED JSON:`);
    console.dir(parsed, { depth: null, colors: true });

    // Prefer chat_response from CRO Router
    if (parsed.chat_response) {
      return { text: parsed.chat_response, parsedJson: parsed };
    }

    // Fallback to summary from individual agents (like Property Analyst)
    if (parsed.summary) {
      return { text: parsed.summary, parsedJson: parsed };
    }

    // Fallback: If it's a JSON but has no chat_response or summary, stringify it cleanly
    return { text: "```json\n" + JSON.stringify(parsed, null, 2) + "\n```", parsedJson: parsed };
  } catch (e) {
    // If it's not valid JSON, just return the raw string
    console.log(`\n🤖 LYZR AGENT RAW TEXT:`);
    console.log(rawStr);
    return { text: rawStr, parsedJson: null };
  }
}
