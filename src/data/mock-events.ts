/**
 * Mock Dubai Events Data - 2026
 * Major tourism events that impact demand
 * Based on roadmap.md Section 5.2
 */

export interface EventSignal {
  id: string;
  name: string;
  description: string;
  startDate: string; // ISO format
  endDate: string; // ISO format
  location: string;
  category:
    | "festival"
    | "conference"
    | "sports"
    | "cultural"
    | "religious"
    | "other";
  demandImpact: "low" | "medium" | "high" | "extreme";
  demandNotes: string;
  confidence: number; // 0-1
  sourceUrl: string;
  isHardcoded: boolean;
}

export const MOCK_EVENTS: EventSignal[] = [
  {
    id: "dsf-2026",
    name: "Dubai Shopping Festival",
    description: "Month-long festival with shopping, entertainment, and events",
    startDate: "2025-12-05",
    endDate: "2026-01-11",
    location: "Dubai (City-wide)",
    category: "festival",
    demandImpact: "extreme",
    demandNotes:
      "City-wide festival with significant tourist influx. Expected 30%+ occupancy boost across all areas.",
    confidence: 1.0,
    sourceUrl: "https://visitdubai.com/shopping-festival",
    isHardcoded: true,
  },
  {
    id: "artdubai-2026",
    name: "Art Dubai",
    description: "Premier international art fair",
    startDate: "2026-04-15",
    endDate: "2026-04-19",
    location: "Dubai World Trade Centre",
    category: "cultural",
    demandImpact: "high",
    demandNotes:
      "High-end art buyers and collectors. Marina area sees price compression. 3-5 day stays.",
    confidence: 0.95,
    sourceUrl: "https://artdubai.ae",
    isHardcoded: true,
  },
  {
    id: "food-festival-2026",
    name: "Taste of Dubai Food Festival",
    description:
      "International culinary festival showcasing world-class chefs and cuisines",
    startDate: "2026-02-25",
    endDate: "2026-03-01",
    location: "Dubai (Multiple Venues)",
    category: "festival",
    demandImpact: "high",
    demandNotes:
      "Foodie tourists. Downtown Dubai and DIFC area see elevated demand. 2-4 night stays.",
    confidence: 0.9,
    sourceUrl: "https://www.tasteofdubai.ae",
    isHardcoded: true,
  },
  {
    id: "itp-2026",
    name: "International Travel & Tourism Conference",
    description: "Global tourism industry conference",
    startDate: "2026-05-10",
    endDate: "2026-05-12",
    location: "Dubai Convention Centre",
    category: "conference",
    demandImpact: "medium",
    demandNotes:
      "Industry professionals. Business Bay and Downtown demand increase. Corporate rates.",
    confidence: 0.85,
    sourceUrl: "https://www.itconference.ae",
    isHardcoded: true,
  },
  {
    id: "gpto-2026",
    name: "Grand Prix Tour Operator Meeting",
    description: "Annual tour operators market",
    startDate: "2026-03-08",
    endDate: "2026-03-10",
    location: "Dubai Exhibition Centre",
    category: "conference",
    demandImpact: "medium",
    demandNotes:
      "Travel industry B2B event. Steady mid-week bookings. Group rates common.",
    confidence: 0.8,
    sourceUrl: "https://www.grandprixtravel.ae",
    isHardcoded: true,
  },
  {
    id: "ifw-2026",
    name: "Islamic Fashion Week",
    description: "Fashion week celebrating Islamic and modest fashion",
    startDate: "2026-06-10",
    endDate: "2026-06-15",
    location: "Dubai (Multiple Venues)",
    category: "cultural",
    demandImpact: "high",
    demandNotes:
      "International fashion buyers and influencers. Downtown and Marina premium pricing.",
    confidence: 0.85,
    sourceUrl: "https://www.islamicfashionweek.ae",
    isHardcoded: true,
  },
  {
    id: "dxb-marathon-2026",
    name: "Dubai Marathon 2026",
    description: "International marathon event",
    startDate: "2026-01-23",
    endDate: "2026-01-24",
    location: "Dubai (Start: Burj Park, End: Burj Park)",
    category: "sports",
    demandImpact: "high",
    demandNotes:
      "Runners and families. Hotels near start/finish see congestion. 2-3 night stays.",
    confidence: 0.9,
    sourceUrl: "https://www.dubaimarathon.ae",
    isHardcoded: true,
  },
  {
    id: "ps-2026",
    name: "Dubai Para Swim 2026",
    description: "International para swimming championships",
    startDate: "2026-03-18",
    endDate: "2026-03-22",
    location: "Hamdan Sports Complex",
    category: "sports",
    demandImpact: "medium",
    demandNotes:
      "Athletes and families. Steady occupancy across portfolio. Lower price sensitivity.",
    confidence: 0.75,
    sourceUrl: "https://www.dubaiparaswim.ae",
    isHardcoded: true,
  },
  {
    id: "dtf-2026",
    name: "Dubai Travel & Tourism Summit",
    description: "Strategic tourism industry summit",
    startDate: "2026-09-12",
    endDate: "2026-09-14",
    location: "Dubai Convention Centre",
    category: "conference",
    demandImpact: "medium",
    demandNotes:
      "Tourism decision-makers. Business Bay and Downtown strong demand.",
    confidence: 0.8,
    sourceUrl: "https://www.dubaiturismsummit.ae",
    isHardcoded: true,
  },
  {
    id: "design-week-2026",
    name: "Dubai Design Week",
    description: "International design industry showcase",
    startDate: "2026-11-08",
    endDate: "2026-11-15",
    location: "Dubai Design District",
    category: "cultural",
    demandImpact: "high",
    demandNotes:
      "Designers and creative professionals. D3 area and Downtown see compression.",
    confidence: 0.9,
    sourceUrl: "https://www.dubaidesignweek.ae",
    isHardcoded: true,
  },
  {
    id: "dubaiworldcup-2026",
    name: "Dubai World Cup - Meydan Racecourse",
    description: "Richest horse racing event in the world",
    startDate: "2026-03-28",
    endDate: "2026-03-28",
    location: "Meydan Racecourse",
    category: "sports",
    demandImpact: "extreme",
    demandNotes:
      "Single day event with massive tourism impact. Properties near Meydan fully booked weeks prior.",
    confidence: 1.0,
    sourceUrl: "https://www.dubaiworldcup.ae",
    isHardcoded: true,
  },
  {
    id: "ramadan-2026",
    name: "Ramadan 2026",
    description: "Islamic holy month - unique cultural and commercial activities",
    startDate: "2026-02-26",
    endDate: "2026-03-27",
    location: "Dubai (City-wide)",
    category: "religious",
    demandImpact: "medium",
    demandNotes:
      "Ramadan creates unique pattern: lower leisure tourism but strong family visits. Evening/night economy. Modified pricing model.",
    confidence: 1.0,
    sourceUrl: "https://visitdubai.com/ramadan",
    isHardcoded: true,
  },
  {
    id: "eid-alfitr-2026",
    name: "Eid al-Fitr 2026",
    description: "End of Ramadan celebration",
    startDate: "2026-03-28",
    endDate: "2026-03-30",
    location: "Dubai (City-wide)",
    category: "religious",
    demandImpact: "high",
    demandNotes:
      "Holiday period with regional family travel. Occupancy spike mid-week.",
    confidence: 1.0,
    sourceUrl: "https://visitdubai.com/eid",
    isHardcoded: true,
  },
];

/**
 * Get events overlapping a date range
 */
export function getEventsInRange(
  startDate: Date,
  endDate: Date,
  events = MOCK_EVENTS
): EventSignal[] {
  return events.filter((event) => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    return eventStart <= endDate && eventEnd >= startDate;
  });
}

/**
 * Get events by impact level
 */
export function getEventsByImpact(
  impact: "low" | "medium" | "high" | "extreme",
  events = MOCK_EVENTS
): EventSignal[] {
  return events.filter((e) => e.demandImpact === impact);
}

/**
 * Get events by category
 */
export function getEventsByCategory(
  category: EventSignal["category"],
  events = MOCK_EVENTS
): EventSignal[] {
  return events.filter((e) => e.category === category);
}
