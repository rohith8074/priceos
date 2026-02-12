"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  level: string;
}

export function RiskBadge({ level }: RiskBadgeProps) {
  const normalized = level.toLowerCase();

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        normalized === "low" && "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
        normalized === "medium" && "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
        normalized === "high" && "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
      )}
    >
      {normalized === "low" ? "Low Risk" : normalized === "medium" ? "Medium Risk" : "High Risk"}
    </Badge>
  );
}
