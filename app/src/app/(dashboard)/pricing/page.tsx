import { createPMSClient } from "@/lib/pms";
import { runFullRevenueCycle } from "@/lib/agents";
import { mapCycleToProposals } from "@/types/proposal";
import { MOCK_EVENTS } from "@/data/mock-events";
import { MOCK_COMPETITOR_SIGNALS } from "@/data/mock-competitors";
import { PricingContent } from "./pricing-content";

export default async function PricingPage() {
  const pms = createPMSClient();

  const [allProperties, cycle] = await Promise.all([
    pms.listListings(),
    runFullRevenueCycle(),
  ]);

  const allProposals = mapCycleToProposals(cycle);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pricing</h1>
        <p className="text-sm text-muted-foreground">
          AI-generated pricing proposals and market insights
        </p>
      </div>

      <PricingContent
        proposals={allProposals}
        properties={allProperties}
        events={MOCK_EVENTS}
        signals={MOCK_COMPETITOR_SIGNALS}
      />
    </div>
  );
}
