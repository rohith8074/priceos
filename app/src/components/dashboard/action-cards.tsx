"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { FileCheck, AlertTriangle, Mail, CalendarCheck } from "lucide-react";

interface ActionCardsProps {
  pendingProposals: number;
  overdueTasks: number;
  unreadMessages: number;
  checkInsToday: number;
}

const actions = [
  {
    key: "proposals",
    label: "proposals to review",
    icon: FileCheck,
    href: "/pricing",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950",
  },
  {
    key: "tasks",
    label: "tasks overdue",
    icon: AlertTriangle,
    href: "/tasks",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950",
  },
  {
    key: "messages",
    label: "unread messages",
    icon: Mail,
    href: "/inbox",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950",
  },
  {
    key: "checkins",
    label: "check-ins today",
    icon: CalendarCheck,
    href: "/bookings",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950",
  },
];

export function ActionCards({
  pendingProposals,
  overdueTasks,
  unreadMessages,
  checkInsToday,
}: ActionCardsProps) {
  const counts: Record<string, number> = {
    proposals: pendingProposals,
    tasks: overdueTasks,
    messages: unreadMessages,
    checkins: checkInsToday,
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {actions.map((action) => (
        <Link key={action.key} href={action.href}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg p-2.5 ${action.bg}`}>
                <action.icon className={`h-5 w-5 ${action.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{counts[action.key]}</p>
                <p className="text-sm text-muted-foreground">
                  {action.label}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
