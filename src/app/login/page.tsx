"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import BrandLogo from "@/components/ui/BrandLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { getRedirectUrl } from "@/lib/api-client";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passFocused, setPassFocused] = useState(false);
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); setLoading(false); }
        else { router.push("/dashboard"); router.refresh(); }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: getRedirectUrl() },
        });
        if (error) { setError(error.message); setLoading(false); }
    };

    return (
        <div className="min-h-[100dvh] bg-[var(--background)] flex items-center justify-center relative overflow-hidden px-5 py-12 transition-colors duration-500">

            {/* ═══ Living background ═══ */}
            <div className="fixed inset-0 pointer-events-none">
                {/* Large indigo orb — top right */}
                <div
                    className="absolute w-[min(700px,80vw)] h-[min(700px,80vw)] rounded-full"
                    style={{
                        top: "-25%", right: "-15%",
                        background: "radial-gradient(circle, rgba(99,102,241,0.07), transparent 65%)",
                        filter: "blur(60px)",
                    }}
                />
                {/* Amber orb — bottom left */}
                <div
                    className="absolute w-[min(500px,70vw)] h-[min(500px,70vw)] rounded-full"
                    style={{
                        bottom: "-20%", left: "-10%",
                        background: "radial-gradient(circle, rgba(245,158,11,0.05), transparent 65%)",
                        filter: "blur(60px)",
                    }}
                />
            </div>

            {/* ═══ Theme toggle ═══ */}
            <ThemeToggle variant="floating" />

            {/* ═══ Center column ═══ */}
            <div className="relative z-10 w-full max-w-[400px]">

                {/* Logo + brand */}
                <div className="text-center mb-10">
                    <BrandLogo size="md" className="mx-auto mb-4" />
                    <h1 className="font-heading text-[22px] font-semibold text-[var(--foreground)] tracking-tight">
                        Welcome back
                    </h1>
                    <p className="text-sm text-[var(--foreground-muted)] mt-1">Sign in to continue learning</p>
                </div>

                {/* ═══ The Card ═══ */}
                <div
                    className="rounded-2xl relative overflow-hidden"
                    style={{
                        background: "var(--background-secondary)",
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow-lg), inset 0 1px 1px var(--card-border)",
                    }}
                >
                    {/* Inner glow */}
                    <div className="absolute top-0 left-0 right-0 h-px" style={{
                        background: "linear-gradient(90deg, transparent 10%, var(--border) 50%, transparent 90%)",
                    }} />

                    <div className="p-7">

                        {/* Google */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-medium text-[14px] transition-all active:scale-[0.98] disabled:opacity-50"
                            style={{
                                background: "var(--background-tertiary)",
                                border: "1px solid var(--border)",
                                color: "var(--foreground-secondary)",
                            }}
                        >
                            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-6">
                            <div className="flex-1 h-px bg-[var(--border)]" />
                            <span className="text-[11px] text-[var(--foreground-muted)] uppercase tracking-widest">or</span>
                            <div className="flex-1 h-px bg-[var(--border)]" />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl mb-5 text-sm"
                                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.12)", color: "#f87171" }}>
                                <span className="material-symbols-outlined text-base">error</span>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label htmlFor="login-email" className="block text-[11px] font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-1.5">
                                    Email
                                </label>
                                <input
                                    id="login-email"
                                    type="email"
                                    placeholder="you@university.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onFocus={() => setEmailFocused(true)}
                                    onBlur={() => setEmailFocused(false)}
                                    required
                                    autoComplete="email"
                                    className="w-full px-3.5 py-2.5 rounded-lg text-[14px] text-white/90 placeholder-white/15 outline-none transition-all duration-200"
                                    style={{
                                        background: "rgba(255,255,255,0.03)",
                                        border: `1px solid ${emailFocused ? "rgba(129,140,248,0.4)" : "rgba(255,255,255,0.07)"}`,
                                        boxShadow: emailFocused ? "0 0 0 3px rgba(129,140,248,0.08)" : "none",
                                    }}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="login-pass" className="text-[11px] font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
                                        Password
                                    </label>
                                    <Link href="/forgot-password" className="text-[11px] text-[#818CF8] hover:text-[#a5b4fc] transition-colors">
                                        Forgot?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input
                                        id="login-pass"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setPassFocused(true)}
                                        onBlur={() => setPassFocused(false)}
                                        required
                                        autoComplete="current-password"
                                        className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-[14px] text-white/90 placeholder-white/15 outline-none transition-all duration-200"
                                        style={{
                                            background: "rgba(255,255,255,0.03)",
                                            border: `1px solid ${passFocused ? "rgba(129,140,248,0.4)" : "rgba(255,255,255,0.07)"}`,
                                            boxShadow: passFocused ? "0 0 0 3px rgba(129,140,248,0.08)" : "none",
                                        }}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                                        aria-label="Toggle password visibility">
                                        <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility_off" : "visibility"}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 rounded-lg font-semibold text-[14px] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                                style={{
                                    background: "linear-gradient(135deg, #F59E0B, #D97706)",
                                    color: "#08080E",
                                    boxShadow: "0 2px 12px rgba(245,158,11,0.2), inset 0 1px 1px rgba(255,255,255,0.15)",
                                }}
                            >
                                {loading ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                                        Signing in...
                                    </>
                                ) : "Sign in"}
                            </button>
                        </form>

                        <p className="text-center text-[13px] text-[var(--foreground-muted)] mt-6">
                            New here?{" "}
                            <Link href="/signup" className="text-[#F59E0B] hover:text-[#FCD34D] font-medium transition-colors">
                                Create an account
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back link */}
                <div className="text-center mt-6">
                    <Link href="/" className="text-[13px] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
