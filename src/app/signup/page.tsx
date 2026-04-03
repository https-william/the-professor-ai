"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import BrandLogo from "@/components/ui/BrandLogo";

type Step = 1 | 2;

export default function SignupPage() {
    const [step, setStep] = useState<Step>(1);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();
    const { resolvedTheme, toggleTheme } = useTheme();

    const handleGoogleSignup = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) { setError(error.message); setLoading(false); }
    };

    const handleStep1 = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (password !== confirmPassword) { setError("Passwords don't match"); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
        setStep(2);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signUp({
            email, password,
            options: { data: { full_name: name } },
        });
        if (error) { setError(error.message); setLoading(false); }
        else { router.push("/dashboard"); router.refresh(); }
    };

    const inputClass = "w-full px-3.5 py-2.5 rounded-lg text-[14px] text-white/90 placeholder-white/15 outline-none transition-all duration-200";
    const getInputStyle = (field: string) => ({
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${focusedField === field ? "rgba(129,140,248,0.4)" : "rgba(255,255,255,0.07)"}`,
        boxShadow: focusedField === field ? "0 0 0 3px rgba(129,140,248,0.08)" : "none",
    });

    return (
        <div className="min-h-[100dvh] bg-[#06060B] flex items-center justify-center relative overflow-hidden px-5 py-12">

            {/* ═══ Living background ═══ */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute w-[min(600px,75vw)] h-[min(600px,75vw)] rounded-full"
                    style={{ top: "-20%", left: "-10%", background: "radial-gradient(circle, rgba(245,158,11,0.06), transparent 65%)", filter: "blur(60px)" }} />
                <div className="absolute w-[min(500px,70vw)] h-[min(500px,70vw)] rounded-full"
                    style={{ bottom: "-15%", right: "-10%", background: "radial-gradient(circle, rgba(99,102,241,0.06), transparent 65%)", filter: "blur(60px)" }} />
            </div>

            {/* Theme toggle */}
            <button onClick={toggleTheme}
                className="fixed top-5 right-5 z-50 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                aria-label="Toggle theme">
                <span className="material-symbols-outlined text-base text-[#8B8690]">
                    {resolvedTheme === "light" ? "dark_mode" : "light_mode"}
                </span>
            </button>

            <div className="relative z-10 w-full max-w-[400px]">

                {/* Logo */}
                <div className="text-center mb-10">
                    <BrandLogo size="md" className="mx-auto mb-4" />
                    <h1 className="font-heading text-[22px] font-semibold text-white/90 tracking-tight">
                        {step === 1 ? "Create your account" : "One last thing"}
                    </h1>
                    <p className="text-sm text-white/35 mt-1">
                        {step === 1 ? "100 free credits on us" : "What should we call you?"}
                    </p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-6">
                    {[1, 2].map((s) => (
                        <div key={s} className="flex-1 flex items-center gap-2">
                            <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300"
                                style={{
                                    background: step >= s ? "linear-gradient(135deg, #F59E0B, #D97706)" : "rgba(255,255,255,0.04)",
                                    color: step >= s ? "#08080E" : "rgba(255,255,255,0.2)",
                                    boxShadow: step >= s ? "0 2px 8px rgba(245,158,11,0.2)" : "none",
                                }}
                            >
                                {step > s ? "✓" : s}
                            </div>
                            {s < 2 && (
                                <div className="flex-1 h-px transition-colors duration-300" style={{
                                    background: step > 1 ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.06)",
                                }} />
                            )}
                        </div>
                    ))}
                </div>

                {/* ═══ Card ═══ */}
                <div className="rounded-2xl relative overflow-hidden"
                    style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3), 0 20px 60px rgba(0,0,0,0.25)",
                    }}>
                    {/* Top edge highlight */}
                    <div className="absolute top-0 left-0 right-0 h-px" style={{
                        background: "linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.08) 50%, transparent 90%)",
                    }} />

                    <div className="p-7">

                        {/* ─── STEP 1 ─── */}
                        {step === 1 && (
                            <>
                                {/* Google */}
                                <button onClick={handleGoogleSignup} disabled={loading}
                                    className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-medium text-[14px] transition-all active:scale-[0.98] disabled:opacity-50"
                                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}>
                                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Sign up with Google
                                </button>

                                <div className="flex items-center gap-3 my-6">
                                    <div className="flex-1 h-px bg-white/[0.06]" />
                                    <span className="text-[11px] text-white/20 uppercase tracking-widest">or</span>
                                    <div className="flex-1 h-px bg-white/[0.06]" />
                                </div>
                            </>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl mb-5 text-sm"
                                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.12)", color: "#f87171" }}>
                                <span className="material-symbols-outlined text-base">error</span>
                                {error}
                            </div>
                        )}

                        {/* Step 1 Form */}
                        {step === 1 && (
                            <form onSubmit={handleStep1} className="space-y-4">
                                <div>
                                    <label htmlFor="s-email" className="block text-[11px] font-medium text-white/30 uppercase tracking-wider mb-1.5">Email</label>
                                    <input id="s-email" type="email" placeholder="you@university.edu" value={email}
                                        onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                                        onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)}
                                        className={inputClass} style={getInputStyle("email")} />
                                </div>
                                <div>
                                    <label htmlFor="s-pass" className="block text-[11px] font-medium text-white/30 uppercase tracking-wider mb-1.5">Password</label>
                                    <div className="relative">
                                        <input id="s-pass" type={showPassword ? "text" : "password"} placeholder="At least 6 characters" value={password}
                                            onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password"
                                            onFocus={() => setFocusedField("pass")} onBlur={() => setFocusedField(null)}
                                            className={`${inputClass} pr-10`} style={getInputStyle("pass")} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors" aria-label="Toggle visibility">
                                            <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility_off" : "visibility"}</span>
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="s-confirm" className="block text-[11px] font-medium text-white/30 uppercase tracking-wider mb-1.5">Confirm</label>
                                    <input id="s-confirm" type={showPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password"
                                        onFocus={() => setFocusedField("confirm")} onBlur={() => setFocusedField(null)}
                                        className={inputClass} style={getInputStyle("confirm")} />
                                </div>
                                <button type="submit"
                                    className="w-full py-2.5 rounded-lg font-semibold text-[14px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                                    style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#08080E", boxShadow: "0 2px 12px rgba(245,158,11,0.2), inset 0 1px 1px rgba(255,255,255,0.15)" }}>
                                    Continue
                                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                                </button>
                            </form>
                        )}

                        {/* Step 2 Form */}
                        {step === 2 && (
                            <form onSubmit={handleSignup} className="space-y-5">
                                <div>
                                    <label htmlFor="s-name" className="block text-[11px] font-medium text-white/30 uppercase tracking-wider mb-1.5">Your Name</label>
                                    <input id="s-name" type="text" placeholder="What should we call you?" value={name}
                                        onChange={(e) => setName(e.target.value)} required autoComplete="name" autoFocus
                                        onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField(null)}
                                        className={inputClass} style={getInputStyle("name")} />
                                </div>

                                {/* Credits callout */}
                                <div className="flex items-start gap-3 px-3.5 py-3 rounded-xl"
                                    style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.1)" }}>
                                    <span className="text-lg mt-0.5">🎁</span>
                                    <p className="text-[13px] text-white/40 leading-relaxed">
                                        You&apos;ll get <strong className="text-[#F59E0B]">100 free credits</strong> to generate flashcards, quizzes, and more.
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setStep(1)}
                                        className="px-4 py-2.5 rounded-lg text-[13px] font-medium text-white/40 transition-all active:scale-[0.98]"
                                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                        Back
                                    </button>
                                    <button type="submit" disabled={loading}
                                        className="flex-1 py-2.5 rounded-lg font-semibold text-[14px] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                        style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#08080E", boxShadow: "0 2px 12px rgba(245,158,11,0.2), inset 0 1px 1px rgba(255,255,255,0.15)" }}>
                                        {loading ? (
                                            <><span className="material-symbols-outlined animate-spin text-base">progress_activity</span>Creating...</>
                                        ) : "Create Account"}
                                    </button>
                                </div>
                            </form>
                        )}

                        <p className="text-center text-[13px] text-white/30 mt-6">
                            Already have an account?{" "}
                            <Link href="/login" className="text-[#F59E0B] hover:text-[#FCD34D] font-medium transition-colors">Sign in</Link>
                        </p>
                    </div>
                </div>

                <div className="text-center mt-6">
                    <Link href="/" className="text-[13px] text-white/20 hover:text-white/40 transition-colors inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
