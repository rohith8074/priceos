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
  amenities: jsonb("amenities").$type<string[]>().default([]),
  address: text("address"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  priceFloor: numeric("price_floor", { precision: 10, scale: 2 }).notNull().default('0'),
  priceCeiling: numeric("price_ceiling", { precision: 10, scale: 2 }).notNull().default('0'),
});

export const inventoryMaster = pgTable("inventory_master", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .references(() => listings.id)
    .notNull(),
  date: date("date").notNull(),
  status: text("status").notNull().default("available"),
  currentPrice: numeric("current_price", { precision: 10, scale: 2 }).notNull(),
  minMaxStay: jsonb("min_max_stay").$type<{ min: number; max: number }>().notNull().default({ min: 1, max: 30 }),
  proposedPrice: numeric("proposed_price", { precision: 10, scale: 2 }),
  changePct: integer("change_pct"),
  proposalStatus: text("proposal_status"),
  reasoning: text("reasoning"),
}, (table) => ({
  listingDateIdx: index("inventory_master_listing_date_idx").on(table.listingId, table.date),
  listingDateUnique: unique("inventory_master_listing_date_unique").on(table.listingId, table.date),
  statusIdx: index("inventory_master_proposal_status_idx").on(table.proposalStatus),
}));

export const activityTimeline = pgTable("activity_timeline", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").references(() => listings.id),
  type: text("type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  title: text("title").notNull(),
  impactScore: integer("impact_score"),
  financials: jsonb("financials").$type<{
    totalPrice?: number;
    pricePerNight?: number;
    channelCommission?: number;
    cleaningFee?: number;
    channelName?: string;
    reservationStatus?: string;
  }>(),
  marketContext: jsonb("market_context").$type<{
    eventType: string;
    location?: string;
    expectedImpact?: string;
    confidence?: number;
    description?: string;
    suggestedPremiumPct?: number;
    competitorMedianRate?: number;
    insightVerdict?: string;
    source?: string;
    [key: string]: any;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  listingIdx: index("activity_timeline_listing_idx").on(table.listingId),
  datesIdx: index("activity_timeline_dates_idx").on(table.startDate, table.endDate),
  typeIdx: index("activity_timeline_type_idx").on(table.type),
}));

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  sessionId: text("session_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  listingId: integer("listing_id"),
  structured: jsonb("structured").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  lyzrApiKey: text("lyzr_api_key"),
  hostawayApiKey: text("hostaway_api_key"),
  preferences: jsonb("preferences").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_settings_user_id_idx").on(table.userId),
}));

export type ListingRow = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type InventoryMasterRow = typeof inventoryMaster.$inferSelect;
export type NewInventoryMaster = typeof inventoryMaster.$inferInsert;
export type ActivityTimelineRow = typeof activityTimeline.$inferSelect;
export type NewActivityTimeline = typeof activityTimeline.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
export type UserSettingsRow = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
