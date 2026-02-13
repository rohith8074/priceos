"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { usePropertyStore } from "@/stores/property-store";
import { useChat } from "@/hooks/use-chat";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ActivityPanel } from "@/components/chat/activity-panel";
import { SuggestedPrompts } from "@/components/chat/suggested-prompts";

export function ChatPanel() {
  const { isOpen, close, contextPrompt } = useChatStore();
  const { activeProperty } = usePropertyStore();
  const { messages, isLoading, activityStep, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-send context prompt when chat opens with one
  useEffect(() => {
    if (isOpen && contextPrompt && !isLoading) {
      sendMessage(contextPrompt);
      useChatStore.getState().open(); // Clear contextPrompt
    }
  }, [isOpen, contextPrompt, isLoading, sendMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activityStep]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="right" className="flex w-[380px] flex-col p-0 sm:max-w-[380px]">
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">
              {activeProperty ? `AI - ${activeProperty.name}` : "AI Assistant"}
            </SheetTitle>
          </div>
          {activeProperty && (
            <p className="text-xs text-muted-foreground">
              {activeProperty.area} &middot; {activeProperty.propertyType} &middot;{" "}
              {activeProperty.price} AED/night
            </p>
          )}
        </SheetHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-sm text-muted-foreground py-8">
                <p className="mb-4">Ask me about pricing, events, or market trends.</p>
                <SuggestedPrompts onSelect={(prompt) => sendMessage(prompt)} />
              </div>
            )}

            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isLoading && activityStep !== null && (
              <ActivityPanel currentStep={activityStep} />
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about pricing..."
              className="min-h-[40px] max-h-[120px] resize-none"
              rows={1}
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
