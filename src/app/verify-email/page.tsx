"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import { Suspense } from "react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your inbox";

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
        maxWidth: "460px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid var(--border)",
        borderRadius: "2rem",
        padding: "40px 32px",
        textAlign: "center",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: "inline-flex", marginBottom: "24px" }}>
          <BrandLogo size="md" />
        </div>

        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "26px",
          fontWeight: 900,
          color: "var(--text)",
          letterSpacing: "-0.02em",
          marginBottom: "16px",
        }}>
          Check your inbox! ✉️
        </h1>

        <p style={{
          fontFamily: "var(--font-serif)",
          fontSize: "15px",
          lineHeight: "1.6",
          color: "var(--text-2)",
          marginBottom: "28px",
        }}>
          We just sent a magic confirmation link to <strong style={{ color: "var(--text)" }}>{email}</strong>. 
          Click the link in that email so we can verify it's really you, and we'll get you started on the good stuff.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Link href="/login" className="btn-jelly-primary" style={{ width: "100%", textDecoration: "none" }}>
            Got it, go to login
          </Link>
          
          <Link href="/signup" style={{
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            color: "var(--text-3)",
            textDecoration: "none",
            fontWeight: 600,
            padding: "8px",
            transition: "color 150ms ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; }}
          >
            Entered the wrong email? Sign up again
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#08080E", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "32px", height: "32px", border: "3px solid rgba(37,99,235,0.3)", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
