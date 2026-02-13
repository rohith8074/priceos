"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ProposalCard } from "./proposal-card";
import type { ProposalView } from "@/types/proposal";
import type { Listing } from "@/types/hostaway";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useSettingsStore } from "@/stores/settings-store";

interface ProposalListProps {
  proposals: ProposalView[];
  properties: Listing[];
}

export function ProposalList({ proposals: initialProposals, properties }: ProposalListProps) {
  const [proposals, setProposals] = useState(initialProposals);
  const { autoApproveLowRisk, setAutoApproveLowRisk } = useSettingsStore();
  const propertyMap = new Map(properties.map((p) => [p.id, p]));

  const handleApprove = (id: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "approved" as const } : p))
    );
    toast.success("Proposal approved");
  };

  const handleReject = (id: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "rejected" as const } : p))
    );
    toast.success("Proposal rejected");
  };

  const pending = proposals.filter((p) => p.status === "pending");
  const approved = proposals.filter((p) => p.status === "approved");
  const rejected = proposals.filter((p) => p.status === "rejected");
  const highRisk = proposals.filter((p) => p.riskLevel === "high");
  const pendingLowRisk = pending.filter((p) => p.riskLevel === "low");

  const handleApproveAllLowRisk = () => {
    const ids = new Set(pendingLowRisk.map((p) => p.id));
    setProposals((prev) =>
      prev.map((p) => (ids.has(p.id) ? { ...p, status: "approved" as const } : p))
    );
    toast.success(`Approved ${ids.size} low-risk proposals`);
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Total:</span>
          <Badge variant="secondary">{proposals.length}</Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Approved:</span>
          <Badge variant="default">{approved.length}</Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">High Risk:</span>
          <Badge variant="destructive">{highRisk.length}</Badge>
        </div>
      </div>

      {pendingLowRisk.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleApproveAllLowRisk}
        >
          <CheckCheck className="h-4 w-4" />
          Approve All Low-Risk ({pendingLowRisk.length})
        </Button>
      )}

      {/* Auto-approve toggle */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Switch
            id="auto-approve"
            checked={autoApproveLowRisk}
            onCheckedChange={setAutoApproveLowRisk}
          />
          <Label htmlFor="auto-approve">Auto-approve low-risk</Label>
        </div>
        {autoApproveLowRisk && (
          <p className="text-xs text-muted-foreground pl-11">
            New low-risk proposals will be automatically approved
          </p>
        )}
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approved.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejected.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                property={propertyMap.get(proposal.listingMapId)}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
            {pending.length === 0 && (
              <p className="col-span-full text-center text-sm text-muted-foreground py-8">
                No pending proposals
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {approved.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                property={propertyMap.get(proposal.listingMapId)}
              />
            ))}
            {approved.length === 0 && (
              <p className="col-span-full text-center text-sm text-muted-foreground py-8">
                No approved proposals
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rejected.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                property={propertyMap.get(proposal.listingMapId)}
              />
            ))}
            {rejected.length === 0 && (
              <p className="col-span-full text-center text-sm text-muted-foreground py-8">
                No rejected proposals
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
