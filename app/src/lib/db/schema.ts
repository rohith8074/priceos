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
} from "drizzle-orm/pg-core";

export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
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
}));

export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
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
  date: date("date").notNull(),
  currentPrice: numeric("current_price", { precision: 10, scale: 2 }).notNull(),
  proposedPrice: numeric("proposed_price", { precision: 10, scale: 2 }).notNull(),
  changePct: integer("change_pct").notNull().default(0),
  riskLevel: text("risk_level").notNull().default("low"), // low, medium, high
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  reasoning: text("reasoning"),
  signals: jsonb("signals").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  listingDateIdx: index("proposals_listing_date_idx").on(table.listingId, table.date),
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

export const executions = pgTable("executions", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id")
    .references(() => proposals.id)
    .notNull(),
  listingId: integer("listing_id")
    .references(() => listings.id)
    .notNull(),
  oldPrice: numeric("old_price", { precision: 10, scale: 2 }).notNull(),
  newPrice: numeric("new_price", { precision: 10, scale: 2 }).notNull(),
  syncStatus: text("sync_status").notNull().default("pending"), // pending, synced, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- New tables ---

export const seasonalRules = pgTable("seasonal_rules", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .references(() => listings.id)
    .notNull(),
  name: text("name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  priceModifier: integer("price_modifier").notNull().default(0),
  minimumStay: integer("minimum_stay"),
  maximumStay: integer("maximum_stay"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  listingIdx: index("seasonal_rules_listing_idx").on(table.listingId),
  datesIdx: index("seasonal_rules_dates_idx").on(table.startDate, table.endDate),
}));

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .references(() => listings.id)
    .notNull(),
  reservationId: integer("reservation_id").references(() => reservations.id),
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  channel: text("channel").notNull().default("Direct"),
  lastMessage: text("last_message"),
  lastMessageAt: timestamp("last_message_at"),
  unreadCount: integer("unread_count").notNull().default(0),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  listingIdx: index("conversations_listing_idx").on(table.listingId),
  statusIdx: index("conversations_status_idx").on(table.status),
}));

export const conversationMessages = pgTable("conversation_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .references(() => conversations.id)
    .notNull(),
  sender: text("sender").notNull(), // guest, host, system
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
}, (table) => ({
  conversationIdx: index("messages_conversation_idx").on(table.conversationId),
}));

export const messageTemplates = pgTable("message_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // check_in, check_out, general, issue
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .references(() => listings.id)
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // cleaning, maintenance, inspection, other
  priority: text("priority").notNull().default("medium"), // low, medium, high
  status: text("status").notNull().default("todo"), // todo, in_progress, done
  dueDate: date("due_date"),
  assignee: text("assignee"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  listingIdx: index("tasks_listing_idx").on(table.listingId),
  statusIdx: index("tasks_status_idx").on(table.status),
  dueDateIdx: index("tasks_due_date_idx").on(table.dueDate),
}));

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .references(() => listings.id)
    .notNull(),
  category: text("category").notNull(), // cleaning, maintenance, supplies, utilities, commission, other
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull().default("AED"),
  description: text("description").notNull(),
  date: date("date").notNull(),
}, (table) => ({
  listingIdx: index("expenses_listing_idx").on(table.listingId),
  dateIdx: index("expenses_date_idx").on(table.date),
}));

export const ownerStatements = pgTable("owner_statements", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .references(() => listings.id)
    .notNull(),
  month: text("month").notNull(), // "2026-01"
  totalRevenue: numeric("total_revenue", { precision: 10, scale: 2 }).notNull(),
  totalExpenses: numeric("total_expenses", { precision: 10, scale: 2 }).notNull(),
  netIncome: numeric("net_income", { precision: 10, scale: 2 }).notNull(),
  occupancyRate: integer("occupancy_rate").notNull().default(0),
  reservationCount: integer("reservation_count").notNull().default(0),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(), // From Neon Auth
  lyzrApiKey: text("lyzr_api_key"), // Encrypted or hashed
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
export type Execution = typeof executions.$inferSelect;
export type NewExecution = typeof executions.$inferInsert;
export type SeasonalRuleRow = typeof seasonalRules.$inferSelect;
export type NewSeasonalRule = typeof seasonalRules.$inferInsert;
export type ConversationRow = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type ConversationMessageRow = typeof conversationMessages.$inferSelect;
export type NewConversationMessage = typeof conversationMessages.$inferInsert;
export type MessageTemplateRow = typeof messageTemplates.$inferSelect;
export type NewMessageTemplate = typeof messageTemplates.$inferInsert;
export type TaskRow = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type ExpenseRow = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type OwnerStatementRow = typeof ownerStatements.$inferSelect;
export type NewOwnerStatement = typeof ownerStatements.$inferInsert;
export type UserSettingsRow = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type OwnerStatementRow = typeof ownerStatements.$inferSelect;
export type NewOwnerStatement = typeof ownerStatements.$inferInsert;
