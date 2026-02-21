"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Loader2, Settings, Zap, Calendar as CalendarIcon, PanelRightClose, PanelRightOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useContextStore } from "@/stores/context-store";
import type { ListingRow } from "@/lib/db";
import { DateRangePicker } from "./date-range-picker";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface PropertyWithMetrics extends ListingRow {
  occupancy?: number;
  avgPrice?: number | string;
}

interface Props {
  properties: PropertyWithMetrics[];
}

interface ChatSession {
  sessionId: string;
  messages: Message[];
  isChatActive: boolean;
  lastActivityDate: number;
  contextKey: string; // e.g., "portfolio_2026-03-01_2026-03-31" or "property_5_..."
}

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function UnifiedChatInterface({ properties }: Props) {
  const { contextType, propertyId, propertyName, isSidebarOpen, toggleSidebar } = useContextStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChatActive, setIsChatActive] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 30),
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to generate a unique session ID
  const generateSessionId = () => `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const [sessionId, setSessionId] = useState(generateSessionId());
  const [isSettingUp, setIsSettingUp] = useState(false);

  // Dynamic calendar metrics (occupancy + avg price for selected date range)
  const [calendarMetrics, setCalendarMetrics] = useState<{
    occupancy: number;
    avgPrice: number;
    bookedDays: number;
    availableDays: number;
    blockedDays: number;
    totalDays: number;
  } | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  // Generate a unique key for the current context (contextType + propertyId + dateRange)
  const getContextKey = () => {
    const fromStr = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "";
    const toStr = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : fromStr;
    const propStr = contextType === "property" ? propertyId : "all";
    return `${contextType}_${propStr}_${fromStr}_${toStr}`;
  };

  // 1. Session Initialization & Hydration
  useEffect(() => {
    // Only run on client after mount (to avoid hydration mismatches if checking localStorage during SSR)
    if (typeof window === "undefined") return;

    const currentKey = getContextKey();
    const storedSessionJson = localStorage.getItem("priceos_chat_session");

    if (storedSessionJson) {
      try {
        const session: ChatSession = JSON.parse(storedSessionJson);
        const timeSinceActive = Date.now() - session.lastActivityDate;

        // Valid session check: matches current context AND is within 15-minute timeout window
        if (session.contextKey === currentKey && timeSinceActive < SESSION_TIMEOUT_MS) {
          console.log("🔄 Restoring active chat session from local storage.");
          setSessionId(session.sessionId);
          setMessages(session.messages);
          setIsChatActive(session.isChatActive);
          return;
        } else if (session.contextKey !== currentKey) {
          console.log("🔄 Context changed. Starting new chat session.");
        } else {
          console.log("⏳ Chat session timed out (15 mins inactive). Starting new session.");
        }
      } catch (err) {
        console.error("Failed to parse stored chat session", err);
      }
    }

    // If no valid session exists, reset everything to a blank slate for this new context
    setSessionId(generateSessionId());
    setMessages([]);
    setIsChatActive(false);
  }, [contextType, propertyId, dateRange?.from?.getTime(), dateRange?.to?.getTime()]);

  // 2. Persist Session on State Changes
  useEffect(() => {
    if (typeof window === "undefined" || (!isChatActive && messages.length === 0)) return;

    const session: ChatSession = {
      sessionId,
      messages,
      isChatActive,
      lastActivityDate: Date.now(),
      contextKey: getContextKey(),
    };

    localStorage.setItem("priceos_chat_session", JSON.stringify(session));
  }, [messages, isChatActive, sessionId]);

  // Fetch calendar metrics when date range or property changes
  useEffect(() => {
    const fetchMetrics = async () => {
      if (contextType !== "property" || !propertyId || !dateRange?.from || !dateRange?.to) {
        setCalendarMetrics(null);
        return;
      }

      setIsLoadingMetrics(true);
      try {
        const from = format(dateRange.from, "yyyy-MM-dd");
        const to = format(dateRange.to, "yyyy-MM-dd");
        const res = await fetch(`/api/calendar-metrics?listingId=${propertyId}&from=${from}&to=${to}`);

        if (res.ok) {
          const data = await res.json();
          setCalendarMetrics({
            occupancy: data.occupancy,
            avgPrice: data.avgPrice,
            bookedDays: data.bookedDays,
            availableDays: data.availableDays,
            blockedDays: data.blockedDays,
            totalDays: data.totalDays,
          });
        }
      } catch (err) {
        console.error("Failed to fetch calendar metrics:", err);
      } finally {
        setIsLoadingMetrics(false);
      }
    };

    fetchMetrics();
  }, [contextType, propertyId, dateRange?.from?.getTime(), dateRange?.to?.getTime()]);

  const handleMarketSetup = async () => {
    if (isSettingUp || !dateRange?.from || !dateRange?.to) return;

    setIsSettingUp(true);

    toast("Syncing Market Intelligence...", {
      description: "Agents are fetching real-time data for your selected dates...",
    });

    try {
      const response = await fetch("/api/market-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateRange: {
            from: format(dateRange.from, "yyyy-MM-dd"),
            to: format(dateRange.to, "yyyy-MM-dd"),
          },
          context: {
            type: contextType,
            propertyId,
            propertyName,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes("403") || data.error?.includes("permission")) {
          throw new Error("Lyzr Permission Error: Your API key doesn't have permission to access this Agent.");
        }
        throw new Error(data.error || "Setup failed");
      }

      // Once setup is done, activate chat silently
      setIsChatActive(true);

      toast.success("Setup Complete", {
        description: `Analyzed ${data.eventsCount} market signals. Chat is now active.`,
      });

    } catch (error) {
      console.error("Market Setup Error:", error);
      toast.error("Market Sync Failed", {
        description: error instanceof Error ? error.message : "Marketing Agent could not be reached.",
      });
    } finally {
      setIsSettingUp(false);
    }
  };

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Find the selected property to display metrics
  const selectedProperty =
    contextType === "property" && propertyId
      ? properties.find((p) => p.id === propertyId)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    console.log(`\n%c📩 USER MESSAGE — ${new Date().toISOString()}`, 'color: #60a5fa; font-weight: bold');
    console.log(`  Context:  ${contextType}`);
    console.log(`  Property: ${propertyName || '(portfolio)'}`);
    console.log(`  Message:  "${input}"`);

    const startTime = performance.now();
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          context: {
            type: contextType,
            propertyId: contextType === "property" ? propertyId : undefined,
            propertyName: contextType === "property" ? propertyName : undefined,
          },
          dateRange: dateRange ? {
            from: format(dateRange.from!, "yyyy-MM-dd"),
            to: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : format(dateRange.from!, "yyyy-MM-dd"),
          } : undefined,
          isChatActive,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      // Add a blank placeholder assistant message immediately
      const assistantMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: "assistant", content: " " },
      ]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let currentContent = "";
      let chunkCount = 0;

      console.log(`%c[UI-Stream] 🟢 Streaming connection opened. Reading data...`, 'color: #3b82f6; font-weight: bold;');

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log(`%c[UI-Stream] 🏁 Stream [DONE]. Total Chunks: ${chunkCount}`, 'color: #10b981; font-weight: bold;');
            break;
          }

          chunkCount++;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\\n');
          buffer = lines.pop() || "";

          // Optionally, log the chunk count (uncomment for very verbose debugging)
          // console.log(`[UI-Stream] Received chunk #${chunkCount} (${lines.length} lines)`);

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              try {
                const dataStr = trimmed.slice(6);
                if (dataStr === "[DONE]") {
                  console.log(`[UI-Stream] 🏁 Server sent [DONE] payload.`);
                  continue;
                }

                const data = JSON.parse(dataStr);

                // Track lifecycle statuses
                if (data.event_type !== "llm_generation") {
                  console.log(`%c[UI-Stream] 🔄 Status Update: ${data.event_type} (${data.status})`, 'color: #8b5cf6;');
                }

                if (data.event_type === "llm_generation" && data.message) {
                  // Protect against either cumulative string logic or delta token logic natively
                  if (data.message.startsWith(currentContent) && currentContent.length > 0) {
                    currentContent = data.message;
                  } else if (currentContent.startsWith(data.message) && data.message.length > 0) {
                    // Ignore, out of order or older cumulative packet
                  } else {
                    // It is a delta token
                    currentContent += data.message;
                  }

                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: currentContent }
                        : m
                    )
                  );
                }
              } catch (e) {
                console.warn(`[UI-Stream] ⚠️ Incomplete JSON, buffered for next frame...`);
              }
            }
          }
        }
      }

      const duration = Math.round(performance.now() - startTime);
      console.log(`%c✅ AGENT REPLY STREAMED — ${duration}ms`, 'color: #34d399; font-weight: bold');

    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      console.error(`%c❌ CHAT ERROR — ${duration}ms`, 'color: #ef4444; font-weight: bold');
      console.error(`  User Msg: "${input}"`);
      console.error(`  Error:`, error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error connecting to the agent. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full">
      {/* Header */}
      <div className="border-b bg-muted/30 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap overflow-hidden">
          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-lg bg-primary/10 p-2">
              <Send className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {contextType === "property" && propertyName
                  ? propertyName
                  : "Portfolio Chat"}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {contextType === "property"
                  ? "Pricing & Market Copilot"
                  : `Portfolio Revenue Analysis`}
              </p>
            </div>
          </div>

          {/* New Control Flow: Range -> Setup -> Activate */}
          <div className="flex items-center gap-3 bg-background/50 p-1.5 rounded-xl border shadow-sm">
            <DateRangePicker
              date={dateRange}
              setDate={(newRange) => {
                setDateRange(newRange);
                if (!newRange?.from || !newRange?.to) {
                  setIsChatActive(false);
                }
              }}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={handleMarketSetup}
              disabled={isLoading || isSettingUp || !dateRange?.from || !dateRange?.to}
              className="h-9 gap-2 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/40 disabled:opacity-30"
            >
              <Settings className={`h-4 w-4 ${isSettingUp ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{isSettingUp ? "Processing..." : "Setup"}</span>
            </Button>

            <div className="flex items-center gap-3 pl-2 border-l ml-1">
              <div className="flex flex-col items-end mr-1">
                <Label htmlFor="activate-chat" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-none mb-1">
                  Activate
                </Label>
                <span className={`text-[10px] font-bold leading-none ${isChatActive ? 'text-amber-500' : 'text-muted-foreground opacity-50'}`}>
                  {isChatActive ? 'ON' : 'OFF'}
                </span>
              </div>
              <Switch
                id="activate-chat"
                checked={isChatActive}
                disabled={true} // Controlled by Setup button only
                className="data-[state=checked]:bg-amber-500 disabled:opacity-100 cursor-default"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 ml-auto">
            {/* Occupancy & Price Metrics — Dynamic from calendar_days */}
            {contextType === "property" && propertyId && (
              <div className="hidden lg:flex items-center gap-6 shrink-0 min-w-max bg-background border px-4 py-1.5 rounded-xl shadow-sm">
                <div className="text-right">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Occupancy
                  </p>
                  <div className="flex items-baseline gap-1 justify-end">
                    {isLoadingMetrics ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : calendarMetrics ? (
                      <>
                        <span className={`text-lg font-bold ${calendarMetrics.occupancy >= 70 ? 'text-emerald-500' :
                          calendarMetrics.occupancy >= 50 ? 'text-amber-500' :
                            'text-red-500'
                          }`}>
                          {calendarMetrics.occupancy}%
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-muted-foreground">—</span>
                    )}
                  </div>
                  {calendarMetrics && (
                    <p className="text-[9px] text-muted-foreground">
                      {calendarMetrics.bookedDays}/{calendarMetrics.totalDays} days
                    </p>
                  )}
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-right">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Avg Price
                  </p>
                  <div className="flex items-baseline gap-1 justify-end">
                    {isLoadingMetrics ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : calendarMetrics ? (
                      <>
                        <span className="text-lg font-bold">
                          {calendarMetrics.avgPrice.toFixed(0)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          AED
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={toggleSidebar}
              className="h-9 w-9 shrink-0 shadow-sm"
              title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            >
              {isSidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <Card
              className={`max-w-2xl ${message.role === "user" ? "bg-primary text-primary-foreground" : ""}`}
            >
              <CardContent className="p-4 overflow-x-auto">
                <div className="prose prose-sm dark:prose-invert max-w-none break-words [&>table]:w-full [&>table]:border-collapse [&>table]:my-4 [&>table_th]:border [&>table_th]:p-2 [&>table_td]:border [&>table_td]:p-2 [&>table_th]:bg-muted/50 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>p]:mb-2 last:mb-0">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <Card className="max-w-2xl">
              <CardContent className="p-4 flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Thinking...
                </span>
              </CardContent>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4 bg-background">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              !isChatActive
                ? "Select date range and click 'Setup' to start..."
                : contextType === "property"
                  ? "Ask about pricing, events, market rates..."
                  : "Ask about your portfolio performance..."
            }
            disabled={isLoading || !isChatActive}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim() || !isChatActive}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
// Toaster was added to layout.tsx
