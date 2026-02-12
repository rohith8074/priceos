"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, MessageSquare, ArrowRight } from "lucide-react";
import { RiskBadge } from "@/components/chat/risk-badge";
import type { ProposalView } from "@/types/proposal";
import type { Listing } from "@/types/hostaway";
import { useChatStore } from "@/stores/chat-store";
import { usePropertyStore } from "@/stores/property-store";

interface ProposalCardProps {
  proposal: ProposalView;
  property?: Listing;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function ProposalCard({ proposal, property, onApprove, onReject }: ProposalCardProps) {
  const { open } = useChatStore();
  const { setActiveProperty } = usePropertyStore();

  const handleApprove = () => {
    onApprove?.(proposal.id);
  };

  const handleReject = () => {
    onReject?.(proposal.id);
  };

  const handleAskAI = () => {
    if (property) setActiveProperty(property);
    open(
      `Explain the pricing reasoning for ${property?.name ?? "this property"} on ${proposal.date}. Current: ${proposal.currentPrice} AED, Proposed: ${proposal.proposedPrice} AED.`
    );
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium">
              {property?.name ?? `Property #${proposal.propertyId}`}
            </p>
            <p className="text-xs text-muted-foreground">{proposal.date}</p>
          </div>
          <RiskBadge level={proposal.riskLevel} />
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{proposal.currentPrice} AED</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="font-semibold">{proposal.proposedPrice} AED</span>
          <Badge
            variant="outline"
            className={
              proposal.changePct > 0
                ? "text-green-700 border-green-300"
                : proposal.changePct < 0
                  ? "text-red-700 border-red-300"
                  : ""
            }
          >
            {proposal.changePct > 0 ? "+" : ""}
            {proposal.changePct}%
          </Badge>
        </div>

        {proposal.reasoning && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {proposal.reasoning}
          </p>
        )}

        <div className="flex gap-2">
          {proposal.status === "pending" && (
            <>
              <Button
                size="sm"
                variant="default"
                className="gap-1.5 flex-1"
                onClick={handleApprove}
              >
                <Check className="h-3.5 w-3.5" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 flex-1"
                onClick={handleReject}
              >
                <X className="h-3.5 w-3.5" />
                Reject
              </Button>
            </>
          )}
          {proposal.status !== "pending" && (
            <Badge
              variant={proposal.status === "approved" ? "default" : "destructive"}
            >
              {proposal.status === "approved" ? "Approved" : "Rejected"}
            </Badge>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 ml-auto"
            onClick={handleAskAI}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Ask AI
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
