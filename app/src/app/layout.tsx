import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { authClient } from "@/lib/auth/client";
import "@neondatabase/auth-ui/css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PriceOS - AI Revenue Management",
  description: "AI-powered revenue management for Dubai short-term rentals",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <NeonAuthUIProvider authClient={authClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </NeonAuthUIProvider>
      </body>
    </html>
  );
}
