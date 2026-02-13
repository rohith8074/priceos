"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProposalList } from "@/components/proposals/proposal-list";
import { InsightsContent } from "@/app/(dashboard)/insights/insights-content";
import type { Listing } from "@/types/hostaway";
import type { ProposalView } from "@/types/proposal";
import type { EventSignal } from "@/data/mock-events";
import type { CompetitorSignal } from "@/data/mock-competitors";

interface PricingContentProps {
  proposals: ProposalView[];
  properties: Listing[];
  events: EventSignal[];
  signals: CompetitorSignal[];
}

export function PricingContent({
  proposals,
  properties,
  events,
  signals,
}: PricingContentProps) {
  return (
    <Tabs defaultValue="proposals">
      <TabsList>
        <TabsTrigger value="proposals">Proposals</TabsTrigger>
        <TabsTrigger value="insights">Insights</TabsTrigger>
      </TabsList>

      <TabsContent value="proposals" className="mt-4">
        <ProposalList proposals={proposals} properties={properties} />
      </TabsContent>

      <TabsContent value="insights" className="mt-4">
        <InsightsContent events={events} signals={signals} />
      </TabsContent>
    </Tabs>
  );
}
