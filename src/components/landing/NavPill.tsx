"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import BrandLogo from "@/components/ui/BrandLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function NavPill() {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    const container = document.getElementById("main-scroll-container");
    if (!container) return;
    const onScroll = () => setScrolled(container.scrollTop > 80);
    container.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minWidth: "min(640px, calc(100vw - 48px))",
        maxWidth: "820px",
        height: "56px",
        padding: "0 8px 0 20px",
        background: scrolled ? "var(--bg-2)" : "var(--background)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: `1px solid ${scrolled ? "var(--border)" : "var(--border-2)"}`,
        borderRadius: "9999px",
        boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.1), 0 1px 0 var(--border) inset" : "none",
        transition: "all 300ms ease",
      }}
    >
      {/* Left — Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
        <BrandLogo size="xs" />
        <span style={{
          fontFamily: "var(--font-heading)",
          fontSize: "14px",
          fontWeight: 900,
          color: "var(--text)",
          letterSpacing: "-0.01em"
        }}>
          The Professor
        </span>
      </Link>

      {/* Center — Nav Links (hidden on mobile) */}
      <div className="hidden lg:flex" style={{ alignItems: "center", gap: "2px" }}>
        {[
          { label: "AI Tools", href: "/tools/ai-study-planner" },
          { label: "Glossary", href: "/glossary" },
          { label: "Blog", href: "/blog" },
          { label: "JAMB 2026", href: "/exams/jamb" },
        ].map((link) => (
          <Link
            key={link.label}
            href={link.href}
            style={{

              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text-3)",
              padding: "6px 14px",
              borderRadius: "9999px",
              textDecoration: "none",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text)";
              e.currentTarget.style.background = "var(--border-2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-3)";
              e.currentTarget.style.background = "transparent";
            }}
            >
              {link.label}
            </Link>
          ))}
        </div>


      {/* Right — Auth Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <ThemeToggle />
        {user.isAuthenticated ? (
          <Link href="/dashboard" className="btn-skeuo-blue" style={{ fontSize: "13px", padding: "8px 20px", borderRadius: "99px", textDecoration: "none" }}>
            Dashboard
          </Link>
        ) : (
          <>
            <Link href="/login" className="btn-ghost" style={{ fontSize: "13px", padding: "8px 16px", color: "var(--text-2)", fontWeight: 700, textDecoration: "none" }}>
              Sign In
            </Link>
            <Link href="/signup" className="btn-skeuo-blue" style={{ fontSize: "12px", padding: "8px 20px", borderRadius: "99px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", textDecoration: "none" }}>
              Sign Up Free
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
