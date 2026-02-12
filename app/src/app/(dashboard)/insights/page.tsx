import { MOCK_EVENTS } from "@/data/mock-events";
import { MOCK_COMPETITOR_SIGNALS } from "@/data/mock-competitors";
import { InsightsContent } from "./insights-content";

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="text-sm text-muted-foreground">
          Events and market signals affecting your pricing strategy
        </p>
      </div>

      <InsightsContent events={MOCK_EVENTS} signals={MOCK_COMPETITOR_SIGNALS} />
    </div>
  );
}
