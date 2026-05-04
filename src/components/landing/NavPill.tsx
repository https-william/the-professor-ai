"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";

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
        background: scrolled ? "rgba(18,18,31,0.95)" : "rgba(18,18,31,0.72)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: `1px solid ${scrolled ? "rgba(245,240,232,0.13)" : "rgba(245,240,232,0.09)"}`,
        borderRadius: "9999px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(245,240,232,0.04) inset",
        transition: "background 300ms ease, border-color 300ms ease",
      }}
    >
      {/* Left — Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
        <div style={{
          width: "28px",
          height: "28px",
          borderRadius: "8px",
          background: "linear-gradient(135deg, #F59E0B 0%, #C47B00 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "14px",
            fontWeight: 800,
            color: "#08080E",
            lineHeight: 1,
          }}>P</span>
        </div>
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: "14px",
          fontWeight: 700,
          color: "#F5F0E8",
        }}>
          The Professor
        </span>
      </Link>

      {/* Center — Nav Links (hidden on mobile) */}
      <div className="hidden lg:flex" style={{ alignItems: "center", gap: "2px" }}>
        {[
          { label: "Features", href: "#features" },
          { label: "How It Works", href: "#how-it-works" },
          { label: "Pricing", href: "#pricing" },
          { label: "About", href: "#about" },
        ].map((link) => (
          <a
            key={link.label}
            href={link.href}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "13px",
              fontWeight: 500,
              color: "rgba(245,240,232,0.55)",
              padding: "4px 14px",
              borderRadius: "9999px",
              textDecoration: "none",
              transition: "color 150ms ease, background 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(245,240,232,0.9)";
              e.currentTarget.style.background = "rgba(245,240,232,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(245,240,232,0.55)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Right — Auth Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {user.isAuthenticated ? (
          <Link href="/dashboard" className="btn-jelly-primary" style={{ fontSize: "13px", padding: "8px 20px" }}>
            Dashboard
          </Link>
        ) : (
          <>
            <Link href="/login" className="btn-ghost" style={{ fontSize: "13px", padding: "8px 16px" }}>
              Sign In
            </Link>
            <Link href="/signup" className="btn-jelly-primary" style={{ fontSize: "13px", padding: "8px 20px" }}>
              Sign Up Free
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
