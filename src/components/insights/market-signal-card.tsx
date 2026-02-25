"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, MessageSquare } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import type { CompetitorSignal } from "@/data/mock-competitors";

interface MarketSignalCardProps {
  signal: CompetitorSignal;
}

export function MarketSignalCard({ signal }: MarketSignalCardProps) {
  const { open } = useChatStore();
  const isCompression = signal.signal === "compression";

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">{signal.area}</h3>
            <p className="text-xs text-muted-foreground">
              {new Date(signal.dateRange.start).toLocaleDateString("en", { month: "short", day: "numeric" })}
              {" - "}
              {new Date(signal.dateRange.end).toLocaleDateString("en", { month: "short", day: "numeric" })}
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              isCompression
                ? "border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                : "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
            }
          >
            {isCompression ? (
              <TrendingUp className="mr-1 h-3 w-3" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3" />
            )}
            {signal.signal}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">
          {signal.reasoning}
        </p>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Avg Price</p>
            <p className="font-medium">{signal.dataPoints.averagePrice} AED</p>
          </div>
          <div>
            <p className="text-muted-foreground">Change</p>
            <p
              className={
                signal.dataPoints.priceChange > 0
                  ? "font-medium text-green-600"
                  : "font-medium text-red-600"
              }
            >
              {signal.dataPoints.priceChange > 0 ? "+" : ""}
              {signal.dataPoints.priceChange}%
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Occupancy</p>
            <p className="font-medium">{signal.dataPoints.occupancyRate}%</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            Confidence: {Math.round(signal.confidence * 100)}%
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-xs"
            onClick={() =>
              open(
                `Tell me about the market ${signal.signal} in ${signal.area}. Average price: ${signal.dataPoints.averagePrice} AED, price change: ${signal.dataPoints.priceChange}%.`
              )
            }
          >
            <MessageSquare className="h-3 w-3" />
            Ask AI
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
