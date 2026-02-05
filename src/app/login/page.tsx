"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import BrandLogo from "@/components/ui/BrandLogo";
import { Grainient } from "@/components/ui/VisualEffects";
import { DecryptedText } from "@/components/ui/TextEffects";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const supabase = createClient();
    const { resolvedTheme, toggleTheme } = useTheme();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push("/dashboard");
            router.refresh();
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex">
            {/* Left Panel - Illustration/Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[var(--accent)]/10 via-[var(--background)] to-[var(--secondary)]/10 items-center justify-center p-12 overflow-hidden">
                {/* Animated Background */}
                <Grainient className="absolute inset-0 opacity-60" />

                <div className="relative z-10 text-center max-w-md">
                    <BrandLogo size="lg" className="mx-auto mb-8" />
                    <div className="mb-4">
                        <DecryptedText
                            text="Welcome back, scholar."
                            className="text-4xl font-bold text-[var(--foreground)]"
                            speed={60}
                            revealDirection="center"
                        />
                    </div>
                    <p className="text-lg text-[var(--foreground-secondary)] mb-8">
                        Your notes missed you. They've been waiting.
                    </p>

                    {/* Floating Puns */}
                    <div className="space-y-3">
                        {[
                            "Time to turn confusion into clarity.",
                            "Your future self will thank you.",
                            "Let's make those notes work for you.",
                        ].map((pun, i) => (
                            <div
                                key={i}
                                className="px-4 py-2 rounded-xl bg-[var(--card)]/80 border border-[var(--border)] text-sm text-[var(--foreground-muted)] backdrop-blur-sm"
                                style={{ transform: `translateX(${(i % 2 === 0 ? 1 : -1) * 20}px)` }}
                            >
                                "{pun}"
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="fixed top-6 right-6 w-10 h-10 rounded-xl flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all z-50"
                >
                    <span className="material-symbols-outlined text-xl">
                        {resolvedTheme === "light" ? "dark_mode" : "light_mode"}
                    </span>
                </button>

                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <BrandLogo size="md" />
                        <span className="text-xl font-semibold text-[var(--foreground)]">The Professor</span>
                    </div>

                    {/* Card */}
                    <div className="p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-2xl">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Sign in</h2>
                            <p className="text-sm text-[var(--foreground-secondary)]">
                                Continue your learning journey
                            </p>
                        </div>

                        {/* Google Login - Prominent */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] font-medium hover:bg-[var(--background-tertiary)] hover:border-[var(--foreground-muted)] transition-all mb-6"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>

                        <div className="relative flex items-center gap-4 mb-6">
                            <div className="flex-1 h-px bg-[var(--border)]" />
                            <span className="text-xs text-[var(--foreground-muted)]">or with email</span>
                            <div className="flex-1 h-px bg-[var(--border)]" />
                        </div>

                        {error && (
                            <div className="p-4 rounded-xl bg-[var(--error)]/10 text-[var(--error)] text-sm mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">error</span>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground-secondary)] mb-2">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="password" className="text-sm font-medium text-[var(--foreground-secondary)]">
                                        Password
                                    </label>
                                    <Link href="/forgot-password" className="text-xs text-[var(--accent)] hover:underline">
                                        Forgot?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 pr-12 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                    >
                                        <span className="material-symbols-outlined text-xl">
                                            {showPassword ? "visibility_off" : "visibility"}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${loading
                                    ? "bg-[var(--accent)]/60 cursor-wait"
                                    : "bg-[var(--accent)] hover:bg-[var(--accent-dark)] shadow-lg shadow-[var(--accent)]/20"
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                        Signing in...
                                    </>
                                ) : (
                                    "Sign in"
                                )}
                            </button>
                        </form>

                        <p className="mt-8 text-center text-sm text-[var(--foreground-secondary)]">
                            New to The Professor?{" "}
                            <Link href="/signup" className="text-[var(--accent)] font-medium hover:underline">
                                Create an account
                            </Link>
                        </p>
                    </div>

                    {/* Back to home */}
                    <div className="text-center mt-6">
                        <Link href="/" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
