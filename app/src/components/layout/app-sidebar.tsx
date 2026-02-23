"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, Settings, Database, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Agent Chat", href: "/agent-chat", icon: MessageSquare },
    { name: "Pricing", href: "/pricing", icon: Activity },
    { name: "Operations", href: "/operations", icon: Settings },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-16 flex-col items-center border-r bg-background py-4 shrink-0 transition-all hover:w-64 group z-20">
            <div className="flex flex-1 flex-col gap-4 w-full px-2">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "group/item flex items-center justify-start gap-3 rounded-lg p-3 text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                                isActive && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                            )}
                        >
                            <item.icon className="h-5 w-5 shrink-0" />
                            <span className="truncate whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover:opacity-100 font-medium text-sm">
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
