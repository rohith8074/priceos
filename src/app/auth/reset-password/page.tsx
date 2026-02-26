"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleResetPassword = async () => {
    setError("");

    if (!token) {
      setError("Invalid or missing reset token. Please request a new reset link.");
      return;
    }
    if (!newPassword.trim()) {
      setError("Please enter a new password");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSaving(true);

    try {
      const result = await authClient.resetPassword({
        newPassword: newPassword,
        token: token,
      });

      if (result.error) {
        setError(result.error.message || "Failed to reset password. The link may have expired.");
        toast.error("Failed to reset password");
      } else {
        setSaveSuccess(true);
        toast.success("Password updated successfully!");
      }
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError("Failed to reset password. Please try again.");
      toast.error("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0b] p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] rounded-full animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-[440px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
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
          <h3 className="text-3xl font-black tracking-tighter text-white">Set New Password</h3>
          <p className="text-sm text-white/40">
            Enter your new password below to regain access to your account.
          </p>
        </div>

        {/* Success State */}
        {saveSuccess ? (
          <Card className="bg-white/[0.03] backdrop-blur-3xl border-emerald-500/20 shadow-2xl p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-emerald-500/10 p-4">
                <CheckCircle className="h-10 w-10 text-emerald-500" />
              </div>
              <h4 className="text-xl font-black text-white">Password Updated!</h4>
              <p className="text-sm text-white/50">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Link href="/login" className="w-full">
                <Button className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black uppercase tracking-wider hover:opacity-90 transition-opacity">
                  Go to Sign In
                </Button>
              </Link>
            </div>
          </Card>
        ) : !token ? (
          /* No Token State */
          <Card className="bg-white/[0.03] backdrop-blur-3xl border-red-500/20 shadow-2xl p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-red-500/10 p-4">
                <AlertCircle className="h-10 w-10 text-red-400" />
              </div>
              <h4 className="text-xl font-black text-white">Invalid Reset Link</h4>
              <p className="text-sm text-white/50">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <div className="w-full space-y-3 pt-2">
                <Link href="/auth/forgot-password" className="block w-full">
                  <Button className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black uppercase tracking-wider hover:opacity-90 transition-opacity">
                    Request New Reset Link
                  </Button>
                </Link>
                <Link href="/login" className="block w-full">
                  <Button variant="outline" className="w-full h-12 bg-transparent border-white/10 text-white/60 hover:text-white hover:border-white/20">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          /* Password Form */
          <Card className="bg-white/[0.03] backdrop-blur-3xl border-white/5 shadow-2xl relative overflow-hidden p-0">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

            <div className="p-6 space-y-5">
              {/* New Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase tracking-widest">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                    className="h-12 pl-10 pr-10 bg-white/[0.03] border-white/5 text-white placeholder:text-white/30 focus:border-amber-500 focus:ring-amber-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase tracking-widest">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                    className={`h-12 pl-10 pr-10 bg-white/[0.03] border-white/5 text-white placeholder:text-white/30 focus:border-amber-500 focus:ring-amber-500/20 ${confirmPassword && confirmPassword === newPassword ? "border-emerald-500/40" : ""
                      } ${confirmPassword && confirmPassword !== newPassword ? "border-red-500/40" : ""
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-[11px] text-red-400 pl-1">Passwords do not match</p>
                )}
                {confirmPassword && confirmPassword === newPassword && (
                  <p className="text-[11px] text-emerald-400 pl-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Passwords match
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleResetPassword}
                  disabled={isSaving || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black uppercase tracking-wider shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  {isSaving ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    "Save Password"
                  )}
                </Button>
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="h-12 px-6 bg-transparent border-white/10 text-white/60 hover:text-white hover:border-white/20 hover:bg-white/5 font-bold uppercase tracking-wider transition-all"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </Link>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0b]" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
