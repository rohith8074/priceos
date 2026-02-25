export interface SeasonalRule {
  id: number;
  listingMapId: number;
  name: string;
  startDate: string;
  endDate: string;
  priceModifier: number;
  minimumStay?: number;
  maximumStay?: number;
  enabled: boolean;
}

export interface Conversation {
  id: number;
  reservationId?: number;
  listingMapId: number;
  guestName: string;
  guestEmail: string;
  lastMessageAt: string;
  unreadCount: number;
  status: "active" | "archived";
}

export interface ConversationMessage {
  id: number;
  conversationId: number;
  sender: "guest" | "host" | "system";
  content: string;
  sentAt: string;
}

export interface MessageTemplate {
  id: number;
  name: string;
  content: string;
  category: "check_in" | "check_out" | "general" | "issue";
}

export interface OperationalTask {
  id: number;
  listingMapId: number;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  category: "cleaning" | "maintenance" | "inspection" | "other";
  dueDate?: string;
  assignee?: string;
  reservationId?: number;
  createdAt: string;
}

export interface Expense {
  id: number;
  listingMapId: number;
  category: "cleaning" | "maintenance" | "supplies" | "utilities" | "commission" | "other";
  amount: number;
  currencyCode: "AED" | "USD";
  description: string;
  date: string;
  reservationId?: number;
}

export interface OwnerStatement {
  id: number;
  listingMapId: number;
  month: string;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  occupancyRate: number;
  reservationCount: number;
}
