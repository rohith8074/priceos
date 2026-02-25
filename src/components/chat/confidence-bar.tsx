"use client";

import { Progress } from "@/components/ui/progress";

interface ConfidenceBarProps {
  value: number; // 0-1 or 0-100
}

export function ConfidenceBar({ value }: ConfidenceBarProps) {
  const pct = value > 1 ? value : Math.round(value * 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Confidence</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}
