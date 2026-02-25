"use client";

import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { usePropertyStore } from "@/stores/property-store";
import type { Listing } from "@/types/hostaway";

export function PropertyAskAI({ property }: { property: Listing }) {
  const { open } = useChatStore();
  const { setActiveProperty } = usePropertyStore();

  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={() => {
        setActiveProperty(property);
        open(`Tell me about the pricing outlook for ${property.name}`);
      }}
    >
      <MessageSquare className="h-4 w-4" />
      Ask AI About This Property
    </Button>
  );
}
