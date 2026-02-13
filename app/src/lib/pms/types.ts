export type {
  Listing,
  CalendarDay,
  Reservation,
  CalendarInterval,
  UpdateResult,
  VerificationResult,
  ReservationFilters,
} from "@/types/hostaway";

export type {
  SeasonalRule,
  Conversation,
  ConversationMessage,
  MessageTemplate,
  OperationalTask,
  Expense,
  OwnerStatement,
} from "@/types/operations";

import type {
  Listing,
  CalendarDay,
  Reservation,
  CalendarInterval,
  UpdateResult,
  VerificationResult,
  ReservationFilters,
} from "@/types/hostaway";

import type {
  SeasonalRule,
  Conversation,
  ConversationMessage,
  MessageTemplate,
  OperationalTask,
  Expense,
  OwnerStatement,
} from "@/types/operations";

/**
 * PMSClient Interface
 * Abstracts property management system operations
 * Allows switching between mock and real Hostaway API
 */

export interface PMSClient {
  // Read operations (Data Aggregator)
  listListings(): Promise<Listing[]>;
  getListing(id: string | number): Promise<Listing>;
  getCalendar(
    id: string | number,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarDay[]>;
  getReservations(filters?: ReservationFilters): Promise<Reservation[]>;

  // Write operations (Channel Sync)
  updateCalendar(
    id: string | number,
    intervals: CalendarInterval[]
  ): Promise<UpdateResult>;
  verifyCalendar(
    id: string | number,
    dates: string[]
  ): Promise<VerificationResult>;

  getReservation(id: string | number): Promise<Reservation>;

  blockDates(
    id: string | number,
    startDate: string,
    endDate: string,
    reason: "owner_stay" | "maintenance" | "other"
  ): Promise<UpdateResult>;
  unblockDates(
    id: string | number,
    startDate: string,
    endDate: string
  ): Promise<UpdateResult>;

  updateListing(id: string | number, updates: Partial<Listing>): Promise<Listing>;

  // Seasonal Rules
  getSeasonalRules(listingId: string | number): Promise<SeasonalRule[]>;
  createSeasonalRule(listingId: string | number, rule: Omit<SeasonalRule, "id" | "listingMapId">): Promise<SeasonalRule>;
  updateSeasonalRule(listingId: string | number, ruleId: number, updates: Partial<SeasonalRule>): Promise<SeasonalRule>;
  deleteSeasonalRule(listingId: string | number, ruleId: number): Promise<void>;

  // Conversations
  getConversations(listingId?: string | number): Promise<Conversation[]>;
  getConversationMessages(conversationId: number): Promise<ConversationMessage[]>;
  sendMessage(conversationId: number, content: string): Promise<ConversationMessage>;
  getMessageTemplates(): Promise<MessageTemplate[]>;

  // Tasks
  getTasks(listingId?: string | number): Promise<OperationalTask[]>;
  createTask(task: Omit<OperationalTask, "id" | "createdAt">): Promise<OperationalTask>;
  updateTask(taskId: number, updates: Partial<OperationalTask>): Promise<OperationalTask>;

  // Expenses
  getExpenses(listingId?: string | number): Promise<Expense[]>;
  createExpense(expense: Omit<Expense, "id">): Promise<Expense>;
  getOwnerStatements(listingId?: string | number): Promise<OwnerStatement[]>;

  // Reservations - create
  createReservation(reservation: Omit<Reservation, "id" | "createdAt" | "pricePerNight">): Promise<Reservation>;

  // Utility
  getMode(): "mock" | "live";
}
