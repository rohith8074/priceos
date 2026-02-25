"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Props {
  proposal: {
    id: number;
    date: string;
    currentPrice: number;
    proposedPrice: number;
    changePct: number;
    riskLevel: string;
    reasoning: string;
  };
  onApprove: (proposalId: number) => void;
  onReject: (proposalId: number) => void;
  isLoading: boolean;
}

export function ProposalCard({ proposal, onApprove, onReject, isLoading }: Props) {
  const isIncrease = proposal.changePct > 0;
  const riskColor = {
    low: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-red-100 text-red-800 border-red-200",
  }[proposal.riskLevel] || "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <Card className="border-2">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header: Date Range + Risk Badge */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              {format(new Date(proposal.date), "EEE, MMM d, yyyy")}
            </div>
            <Badge className={riskColor}>
              {proposal.riskLevel.toUpperCase()} RISK
            </Badge>
          </div>

          {/* Price Change */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Current Price</p>
              <p className="text-lg font-semibold">AED {proposal.currentPrice.toLocaleString("en-US")}</p>
            </div>

            <div className="flex items-center">
              {isIncrease ? (
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
              )}
              <span className={`text-2xl font-bold ${isIncrease ? "text-green-600" : "text-red-600"}`}>
                {isIncrease ? "+" : ""}{proposal.changePct.toFixed(1)}%
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Proposed Price</p>
              <p className="text-lg font-semibold">AED {proposal.proposedPrice.toLocaleString("en-US")}</p>
            </div>
          </div>

          {/* Reasoning */}
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium mb-1">Reasoning:</p>
            <p className="text-sm text-muted-foreground">{proposal.reasoning}</p>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <Button
              onClick={() => onApprove(proposal.id)}
              disabled={isLoading}
              className="flex-1"
              variant="default"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Approve & Execute
            </Button>
            <Button
              onClick={() => onReject(proposal.id)}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
