"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, TrendingUp, Building2, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin';

    return (
        <div className="min-h-screen grid lg:grid-cols-2 overflow-hidden bg-[#0a0a0b]">
            {/* Left side: Dramatic Branding/Stats */}
            <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden border-r border-white/5">
                {/* Animated Background Mesh */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] rounded-full animate-pulse delay-1000" />
                </div>

                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-2.5 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tighter">PriceOS</h1>
                            <p className="text-[10px] text-amber-500/80 font-bold uppercase tracking-[0.2em]">Revenue intelligence</p>
                        </div>
                    </Link>
                </div>

                <div className="relative z-10 max-w-lg space-y-8">
                    <h2 className="text-6xl font-black text-white leading-tight tracking-tighter">
                        Maximize your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-500">
                            Portfolio Potential
                        </span>
                    </h2>
                    <p className="text-lg text-white/50 font-light leading-relaxed">
                        The only revenue management system built specifically for the high-velocity Dubai luxury market.
                        Real-time event tracking, automated pricing, and competitor intelligence.
                    </p>

                    <div className="grid grid-cols-2 gap-8 pt-6">
                        <div className="space-y-2 group cursor-default">
                            <div className="flex items-center gap-2 text-amber-500">
                                <TrendingUp className="h-5 w-5" />
                                <span className="text-2xl font-black tracking-tighter text-white group-hover:text-amber-400 transition-colors">+24%</span>
                            </div>
                            <p className="text-[10px] uppercase font-black tracking-widest text-white/30">Avg. Revenue Lift</p>
                        </div>
                        <div className="space-y-2 group cursor-default">
                            <div className="flex items-center gap-2 text-emerald-500">
                                <ShieldCheck className="h-5 w-5" />
                                <span className="text-2xl font-black tracking-tighter text-white group-hover:text-emerald-400 transition-colors">99.8%</span>
                            </div>
                            <p className="text-[10px] uppercase font-black tracking-widest text-white/30">Sync Accuracy</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-6 text-xs text-white/30 font-medium tracking-wide">
                    <div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Dubai Specialist</div>
                    <div className="w-1 h-1 rounded-full bg-white/10" />
                    <div>Enterprise Grade</div>
                    <div className="w-1 h-1 rounded-full bg-white/10" />
                    <div>24/7 Monitoring</div>
                </div>
            </div>

            {/* Right side: Login Form */}
            <div className="relative flex flex-col items-center justify-center p-6 lg:p-12">
                {/* Mobile Header */}
                <div className="lg:hidden absolute top-8 left-8">
                    <Link href="/" className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        <span className="text-sm font-bold text-white uppercase tracking-tighter">PriceOS</span>
                    </Link>
                </div>

                <div className="w-full max-w-[440px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="space-y-2 text-center lg:text-left">
                        <h3 className="text-3xl font-black tracking-tighter text-white">Access Your Dashboard</h3>
                        <p className="text-sm text-white/40">Secure administrative access for property operators.</p>
                    </div>

                    <Card className="bg-white/[0.03] backdrop-blur-3xl border-white/5 shadow-2xl relative overflow-hidden group">
                        {/* Top accent line */}
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-bold text-white">Sign In</CardTitle>
                            <CardDescription className="text-white/40">Enter your credentials to access the system.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4" onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const username = formData.get('username') as string;
                                const password = formData.get('password') as string;

                                try {
                                    const res = await fetch('/api/auth/login', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ username, password })
                                    });

                                    const data = await res.json();
                                    if (data.success) {
                                        // Set simple session
                                        const expiry = new Date();
                                        expiry.setDate(expiry.getDate() + 7);
                                        document.cookie = `priceos-session=${encodeURIComponent(JSON.stringify({ username: data.user.username, role: data.user.role }))}; path=/; expires=${expiry.toUTCString()}`;
                                        window.location.href = '/dashboard';
                                    } else {
                                        alert(data.error || 'Invalid credentials');
                                    }
                                } catch (err) {
                                    alert('An error occurred during sign in');
                                }
                            }}>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest">Username</label>
                                    <input
                                        name="username"
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-amber-500 transition-colors outline-none"
                                        placeholder="Enter username"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest">Password</label>
                                    <input
                                        name="password"
                                        type="password"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-amber-500 transition-colors outline-none"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-6">
                                    SIGN IN
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <p className="text-center text-[10px] text-white/20 px-8 uppercase tracking-widest leading-relaxed">
                        By accessing this system you agree to our
                        <Link href="#" className="text-amber-500/50 hover:text-amber-500 transition-colors mx-1 font-bold">Terms of Service</Link>
                        and
                        <Link href="#" className="text-amber-500/50 hover:text-amber-500 transition-colors mx-1 font-bold">Privacy Policy</Link>.
                    </p>

                    <div className="flex justify-center">
                        <Button variant="ghost" className="text-white/40 hover:text-white hover:bg-white/5" asChild>
                            <Link href="/">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Landing Page
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <style jsx global>{`
        /* Overriding Neon UI component colors to match our dark emerald/amber theme */
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
        
        /* Deep custom styling for Neon Auth inputs */
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

        form button[type="submit"] {
          background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%) !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          height: 48px !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 20px -10px rgba(245, 158, 11, 0.5) !important;
          transition: all 0.3s ease !important;
        }

        form button[type="submit"]:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 15px 30px -10px rgba(245, 158, 11, 0.6) !important;
        }
      `}</style>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0b]" />}>
            <LoginContent />
        </Suspense>
    );
}
