import type { PriceProposal, ReviewedProposal, RevenueCycleResult } from "@/lib/agents/types";

export interface ProposalView extends PriceProposal {
  status: "pending" | "approved" | "rejected";
}

/**
 * Convert a RevenueCycleResult into a flat list of ProposalView items.
 * - approved + low risk -> "approved" (auto-approved by guardrails)
 * - not approved -> "pending" (needs manual review)
 */
export function mapCycleToProposals(cycle: RevenueCycleResult): ProposalView[] {
  const proposals: ProposalView[] = [];

  for (const reviewed of cycle.approvedProposals) {
    proposals.push({
      ...reviewed.proposal,
      status:
        reviewed.approved && reviewed.proposal.riskLevel === "low"
          ? "approved"
          : "pending",
    });
  }

  for (const reviewed of cycle.rejectedProposals) {
    proposals.push({
      ...reviewed.proposal,
      status: "pending",
    });
  }

  return proposals;
}
