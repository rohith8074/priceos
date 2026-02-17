"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Loader2, Building2, TrendingUp, DollarSign, AlertCircle } from "lucide-react";
import { ProposalCard } from "./proposal-card";
import { useContextStore } from "@/stores/context-store";
import { useAgentCache } from "@/lib/cache/agent-cache-provider";
import type { ListingRow } from "@/lib/db";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  proposals?: Array<{
    id: number;
    dateRangeStart: string;
    dateRangeEnd: string;
    currentPrice: number;
    proposedPrice: number;
    changePct: number;
    riskLevel: string;
    reasoning: string;
  }>;
  metadata?: {
    propertyCount?: number;
    totalRevenue?: number;
    avgOccupancy?: number;
  };
}

interface Props {
  properties: ListingRow[];
}

// Mock occupancy data - in real app, fetch from API
function getOccupancy(propertyId: number): number {
  const occupancies: Record<number, number> = {
    1: 68,
    2: 72,
    3: 55,
    4: 85,
    5: 63,
  };
  return occupancies[propertyId] || 0;
}

export function UnifiedChatInterface({ properties }: Props) {
  const { contextType, propertyId, propertyName } = useContextStore();
  const { cache, isReady } = useAgentCache();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize greeting message when context changes
  useEffect(() => {
    if (contextType === "portfolio") {
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: `Hello! I'm your portfolio pricing analyst. I can help you with:\n\n• Portfolio-wide performance analysis\n• Identify underperforming properties\n• Generate batch pricing proposals\n• Compare properties and markets\n• Revenue forecasting\n\nYou have ${properties.length} properties in your portfolio. What would you like to analyze?`,
        },
      ]);
    } else if (contextType === "property" && propertyName) {
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: `Hello! I'm your AI pricing analyst for ${propertyName}. I can help you with:\n\n• Analyze pricing for specific dates\n• Generate pricing proposals\n• Review market events and demand\n• Execute approved price changes\n\nWhat would you like to do?`,
        },
      ]);
    }
  }, [contextType, propertyId, propertyName, properties.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isReady) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call unified chat API with context and cache
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          context: {
            type: contextType,
            propertyId: contextType === "property" ? propertyId : undefined,
          },
          cache: cache, // Include cache metadata
          sessionId: `session-${Date.now()}`,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        proposals: data.proposals,
        metadata: data.metadata,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (proposalId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/proposals/${proposalId}/approve`, {
        method: "POST",
      });

      const data = await response.json();

      const successMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.success
          ? `✅ Price updated successfully! ${data.message}`
          : `❌ Failed to update price: ${data.message}`,
      };

      setMessages((prev) => [...prev, successMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Failed to execute proposal. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (proposalId: number) => {
    const confirmMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content:
        "Proposal rejected. Would you like me to generate a different recommendation?",
    };
    setMessages((prev) => [...prev, confirmMessage]);
  };

  // Calculate metrics based on context
  const currentProperty =
    contextType === "property"
      ? properties.find((p) => p.id === propertyId)
      : null;

  const portfolioMetrics =
    contextType === "portfolio"
      ? {
          totalProperties: properties.length,
          avgOccupancy:
            properties.reduce((sum, p) => sum + getOccupancy(p.id), 0) /
              properties.length || 0,
          totalRevenue: properties.reduce(
            (sum, p) => sum + parseFloat(p.price as string),
            0
          ),
        }
      : null;

  const propertyMetrics =
    contextType === "property" && currentProperty
      ? {
          occupancy: getOccupancy(currentProperty.id),
          price: parseFloat(currentProperty.price as string),
          bedrooms: currentProperty.bedroomsNumber,
          area: currentProperty.area,
        }
      : null;

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full">
      {/* Cache Loading State */}
      {!isReady && (
        <div className="border-b bg-muted/30 px-6 py-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading agent context...
          </div>
        </div>
      )}

      {/* Cache Stale Warning */}
      {isReady && cache?.meta.isStale && (
        <div className="border-b bg-amber-500/10 px-6 py-2">
          <div className="flex items-center gap-2 text-xs text-amber-600">
            <AlertCircle className="h-3 w-3" />
            Data may be stale. Consider refreshing via the sidebar.
          </div>
        </div>
      )}

      {/* Metrics Header */}
      <div className="border-b bg-muted/30 px-6 py-4">
        {contextType === "portfolio" && portfolioMetrics && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Properties</p>
                <p className="text-lg font-bold">
                  {portfolioMetrics.totalProperties}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-green-500/10 p-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Occupancy</p>
                <p className="text-lg font-bold">
                  {Math.round(portfolioMetrics.avgOccupancy)}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <DollarSign className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-lg font-bold">
                  AED {portfolioMetrics.totalRevenue.toLocaleString("en-US")}
                </p>
              </div>
            </div>
          </div>
        )}

        {contextType === "property" && propertyMetrics && currentProperty && (
          <div className="flex items-center gap-6">
            <div>
              <h3 className="text-lg font-bold">{currentProperty.name}</h3>
              <p className="text-xs text-muted-foreground">
                {propertyMetrics.area} • {propertyMetrics.bedrooms} bed
              </p>
            </div>
            <div className="flex items-center gap-6 ml-auto">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-green-500/10 p-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Occupancy</p>
                  <p className="text-lg font-bold">
                    {propertyMetrics.occupancy}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <DollarSign className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="text-lg font-bold">
                    {currentProperty.currencyCode}{" "}
                    {propertyMetrics.price.toLocaleString("en-US")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
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
              <CardContent className="p-4">
                <p className="whitespace-pre-wrap">{message.content}</p>

                {/* Render proposals if present */}
                {message.proposals && message.proposals.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {message.proposals.map((proposal) => (
                      <ProposalCard
                        key={proposal.id}
                        proposal={proposal}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        isLoading={isLoading}
                      />
                    ))}
                  </div>
                )}

                {/* Render metadata if present (portfolio view) */}
                {message.metadata && (
                  <div className="mt-4 grid grid-cols-3 gap-4 p-3 bg-muted rounded-md">
                    {message.metadata.propertyCount !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Properties
                        </p>
                        <p className="text-lg font-semibold">
                          {message.metadata.propertyCount}
                        </p>
                      </div>
                    )}
                    {message.metadata.totalRevenue !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total Revenue
                        </p>
                        <p className="text-lg font-semibold">
                          AED{" "}
                          {message.metadata.totalRevenue.toLocaleString(
                            "en-US"
                          )}
                        </p>
                      </div>
                    )}
                    {message.metadata.avgOccupancy !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Avg Occupancy
                        </p>
                        <p className="text-lg font-semibold">
                          {message.metadata.avgOccupancy}%
                        </p>
                      </div>
                    )}
                  </div>
                )}
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
                  {contextType === "portfolio"
                    ? "Analyzing portfolio..."
                    : "Analyzing..."}
                </span>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4 bg-background">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              contextType === "portfolio"
                ? "Ask about your portfolio (e.g., 'Which properties are underperforming?')"
                : "Ask me to analyze pricing, generate proposals, or execute changes..."
            }
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim() || !isReady}>
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
