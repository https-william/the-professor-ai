"use client";

import { useEffect, useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import Turnstile from "@/components/ui/Turnstile";

const TESTIMONIALS = [
  { quote: "Finally got 8 hours of sleep before my exam. My bed actually remembers what I look like now.", author: "Amaka O. · University of Ibadan", },
  { quote: "Turned 40 pages of slides into 15 smart flashcards. Now I have more time to ignore my group chats.", author: "Tunde A. · UNILAG", },
  { quote: "I passed my finals without drinking a single cup of unsweetened coffee. Pure magic.", author: "Bolu W. · Covenant University", },
];

function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [testiIndex, setTestiIndex] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const topic = searchParams.get("topic");

  const [pendingUpload, setPendingUpload] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPendingUpload(localStorage.getItem("pending_upload_name"));
    }
  }, []);

  // Auto-cycle testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setTestiIndex(prev => (prev + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleGoogleSignup = async () => {
    setLoading(true);
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
    if (password.length < 6) { setError("A bit too short! Let's make that password at least 6 characters so it's nice and secure."); return; }
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.auth.signOut();
      await fetch('/api/auth/signout', { method: 'POST' });
    }

    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        captchaToken: captchaToken || undefined,
      }
    });
    if (error) {
      let msg = error.message;
      if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already exists")) {
        msg = "Looks like you're already in our books! Try signing in instead?";
      } else if (msg.toLowerCase().includes("rate limit")) {
        msg = "Whoa, slow down a bit! You've tried signing up too many times recently. Take a breath and try again in a minute.";
      }
      setError(msg);
      setLoading(false);
    }
    else {
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      router.refresh();
    }
  };

  // Password strength
  const getStrength = () => {
    if (password.length === 0) return 0;
    if (password.length < 6) return 1;
    if (password.length < 9) return 2;
    return 3;
  };
  const strength = getStrength();
  const strengthLabel = ["", "Weak", "Fair", "Strong"][strength];
  const strengthColor = ["", "#e05050", "#e59e0e", "#1aab76"][strength];

  return (
    <div style={{ minHeight: "100dvh", display: "flex", background: "transparent" }}>
      {/* Left Panel — Desktop only */}
      <div className="signup-left-panel" style={{
        width: "45%",
        background: "rgba(255, 255, 255, 0.01)",
        borderRight: "1px solid var(--border)",
        minHeight: "100vh",
        padding: "48px",
        display: "flex",
        flexDirection: "column",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        justifyContent: "center",
      }}>
        {/* Logo & Navigation */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "48px", textDecoration: "none" }}>
          <BrandLogo size="xs" />
          <span style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 800, color: "var(--text)", letterSpacing: "0.05em", textTransform: "uppercase" }}>The Professor</span>
        </Link>



        {/* Display quote */}
        <h2 style={{
          fontFamily: "var(--font-serif)",
          fontSize: "1.8rem",
          fontWeight: 500,
          color: "var(--text)",
          lineHeight: 1.3,
          letterSpacing: "-0.01em"
        }}>
          The last study tool you&apos;ll ever need before an exam.
        </h2>

        {/* Testimonial ticker */}
        <div style={{
          background: "var(--bg-3)",
          border: "1px solid var(--border)",
          borderRadius: "1rem",
          padding: "14px 16px",
          marginTop: "24px",
          maxWidth: "340px",
          transition: "opacity 400ms ease",
          boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>
            {[...Array(5)].map((_, j) => <span key={j} style={{ color: "var(--blue)", fontSize: "10px" }}>★</span>)}
          </div>
          <p style={{
            fontFamily: "var(--font-serif)",
            fontSize: "13px",
            color: "var(--text-2)",
            lineHeight: 1.6,
            fontStyle: "italic",
          }}>
            &ldquo;{TESTIMONIALS[testiIndex].quote}&rdquo;
          </p>
          <p style={{
            fontFamily: "var(--font-sans)",
            fontSize: "11px",
            color: "var(--text-4)",
            marginTop: "8px",
            fontWeight: 600
          }}>
            {TESTIMONIALS[testiIndex].author}
          </p>
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: "8px", marginTop: "32px" }}>
          {["Study Guides", "Quizzes", "Match Games"].map(f => (
            <span key={f} className="format-pill" style={{ fontSize: "11px", padding: "4px 12px" }}>{f}</span>
          ))}
        </div>
      </div>

      {/* Right Panel — Form */}
      <div style={{
        flex: 1,
        background: "transparent",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "24px",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "420px",
          margin: "0 auto",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid var(--border)",
          borderRadius: "2rem",
          padding: "40px 32px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          position: "relative",
          zIndex: 1,
        }}>
          <h1 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "26px",
            fontWeight: 900,
            color: "var(--text)",
            letterSpacing: "-0.03em"
          }}>
            {pendingUpload ? "Save your study pack" : "Create your free account"}
          </h1>
          <p style={{
            fontFamily: "var(--font-serif)",
            fontSize: "14px",
            color: "var(--text-3)",
            marginBottom: "28px",
            marginTop: "8px",
          }}>
            {pendingUpload ? "Create an account to keep your progress." : "Takes 30 seconds. No credit card."}
          </p>

          {/* Pending upload banner */}
          {pendingUpload && (
            <div style={{
              padding: "14px 16px",
              borderRadius: "1rem",
              background: "rgba(37,99,235,0.06)",
              border: "1px solid rgba(37,99,235,0.15)",
              marginBottom: "20px",
            }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--blue)", marginBottom: "4px" }}>Progress Saved</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
                Analysis of &ldquo;{pendingUpload}&rdquo; is ready.
              </p>
            </div>
          )}

          {/* Google OAuth */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            style={{
              width: "100%",
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              borderRadius: "1.25rem",
              padding: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              cursor: "pointer",
              transition: "all 150ms ease",
              opacity: loading ? 0.5 : 1,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Sign up with Google</span>
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "20px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-4)" }}>or</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>

          {/* Error */}
          {error && (
            <div style={{
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
          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label htmlFor="s-email" className="field-label">Email</label>
              <input id="s-email" type="email" placeholder="you@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                className="input-redesign"
              />
            </div>
            <div>
              <label htmlFor="s-pass" className="field-label">Password</label>
              <div style={{ position: "relative" }}>
                <input id="s-pass" type={showPassword ? "text" : "password"} placeholder="At least 6 characters" value={password}
                  onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password"
                  className="input-redesign" style={{ paddingRight: "40px" }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "rgba(245,240,232,0.3)", cursor: "pointer", fontSize: "14px",
                  fontFamily: "'Outfit',sans-serif",
                }}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {/* Strength bars */}
              {password.length > 0 && (
                <div style={{ display: "flex", gap: "4px", marginTop: "8px", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "3px", flex: 1 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`strength-bar ${i <= strength ? (strength === 1 ? "weak" : strength === 2 ? "fair" : "strong") : ""}`} />
                    ))}
                  </div>
                  <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: "11px", color: strengthColor, marginLeft: "8px" }}>{strengthLabel}</span>
                </div>
              )}
            </div>

             <button type="submit" disabled={loading} className="btn-jelly-primary" style={{ width: "100%", marginTop: "8px" }}>
              {loading ? "Creating account..." : "Create free account"}
            </button>
            <Turnstile onVerify={setCaptchaToken} />
          </form>

          {/* Legal text */}
          <p style={{
            fontFamily: "'Outfit',sans-serif",
            fontSize: "11px",
            color: "rgba(245,240,232,0.3)",
            textAlign: "center",
            marginTop: "16px",
            lineHeight: "1.5",
          }}>
            By signing up, you agree to our{" "}
            <Link href="/legal/terms" style={{ color: "var(--blue)", textDecoration: "underline" }}>Terms of Use</Link>{" "}
            and{" "}
            <Link href="/legal/privacy" style={{ color: "var(--blue)", textDecoration: "underline" }}>Privacy Policy</Link>.
          </p>

          {/* Sign in link */}
          <p style={{
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            color: "var(--text-3)",
            textAlign: "center",
            marginTop: "16px",
          }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--blue)", textDecoration: "none", fontWeight: 700 }}>Sign in</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .signup-left-panel {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#08080E", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "32px", height: "32px", border: "3px solid rgba(245,158,11,0.3)", borderTopColor: "#F59E0B", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
