"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      // Translate standard error to brand voice
      if (resetError.message.includes("rate limit")) {
        setError("Whoa, slow down a bit! We've sent a link recently. Check your spam folder or try again in a few minutes.");
      } else {
        setError(resetError.message);
      }
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      position: "relative",
    }}>
      {/* Decorative glow */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-[var(--blue)]/10 rounded-full blur-[100px] pointer-events-none" />

      <div style={{
        width: "100%",
        maxWidth: "420px",
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
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", marginBottom: "16px" }}>
            <BrandLogo size="md" />
          </div>
          <h1 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "24px",
            fontWeight: 900,
            color: "var(--text)",
            letterSpacing: "-0.03em"
          }}>
            Forgot password?
          </h1>
          <p style={{
            fontFamily: "var(--font-serif)",
            fontSize: "14px",
            color: "var(--text-3)",
            marginTop: "8px",
          }}>
            No worries, we'll help you get back in.
          </p>
        </div>

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
            lineHeight: "1.5",
          }}>
            ⚠ {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: "center" }}>
            <div style={{
              padding: "14px 16px",
              borderRadius: "1rem",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.15)",
              color: "#34d399",
              fontFamily: "var(--font-sans)",
              fontSize: "14px",
              lineHeight: "1.6",
              marginBottom: "24px",
            }}>
              Link sent! Check your inbox for reset instructions.
            </div>
            <Link href="/login" className="btn-jelly-primary" style={{ width: "100%", textDecoration: "none" }}>
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label htmlFor="reset-email" className="field-label">Email Address</label>
              <input
                id="reset-email"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-redesign"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-jelly-primary" style={{ width: "100%" }}>
              {loading ? "Sending link..." : "Send reset link"}
            </button>

            <p style={{
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              color: "var(--text-3)",
              textAlign: "center",
              margin: 0,
            }}>
              Remembered your password?{" "}
              <Link href="/login" style={{ color: "var(--blue)", textDecoration: "none", fontWeight: 700 }}>
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
