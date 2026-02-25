"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

// 15 minutes in milliseconds
const INACTIVITY_TIME = 15 * 60 * 1000;

export function InactivityMonitor() {
    const router = useRouter();

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const handleLogout = async () => {
            try {
                const signOutPromise = authClient.signOut();
                const timeoutPromise = new Promise(resolve => setTimeout(resolve, 2000));
                await Promise.race([signOutPromise, timeoutPromise]);
            } catch { }
            const cookiesToClear = ['priceos-session', '__Secure-neon-auth.session_token', '__Secure-neon-auth.local.session_data', 'neon-auth.session_token', 'better-auth.session_token'];
            cookiesToClear.forEach(name => {
                document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
                document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax`;
            });
            window.location.href = '/login';
        };

        const resetTimer = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(handleLogout, INACTIVITY_TIME);
        };

        resetTimer();

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

    return null;
}
