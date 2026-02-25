"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, FileText, Loader2 } from "lucide-react";
import type { ConversationMessage, MessageTemplate } from "@/types/operations";
import { format } from "date-fns";

interface MessageThreadProps {
  conversationId: number;
  guestName: string;
  templates: MessageTemplate[];
}

function formatMessageTime(dateString: string): string {
  try {
    return format(new Date(dateString), "MMM d, h:mm a");
  } catch {
    return "";
  }
}

const CATEGORY_LABELS: Record<MessageTemplate["category"], string> = {
  check_in: "Check-in",
  check_out: "Check-out",
  general: "General",
  issue: "Issue",
};

const CATEGORY_COLORS: Record<MessageTemplate["category"], string> = {
  check_in: "bg-green-100 text-green-700 border-green-200",
  check_out: "bg-orange-100 text-orange-700 border-orange-200",
  general: "bg-blue-100 text-blue-700 border-blue-200",
  issue: "bg-red-100 text-red-700 border-red-200",
};

export function MessageThread({
  conversationId,
  guestName,
  templates,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchMessages() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/conversations/${conversationId}/messages`
        );
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data: ConversationMessage[] = await res.json();
        if (!cancelled) {
          setMessages(data);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchMessages();

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    if (!loading) {
      // Small delay to allow DOM update
      const timer = setTimeout(scrollToBottom, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, loading, scrollToBottom]);

  async function handleSend() {
    const content = inputValue.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );
      if (!res.ok) throw new Error("Failed to send message");
      const newMessage: ConversationMessage = await res.json();
      setMessages((prev) => [...prev, newMessage]);
      setInputValue("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  }

  function handleTemplateSelect(template: MessageTemplate) {
    setInputValue(template.content);
    setTemplateOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-3 flex-shrink-0">
        <h3 className="font-semibold text-sm">{guestName}</h3>
        <p className="text-xs text-muted-foreground">
          {messages.length} message{messages.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
      </div>

      {/* Input area */}
      <div className="border-t px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Popover open={templateOpen} onOpenChange={setTemplateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="flex-shrink-0"
                title="Message templates"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="top"
              className="w-80 p-0"
            >
              <div className="p-3 border-b">
                <h4 className="text-sm font-semibold">Message Templates</h4>
                <p className="text-xs text-muted-foreground">
                  Click a template to insert it
                </p>
              </div>
              <ScrollArea className="max-h-64">
                <div className="divide-y">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className="w-full text-left px-3 py-2.5 hover:bg-accent/50 transition-colors"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {template.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            CATEGORY_COLORS[template.category]
                          )}
                        >
                          {CATEGORY_LABELS[template.category]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.content}
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <Input
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            className="flex-1"
          />

          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            className="flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ConversationMessage }) {
  if (message.sender === "system") {
    return (
      <div className="flex justify-center">
        <p className="text-xs text-muted-foreground italic bg-muted/50 rounded-full px-3 py-1">
          {message.content}
        </p>
      </div>
    );
  }

  const isHost = message.sender === "host";

  return (
    <div
      className={cn("flex", isHost ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-lg px-3 py-2",
          isHost
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p
          className={cn(
            "text-[10px] mt-1",
            isHost
              ? "text-primary-foreground/70"
              : "text-muted-foreground"
          )}
        >
          {formatMessageTime(message.sentAt)}
        </p>
      </div>
    </div>
  );
}
