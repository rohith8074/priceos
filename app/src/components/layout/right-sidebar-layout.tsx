"use client";

import { ReactNode, useState, useEffect, useCallback } from "react";
import { useContextStore } from "@/stores/context-store";
import { cn } from "@/lib/utils";

interface RightSidebarLayoutProps {
    children: ReactNode;
}

export function RightSidebarLayout({ children }: RightSidebarLayoutProps) {
    const isSidebarOpen = useContextStore((s) => s.isSidebarOpen);
    const [width, setWidth] = useState(400); // Default width
    const [isResizing, setIsResizing] = useState(false);

    const startResizing = useCallback((e: React.MouseEvent) => {
        setIsResizing(true);
        e.preventDefault();
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            // Calculate new width based on mouse position
            // Since sidebar is on the right, width = window.innerWidth - mouseX
            const newWidth = window.innerWidth - e.clientX;
            // Add constraints (min 300px, max 800px)
            if (newWidth >= 300 && newWidth <= 800) {
                setWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", resize);
            window.addEventListener("mouseup", stopResizing);
        }
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    return (
        <div
            className={cn(
                "bg-background relative border-l flex flex-col h-full overflow-hidden shrink-0",
                !isSidebarOpen && "border-l-0"
            )}
            style={{
                width: isSidebarOpen ? width : 0,
                opacity: isSidebarOpen ? 1 : 0,
                transition: isResizing ? 'none' : 'width 300ms ease-in-out, opacity 300ms ease-in-out'
            }}
        >
            {isSidebarOpen && (
                <div
                    className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary z-50 transition-colors"
                    onMouseDown={startResizing}
                />
            )}
            <div
                className="h-full flex flex-col shrink-0 w-full"
                style={{ width: isSidebarOpen ? width : 0 }}
            >
                {children}
            </div>
        </div>
    );
}
