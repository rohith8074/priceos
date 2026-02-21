"use client";

import { ReactNode } from "react";
import { useContextStore } from "@/stores/context-store";
import { cn } from "@/lib/utils";

interface RightSidebarLayoutProps {
    children: ReactNode;
}

export function RightSidebarLayout({ children }: RightSidebarLayoutProps) {
    const isSidebarOpen = useContextStore((s) => s.isSidebarOpen);

    return (
        <div
            className={cn(
                "bg-background relative border-l transition-all duration-300 flex flex-col h-full overflow-hidden",
                isSidebarOpen
                    ? "w-[350px] min-w-[350px] max-w-[450px] lg:w-[400px] xl:w-[450px] opacity-100"
                    : "w-0 min-w-0 max-w-0 opacity-0 border-l-0"
            )}
        >
            <div className="w-[350px] lg:w-[400px] xl:w-[450px] h-full flex flex-col shrink-0">
                {children}
            </div>
        </div>
    );
}
