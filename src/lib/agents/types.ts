/**
 * AI Agent Output Types
 * Interfaces for each agent in the revenue cycle
 */

import { EventSignal } from "@/data/mock-events";
import { CompetitorSignal } from "@/data/mock-competitors";

export interface PriceProposal {
  id: string;
  listingMapId: number;
  date: string; // ISO format
  currentPrice: number;
  proposedPrice: number;
  changePct: number;
  riskLevel: "low" | "medium" | "high";
  reasoning: string;
  signals: {
    events?: EventSignal[];
    demand?: {
      bookingVelocity: string; // "low" | "medium" | "high" | "extreme"
      occupancyTrend: string; // "declining" | "stable" | "increasing"
      daysUntilFull?: number;
    };
    patterns?: {
      dayOfWeek: string;
      seasonal: string;
      avgPrice: number;
    };
    competition?: {
      marketSignal: string; // "compression" | "release"
      pricePosition: string; // "above_market" | "market_neutral" | "below_market"
      avgMarketPrice: number;
    };
  };
  generatedAt: string;
}

export interface ReviewedProposal {
  proposal: PriceProposal;
  approved: boolean;
  vetoReason?: string;
  adjustedRiskLevel?: "low" | "medium" | "high";
  adjustedPrice?: number;
  guardrailsApplied?: string[];
  reviewedAt: string;
}

export interface RevenueCycleResult {
  cycleId: string;
  timestamp: string;
  properties: number[];
  dateRange: {
    start: string;
    end: string;
  };
  aggregatedData: {
    totalProperties: number;
    bookedDays: number;
    availableDays: number;
    occupancyRate: number;
    averagePrice: number;
  };
  events: EventSignal[];
  competitorSignals: CompetitorSignal[];
  allProposals: PriceProposal[];
  approvedProposals: ReviewedProposal[];
  rejectedProposals: ReviewedProposal[];
  stats: {
    totalProposals: number;
    approvedCount: number;
    rejectedCount: number;
    avgPriceChange: number;
    highRiskCount: number;
  };
}

export interface AgentExecutionMetrics {
  agentName: string;
  executionTime: number; // ms
  inputCount: number;
  outputCount: number;
  confidence: number; // 0-1
  errors?: string[];
}
