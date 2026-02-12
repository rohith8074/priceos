import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  date,
  timestamp,
  jsonb,
  varchar,
} from "drizzle-orm/pg-core";

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  area: text("area").notNull(),
  type: text("type").notNull(),
  bedrooms: integer("bedrooms").notNull().default(0),
  bathrooms: integer("bathrooms").notNull().default(1),
  basePrice: integer("base_price").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("AED"),
  priceFloor: integer("price_floor").notNull(),
  priceCeiling: integer("price_ceiling").notNull(),
  maximumGuests: integer("maximum_guests"),
  amenities: jsonb("amenities").$type<string[]>().default([]),
  hostawayListingId: text("hostaway_listing_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const calendarDays = pgTable("calendar_days", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id")
    .references(() => properties.id)
    .notNull(),
  date: date("date").notNull(),
  status: text("status").notNull().default("available"), // available, booked, blocked
  price: integer("price").notNull(),
  minStay: integer("min_stay").default(1),
  maxStay: integer("max_stay").default(30),
  notes: text("notes"),
});

export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id")
    .references(() => properties.id)
    .notNull(),
  date: date("date").notNull(),
  currentPrice: integer("current_price").notNull(),
  proposedPrice: integer("proposed_price").notNull(),
  changePct: integer("change_pct").notNull().default(0),
  riskLevel: text("risk_level").notNull().default("low"), // low, medium, high
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  reasoning: text("reasoning"),
  signals: jsonb("signals").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  sessionId: text("session_id").notNull(),
  role: text("role").notNull(), // user, assistant, error
  content: text("content").notNull(),
  propertyId: integer("property_id"),
  structured: jsonb("structured").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const executions = pgTable("executions", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id")
    .references(() => proposals.id)
    .notNull(),
  propertyId: integer("property_id")
    .references(() => properties.id)
    .notNull(),
  oldPrice: integer("old_price").notNull(),
  newPrice: integer("new_price").notNull(),
  syncStatus: text("sync_status").notNull().default("pending"), // pending, synced, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type exports
export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type CalendarDayRow = typeof calendarDays.$inferSelect;
export type NewCalendarDay = typeof calendarDays.$inferInsert;
export type Proposal = typeof proposals.$inferSelect;
export type NewProposal = typeof proposals.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
export type Execution = typeof executions.$inferSelect;
export type NewExecution = typeof executions.$inferInsert;
