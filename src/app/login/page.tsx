"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getRedirectUrl } from "@/lib/api-client";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        const { data: { user: authUser }, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        
        if (loginError) { 
            setError(loginError.message); 
            setLoading(false); 
        } else if (authUser) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("has_onboarded")
                .eq("id", authUser.id)
                .single();

            if (profile?.has_onboarded === false) {
                router.push("/onboarding");
            } else {
                router.push("/dashboard");
            }
            router.refresh();
        }
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
        <div style={{
            minHeight: "100dvh",
            background: "#08080E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            padding: "24px",
        }}>
            {/* Back link */}
            <Link
                href="/"
                style={{
                    position: "absolute",
                    top: "24px",
                    left: "24px",
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "13px",
                    color: "rgba(245,240,232,0.35)",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "color 150ms ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "#F5F0E8"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(245,240,232,0.35)"; }}
            >
                ← Back
            </Link>

            <div style={{ width: "100%", maxWidth: "400px" }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div style={{
                        width: "40px", height: "40px", borderRadius: "10px",
                        background: "linear-gradient(135deg, #F59E0B 0%, #C47B00 100%)",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        marginBottom: "16px",
                    }}>
                        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: "18px", fontWeight: 800, color: "#08080E" }}>P</span>
                    </div>
                    <h1 style={{
                        fontFamily: "'Outfit',sans-serif",
                        fontSize: "24px",
                        fontWeight: 700,
                        color: "#F5F0E8",
                    }}>
                        Welcome back.
                    </h1>
                    <p style={{
                        fontFamily: "'Tiempos Text','Source Serif 4',Georgia,serif",
                        fontSize: "14px",
                        color: "rgba(245,240,232,0.5)",
                        marginTop: "8px",
                    }}>
                        Continue where you left off.
                    </p>
                </div>

                {/* Google OAuth */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(245,240,232,0.12)",
                        borderRadius: "1.25rem",
                        padding: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        cursor: "pointer",
                        transition: "background 150ms ease, border-color 150ms ease",
                        opacity: loading ? 0.5 : 1,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(245,240,232,0.22)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(245,240,232,0.12)"; }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: "14px", fontWeight: 600, color: "#F5F0E8" }}>Continue with Google</span>
                </button>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "20px 0" }}>
                    <div style={{ flex: 1, height: "0.5px", background: "rgba(245,240,232,0.1)" }} />
                    <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: "12px", color: "rgba(245,240,232,0.3)" }}>or</span>
                    <div style={{ flex: 1, height: "0.5px", background: "rgba(245,240,232,0.1)" }} />
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 14px",
                        borderRadius: "0.875rem",
                        marginBottom: "16px",
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.15)",
                        color: "#f87171",
                        fontFamily: "'Outfit',sans-serif",
                        fontSize: "13px",
                    }}>
                        ⚠ {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <label htmlFor="login-email" className="field-label">Email</label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="input-redesign"
                        />
                    </div>
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <label htmlFor="login-pass" className="field-label" style={{ marginBottom: 0 }}>Password</label>
                            <Link href="/forgot-password" style={{
                                fontFamily: "'Outfit',sans-serif",
                                fontSize: "12px",
                                color: "rgba(245,158,11,0.5)",
                                textDecoration: "none",
                                cursor: "pointer",
                            }}>
                                Forgot password?
                            </Link>
                        </div>
                        <div style={{ position: "relative", marginTop: "6px" }}>
                            <input
                                id="login-pass"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className="input-redesign"
                                style={{ paddingRight: "40px" }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: "absolute",
                                    right: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    color: "rgba(245,240,232,0.3)",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                }}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-jelly-primary" style={{ width: "100%", marginTop: "8px" }}>
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p style={{
                    fontFamily: "'Outfit',sans-serif",
                    fontSize: "13px",
                    color: "rgba(245,240,232,0.5)",
                    textAlign: "center",
                    marginTop: "20px",
                }}>
                    New to The Professor?{" "}
                    <Link href="/signup" style={{ color: "#F59E0B", textDecoration: "none", fontWeight: 600 }}>
                        Create a free account
                    </Link>
                </p>
            </div>
        </div>
    );
}
