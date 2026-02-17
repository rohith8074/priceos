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
  boolean,
  index,
  unique,
} from "drizzle-orm/pg-core";

export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  hostawayId: text("hostaway_id").unique(),
  name: text("name").notNull(),
  city: text("city").notNull().default("Dubai"),
  countryCode: varchar("country_code", { length: 3 }).notNull().default("AE"),
  area: text("area").notNull(),
  bedroomsNumber: integer("bedrooms_number").notNull().default(0),
  bathroomsNumber: integer("bathrooms_number").notNull().default(1),
  propertyType: text("property_type").notNull(),
  propertyTypeId: integer("property_type_id"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull().default("AED"),
  priceFloor: numeric("price_floor", { precision: 10, scale: 2 }).notNull(),
  priceCeiling: numeric("price_ceiling", { precision: 10, scale: 2 }).notNull(),
  personCapacity: integer("person_capacity"),
  amenities: jsonb("amenities").$type<string[]>().default([]),
  externalData: jsonb("external_data").$type<Record<string, unknown>>(),
  syncedAt: timestamp("synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const calendarDays = pgTable("calendar_days", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .references(() => listings.id)
    .notNull(),
  date: date("date").notNull(),
  status: text("status").notNull().default("available"), // available, booked, blocked
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  minimumStay: integer("minimum_stay").default(1),
  maximumStay: integer("maximum_stay").default(30),
  notes: text("notes"),
  syncedAt: timestamp("synced_at"),
}, (table) => ({
  listingDateIdx: index("calendar_listing_date_idx").on(table.listingId, table.date),
  listingDateUnique: unique("calendar_listing_date_unique").on(table.listingId, table.date),
}));

export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  hostawayId: text("hostaway_id").unique(),
  listingMapId: integer("listing_map_id")
    .references(() => listings.id)
    .notNull(),
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email"),
  channelName: text("channel_name").notNull(),
  arrivalDate: date("arrival_date").notNull(),
  departureDate: date("departure_date").notNull(),
  nights: integer("nights").notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  pricePerNight: numeric("price_per_night", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("confirmed"),
  checkInTime: text("check_in_time"),
  checkOutTime: text("check_out_time"),
  externalData: jsonb("external_data").$type<Record<string, unknown>>(),
  syncedAt: timestamp("synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  listingIdx: index("reservations_listing_idx").on(table.listingMapId),
  datesIdx: index("reservations_dates_idx").on(table.arrivalDate, table.departureDate),
  statusIdx: index("reservations_status_idx").on(table.status),
}));

export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .references(() => listings.id)
    .notNull(),
  dateRangeStart: date("date_range_start").notNull(),
  dateRangeEnd: date("date_range_end").notNull(),
  currentPrice: numeric("current_price", { precision: 10, scale: 2 }).notNull(),
  proposedPrice: numeric("proposed_price", { precision: 10, scale: 2 }).notNull(),
  changePct: integer("change_pct").notNull().default(0),
  riskLevel: text("risk_level").notNull().default("low"), // low, medium, high
  status: text("status").notNull().default("pending"), // pending, approved, rejected, executed
  reasoning: text("reasoning"),
  signals: jsonb("signals").$type<Record<string, unknown>>().default({}),
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  listingDateIdx: index("proposals_listing_date_idx").on(table.listingId, table.dateRangeStart),
  statusIdx: index("proposals_status_idx").on(table.status),
}));

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  sessionId: text("session_id").notNull(),
  role: text("role").notNull(), // user, assistant, error
  content: text("content").notNull(),
  listingId: integer("listing_id"),
  structured: jsonb("structured").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Event intelligence cache (for pricing analysis)
export const eventSignals = pgTable("event_signals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  location: text("location").notNull().default("Dubai"),
  expectedImpact: text("expected_impact"), // high, medium, low
  confidence: integer("confidence").default(50), // 0-100
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
}, (table) => ({
  datesIdx: index("event_signals_dates_idx").on(table.startDate, table.endDate),
  locationIdx: index("event_signals_location_idx").on(table.location),
}));

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(), // From Neon Auth
  lyzrApiKey: text("lyzr_api_key"), // Encrypted or hashed
  hostawayApiKey: text("hostaway_api_key"), // HostAway API key
  preferences: jsonb("preferences").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_settings_user_id_idx").on(table.userId),
}));

// Type exports
export type ListingRow = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type CalendarDayRow = typeof calendarDays.$inferSelect;
export type NewCalendarDay = typeof calendarDays.$inferInsert;
export type ReservationRow = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type Proposal = typeof proposals.$inferSelect;
export type NewProposal = typeof proposals.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
export type EventSignal = typeof eventSignals.$inferSelect;
export type NewEventSignal = typeof eventSignals.$inferInsert;
export type UserSettingsRow = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
