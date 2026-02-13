"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Conversation } from "@/types/operations";
import type { Listing } from "@/types/hostaway";
import { formatDistanceToNow } from "date-fns";

interface ConversationListProps {
  conversations: Conversation[];
  properties: Listing[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

function getPropertyName(
  listingMapId: number,
  properties: Listing[]
): string {
  const property = properties.find((p) => p.id === listingMapId);
  return property?.name ?? "Unknown Property";
}

function getStatusBadgeColor(status: "active" | "archived"): string {
  return status === "active"
    ? "bg-green-100 text-green-700 border-green-200"
    : "bg-gray-100 text-gray-500 border-gray-200";
}

function formatRelativeTime(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return "";
  }
}

export function ConversationList({
  conversations,
  properties,
  selectedId,
  onSelect,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No conversations found
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-220px)]">
      <div className="divide-y">
        {conversations.map((conversation) => {
          const isSelected = selectedId === conversation.id;
          const hasUnread = conversation.unreadCount > 0;

          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={cn(
                "w-full text-left px-4 py-3 transition-colors hover:bg-accent/50",
                isSelected && "bg-accent",
                hasUnread && "bg-blue-50/50 dark:bg-blue-950/20"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {hasUnread && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                    <span
                      className={cn(
                        "text-sm truncate",
                        hasUnread ? "font-semibold" : "font-medium"
                      )}
                    >
                      {conversation.guestName}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {getPropertyName(conversation.listingMapId, properties)}
                  </p>

                  {conversation.guestEmail && (
                    <p className="text-xs text-muted-foreground truncate">
                      {conversation.guestEmail}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(conversation.lastMessageAt)}
                  </span>

                  <div className="flex items-center gap-1">
                    {hasUnread && (
                      <Badge
                        variant="default"
                        className="h-5 min-w-[20px] px-1.5 text-xs justify-center"
                      >
                        {conversation.unreadCount}
                      </Badge>
                    )}

                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        getStatusBadgeColor(conversation.status)
                      )}
                    >
                      {conversation.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
