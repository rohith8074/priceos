import type { Conversation, ConversationMessage, MessageTemplate } from "@/types/operations";

export const MOCK_CONVERSATIONS: Conversation[] = [
  { id: 1, reservationId: 1, listingMapId: 1001, guestName: "John Smith", guestEmail: "guest0@example.com", lastMessageAt: "2026-02-12T10:30:00Z", unreadCount: 2, status: "active" },
  { id: 2, reservationId: 3, listingMapId: 1003, guestName: "Michael Brown", guestEmail: "guest2@example.com", lastMessageAt: "2026-02-12T09:15:00Z", unreadCount: 0, status: "active" },
  { id: 3, reservationId: 5, listingMapId: 1005, guestName: "David Lee", guestEmail: "guest4@example.com", lastMessageAt: "2026-02-11T18:45:00Z", unreadCount: 1, status: "active" },
  { id: 4, reservationId: 2, listingMapId: 1002, guestName: "Sarah Johnson", guestEmail: "guest1@example.com", lastMessageAt: "2026-02-11T14:00:00Z", unreadCount: 0, status: "active" },
  { id: 5, reservationId: 4, listingMapId: 1004, guestName: "Emma Wilson", guestEmail: "guest3@example.com", lastMessageAt: "2026-02-10T22:30:00Z", unreadCount: 0, status: "archived" },
  { id: 6, listingMapId: 1001, guestName: "Lisa Anderson", guestEmail: "guest5@example.com", lastMessageAt: "2026-02-10T16:00:00Z", unreadCount: 3, status: "active" },
  { id: 7, reservationId: 6, listingMapId: 1001, guestName: "James Taylor", guestEmail: "guest6@example.com", lastMessageAt: "2026-02-09T11:00:00Z", unreadCount: 0, status: "active" },
  { id: 8, listingMapId: 1003, guestName: "Maria Garcia", guestEmail: "guest7@example.com", lastMessageAt: "2026-02-08T20:00:00Z", unreadCount: 0, status: "archived" },
  { id: 9, reservationId: 8, listingMapId: 1003, guestName: "Robert Martin", guestEmail: "guest8@example.com", lastMessageAt: "2026-02-12T08:00:00Z", unreadCount: 1, status: "active" },
  { id: 10, listingMapId: 1002, guestName: "Jessica White", guestEmail: "guest9@example.com", lastMessageAt: "2026-02-07T13:00:00Z", unreadCount: 0, status: "archived" },
];

export const MOCK_MESSAGES: ConversationMessage[] = [
  // Conversation 1 - John Smith (early check-in)
  { id: 1, conversationId: 1, sender: "guest", content: "Hi! We're arriving a bit earlier than expected. Is there any chance we can check in at 1pm instead of 3pm?", sentAt: "2026-02-12T10:00:00Z" },
  { id: 2, conversationId: 1, sender: "host", content: "Hi John! Let me check if the cleaning team can finish early. I'll get back to you shortly.", sentAt: "2026-02-12T10:15:00Z" },
  { id: 3, conversationId: 1, sender: "guest", content: "That would be amazing, thank you so much!", sentAt: "2026-02-12T10:30:00Z" },
  // Conversation 2 - Michael Brown (amenity question)
  { id: 4, conversationId: 2, sender: "guest", content: "Does the apartment have a washing machine? I'm packing light.", sentAt: "2026-02-12T09:00:00Z" },
  { id: 5, conversationId: 2, sender: "host", content: "Yes! There's a washer/dryer combo in the utility closet. Detergent pods are provided under the kitchen sink.", sentAt: "2026-02-12T09:15:00Z" },
  // Conversation 3 - David Lee (wifi issue)
  { id: 6, conversationId: 3, sender: "guest", content: "The WiFi seems really slow today. I have an important video call in an hour. Can you help?", sentAt: "2026-02-11T18:30:00Z" },
  { id: 7, conversationId: 3, sender: "host", content: "Sorry about that! Try restarting the router - it's the white box near the TV. If that doesn't work, I'll send our tech person over.", sentAt: "2026-02-11T18:45:00Z" },
  // Conversation 4 - Sarah Johnson (extension)
  { id: 8, conversationId: 4, sender: "guest", content: "We're loving the place! Any chance we could extend by 2 more nights?", sentAt: "2026-02-11T13:00:00Z" },
  { id: 9, conversationId: 4, sender: "host", content: "Great to hear! Let me check availability for those dates and get back to you with a rate.", sentAt: "2026-02-11T13:30:00Z" },
  { id: 10, conversationId: 4, sender: "host", content: "Good news - those nights are available! I can offer them at 800 AED/night. Shall I update the booking?", sentAt: "2026-02-11T14:00:00Z" },
  // Conversation 6 - Lisa Anderson (inquiry)
  { id: 11, conversationId: 6, sender: "guest", content: "Hi, I'm looking to book for a family of 5. Is this suitable?", sentAt: "2026-02-10T15:00:00Z" },
  { id: 12, conversationId: 6, sender: "guest", content: "Also, is parking available?", sentAt: "2026-02-10T15:30:00Z" },
  { id: 13, conversationId: 6, sender: "guest", content: "And one more thing - do you allow pets?", sentAt: "2026-02-10T16:00:00Z" },
  // Conversation 9 - Robert Martin (complaint)
  { id: 14, conversationId: 9, sender: "guest", content: "The AC in the bedroom is making a loud noise. It kept us up last night.", sentAt: "2026-02-12T07:30:00Z" },
  { id: 15, conversationId: 9, sender: "host", content: "I'm so sorry about that! I'm sending our maintenance team over today between 10-11am. Will someone be home?", sentAt: "2026-02-12T08:00:00Z" },
];

export const MOCK_MESSAGE_TEMPLATES: MessageTemplate[] = [
  { id: 1, name: "Welcome", category: "check_in", content: "Welcome to your stay! Here are a few things to know:\n\n- WiFi: {wifi_name} / {wifi_password}\n- Check-out: 11:00 AM\n- Emergency contact: +971-XX-XXX-XXXX\n\nEnjoy your stay!" },
  { id: 2, name: "Early Check-in Available", category: "check_in", content: "Great news! Early check-in is available for your dates. You can arrive as early as 1:00 PM. I'll make sure everything is ready for you." },
  { id: 3, name: "Early Check-in Unavailable", category: "check_in", content: "Unfortunately, early check-in isn't possible for your dates as we have a guest checking out that morning. Standard check-in is at 3:00 PM. You're welcome to store luggage with the concierge." },
  { id: 4, name: "Check-out Reminder", category: "check_out", content: "Hi! Just a friendly reminder that check-out is tomorrow at 11:00 AM. Please leave the keys on the kitchen counter. Safe travels!" },
  { id: 5, name: "Maintenance Scheduled", category: "issue", content: "I've scheduled our maintenance team to visit today. They'll arrive between {time_range}. Please let me know if that works for you." },
  { id: 6, name: "Thank You", category: "general", content: "Thank you for staying with us! We'd love a review if you have a moment. We hope to host you again soon!" },
];

export function getConversationsForListing(listingMapId: number): Conversation[] {
  return MOCK_CONVERSATIONS.filter((c) => c.listingMapId === listingMapId);
}

export function getMessagesForConversation(conversationId: number): ConversationMessage[] {
  return MOCK_MESSAGES.filter((m) => m.conversationId === conversationId);
}
