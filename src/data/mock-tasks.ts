import type { OperationalTask } from "@/types/operations";

export const MOCK_TASKS: OperationalTask[] = [
  { id: 1, listingMapId: 1001, title: "Deep cleaning after checkout", status: "todo", priority: "high", category: "cleaning", dueDate: "2026-02-13", assignee: "Ahmed", reservationId: 1, createdAt: "2026-02-12T08:00:00Z" },
  { id: 2, listingMapId: 1002, title: "Replace bed linens", status: "todo", priority: "medium", category: "cleaning", dueDate: "2026-02-14", assignee: "Ahmed", createdAt: "2026-02-12T08:00:00Z" },
  { id: 3, listingMapId: 1003, title: "AC maintenance - annual service", status: "in_progress", priority: "high", category: "maintenance", dueDate: "2026-02-12", assignee: "Rashid", createdAt: "2026-02-10T09:00:00Z" },
  { id: 4, listingMapId: 1004, title: "Pool chemical check", status: "todo", priority: "medium", category: "maintenance", dueDate: "2026-02-15", assignee: "Rashid", createdAt: "2026-02-11T10:00:00Z" },
  { id: 5, listingMapId: 1004, title: "Garden landscaping trim", status: "done", priority: "low", category: "maintenance", dueDate: "2026-02-10", assignee: "External", createdAt: "2026-02-08T07:00:00Z" },
  { id: 6, listingMapId: 1001, title: "Restock toiletries and coffee pods", status: "todo", priority: "medium", category: "cleaning", dueDate: "2026-02-13", assignee: "Fatima", createdAt: "2026-02-12T08:30:00Z" },
  { id: 7, listingMapId: 1005, title: "Fix leaking bathroom faucet", description: "Guest reported slow drip from hot water tap", status: "in_progress", priority: "high", category: "maintenance", dueDate: "2026-02-12", assignee: "Rashid", reservationId: 5, createdAt: "2026-02-11T19:00:00Z" },
  { id: 8, listingMapId: 1002, title: "Pre-arrival inspection", status: "todo", priority: "high", category: "inspection", dueDate: "2026-02-14", assignee: "Fatima", reservationId: 3, createdAt: "2026-02-12T07:00:00Z" },
  { id: 9, listingMapId: 1003, title: "Replace kitchen cabinet hinges", description: "Two hinges on upper cabinet are loose", status: "todo", priority: "low", category: "maintenance", dueDate: "2026-02-20", createdAt: "2026-02-09T14:00:00Z" },
  { id: 10, listingMapId: 1001, title: "Deep cleaning after checkout", status: "done", priority: "high", category: "cleaning", dueDate: "2026-02-08", assignee: "Ahmed", createdAt: "2026-02-07T08:00:00Z" },
  { id: 11, listingMapId: 1005, title: "Replace TV remote batteries", status: "done", priority: "low", category: "other", dueDate: "2026-02-09", assignee: "Fatima", createdAt: "2026-02-09T10:00:00Z" },
  { id: 12, listingMapId: 1002, title: "Standard cleaning before check-in", status: "todo", priority: "high", category: "cleaning", dueDate: "2026-02-15", assignee: "Ahmed", reservationId: 4, createdAt: "2026-02-12T08:00:00Z" },
  { id: 13, listingMapId: 1004, title: "Quarterly property inspection", status: "todo", priority: "medium", category: "inspection", dueDate: "2026-02-28", createdAt: "2026-02-01T09:00:00Z" },
  { id: 14, listingMapId: 1003, title: "WiFi router replacement", description: "Current router is 3+ years old, performance degrading", status: "in_progress", priority: "medium", category: "maintenance", dueDate: "2026-02-13", assignee: "Rashid", createdAt: "2026-02-11T11:00:00Z" },
  { id: 15, listingMapId: 1001, title: "Window cleaning (exterior)", status: "todo", priority: "low", category: "cleaning", dueDate: "2026-02-25", assignee: "External", createdAt: "2026-02-10T12:00:00Z" },
];

export function getTasksForListing(listingMapId: number): OperationalTask[] {
  return MOCK_TASKS.filter((t) => t.listingMapId === listingMapId);
}
