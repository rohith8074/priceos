"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, User, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { toast } from "sonner";

function ForgotPasswordContent() {
  const [email, setEmail] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Verify email exists in database
  const handleVerifyEmail = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    setIsVerifying(true);
    setError("");

    try {
      const res = await fetch(`/api/auth/admin-reset-password?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (data.exists) {
        setVerifiedEmail(email);
        setUserName(data.name || email);
        setIsVerified(true);
        toast.success("Account found! Set your new password below.");
      } else {
        setError("No account found with this email address.");
        toast.error("Account not found");
      }
    } catch {
      setError("Failed to verify email. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 2: Save new password
  const handleSavePassword = async () => {
    setError("");

    if (!newPassword.trim()) { setError("Please enter a new password"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }

    setIsSaving(true);

    try {
      const res = await fetch("/api/auth/admin-reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifiedEmail, newPassword }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.emailSent) {
          setEmailSent(true);
          toast.success("Password reset link sent to your email!");
        } else {
          setSaveSuccess(true);
          toast.success("Password updated successfully!");
        }
      } else {
        setError(data.error || "Failed to reset password");
        toast.error(data.error || "Failed to reset password");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      toast.error("Failed to reset password");
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
          <h3 className="text-3xl font-black tracking-tighter text-white">Reset Password</h3>
          <p className="text-sm text-white/40">
            {!isVerified
              ? "Enter your email to verify your account."
              : "Set your new password below."}
          </p>
        </div>

        {/* ── SUCCESS STATE ── */}
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

          /* ── EMAIL SENT STATE ── */
        ) : emailSent ? (
          <Card className="bg-white/[0.03] backdrop-blur-3xl border-amber-500/20 shadow-2xl p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-amber-500/10 p-4">
                <Mail className="h-10 w-10 text-amber-500" />
              </div>
              <h4 className="text-xl font-black text-white">Check Your Email</h4>
              <p className="text-sm text-white/50">
                A password reset link has been sent to <span className="text-amber-500 font-semibold">{verifiedEmail}</span>.
                Click the link in the email to set a new password.
              </p>
              <div className="w-full space-y-3 pt-2">
                <Link href="/login" className="block w-full">
                  <Button className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black uppercase tracking-wider hover:opacity-90 transition-opacity">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          /* ── MAIN FORM ── */
        ) : (
          <Card className="bg-white/[0.03] backdrop-blur-3xl border-white/5 shadow-2xl relative overflow-hidden p-0">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

            <div className="p-6 space-y-5">
              {!isVerified ? (
                /* ── STEP 1: Email Verification ── */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest">
                      Email Address
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <Input
                        type="email"
                        placeholder="Enter your registered email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleVerifyEmail()}
                        className="h-12 pl-10 bg-white/[0.03] border-white/5 text-white placeholder:text-white/30 focus:border-amber-500 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleVerifyEmail}
                    disabled={isVerifying || !email.trim()}
                    className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black uppercase tracking-wider shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:-translate-y-0.5 transition-all"
                  >
                    {isVerifying ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...</>
                    ) : (
                      "Verify Account"
                    )}
                  </Button>
                </div>
              ) : (
                /* ── STEP 2: Username + New Password ── */
                <div className="space-y-5">
                  {/* Username (read-only from database) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500/60" />
                      <Input
                        type="text"
                        value={userName}
                        disabled
                        className="h-12 pl-10 bg-amber-500/5 border-amber-500/20 text-amber-500 font-semibold cursor-not-allowed opacity-80"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      </div>
                    </div>
                    <p className="text-[10px] text-white/30 pl-1">{verifiedEmail}</p>
                  </div>

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
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
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
                        onKeyDown={(e) => e.key === "Enter" && handleSavePassword()}
                        className={`h-12 pl-10 pr-10 bg-white/[0.03] border-white/5 text-white placeholder:text-white/30 focus:border-amber-500 focus:ring-amber-500/20 ${confirmPassword && confirmPassword === newPassword ? "border-emerald-500/40" : ""} ${confirmPassword && confirmPassword !== newPassword ? "border-red-500/40" : ""}`}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
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

                  {/* Save + Back */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleSavePassword}
                      disabled={isSaving || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                      className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black uppercase tracking-wider shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:hover:translate-y-0"
                    >
                      {isSaving ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                      ) : (
                        "Save"
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
                </div>
              )}

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

        {/* Back to Login (on step 1 only) */}
        {!isVerified && !saveSuccess && !emailSent && (
          <Link href="/login" className="flex items-center gap-2 text-sm text-white/40 hover:text-amber-500 transition-colors font-medium">
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        )}
      </div>
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
