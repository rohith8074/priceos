"use client";

import { Card } from "@/components/ui/card";
import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ForgotPasswordForm, NeonAuthUIProvider, authLocalization } from "@neondatabase/auth/react/ui";
import { authClient } from "@/lib/auth/client";

function ForgotPasswordContent() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0b] p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] rounded-full animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-[440px] space-y-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-2.5 shadow-lg shadow-amber-500/20">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter">PriceOS</h1>
            <p className="text-[10px] text-amber-500/80 font-bold uppercase tracking-[0.2em]">Revenue Intelligence</p>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h3 className="text-3xl font-black tracking-tighter text-white">Forgot Password</h3>
          <p className="text-sm text-white/40">Enter your email address and we&apos;ll send you a link to reset your password.</p>
        </div>

        {/* Form */}
        <NeonAuthUIProvider authClient={authClient}>
          <Card className="bg-white/[0.03] backdrop-blur-3xl border-white/5 shadow-2xl relative overflow-hidden neon-auth-ui p-6">
            <ForgotPasswordForm localization={authLocalization} />
          </Card>
        </NeonAuthUIProvider>

        {/* Back to Login */}
        <Link
          href="/login"
          className="flex items-center gap-2 text-sm text-white/40 hover:text-amber-500 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Link>
      </div>

      <style jsx global>{`
                .neon-auth-ui {
                    --neon-primary: #f59e0b;
                    --neon-primary-foreground: #000;
                    --neon-background: transparent;
                    --neon-card: transparent;
                    --neon-border: rgba(255, 255, 255, 0.05);
                    --neon-input: rgba(255, 255, 255, 0.03);
                    --neon-foreground: #ffffff;
                    --neon-muted: rgba(255, 255, 255, 0.4);
                }
                form input {
                    background-color: rgba(255, 255, 255, 0.03) !important;
                    border: 1px solid rgba(255, 255, 255, 0.05) !important;
                    color: white !important;
                    border-radius: 8px !important;
                    height: 48px !important;
                    transition: all 0.2s ease !important;
                }
                form input:focus {
                    border-color: #f59e0b !important;
                    background-color: rgba(255, 255, 255, 0.05) !important;
                    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.1) !important;
                }
                form input::placeholder { color: rgba(255, 255, 255, 0.3) !important; }
                form label { color: rgba(255, 255, 255, 0.75) !important; font-weight: 600 !important; font-size: 0.8rem !important; }
                form a { color: rgba(255, 255, 255, 0.55) !important; }
                form a:hover { color: #f59e0b !important; }
                form p, form span { color: rgba(255, 255, 255, 0.5) !important; }
                form button[type="submit"] {
                    background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%) !important;
                    font-weight: 800 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.1em !important;
                    height: 48px !important;
                    border-radius: 8px !important;
                    box-shadow: 0 10px 20px -10px rgba(245, 158, 11, 0.5) !important;
                    transition: all 0.3s ease !important;
                    color: #000 !important;
                }
                form button[type="submit"]:hover {
                    transform: translateY(-2px) !important;
                    box-shadow: 0 15px 30px -10px rgba(245, 158, 11, 0.6) !important;
                }
            `}</style>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0b]" />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
