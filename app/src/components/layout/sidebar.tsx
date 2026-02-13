"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Building2,
  CalendarDays,
  Mail,
  CheckSquare,
  DollarSign,
  Wallet,
  Settings,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/chat-store";
import { useAgentStore } from "@/stores/agent-store";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/inbox", label: "Inbox", icon: Mail },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
];

const navItemsLower = [
  { href: "/pricing", label: "Pricing", icon: DollarSign },
  { href: "/finance", label: "Finance", icon: Wallet },
];

const navSettings = { href: "/settings", label: "Settings", icon: Settings };

export function Sidebar() {
  const pathname = usePathname();
  const { open } = useChatStore();
  const { agents } = useAgentStore();
  const [collapsed, setCollapsed] = useState(false);

  function isActive(href: string) {
    return (
      pathname === href ||
      (href !== "/dashboard" && pathname.startsWith(href))
    );
  }

  function renderNavItem(item: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setCollapsed(false)}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  }

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-3 z-50 md:hidden"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <aside
        className={cn(
          "flex h-screen w-56 flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200",
          "max-md:fixed max-md:z-40",
          collapsed ? "max-md:translate-x-0" : "max-md:-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              P
            </div>
            <span className="text-lg font-semibold">PriceOS</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(renderNavItem)}

          <div className="my-3 border-t" />

          {navItemsLower.map(renderNavItem)}

          <div className="my-3 border-t" />

          {renderNavItem(navSettings)}
        </nav>

        {/* Agent status */}
        <div className="border-t p-3">
          <p className="mb-2 px-3 text-xs font-medium text-sidebar-foreground/50 uppercase">
            Agents
          </p>
          <div className="space-y-1 px-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-2 text-xs text-sidebar-foreground/70"
              >
                <div
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    agent.status === "active"
                      ? "bg-green-500"
                      : agent.status === "error"
                        ? "bg-red-500"
                        : "bg-muted-foreground/40"
                  )}
                />
                {agent.name}
              </div>
            ))}
          </div>
        </div>

        {/* Ask AI button */}
        <div className="border-t p-3">
          <Button
            onClick={() => {
              open();
              setCollapsed(false);
            }}
            className="w-full gap-2"
            size="sm"
          >
            <MessageSquare className="h-4 w-4" />
            Ask AI
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setCollapsed(false)}
        />
      )}
    </>
  );
}
