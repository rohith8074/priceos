"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  Moon,
  Sun,
  User,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useContextStore } from "@/stores/context-store";
import { useChatStore } from "@/stores/chat-store";
import { authClient } from "@/lib/auth/client";

export function HeaderNav() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { setPortfolioContext } = useContextStore();
  const { switchContext } = useChatStore();

  const [userName, setUserName] = useState("User Account");
  const [userInitial, setUserInitial] = useState("U");
  const [userEmail, setUserEmail] = useState("");

  // Fetch user info from Neon Auth session
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await authClient.getSession();
        if (res?.data?.user) {
          const u = res.data.user;
          setUserName(u.name || u.email || "User Account");
          setUserInitial((u.name?.[0] || u.email?.[0] || "U").toUpperCase());
          setUserEmail(u.email || "");
        }
      } catch (e) {
        console.error("Failed to load session", e);
      }
    }
    loadSession();
  }, []);

  const handleSignOut = async () => {
    // 1. Try to sign out via API first (needs session cookie)
    //    Race against 2s timeout so we always proceed
    try {
      const signOutPromise = authClient.signOut();
      const timeoutPromise = new Promise(resolve => setTimeout(resolve, 2000));
      await Promise.race([signOutPromise, timeoutPromise]);
    } catch { }

    // 2. Clear all auth cookies AFTER the API call
    const cookiesToClear = [
      'priceos-session',
      '__Secure-neon-auth.session_token',
      '__Secure-neon-auth.local.session_data',
      'neon-auth.session_token',
      'better-auth.session_token',
    ];
    cookiesToClear.forEach(name => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax`;
      document.cookie = `${name}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });

    // 3. Hard redirect to login
    window.location.href = '/login';
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 z-10">
      <div className="flex items-center gap-6 flex-1 min-w-0">
        {/* Logo/Brand - clickable to return to portfolio */}
        <button
          onClick={() => {
            setPortfolioContext();
            switchContext({ type: "portfolio" });
            router.push("/dashboard");
          }}
          className="flex items-center gap-3 shrink-0 group"
        >
          <div className="rounded-lg bg-amber-500 p-2 shadow-sm group-hover:shadow-md transition-shadow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">PriceOS</h1>
            <p className="text-[10px] text-muted-foreground font-medium">
              Revenue Intelligence
            </p>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User dropdown with settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold uppercase">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold uppercase">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {userEmail || "Property Manager"}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-red-600 dark:text-red-400"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
