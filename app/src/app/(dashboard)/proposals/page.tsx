import { createPMSClient } from "@/lib/pms";
import { runFullRevenueCycle } from "@/lib/agents";
import { mapCycleToProposals } from "@/types/proposal";
import { ProposalList } from "@/components/proposals/proposal-list";

export default async function ProposalsPage() {
  const pms = createPMSClient();

  const [allProperties, cycle] = await Promise.all([
    pms.listListings(),
    runFullRevenueCycle(),
  ]);

  const allProposals = mapCycleToProposals(cycle);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Proposals</h1>
        <p className="text-sm text-muted-foreground">
          Review AI-generated pricing proposals. Approve or reject with one click.
        </p>
      </div>

      <ProposalList proposals={allProposals} properties={allProperties} />
    </div>
  );
}
