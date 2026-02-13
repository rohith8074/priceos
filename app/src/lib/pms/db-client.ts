import { PMSClient } from "./types";
import {
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
import { db } from "@/lib/db";
import {
  listings,
  calendarDays,
  reservations,
  seasonalRules,
  conversations,
  conversationMessages,
  messageTemplates,
  tasks,
  expenses,
  ownerStatements,
  type ListingRow,
  type ReservationRow,
  type CalendarDayRow,
  type SeasonalRuleRow,
  type ConversationRow,
  type ConversationMessageRow,
  type MessageTemplateRow,
  type TaskRow,
  type ExpenseRow,
  type OwnerStatementRow,
} from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { format, eachDayOfInterval, parseISO } from "date-fns";

// --- Row mappers (Drizzle numeric columns return strings) ---

function mapListingRow(row: ListingRow): Listing {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    countryCode: row.countryCode,
    area: row.area,
    bedroomsNumber: row.bedroomsNumber,
    bathroomsNumber: row.bathroomsNumber,
    propertyType: row.propertyType as Listing["propertyType"],
    propertyTypeId: row.propertyTypeId ?? undefined,
    price: parseFloat(row.price),
    currencyCode: row.currencyCode as "AED" | "USD",
    priceFloor: parseFloat(row.priceFloor),
    priceCeiling: parseFloat(row.priceCeiling),
    personCapacity: row.personCapacity ?? undefined,
    amenities: (row.amenities as string[]) ?? [],
  };
}

function mapCalendarDayRow(row: CalendarDayRow): CalendarDay {
  return {
    date: row.date,
    status: row.status as CalendarDay["status"],
    price: parseFloat(row.price),
    minimumStay: row.minimumStay ?? 1,
    maximumStay: row.maximumStay ?? 30,
    notes: row.notes ?? undefined,
  };
}

function mapReservationRow(row: ReservationRow): Reservation {
  return {
    id: row.id,
    listingMapId: row.listingMapId,
    guestName: row.guestName,
    guestEmail: row.guestEmail ?? undefined,
    channelName: row.channelName as Reservation["channelName"],
    arrivalDate: row.arrivalDate,
    departureDate: row.departureDate,
    nights: row.nights,
    totalPrice: parseFloat(row.totalPrice),
    pricePerNight: parseFloat(row.pricePerNight),
    status: row.status as Reservation["status"],
    createdAt: row.createdAt.toISOString(),
    checkInTime: row.checkInTime ?? undefined,
    checkOutTime: row.checkOutTime ?? undefined,
  };
}

function mapSeasonalRuleRow(row: SeasonalRuleRow): SeasonalRule {
  return {
    id: row.id,
    listingMapId: row.listingId,
    name: row.name,
    startDate: row.startDate,
    endDate: row.endDate,
    priceModifier: row.priceModifier,
    minimumStay: row.minimumStay ?? undefined,
    maximumStay: row.maximumStay ?? undefined,
    enabled: row.enabled,
  };
}

function mapConversationRow(row: ConversationRow): Conversation {
  return {
    id: row.id,
    listingMapId: row.listingId,
    reservationId: row.reservationId ?? undefined,
    guestName: row.guestName,
    guestEmail: row.guestEmail,
    lastMessageAt: row.lastMessageAt?.toISOString() ?? "",
    unreadCount: row.unreadCount,
    status: row.status as Conversation["status"],
  };
}

function mapConversationMessageRow(
  row: ConversationMessageRow
): ConversationMessage {
  return {
    id: row.id,
    conversationId: row.conversationId,
    sender: row.sender as ConversationMessage["sender"],
    content: row.content,
    sentAt: row.sentAt.toISOString(),
  };
}

function mapMessageTemplateRow(row: MessageTemplateRow): MessageTemplate {
  return {
    id: row.id,
    name: row.name,
    content: row.content,
    category: row.category as MessageTemplate["category"],
  };
}

function mapTaskRow(row: TaskRow): OperationalTask {
  return {
    id: row.id,
    listingMapId: row.listingId,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status as OperationalTask["status"],
    priority: row.priority as OperationalTask["priority"],
    category: row.category as OperationalTask["category"],
    dueDate: row.dueDate ?? undefined,
    assignee: row.assignee ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapExpenseRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    listingMapId: row.listingId,
    category: row.category as Expense["category"],
    amount: parseFloat(row.amount),
    currencyCode: row.currencyCode as "AED" | "USD",
    description: row.description,
    date: row.date,
  };
}

function mapOwnerStatementRow(row: OwnerStatementRow): OwnerStatement {
  return {
    id: row.id,
    listingMapId: row.listingId,
    month: row.month,
    totalRevenue: parseFloat(row.totalRevenue),
    totalExpenses: parseFloat(row.totalExpenses),
    netIncome: parseFloat(row.netIncome),
    occupancyRate: row.occupancyRate,
    reservationCount: row.reservationCount,
  };
}

// --- DbPMSClient ---

export class DbPMSClient implements PMSClient {
  // --- Listings ---

  async listListings(): Promise<Listing[]> {
    const rows = await db.select().from(listings);
    return rows.map(mapListingRow);
  }

  async getListing(id: string | number): Promise<Listing> {
    const numId = typeof id === "string" ? parseInt(id) : id;
    const rows = await db
      .select()
      .from(listings)
      .where(eq(listings.id, numId));
    if (rows.length === 0) throw new Error(`Listing ${id} not found`);
    return mapListingRow(rows[0]);
  }

  async updateListing(
    id: string | number,
    updates: Partial<Listing>
  ): Promise<Listing> {
    const numId = typeof id === "string" ? parseInt(id) : id;
    const setValues: Record<string, unknown> = {};
    if (updates.name !== undefined) setValues.name = updates.name;
    if (updates.price !== undefined) setValues.price = String(updates.price);
    if (updates.priceFloor !== undefined)
      setValues.priceFloor = String(updates.priceFloor);
    if (updates.priceCeiling !== undefined)
      setValues.priceCeiling = String(updates.priceCeiling);
    if (updates.bedroomsNumber !== undefined)
      setValues.bedroomsNumber = updates.bedroomsNumber;
    if (updates.bathroomsNumber !== undefined)
      setValues.bathroomsNumber = updates.bathroomsNumber;
    if (updates.personCapacity !== undefined)
      setValues.personCapacity = updates.personCapacity;
    if (updates.amenities !== undefined) setValues.amenities = updates.amenities;
    if (updates.propertyType !== undefined)
      setValues.propertyType = updates.propertyType;

    if (Object.keys(setValues).length > 0) {
      await db.update(listings).set(setValues).where(eq(listings.id, numId));
    }
    return this.getListing(numId);
  }

  // --- Calendar ---

  async getCalendar(
    id: string | number,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarDay[]> {
    const numId = typeof id === "string" ? parseInt(id) : id;
    const startStr = format(startDate, "yyyy-MM-dd");
    const endStr = format(endDate, "yyyy-MM-dd");

    const rows = await db
      .select()
      .from(calendarDays)
      .where(
        and(
          eq(calendarDays.listingId, numId),
          gte(calendarDays.date, startStr),
          lte(calendarDays.date, endStr)
        )
      );
    return rows.map(mapCalendarDayRow);
  }

  async updateCalendar(
    id: string | number,
    intervals: CalendarInterval[]
  ): Promise<UpdateResult> {
    const numId = typeof id === "string" ? parseInt(id) : id;
    let updatedCount = 0;

    for (const interval of intervals) {
      const days = eachDayOfInterval({
        start: parseISO(interval.startDate),
        end: parseISO(interval.endDate),
      });
      for (const day of days) {
        const dateStr = format(day, "yyyy-MM-dd");
        await db
          .update(calendarDays)
          .set({ price: String(interval.price) })
          .where(
            and(
              eq(calendarDays.listingId, numId),
              eq(calendarDays.date, dateStr)
            )
          );
        updatedCount++;
      }
    }

    return { success: true, updatedCount };
  }

  async verifyCalendar(
    id: string | number,
    dates: string[]
  ): Promise<VerificationResult> {
    // Simplified: check that all dates exist in the calendar
    const numId = typeof id === "string" ? parseInt(id) : id;
    let matchedDates = 0;
    for (const dateStr of dates) {
      const rows = await db
        .select()
        .from(calendarDays)
        .where(
          and(
            eq(calendarDays.listingId, numId),
            eq(calendarDays.date, dateStr)
          )
        );
      if (rows.length > 0) matchedDates++;
    }
    return {
      matches: matchedDates === dates.length,
      totalDates: dates.length,
      matchedDates,
    };
  }

  async blockDates(
    id: string | number,
    startDate: string,
    endDate: string,
    reason: "owner_stay" | "maintenance" | "other"
  ): Promise<UpdateResult> {
    const numId = typeof id === "string" ? parseInt(id) : id;
    const days = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(endDate),
    });
    let updatedCount = 0;
    for (const day of days) {
      const dateStr = format(day, "yyyy-MM-dd");
      await db
        .update(calendarDays)
        .set({ status: "blocked", notes: reason, price: "0" })
        .where(
          and(
            eq(calendarDays.listingId, numId),
            eq(calendarDays.date, dateStr)
          )
        );
      updatedCount++;
    }
    return { success: true, updatedCount };
  }

  async unblockDates(
    id: string | number,
    startDate: string,
    endDate: string
  ): Promise<UpdateResult> {
    const numId = typeof id === "string" ? parseInt(id) : id;
    const days = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(endDate),
    });
    let updatedCount = 0;
    for (const day of days) {
      const dateStr = format(day, "yyyy-MM-dd");
      await db
        .update(calendarDays)
        .set({ status: "available", notes: null })
        .where(
          and(
            eq(calendarDays.listingId, numId),
            eq(calendarDays.date, dateStr)
          )
        );
      updatedCount++;
    }
    return { success: true, updatedCount };
  }

  // --- Reservations ---

  async getReservations(filters?: ReservationFilters): Promise<Reservation[]> {
    const conditions = [];

    if (filters?.listingMapId) {
      conditions.push(eq(reservations.listingMapId, filters.listingMapId));
    }
    if (filters?.startDate) {
      conditions.push(
        gte(reservations.arrivalDate, format(filters.startDate, "yyyy-MM-dd"))
      );
    }
    if (filters?.endDate) {
      conditions.push(
        lte(
          reservations.departureDate,
          format(filters.endDate, "yyyy-MM-dd")
        )
      );
    }
    if (filters?.channelName) {
      conditions.push(eq(reservations.channelName, filters.channelName));
    }
    if (filters?.status) {
      conditions.push(eq(reservations.status, filters.status));
    }

    let query = db.select().from(reservations);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const rows = await query;
    let result = rows.map(mapReservationRow);

    if (filters?.offset) result = result.slice(filters.offset);
    if (filters?.limit) result = result.slice(0, filters.limit);

    return result;
  }

  async getReservation(id: string | number): Promise<Reservation> {
    const numId = typeof id === "string" ? parseInt(id) : id;
    const rows = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, numId));
    if (rows.length === 0) throw new Error(`Reservation ${id} not found`);
    return mapReservationRow(rows[0]);
  }

  async createReservation(
    reservation: Omit<Reservation, "id" | "createdAt" | "pricePerNight">
  ): Promise<Reservation> {
    const pricePerNight =
      reservation.nights > 0
        ? Math.round(reservation.totalPrice / reservation.nights)
        : 0;
    const [inserted] = await db
      .insert(reservations)
      .values({
        listingMapId: reservation.listingMapId,
        guestName: reservation.guestName,
        guestEmail: reservation.guestEmail,
        channelName: reservation.channelName,
        arrivalDate: reservation.arrivalDate,
        departureDate: reservation.departureDate,
        nights: reservation.nights,
        totalPrice: String(reservation.totalPrice),
        pricePerNight: String(pricePerNight),
        status: reservation.status,
        checkInTime: reservation.checkInTime,
        checkOutTime: reservation.checkOutTime,
      })
      .returning();
    return mapReservationRow(inserted);
  }

  // --- Seasonal Rules ---

  async getSeasonalRules(listingId: string | number): Promise<SeasonalRule[]> {
    const numId = typeof listingId === "string" ? parseInt(listingId) : listingId;
    const rows = await db
      .select()
      .from(seasonalRules)
      .where(eq(seasonalRules.listingId, numId));
    return rows.map(mapSeasonalRuleRow);
  }

  async createSeasonalRule(
    listingId: string | number,
    rule: Omit<SeasonalRule, "id" | "listingMapId">
  ): Promise<SeasonalRule> {
    const numId = typeof listingId === "string" ? parseInt(listingId) : listingId;
    const [inserted] = await db
      .insert(seasonalRules)
      .values({
        listingId: numId,
        name: rule.name,
        startDate: rule.startDate,
        endDate: rule.endDate,
        priceModifier: rule.priceModifier,
        minimumStay: rule.minimumStay,
        maximumStay: rule.maximumStay,
        enabled: rule.enabled,
      })
      .returning();
    return mapSeasonalRuleRow(inserted);
  }

  async updateSeasonalRule(
    listingId: string | number,
    ruleId: number,
    updates: Partial<SeasonalRule>
  ): Promise<SeasonalRule> {
    const setValues: Record<string, unknown> = {};
    if (updates.name !== undefined) setValues.name = updates.name;
    if (updates.startDate !== undefined) setValues.startDate = updates.startDate;
    if (updates.endDate !== undefined) setValues.endDate = updates.endDate;
    if (updates.priceModifier !== undefined)
      setValues.priceModifier = updates.priceModifier;
    if (updates.minimumStay !== undefined)
      setValues.minimumStay = updates.minimumStay;
    if (updates.maximumStay !== undefined)
      setValues.maximumStay = updates.maximumStay;
    if (updates.enabled !== undefined) setValues.enabled = updates.enabled;

    await db
      .update(seasonalRules)
      .set(setValues)
      .where(eq(seasonalRules.id, ruleId));

    const [row] = await db
      .select()
      .from(seasonalRules)
      .where(eq(seasonalRules.id, ruleId));
    return mapSeasonalRuleRow(row);
  }

  async deleteSeasonalRule(
    listingId: string | number,
    ruleId: number
  ): Promise<void> {
    await db.delete(seasonalRules).where(eq(seasonalRules.id, ruleId));
  }

  // --- Conversations ---

  async getConversations(
    listingId?: string | number
  ): Promise<Conversation[]> {
    if (listingId) {
      const numId =
        typeof listingId === "string" ? parseInt(listingId) : listingId;
      const rows = await db
        .select()
        .from(conversations)
        .where(eq(conversations.listingId, numId));
      return rows.map(mapConversationRow);
    }
    const rows = await db.select().from(conversations);
    return rows.map(mapConversationRow);
  }

  async getConversationMessages(
    conversationId: number
  ): Promise<ConversationMessage[]> {
    const rows = await db
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.conversationId, conversationId));
    return rows.map(mapConversationMessageRow);
  }

  async sendMessage(
    conversationId: number,
    content: string
  ): Promise<ConversationMessage> {
    const now = new Date();
    const [inserted] = await db
      .insert(conversationMessages)
      .values({
        conversationId,
        sender: "host",
        content,
        sentAt: now,
      })
      .returning();

    // Update conversation's lastMessage and lastMessageAt
    await db
      .update(conversations)
      .set({ lastMessage: content, lastMessageAt: now })
      .where(eq(conversations.id, conversationId));

    return mapConversationMessageRow(inserted);
  }

  async getMessageTemplates(): Promise<MessageTemplate[]> {
    const rows = await db.select().from(messageTemplates);
    return rows.map(mapMessageTemplateRow);
  }

  // --- Tasks ---

  async getTasks(listingId?: string | number): Promise<OperationalTask[]> {
    if (listingId) {
      const numId =
        typeof listingId === "string" ? parseInt(listingId) : listingId;
      const rows = await db
        .select()
        .from(tasks)
        .where(eq(tasks.listingId, numId));
      return rows.map(mapTaskRow);
    }
    const rows = await db.select().from(tasks);
    return rows.map(mapTaskRow);
  }

  async createTask(
    task: Omit<OperationalTask, "id" | "createdAt">
  ): Promise<OperationalTask> {
    const [inserted] = await db
      .insert(tasks)
      .values({
        listingId: task.listingMapId,
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        assignee: task.assignee,
      })
      .returning();
    return mapTaskRow(inserted);
  }

  async updateTask(
    taskId: number,
    updates: Partial<OperationalTask>
  ): Promise<OperationalTask> {
    const setValues: Record<string, unknown> = {};
    if (updates.title !== undefined) setValues.title = updates.title;
    if (updates.description !== undefined)
      setValues.description = updates.description;
    if (updates.status !== undefined) setValues.status = updates.status;
    if (updates.priority !== undefined) setValues.priority = updates.priority;
    if (updates.category !== undefined) setValues.category = updates.category;
    if (updates.dueDate !== undefined) setValues.dueDate = updates.dueDate;
    if (updates.assignee !== undefined) setValues.assignee = updates.assignee;

    await db.update(tasks).set(setValues).where(eq(tasks.id, taskId));

    const [row] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    return mapTaskRow(row);
  }

  // --- Expenses ---

  async getExpenses(listingId?: string | number): Promise<Expense[]> {
    if (listingId) {
      const numId =
        typeof listingId === "string" ? parseInt(listingId) : listingId;
      const rows = await db
        .select()
        .from(expenses)
        .where(eq(expenses.listingId, numId));
      return rows.map(mapExpenseRow);
    }
    const rows = await db.select().from(expenses);
    return rows.map(mapExpenseRow);
  }

  async createExpense(expense: Omit<Expense, "id">): Promise<Expense> {
    const [inserted] = await db
      .insert(expenses)
      .values({
        listingId: expense.listingMapId,
        category: expense.category,
        amount: String(expense.amount),
        currencyCode: expense.currencyCode,
        description: expense.description,
        date: expense.date,
      })
      .returning();
    return mapExpenseRow(inserted);
  }

  async getOwnerStatements(
    listingId?: string | number
  ): Promise<OwnerStatement[]> {
    if (listingId) {
      const numId =
        typeof listingId === "string" ? parseInt(listingId) : listingId;
      const rows = await db
        .select()
        .from(ownerStatements)
        .where(eq(ownerStatements.listingId, numId));
      return rows.map(mapOwnerStatementRow);
    }
    const rows = await db.select().from(ownerStatements);
    return rows.map(mapOwnerStatementRow);
  }

  // --- Utility ---

  getMode(): "mock" | "live" {
    return "mock"; // DB-backed but still "mock" data
  }
}
