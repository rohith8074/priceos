import { db, eventSignals } from "@/lib/db";
import { and, gte, lte } from "drizzle-orm";
import { format, addDays, parseISO } from "date-fns";

export interface EventSignal {
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  expectedImpact: "high" | "medium" | "low";
  confidence: number; // 0-100
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface EventAnalysisResult {
  events: EventSignal[];
  dateRange: {
    start: string;
    end: string;
  };
  summary: string;
  totalEvents: number;
  highImpactEvents: number;
}

/**
 * Event Intelligence Agent
 * Responsible for fetching and analyzing Dubai events for pricing impact
 */
export class EventIntelligenceAgent {
  /**
   * Fetch events for a date range
   */
  async getEvents(startDate: Date, endDate: Date): Promise<EventSignal[]> {
    const startDateStr = format(startDate, "yyyy-MM-dd");
    const endDateStr = format(endDate, "yyyy-MM-dd");

    // Fetch from database cache
    const cachedEvents = await db
      .select()
      .from(eventSignals)
      .where(
        and(
          gte(eventSignals.endDate, startDateStr),
          lte(eventSignals.startDate, endDateStr)
        )
      );

    return cachedEvents.map((event) => ({
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      expectedImpact: (event.expectedImpact || "medium") as "high" | "medium" | "low",
      confidence: event.confidence || 50,
      description: event.description || undefined,
      metadata: (event.metadata as Record<string, unknown>) || undefined,
    }));
  }

  /**
   * Analyze events for a specific date range
   */
  async analyzeEvents(startDate: Date, endDate: Date): Promise<EventAnalysisResult> {
    const events = await this.getEvents(startDate, endDate);

    const highImpactEvents = events.filter(
      (e) => e.expectedImpact === "high"
    ).length;

    let summary = "";
    if (events.length === 0) {
      summary = "No major events detected for this period.";
    } else if (highImpactEvents > 0) {
      summary = `${highImpactEvents} high-impact event(s) detected. Significant demand increase expected.`;
    } else {
      summary = `${events.length} event(s) detected with moderate impact.`;
    }

    return {
      events,
      dateRange: {
        start: format(startDate, "yyyy-MM-dd"),
        end: format(endDate, "yyyy-MM-dd"),
      },
      summary,
      totalEvents: events.length,
      highImpactEvents,
    };
  }

  /**
   * Check if a specific date overlaps with any events
   */
  async hasEventImpact(date: Date): Promise<boolean> {
    const dateStr = format(date, "yyyy-MM-dd");

    const overlappingEvents = await db
      .select()
      .from(eventSignals)
      .where(
        and(
          lte(eventSignals.startDate, dateStr),
          gte(eventSignals.endDate, dateStr)
        )
      );

    return overlappingEvents.length > 0;
  }

  /**
   * Fetch and cache events from external sources
   * (Mock implementation - in production would call real APIs)
   */
  async fetchAndCacheEvents(): Promise<{ cached: number; error?: string }> {
    try {
      // Mock events for Dubai (2026)
      const mockEvents: EventSignal[] = [
        {
          name: "Dubai Shopping Festival",
          startDate: "2026-01-01",
          endDate: "2026-02-01",
          location: "Dubai",
          expectedImpact: "high",
          confidence: 95,
          description: "Annual shopping festival attracting millions of visitors",
          metadata: { category: "shopping", tourists: "high" },
        },
        {
          name: "Formula 1 Abu Dhabi Grand Prix",
          startDate: "2026-03-20",
          endDate: "2026-03-22",
          location: "Abu Dhabi",
          expectedImpact: "high",
          confidence: 90,
          description: "F1 race weekend, high hotel demand in Dubai area",
          metadata: { category: "sports", spillover: "Dubai" },
        },
        {
          name: "Dubai World Cup",
          startDate: "2026-03-28",
          endDate: "2026-03-28",
          location: "Dubai",
          expectedImpact: "high",
          confidence: 85,
          description: "World's richest horse race",
          metadata: { category: "sports", tourists: "high" },
        },
        {
          name: "Ramadan",
          startDate: "2026-02-17",
          endDate: "2026-03-18",
          location: "Dubai",
          expectedImpact: "medium",
          confidence: 70,
          description: "Lower tourist demand during Ramadan",
          metadata: { category: "religious", demand: "lower" },
        },
        {
          name: "Dubai International Boat Show",
          startDate: "2026-03-03",
          endDate: "2026-03-07",
          location: "Dubai",
          expectedImpact: "medium",
          confidence: 75,
          description: "Annual boat show",
          metadata: { category: "trade", tourists: "medium" },
        },
        {
          name: "Dubai Food Festival",
          startDate: "2026-02-20",
          endDate: "2026-03-20",
          location: "Dubai",
          expectedImpact: "medium",
          confidence: 80,
          description: "Culinary festival across Dubai",
          metadata: { category: "food", tourists: "medium" },
        },
        {
          name: "Dubai Jazz Festival",
          startDate: "2026-02-25",
          endDate: "2026-02-27",
          location: "Dubai",
          expectedImpact: "medium",
          confidence: 70,
          description: "Annual music festival",
          metadata: { category: "entertainment", tourists: "medium" },
        },
      ];

      let cachedCount = 0;

      for (const event of mockEvents) {
        // Check if event already exists
        const existing = await db
          .select()
          .from(eventSignals)
          .where(
            and(
              eq(eventSignals.name, event.name),
              eq(eventSignals.startDate, event.startDate)
            )
          )
          .limit(1);

        if (existing.length === 0) {
          // Insert new event
          await db.insert(eventSignals).values({
            name: event.name,
            startDate: event.startDate,
            endDate: event.endDate,
            location: event.location,
            expectedImpact: event.expectedImpact,
            confidence: event.confidence,
            description: event.description || null,
            metadata: event.metadata || {},
            fetchedAt: new Date(),
          });
          cachedCount++;
        }
      }

      return { cached: cachedCount };
    } catch (error) {
      return {
        cached: 0,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get event-driven pricing recommendation
   */
  getPricingRecommendation(events: EventSignal[]): {
    suggestedIncrease: number;
    reasoning: string;
  } {
    if (events.length === 0) {
      return {
        suggestedIncrease: 0,
        reasoning: "No events detected, maintain current pricing",
      };
    }

    const highImpactEvents = events.filter((e) => e.expectedImpact === "high");
    const mediumImpactEvents = events.filter((e) => e.expectedImpact === "medium");

    if (highImpactEvents.length > 0) {
      const eventNames = highImpactEvents.map((e) => e.name).join(", ");
      return {
        suggestedIncrease: 30, // 30% increase for high-impact events
        reasoning: `High-impact events detected: ${eventNames}. Significant demand increase expected.`,
      };
    }

    if (mediumImpactEvents.length > 0) {
      const eventNames = mediumImpactEvents.map((e) => e.name).join(", ");
      return {
        suggestedIncrease: 15, // 15% increase for medium-impact events
        reasoning: `Medium-impact events detected: ${eventNames}. Moderate demand increase expected.`,
      };
    }

    return {
      suggestedIncrease: 5, // 5% increase for low-impact events
      reasoning: `Low-impact events detected. Minor demand increase expected.`,
    };
  }
}

/**
 * Create an Event Intelligence Agent instance
 */
export function createEventIntelligenceAgent(): EventIntelligenceAgent {
  return new EventIntelligenceAgent();
}

// Fix missing import
import { eq } from "drizzle-orm";
