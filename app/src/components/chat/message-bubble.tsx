"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import { StructuredResponse } from "./structured-response";
import { AlertCircle } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === "error") {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{message.content}</p>
      </div>
    );
  }

  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.structured && <StructuredResponse data={message.structured} />}
      </div>
    </div>
  );
}
