"use client";

import { SUGGESTED_PROMPTS } from "@/lib/agents/constants";
import { Button } from "@/components/ui/button";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUGGESTED_PROMPTS.slice(0, 4).map((prompt) => (
        <Button
          key={prompt}
          variant="outline"
          size="sm"
          className="h-auto whitespace-normal py-1.5 text-xs text-left"
          onClick={() => onSelect(prompt)}
        >
          {prompt}
        </Button>
      ))}
    </div>
  );
}
