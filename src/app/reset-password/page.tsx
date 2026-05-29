"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("A bit too short! Let's make that password at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Those passwords don't match. Double check your typing!");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
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
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[var(--blue)]/10 rounded-full blur-[100px] pointer-events-none" />

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
            Set new password
          </h1>
          <p style={{
            fontFamily: "var(--font-serif)",
            fontSize: "14px",
            color: "var(--text-3)",
            marginTop: "8px",
          }}>
            Choose a strong password to secure your account.
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
              Password updated successfully! Redirecting you to login...
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label htmlFor="new-password" className="field-label">New Password</label>
              <input
                id="new-password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-redesign"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="field-label">Confirm New Password</label>
              <input
                id="confirm-password"
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="input-redesign"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-jelly-primary" style={{ width: "100%", marginTop: "8px" }}>
              {loading ? "Updating password..." : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
