"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import BrandLogo from "@/components/ui/BrandLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { PrivacyPolicyModal, TermsOfUseModal } from "@/components/ui/LegalModals";
import { AlertCircle, Eye, EyeOff, Loader2, CheckCircle2, Gavel, Shield, Check } from "lucide-react";

type Step = 1 | 2;

export default function SignupPage() {
    const [step, setStep] = useState<Step>(1);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [isAgeVerified, setIsAgeVerified] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const supabase = createClient();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setError(`Note: You are currently signed in as ${session.user.email}. Creating a new account will sign you out.`);
            }
        };
        checkSession();
    }, [supabase]);

    const handleGoogleSignup = async () => {
        setLoading(true);
        
        // Sign out first to ensure we are creating a new account session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.auth.signOut();
            await fetch('/api/auth/signout', { method: 'POST' });
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) { setError(error.message); setLoading(false); }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!isAgeVerified) { setError("You must verify your age to continue."); return; }
        if (password !== confirmPassword) { setError("Passwords don't match"); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
        
        setLoading(true);

        // Ensure we sign out the old user before signing up the new one
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.auth.signOut();
            await fetch('/api/auth/signout', { method: 'POST' });
        }

        const { error } = await supabase.auth.signUp({
            email, password,
        });
        if (error) { setError(error.message); setLoading(false); }
        else { 
            setIsSuccess(true);
            setTimeout(() => {
                router.push("/onboarding"); 
                router.refresh(); 
            }, 2000);
        }
    };

    const inputClass = "w-full px-3.5 py-2.5 rounded-lg text-[14px] text-[var(--foreground)] placeholder-[var(--foreground-muted)]/40 outline-none transition-all duration-200";
    const getInputStyle = (field: string) => ({
        background: "var(--background-secondary)",
        border: `1px solid ${focusedField === field ? "rgba(245,158,11,0.5)" : "var(--border)"}`,
        boxShadow: focusedField === field ? "0 0 0 3px rgba(245,158,11,0.15)" : "none",
    });

    return (
        <div className="min-h-[100dvh] bg-[var(--background)] flex items-center justify-center relative overflow-hidden px-5 py-12 transition-colors duration-500">

            {/* ═══ Living background ═══ */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute w-[min(600px,75vw)] h-[min(600px,75vw)] rounded-full"
                    style={{ top: "-20%", left: "-10%", background: "radial-gradient(circle, rgba(245,158,11,0.06), transparent 65%)", filter: "blur(60px)" }} />
                <div className="absolute w-[min(500px,70vw)] h-[min(500px,70vw)] rounded-full"
                    style={{ bottom: "-15%", right: "-10%", background: "radial-gradient(circle, rgba(99,102,241,0.06), transparent 65%)", filter: "blur(60px)" }} />
            </div>

            {/* Theme toggle */}
            <ThemeToggle variant="floating" />

            <div className="relative z-10 w-full max-w-[400px]">

                <div className="text-center mb-10">
                    <BrandLogo size="md" className="mx-auto mb-6" />
                    <h1 className="font-galaxie text-3xl md:text-4xl font-bold text-[var(--foreground)] tracking-tight">
                        Create your account
                    </h1>
                    <p className="text-sm font-medium text-[var(--foreground-muted)] mt-2">
                        Scholarly access on us
                    </p>
                </div>

                {/* ═══ Card ═══ */}
                <div className="relative">
                    <div className="p-7">
                        <AnimatePresence mode="wait">
                            {!isSuccess ? (
                                <motion.div
                                    key="signup-form"
                                    initial={{ opacity: 1 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* ─── STEP 1 ─── */}
                                    {step === 1 && (
                                        <>
                                            {/* Google */}
                                            <button onClick={handleGoogleSignup} disabled={loading || !isAgeVerified}
                                                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-medium text-[14px] transition-all hover:bg-white/5 active:scale-[0.98] disabled:opacity-50"
                                                style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--foreground-secondary)" }}>
                                                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                </svg>
                                                Sign up with Google
                                            </button>

                                            <div className="flex items-center gap-3 my-6">
                                                <div className="flex-1 h-px bg-[var(--border)]" />
                                                <span className="text-[11px] text-[var(--foreground-muted)] uppercase tracking-widest">or</span>
                                                <div className="flex-1 h-px bg-[var(--border)]" />
                                            </div>
                                        </>
                                    )}

                                    {/* Error */}
                                    {error && (
                                        <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl mb-5 text-sm"
                                            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.12)", color: "#f87171" }}>
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}

                                    {/* Step 1 Form */}
                                    <form onSubmit={handleSignup} className="space-y-4">
                                        <div>
                                            <label htmlFor="s-email" className="block text-[11px] font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-1.5">Email</label>
                                            <input id="s-email" type="email" placeholder="you@email.com" value={email}
                                                onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                                                onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)}
                                                className={inputClass} style={getInputStyle("email")} />
                                        </div>
                                        <div>
                                            <label htmlFor="s-pass" className="block text-[11px] font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-1.5">Password</label>
                                            <div className="relative">
                                                <input id="s-pass" type={confirmPassword && !password ? "text" : (showPassword ? "text" : "password")} placeholder="At least 6 characters" value={password}
                                                    onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password"
                                                    onFocus={() => setFocusedField("pass")} onBlur={() => setFocusedField(null)}
                                                    className={`${inputClass} pr-10`} style={getInputStyle("pass")} />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors" aria-label="Toggle visibility">
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="s-confirm" className="block text-[11px] font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-1.5">Confirm</label>
                                            <input id="s-confirm" type={showPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password"
                                                onFocus={() => setFocusedField("confirm")} onBlur={() => setFocusedField(null)}
                                                className={inputClass} style={getInputStyle("confirm")} />
                                        </div>

                                        {/* COPPA Age Gate */}
                                        <label className="flex items-start gap-4 mt-8 px-1 cursor-pointer group">
                                            <div className="relative flex-shrink-0 mt-0.5">
                                                <input 
                                                    type="checkbox" 
                                                    id="age-gate" 
                                                    className="sr-only" 
                                                    checked={isAgeVerified}
                                                    onChange={(e) => setIsAgeVerified(e.target.checked)}
                                                />
                                                <div className={`w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center ${
                                                    isAgeVerified 
                                                        ? "bg-[#F59E0B] border-[#F59E0B]" 
                                                        : "border-[var(--border)] bg-[var(--background-secondary)] group-hover:border-[var(--foreground-muted)]"
                                                }`} style={{ 
                                                    boxShadow: isAgeVerified ? "0 0 12px rgba(245,158,11,0.3)" : "none",
                                                    // Ensure visibility even if var(--border) is faint
                                                    borderColor: !isAgeVerified ? (resolvedTheme === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.15)") : "#F59E0B"
                                                }}>
                                                    {isAgeVerified && <Check className="w-4 h-4 text-[#08080E]" strokeWidth={4} />}
                                                </div>
                                            </div>
                                            <span className="text-[14px] font-medium text-[var(--foreground-secondary)] leading-tight select-none pt-0.5">
                                                I agree to the <button type="button" onClick={(e) => { e.preventDefault(); setShowTerms(true); }} className="text-[var(--foreground)] hover:text-[#F59E0B] transition-colors underline font-semibold">Terms of Use</button> and <button type="button" onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }} className="text-[var(--foreground)] hover:text-[#F59E0B] transition-colors underline font-semibold">Privacy Policy</button>.
                                            </span>
                                        </label>

                                        {/* Credits callout */}
                                        <div className="flex items-start gap-3 px-3.5 py-3 rounded-xl mt-4 mb-2"
                                            style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-glow)" }}>
                                            <span className="text-lg mt-0.5">🎁</span>
                                            <p className="text-[13px] text-[var(--foreground-secondary)] leading-relaxed">
                                                You&apos;ll get <strong>full access</strong> to all study tools and features instantly.
                                            </p>
                                        </div>

                                        <button type="submit" disabled={loading || !isAgeVerified}
                                            className="w-full mt-4 py-2.5 rounded-lg font-semibold text-[14px] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                            style={{ background: "var(--foreground)", color: "var(--background)", boxShadow: "none" }}>
                                            {loading ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" />Creating Account...</>
                                            ) : "Create Account"}
                                        </button>
                                    </form>

                                    <p className="text-center text-[13px] text-[var(--foreground-muted)] mt-6">
                                        Already have an account?{" "}
                                        <Link href="/login" className="text-[#F59E0B] hover:text-[#FCD34D] font-medium transition-colors">Sign in</Link>
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="signup-success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-12 flex flex-col items-center text-center"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                                        <motion.span 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="flex items-center justify-center"
                                        >
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                        </motion.span>
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-2">Welcome to the Academy</h2>
                                    <p className="text-sm text-white/40 leading-relaxed max-w-[240px]">
                                        Your scholarly credentials have been verified. Synchronizing your archives...
                                    </p>
                                    <div className="mt-8 flex gap-1">
                                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Back links */}
                <div className="flex items-center justify-center gap-6 mt-6">
                    <button onClick={() => setShowTerms(true)} className="text-[13px] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-1.5 group">
                        <Gavel className="w-[18px] h-[18px]" />
                        Terms
                    </button>
                    <div className="w-1 h-1 rounded-full bg-[var(--border)]" />
                    <button onClick={() => setShowPrivacy(true)} className="text-[13px] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-1.5 group">
                        <Shield className="w-[18px] h-[18px]" />
                        Privacy
                    </button>
                </div>
            </div>

            {/* Legal Modals */}
            <AnimatePresence>
                {showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}
                {showTerms && <TermsOfUseModal onClose={() => setShowTerms(false)} />}
            </AnimatePresence>
        </div>
    );
}
