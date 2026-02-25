import { db } from "@/lib/db";
import { inventoryMaster, listings } from "@/lib/db/schema";
import { eq, gte, and } from "drizzle-orm";
import { PricingClient } from "./pricing-client";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const today = format(new Date(), "yyyy-MM-dd");

  // Fetch all price records from today onwards
  const rawRows = await db
    .select({
      id: inventoryMaster.id,
      listingId: inventoryMaster.listingId,
      date: inventoryMaster.date,
      currentPrice: inventoryMaster.currentPrice,
      proposedPrice: inventoryMaster.proposedPrice,
      changePct: inventoryMaster.changePct,
      reasoning: inventoryMaster.reasoning,
      listingName: listings.name,
    })
    .from(inventoryMaster)
    .innerJoin(listings, eq(inventoryMaster.listingId, listings.id))
    .where(
      and(
        gte(inventoryMaster.date, today),
        eq(inventoryMaster.proposalStatus, "pending")
      )
    )
    .orderBy(inventoryMaster.date);

  const pendingRows = rawRows.map(row => {
    const current = parseFloat(row.currentPrice || "0");
    const proposed = parseFloat(row.proposedPrice || "0");

    let changePct = row.changePct;
    if (current > 0 && proposed > 0) {
      // Recalculate to ensure accuracy and avoid AI hallucination mismatches
      changePct = Math.round(((proposed - current) / current) * 100);
    }

    return {
      ...row,
      changePct
    };
  });

  return (
    <div className="flex-1 flex flex-col p-8 bg-muted/5 h-full overflow-hidden">
      <div className="mb-8 shrink-0">
        <h1 className="text-3xl font-bold mb-2">Pricing Command Center</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Review and approve pending price changes proposed by the AI engines. These changes will be synced to your Property Management System (PMS) upon approval.
        </p>
      </div>

      <PricingClient initialProposals={pendingRows} />
    </div>
  );
}
