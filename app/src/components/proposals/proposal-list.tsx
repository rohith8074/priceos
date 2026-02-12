"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProposalCard } from "./proposal-card";
import type { ProposalView } from "@/types/proposal";
import type { Listing } from "@/types/hostaway";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ProposalListProps {
  proposals: ProposalView[];
  properties: Listing[];
}

export function ProposalList({ proposals: initialProposals, properties }: ProposalListProps) {
  const [proposals, setProposals] = useState(initialProposals);
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
                property={propertyMap.get(proposal.propertyId)}
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
                property={propertyMap.get(proposal.propertyId)}
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
                property={propertyMap.get(proposal.propertyId)}
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
