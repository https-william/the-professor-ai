"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getRedirectUrl } from "@/lib/api-client";
import BrandLogo from "@/components/ui/BrandLogo";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import { motion } from "framer-motion";
import { RotateCw, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [googleHighlight, setGoogleHighlight] = useState(false);
    const [resending, setResending] = useState(false);
    const [resentStatus, setResentStatus] = useState<string | null>(null);
    const [providerInfo, setProviderInfo] = useState<any>(null);
    const router = useRouter();
    const supabase = createClient();
    const searchParams = useSearchParams();

    const nextUrl = searchParams.get("next") || "/dashboard";

    const handleResendConfirm = async () => {
        if (!email) return;
        setResending(true);
        setResentStatus(null);
        try {
            const { error: resendError } = await supabase.auth.resend({
                type: "signup",
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`
                }
            });
            if (resendError) {
                setResentStatus(`Failed: ${resendError.message}`);
            } else {
                setResentStatus("✉️ Link sent! Check your inbox.");
            }
        } catch (err: any) {
            setResentStatus(`Failed: ${err.message || err}`);
        } finally {
            setResending(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setGoogleHighlight(false);
        setResentStatus(null);

        let currentProviderInfo = null;

        // Pre-check if email is registered with Google OAuth
        try {
            const checkRes = await fetch(`/api/auth/check-provider?email=${encodeURIComponent(email)}`);
            if (checkRes.ok) {
                const checkData = await checkRes.json();
                currentProviderInfo = checkData;
                setProviderInfo(checkData);
                if (checkData.exists && checkData.isGoogleOnly) {
                    setError("It looks like you registered using Google! Click the 'Continue with Google' button below to sign in.");
                    setGoogleHighlight(true);
                    setLoading(false);
                    return;
                }
            }
        } catch (err) {
            console.error("Failed to check auth provider options:", err);
        }
        
        const { data: { user: authUser }, error: loginError } = await supabase.auth.signInWithPassword({ 
            email, 
            password,
        });
        
        if (loginError) { 
            let msg = loginError.message;
            if (msg.toLowerCase().includes("invalid login credentials") || msg.toLowerCase().includes("invalid credentials")) {
                if (currentProviderInfo?.hasGoogle) {
                    msg = "It looks like this email is linked to a Google account. Please use the 'Continue with Google' button below to sign in.";
                    setGoogleHighlight(true);
                } else {
                    msg = "Hmm, that email or password doesn't match our notes. Try checking for typos?";
                }
            } else if (msg.toLowerCase().includes("email not confirmed")) {
                if (currentProviderInfo?.hasGoogle) {
                    msg = "It looks like this email is linked to a Google account. Please use the 'Continue with Google' button above to sign in.";
                    setGoogleHighlight(true);
                } else {
                    msg = "Almost there! We sent a confirmation link to your email. Click it to unlock your account.";
                }
            } else if (msg.toLowerCase().includes("rate limit")) {
                msg = "Whoa, slow down a bit! You've tried logging in too many times recently. Take a breath and try again in a minute.";
            }
            setError(msg);
            setLoading(false); 
        } else if (authUser) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("has_onboarded")
                .eq("id", authUser.id)
                .single();

            if (profile?.has_onboarded === false) {
                router.push(`/onboarding?next=${encodeURIComponent(nextUrl)}`);
            } else {
                router.push(nextUrl);
            }
            router.refresh();
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const redirectBase = getRedirectUrl();
        const redirectUrl = `${redirectBase}${redirectBase.includes("?") ? "&" : "?"}next=${encodeURIComponent(nextUrl)}`;
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: redirectUrl },
        });
        if (error) { setError(error.message); setLoading(false); }
    };

    const renderError = () => {
        if (!error) return null;

        // Detect custom Google OAuth warning
        if (error.includes("registered using Google") || error.includes("linked to a Google account")) {
            return (
                <div className="flex flex-col gap-1.5 p-4 rounded-2xl mb-5 bg-amber-500/5 border border-amber-500/25 text-amber-400 text-xs shadow-[0_4px_12px_rgba(229,169,60,0.03)] text-left animate-shake">
                    <div className="flex items-center gap-2 font-black uppercase tracking-wider text-[10px] text-amber-500">
                        <span>💡</span> Registered via Google
                    </div>
                    <div className="opacity-85 leading-relaxed font-medium">
                        Please use the <strong>Continue with Google</strong> button above to sign in.
                    </div>
                </div>
            );
        }

        // Detect unconfirmed email warning
        if (error.includes("confirmation link") || error.includes("confirm your email")) {
            return (
                <div className="flex flex-col gap-1.5 p-4 rounded-2xl mb-5 bg-violet-500/5 border border-violet-500/25 text-violet-300 text-xs shadow-[0_4px_12px_rgba(150,115,245,0.03)] text-left">
                    <div className="flex items-center gap-2 font-black uppercase tracking-wider text-[10px] text-violet-400">
                        <span>✉️</span> Confirm your email
                    </div>
                    <div className="opacity-85 leading-relaxed font-medium">
                        We sent a confirmation link to your email. Click it to unlock your account.
                        <div className="mt-2 text-[10px] opacity-75">
                            (If you registered with Google, use the <strong>Continue with Google</strong> button above instead.)
                        </div>
                    </div>
                    <div className="mt-2 border-t border-violet-500/10 pt-2 flex flex-col gap-1.5">
                        <button
                            type="button"
                            onClick={handleResendConfirm}
                            disabled={resending}
                            className="text-left font-black uppercase tracking-widest text-[9px] text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                            {resending ? "Sending..." : "Resend confirmation link"}
                        </button>
                        {resentStatus && (
                            <span className="text-[10px] text-white/60 font-semibold">{resentStatus}</span>
                        )}
                    </div>
                </div>
            );
        }

        // Default incorrect credentials error (cleaner, structured)
        if (error.toLowerCase().includes("match our notes") || error.toLowerCase().includes("invalid login") || error.toLowerCase().includes("invalid credentials")) {
            return (
                <div className="flex flex-col gap-2 p-4 rounded-2xl mb-5 bg-rose-500/5 border border-rose-500/20 text-rose-300 text-xs shadow-[0_4px_12px_rgba(232,93,117,0.03)] text-left">
                    <div className="flex items-center gap-2 font-black uppercase tracking-wider text-[10px] text-rose-400">
                        <span>⚠️</span> Let's check those details
                    </div>
                    <div className="opacity-85 leading-relaxed font-medium">
                        That email or password doesn't match our notes.
                    </div>
                    <div className="border-t border-rose-500/10 pt-2 mt-1 flex flex-col gap-1 text-[10px] opacity-75 font-semibold">
                        <div>• Typos in the email address or password?</div>
                        <div>• Registered using Google? Try Google sign-in instead.</div>
                        <div>• Newly signed up? Make sure your email link is confirmed.</div>
                    </div>
                </div>
            );
        }

        // Standard fallback error
        return (
            <div className="flex items-center gap-2 p-4 rounded-2xl mb-5 bg-rose-500/5 border border-rose-500/20 text-rose-300 text-xs text-left font-bold">
                ⚠️ {error}
            </div>
        );
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-[var(--background)] font-sans">
            {/* Cinematic Background Blur */}
            <div className="absolute inset-0 bg-[var(--background)]/90 backdrop-blur-[100px] pointer-events-none z-0" />
            
            {/* Ambient Background Orbs */}
            <motion.div 
                className="absolute w-[500px] h-[500px] rounded-full mix-blend-screen opacity-20 pointer-events-none z-0"
                style={{ background: "radial-gradient(circle, var(--blue-dim) 0%, var(--blue-glow) 50%, transparent 70%)", filter: "blur(120px)", top: "15%", left: "10%" }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
                className="absolute w-[500px] h-[500px] rounded-full mix-blend-screen opacity-15 pointer-events-none z-0"
                style={{ background: "radial-gradient(circle, var(--blue-dim) 0%, var(--blue-glow) 50%, transparent 70%)", filter: "blur(120px)", bottom: "10%", right: "10%" }}
                animate={{ scale: [1.1, 1, 1.1] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Back link */}
            <Link
                href="/"
                className="absolute top-6 left-6 text-white/50 hover:text-white font-bold text-xs tracking-wider uppercase transition-colors duration-150 flex items-center gap-2 z-10"
            >
                <ArrowLeft size={16} />
                <span>Back</span>
            </Link>

            <GlassmorphicCard 
                intensity="heavy"
                radius="2rem"
                className="relative z-10 w-full max-w-[420px] p-8 sm:p-10 shadow-2xl text-center"
            >
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="inline-flex items-center justify-center mb-4">
                        <BrandLogo size="md" />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight uppercase italic">
                        Welcome back.
                    </h1>
                    <p className="text-white/40 text-xs font-semibold tracking-wider uppercase mt-1">
                        Continue where you left off
                    </p>
                </div>

                {/* Google OAuth */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className={`w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl py-3.5 flex items-center justify-center gap-3 transition-all duration-150 active:scale-98 font-bold text-sm text-white ${
                        googleHighlight ? "animate-shake border-amber-500/50 shadow-[0_0_15px_rgba(229,169,60,0.1)]" : ""
                    }`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Continue with Google</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-[1px] bg-white/5" />
                    <span className="font-bold text-[10px] tracking-widest text-white/20 uppercase">or</span>
                    <div className="flex-1 h-[1px] bg-white/5" />
                </div>

                {/* Error Box */}
                {renderError()}

                {/* Form */}
                <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="login-email" className="text-[10px] font-black uppercase tracking-widest text-white/40 pl-1">Email</label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                            <input
                                id="login-email"
                                type="email"
                                placeholder="you@email.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (googleHighlight) setGoogleHighlight(false);
                                }}
                                required
                                autoComplete="email"
                                className="w-full pl-11 pr-5 py-3.5 font-bold text-white outline-none placeholder:text-white/20 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-white/20 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] transition-all duration-300 focus:border-amber-500/50 focus:bg-white/[0.05] focus:scale-[1.01] focus:shadow-[0_0_15px_rgba(229,169,60,0.15),_inset_0_2px_4px_rgba(0,0,0,0.4)]"
                            />
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center px-1">
                            <label htmlFor="login-pass" className="text-[10px] font-black uppercase tracking-widest text-white/40">Password</label>
                            <Link 
                                href="/forgot-password" 
                                className="text-[10px] font-black uppercase tracking-widest text-amber-500/80 hover:text-amber-400 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                            <input
                                id="login-pass"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (googleHighlight) setGoogleHighlight(false);
                                }}
                                required
                                autoComplete="current-password"
                                className="w-full pl-11 pr-12 py-3.5 font-bold text-white outline-none placeholder:text-white/20 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-white/20 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] transition-all duration-300 focus:border-amber-500/50 focus:bg-white/[0.05] focus:scale-[1.01] focus:shadow-[0_0_15px_rgba(229,169,60,0.15),_inset_0_2px_4px_rgba(0,0,0,0.4)]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-900 border border-amber-500/30 hover:shadow-[0_8px_30px_rgba(229,169,60,0.3)] shadow-[0_4px_15px_rgba(229,169,60,0.15)] rounded-2xl font-black text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all active:scale-98 hover:scale-[1.01] duration-300 mt-4"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <RotateCw size={18} className="animate-spin" />
                                <span>Signing in...</span>
                            </div>
                        ) : "Sign in"}
                    </button>
                </form>

                <p className="text-xs text-white/50 font-medium mt-8">
                    New to The Professor?{" "}
                    <Link 
                        href={`/signup${nextUrl && nextUrl !== "/dashboard" ? `?next=${encodeURIComponent(nextUrl)}` : ""}`} 
                        className="text-amber-500 font-bold hover:underline transition-all"
                    >
                        Create a free account
                    </Link>
                </p>

                <div className="flex justify-center gap-4 mt-6 text-[10px] font-black uppercase tracking-wider text-white/20">
                    <Link href="/legal/privacy" className="hover:text-white/40 transition-colors">Privacy Policy</Link>
                    <span>•</span>
                    <Link href="/legal/terms" className="hover:text-white/40 transition-colors">Terms of Use</Link>
                </div>
            </GlassmorphicCard>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
