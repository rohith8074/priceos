export const dynamic = "force-dynamic";

import { createPMSClient } from "@/lib/pms";
import { FinanceContent } from "@/components/finance/finance-content";

export default async function FinancePage() {
  const pms = createPMSClient();
  const [expenses, statements, properties] = await Promise.all([
    pms.getExpenses(),
    pms.getOwnerStatements(),
    pms.listListings(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Finance</h1>
        <p className="text-sm text-muted-foreground">
          Track expenses and view owner P&L statements across properties
        </p>
      </div>
      <FinanceContent
        expenses={expenses}
        statements={statements}
        properties={properties}
      />
    </div>
  );
}
