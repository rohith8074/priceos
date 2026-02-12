"use client";

import { EventCard } from "@/components/insights/event-card";
import { MarketSignalCard } from "@/components/insights/market-signal-card";
import type { EventSignal } from "@/data/mock-events";
import type { CompetitorSignal } from "@/data/mock-competitors";
import { Separator } from "@/components/ui/separator";

interface InsightsContentProps {
  events: EventSignal[];
  signals: CompetitorSignal[];
}

export function InsightsContent({ events, signals }: InsightsContentProps) {
  return (
    <div className="space-y-8">
      {/* Events */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">
          Events ({events.length})
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      <Separator />

      {/* Market Signals */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">
          Market Signals ({signals.length})
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {signals.map((signal) => (
            <MarketSignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      </section>
    </div>
  );
}
