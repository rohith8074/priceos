import { NextRequest, NextResponse } from "next/server";
import { MANAGER_AGENT_ID } from "@/lib/agents/constants";
import { db } from "@/lib/db";
import { chatMessages } from "@/lib/db/schema";

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

const LYZR_STREAM_URL =
  process.env.LYZR_STREAM_URL ||
  "https://agent-prod.studio.lyzr.ai/v3/inference/stream";
const LYZR_API_KEY = process.env.LYZR_API_KEY || "";
const AGENT_ID = process.env.AGENT_ID || MANAGER_AGENT_ID;

interface ChatContext {
  type: "portfolio" | "property";
  propertyId?: number;
  propertyName?: string;
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
      agentMessage = `Property: ${context.propertyName}\n${rangeTag}\nUser query: ${message || "Please analyze this property for the selected dates."}`;
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
    // 📤 LOG: STREAM REQUEST TO LYZR AGENT
    // ═══════════════════════════════════════════
    console.log(`\n📤 LYZR STREAM REQUEST — Sending to agent`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`  URL:         ${LYZR_STREAM_URL}`);
    console.log(`  API Key:     ${maskedKey}`);
    console.log(`  Agent ID:    ${AGENT_ID}`);
    console.log(`  Session ID:  ${lyzrSessionId}`);
    console.log(`${'─'.repeat(60)}`);

    // Call the Lyzr inference stream endpoint
    const response = await fetch(LYZR_STREAM_URL, {
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

    if (!response.body) {
      return NextResponse.json({ error: "No stream from Lyzr" }, { status: 500 });
    }

    // Pass the SSE stream through to the client, while extracting the text to save to DB
    const decoder = new TextDecoder("utf-8");
    let fullAgentReply = "";

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const chunkStr = decoder.decode(chunk, { stream: true });
        const lines = chunkStr.split('\\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') continue;

              const data = JSON.parse(dataStr);
              if (data.event_type === "llm_generation" && data.message) {
                // Keep track of the message either cumulatively or via delta
                if (data.message.startsWith(fullAgentReply) && fullAgentReply.length > 0) {
                  fullAgentReply = data.message;
                } else if (!fullAgentReply.startsWith(data.message)) {
                  fullAgentReply += data.message;
                }
              }
            } catch (e) {
              // Ignore partial JSON parsing errors
            }
          }
        }
        controller.enqueue(chunk); // pass the raw SSE chunk identical to original stream
      },
      async flush() {
        // Save assistant message to database
        try {
          if (fullAgentReply) {
            await db.insert(chatMessages).values({
              userId: "user-1",
              sessionId: lyzrSessionId,
              role: "assistant",
              content: fullAgentReply,
              listingId: context.propertyId || null,
              structured: { context, dateRange },
            });
            console.log(`\n✅ AGENT REPLY STREAMED & SAVED — ${new Date().toISOString()}`);
          }
        } catch (err) {
          console.error("Failed to save assistant message to DB:", err);
        }
      }
    });

    return new NextResponse(response.body.pipeThrough(transformStream), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
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
 * Extract the agent's text message from the Lyzr response.
 *
 * The Lyzr `/v3/inference/chat/` endpoint returns a JSON response.
 * Based on lyzr_client.py, the response is used directly via `response.json()`.
 * We handle multiple possible response formats for robustness.
 */
function extractAgentMessage(response: any): string {
  // Format 1: Direct response string (common from Lyzr chat endpoint)
  if (typeof response.response === "string") {
    return response.response;
  }

  // Format 2: Response with nested message
  if (response.response?.message) {
    return response.response.message;
  }

  // Format 3: Response with nested result containing message
  if (response.response?.result?.message) {
    return response.response.result.message;
  }

  // Format 4: Response with nested result containing text
  if (response.response?.result?.text) {
    return response.response.result.text;
  }

  // Format 5: Response with nested result containing answer
  if (response.response?.result?.answer) {
    return response.response.result.answer;
  }

  // Format 6: Direct message field
  if (typeof response.message === "string") {
    return response.message;
  }

  // Format 7: OpenAI-style choices (from the /chat/completions variant)
  if (response.choices?.[0]?.message?.content) {
    return response.choices[0].message.content;
  }

  // Format 8: Direct result string
  if (typeof response.result === "string") {
    return response.result;
  }

  // Fallback: stringify the response
  console.warn(
    "[Chat API] Unknown Lyzr response format:",
    JSON.stringify(response).substring(0, 500)
  );
  return "I received your message but couldn't parse my response. Please try again.";
}
