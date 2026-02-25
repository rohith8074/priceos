"use client";

import { cn } from "@/lib/utils";
import { ACTIVITY_STEPS } from "@/lib/agents/constants";
import { Zap, BarChart3, ShieldCheck, Check, Loader2 } from "lucide-react";

const iconMap = {
  Zap,
  BarChart3,
  ShieldCheck,
  Check,
} as const;

interface ActivityPanelProps {
  currentStep: number;
}

export function ActivityPanel({ currentStep }: ActivityPanelProps) {
  return (
    <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        Processing your request...
      </p>
      {ACTIVITY_STEPS.map((step, index) => {
        const Icon = iconMap[step.icon as keyof typeof iconMap] || Zap;
        const isActive = index === currentStep;
        const isComplete = index < currentStep;

        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-2 text-xs transition-all duration-300",
              isActive && "text-foreground font-medium",
              isComplete && "text-green-600",
              !isActive && !isComplete && "text-muted-foreground/50"
            )}
          >
            {isActive ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isComplete ? (
              <Check className="h-3 w-3" />
            ) : (
              <Icon className="h-3 w-3" />
            )}
            {step.label}
          </div>
        );
      })}
    </div>
  );
}
