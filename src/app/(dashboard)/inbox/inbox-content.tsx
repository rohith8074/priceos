"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConversationList } from "@/components/inbox/conversation-list";
import { MessageThread } from "@/components/inbox/message-thread";
import { ArrowLeft, MessageSquare } from "lucide-react";
import type { Conversation, MessageTemplate } from "@/types/operations";
import type { Listing } from "@/types/hostaway";

interface InboxContentProps {
  conversations: Conversation[];
  properties: Listing[];
  templates: MessageTemplate[];
}

export function InboxContent({
  conversations,
  properties,
  templates,
}: InboxContentProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selectedConversation = conversations.find(
    (c) => c.id === selectedId
  );

  return (
    <>
      {/* Desktop two-panel layout */}
      <div className="hidden md:grid md:grid-cols-3 gap-0 border rounded-lg overflow-hidden h-[calc(100vh-220px)]">
        {/* Left panel - Conversation list */}
        <Card className="rounded-none border-0 border-r col-span-1">
          <ConversationList
            conversations={conversations}
            properties={properties}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </Card>

        {/* Right panel - Message thread or empty state */}
        <Card className="rounded-none border-0 col-span-2">
          {selectedConversation ? (
            <MessageThread
              conversationId={selectedConversation.id}
              guestName={selectedConversation.guestName}
              templates={templates}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <MessageSquare className="h-12 w-12 stroke-1" />
              <div className="text-center">
                <p className="font-medium">No conversation selected</p>
                <p className="text-sm">
                  Choose a conversation from the list to view messages
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden">
        {selectedId && selectedConversation ? (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedId(null)}
              className="mb-3"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to conversations
            </Button>
            <Card className="h-[calc(100vh-280px)]">
              <MessageThread
                conversationId={selectedConversation.id}
                guestName={selectedConversation.guestName}
                templates={templates}
              />
            </Card>
          </div>
        ) : (
          <Card>
            <ConversationList
              conversations={conversations}
              properties={properties}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </Card>
        )}
      </div>
    </>
  );
}
