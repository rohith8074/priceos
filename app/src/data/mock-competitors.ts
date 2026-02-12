/**
 * Mock Competitor Intelligence Signals
 * Market compression/release patterns for different Dubai areas
 */

export interface CompetitorSignal {
  id: string;
  area: string;
  dateRange: {
    start: string; // ISO format
    end: string; // ISO format
  };
  signal: "compression" | "release";
  confidence: number; // 0-1
  reasoning: string;
  dataPoints: {
    availableUnits: number;
    averagePrice: number;
    priceChange: number; // % change from baseline
    occupancyRate?: number; // %
  };
  source: "market_analysis" | "competitor_scrape" | "booking_velocity";
}

export const MOCK_COMPETITOR_SIGNALS: CompetitorSignal[] = [
  {
    id: "comp-001",
    area: "Dubai Marina",
    dateRange: {
      start: "2026-03-15",
      end: "2026-03-22",
    },
    signal: "compression",
    confidence: 0.85,
    reasoning:
      "Art Dubai (Apr 15-19) early bookings creating pre-event surge. Marina area amenities attract high-end buyers.",
    dataPoints: {
      availableUnits: 120,
      averagePrice: 620,
      priceChange: 15,
      occupancyRate: 78,
    },
    source: "competitor_scrape",
  },
  {
    id: "comp-002",
    area: "Downtown Dubai",
    dateRange: {
      start: "2026-01-18",
      end: "2026-01-26",
    },
    signal: "compression",
    confidence: 0.9,
    reasoning:
      "Dubai Marathon (Jan 23-24) and overlapping DSF tail events. Downtown proximity to finish line drives bookings.",
    dataPoints: {
      availableUnits: 85,
      averagePrice: 750,
      priceChange: 22,
      occupancyRate: 82,
    },
    source: "booking_velocity",
  },
  {
    id: "comp-003",
    area: "JBR - Jumeirah Beach Residence",
    dateRange: {
      start: "2026-07-01",
      end: "2026-08-15",
    },
    signal: "release",
    confidence: 0.88,
    reasoning:
      "Summer season - scorching heat reduces leisure tourism. Beach access not enough to overcome 45°C+ temperatures.",
    dataPoints: {
      availableUnits: 340,
      averagePrice: 310,
      priceChange: -28,
      occupancyRate: 42,
    },
    source: "market_analysis",
  },
  {
    id: "comp-004",
    area: "Business Bay",
    dateRange: {
      start: "2026-05-08",
      end: "2026-05-15",
    },
    signal: "compression",
    confidence: 0.75,
    reasoning:
      "International Travel Conference (May 10-12) drives corporate demand. Multiple hotels hitting occupancy limits.",
    dataPoints: {
      availableUnits: 95,
      averagePrice: 580,
      priceChange: 18,
      occupancyRate: 75,
    },
    source: "booking_velocity",
  },
  {
    id: "comp-005",
    area: "Palm Jumeirah",
    dateRange: {
      start: "2026-04-01",
      end: "2026-05-31",
    },
    signal: "compression",
    confidence: 0.8,
    reasoning:
      "Spring season with luxury-focused events. High-end properties maintain premium pricing. Limited supply drives rates up.",
    dataPoints: {
      availableUnits: 35,
      averagePrice: 1950,
      priceChange: 12,
      occupancyRate: 88,
    },
    source: "competitor_scrape",
  },
  {
    id: "comp-006",
    area: "Dubai Marina",
    dateRange: {
      start: "2026-06-08",
      end: "2026-06-18",
    },
    signal: "compression",
    confidence: 0.82,
    reasoning:
      "Islamic Fashion Week (Jun 10-15) attracts international buyers and influencers. Marina shopping/dining proximity key.",
    dataPoints: {
      availableUnits: 110,
      averagePrice: 640,
      priceChange: 16,
      occupancyRate: 79,
    },
    source: "booking_velocity",
  },
  {
    id: "comp-007",
    area: "Downtown Dubai",
    dateRange: {
      start: "2026-11-04",
      end: "2026-11-20",
    },
    signal: "compression",
    confidence: 0.87,
    reasoning:
      "Dubai Design Week (Nov 8-15) attracts design professionals. Burj Khalifa proximity and dining scene drive bookings.",
    dataPoints: {
      availableUnits: 78,
      averagePrice: 820,
      priceChange: 25,
      occupancyRate: 85,
    },
    source: "competitor_scrape",
  },
  {
    id: "comp-008",
    area: "Business Bay",
    dateRange: {
      start: "2026-02-20",
      end: "2026-03-05",
    },
    signal: "compression",
    confidence: 0.78,
    reasoning:
      "Taste of Dubai and Grand Prix meetings create mid-week corporate demand. DIFC area restaurants at capacity.",
    dataPoints: {
      availableUnits: 105,
      averagePrice: 550,
      priceChange: 14,
      occupancyRate: 73,
    },
    source: "booking_velocity",
  },
  {
    id: "comp-009",
    area: "Jumeirah Beach Residence",
    dateRange: {
      start: "2026-12-15",
      end: "2026-12-31",
    },
    signal: "compression",
    confidence: 0.92,
    reasoning:
      "Year-end holidays and New Year preparation. Families seeking long-term stays and beach access.",
    dataPoints: {
      availableUnits: 280,
      averagePrice: 480,
      priceChange: 35,
      occupancyRate: 92,
    },
    source: "market_analysis",
  },
  {
    id: "comp-010",
    area: "Downtown Dubai",
    dateRange: {
      start: "2026-03-25",
      end: "2026-04-05",
    },
    signal: "compression",
    confidence: 0.88,
    reasoning:
      "Dubai World Cup (Mar 28) and Easter holidays create extended peak. Multiple major events cluster.",
    dataPoints: {
      availableUnits: 65,
      averagePrice: 890,
      priceChange: 32,
      occupancyRate: 88,
    },
    source: "booking_velocity",
  },
];

/**
 * Get signals overlapping a date range
 */
export function getSignalsInRange(
  startDate: Date,
  endDate: Date,
  signals = MOCK_COMPETITOR_SIGNALS
): CompetitorSignal[] {
  return signals.filter((signal) => {
    const signalStart = new Date(signal.dateRange.start);
    const signalEnd = new Date(signal.dateRange.end);
    return signalStart <= endDate && signalEnd >= startDate;
  });
}

/**
 * Get signals by area
 */
export function getSignalsByArea(
  area: string,
  signals = MOCK_COMPETITOR_SIGNALS
): CompetitorSignal[] {
  return signals.filter((s) => s.area === area);
}

/**
 * Get signals by type (compression or release)
 */
export function getSignalsByType(
  signalType: "compression" | "release",
  signals = MOCK_COMPETITOR_SIGNALS
): CompetitorSignal[] {
  return signals.filter((s) => s.signal === signalType);
}

/**
 * Get high-confidence signals (>= threshold)
 */
export function getHighConfidenceSignals(
  threshold = 0.8,
  signals = MOCK_COMPETITOR_SIGNALS
): CompetitorSignal[] {
  return signals.filter((s) => s.confidence >= threshold);
}
