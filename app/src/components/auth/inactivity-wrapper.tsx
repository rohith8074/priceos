"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 15 minutes in milliseconds
const INACTIVITY_TIME = 15 * 60 * 1000;

export function InactivityWrapper({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const handleLogout = () => {
            // Clear cookie and redirect
            document.cookie = 'priceos-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            router.push('/login');
        };

        const resetTimer = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(handleLogout, INACTIVITY_TIME);
        };

        // Initialize timer
        resetTimer();

        // Listen to activity
        window.addEventListener("mousemove", resetTimer);
        window.addEventListener("mousedown", resetTimer);
        window.addEventListener("keydown", resetTimer);
        window.addEventListener("touchstart", resetTimer);
        window.addEventListener("scroll", resetTimer);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener("mousemove", resetTimer);
            window.removeEventListener("mousedown", resetTimer);
            window.removeEventListener("keydown", resetTimer);
            window.removeEventListener("touchstart", resetTimer);
            window.removeEventListener("scroll", resetTimer);
        };
    }, [router]);

    return <>{children}</>;
}
