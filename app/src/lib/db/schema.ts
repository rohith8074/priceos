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
  index,
  unique,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────
// Table 1: LISTINGS — Property Registry
// ─────────────────────────────────────────────────────────
export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  hostawayId: text("hostaway_id").unique(),
  name: text("name").notNull(),
  city: text("city").notNull().default("Dubai"),
  countryCode: varchar("country_code", { length: 3 }).notNull().default("AE"),
  area: text("area").notNull(),
  bedroomsNumber: integer("bedrooms_number").notNull().default(0),
  bathroomsNumber: integer("bathrooms_number").notNull().default(1),
  propertyTypeId: integer("property_type_id").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull().default("AED"),
  personCapacity: integer("person_capacity"),
  amenities: jsonb("amenities").$type<string[]>(), // Postgres natively supports JSON array of strings
  address: text("address"),
  priceFloor: numeric("price_floor", { precision: 10, scale: 2 }).notNull().default('0'),
  priceCeiling: numeric("price_ceiling", { precision: 10, scale: 2 }).notNull().default('0'),
});

// ─────────────────────────────────────────────────────────
// Table 2: INVENTORY_MASTER — Daily Price Calendar
// ─────────────────────────────────────────────────────────
export const inventoryMaster = pgTable("inventory_master", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .references(() => listings.id)
    .notNull(),
  date: date("date").notNull(),
  status: text("status").notNull().default("available"),
  currentPrice: numeric("current_price", { precision: 10, scale: 2 }).notNull(),
  minStay: integer("min_stay").notNull().default(1),
  maxStay: integer("max_stay").notNull().default(30),
  proposedPrice: numeric("proposed_price", { precision: 10, scale: 2 }),
  changePct: integer("change_pct"),
  proposalStatus: text("proposal_status"),
  reasoning: text("reasoning"),
}, (table) => ({
  listingDateIdx: index("inventory_master_listing_date_idx").on(table.listingId, table.date),
  listingDateUnique: unique("inventory_master_listing_date_unique").on(table.listingId, table.date),
  statusIdx: index("inventory_master_proposal_status_idx").on(table.proposalStatus),
}));

// ─────────────────────────────────────────────────────────
// Table 3: RESERVATIONS — Guest Bookings & Financials (from PMS)
// ─────────────────────────────────────────────────────────
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .references(() => listings.id)
    .notNull(),
  // Guest details — strict columns, no JSON
  guestName: text("guest_name"),
  guestEmail: text("guest_email"),
  guestPhone: text("guest_phone"),
  numGuests: integer("num_guests"),
  // Stay dates
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  // Financials — strict columns, no JSON
  channelName: text("channel_name"),              // Airbnb, Booking.com, Direct
  reservationStatus: text("reservation_status"),   // confirmed, pending, cancelled
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }),
  pricePerNight: numeric("price_per_night", { precision: 10, scale: 2 }),
  channelCommission: numeric("channel_commission", { precision: 10, scale: 2 }),
  cleaningFee: numeric("cleaning_fee", { precision: 10, scale: 2 }),
  hostawayReservationId: text("hostaway_reservation_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  listingIdx: index("reservations_listing_idx").on(table.listingId),
  datesIdx: index("reservations_dates_idx").on(table.startDate, table.endDate),
  channelIdx: index("reservations_channel_idx").on(table.channelName),
  statusIdx: index("reservations_status_idx").on(table.reservationStatus),
}));

// ─────────────────────────────────────────────────────────
// Table 4: MARKET_EVENTS — AI Market Intelligence (from Setup)
// ─────────────────────────────────────────────────────────
export const marketEvents = pgTable("market_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  eventType: text("event_type").notNull(),         // event, holiday, competitor_intel, positioning, market_summary
  location: text("location"),
  expectedImpact: text("expected_impact"),          // high, medium, low
  confidence: integer("confidence"),                // 0-100
  description: text("description"),
  source: text("source"),                           // URL or "Lyzr Marketing Agent"
  suggestedPremium: numeric("suggested_premium", { precision: 5, scale: 2 }),
  competitorMedian: numeric("competitor_median", { precision: 10, scale: 2 }),
  // Minimal JSONB catch-all for rare/variable AI data (competitor examples, positioning details)
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  datesIdx: index("market_events_dates_idx").on(table.startDate, table.endDate),
  typeIdx: index("market_events_type_idx").on(table.eventType),
}));

// ─────────────────────────────────────────────────────────
// Table 5: CHAT_MESSAGES — AI Conversation Memory
// ─────────────────────────────────────────────────────────
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  sessionId: text("session_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  listingId: integer("listing_id"),
  structured: jsonb("structured").$type<Record<string, unknown>>(), // Only JSONB in the system — unavoidable (AI output shape varies)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────
// Table 6: USER_SETTINGS — User Configuration
// ─────────────────────────────────────────────────────────
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  fullName: text("full_name"),
  email: text("email"),
  lyzrApiKey: text("lyzr_api_key"),
  hostawayApiKey: text("hostaway_api_key"),
  preferences: jsonb("preferences").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_settings_user_id_idx").on(table.userId),
}));

// ─────────────────────────────────────────────────────────
// Type Exports
// ─────────────────────────────────────────────────────────
export type ListingRow = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type InventoryMasterRow = typeof inventoryMaster.$inferSelect;
export type NewInventoryMaster = typeof inventoryMaster.$inferInsert;
export type ReservationRow = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type MarketEventRow = typeof marketEvents.$inferSelect;
export type NewMarketEvent = typeof marketEvents.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
export type UserSettingsRow = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;

// ─────────────────────────────────────────────────────────
// Legacy Aliases (for migration period — remove after full refactor)
// ─────────────────────────────────────────────────────────
/** @deprecated Use `reservations` table instead */
export const activityTimeline = reservations;
/** @deprecated Use `ReservationRow` instead */
export type ActivityTimelineRow = ReservationRow;
/** @deprecated Use `NewReservation` instead */
export type NewActivityTimeline = NewReservation;
