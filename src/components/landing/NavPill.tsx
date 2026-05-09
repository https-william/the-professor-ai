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
      <div className="hidden lg:flex" style={{ alignItems: "center", gap: "4px" }}>
        {[
          { label: "AI Tools", href: "/tools/ai-study-planner" },
          { label: "Resources", href: "/exams", dropdown: [
            { label: "JAMB 2026", href: "/exams/jamb" },
            { label: "WAEC 2026", href: "/exams/waec" },
            { label: "SAT Guide", href: "/exams/sat" },
            { label: "Glossary", href: "/glossary" },
          ]},
          { label: "Blog", href: "/blog" },
        ].map((link) => (
          <div key={link.label} className="relative group">
            <Link
              href={link.href}
              className="nav-link-pill"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "12px",
                fontWeight: 800,
                color: "var(--text-3)",
                padding: "8px 16px",
                borderRadius: "9999px",
                textDecoration: "none",
                transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block"
              }}
            >
              {link.label}
            </Link>
            
            {link.dropdown && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "16px",
                  padding: "8px",
                  minWidth: "160px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                  backdropFilter: "blur(12px)"
                }}>
                  {link.dropdown.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      style={{
                        display: "block",
                        padding: "10px 16px",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "var(--text-2)",
                        textDecoration: "none",
                        borderRadius: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em"
                      }}
                      className="hover:bg-[var(--border)] hover:text-[var(--text)] transition-all"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Right — Auth Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <ThemeToggle />
        {user.isAuthenticated ? (
          <Link 
            href="/dashboard" 
            className="btn-skeuo-blue" 
            style={{ 
              fontSize: "11px", 
              padding: "6px 16px", 
              borderRadius: "99px", 
              textDecoration: "none",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}
          >
            Go to Hub
          </Link>
        ) : (
          <>
            <Link 
              href="/login" 
              style={{ 
                fontSize: "12px", 
                padding: "10px 18px", 
                color: "var(--text-2)", 
                fontWeight: 800, 
                textDecoration: "none",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
              className="hover:text-[var(--text)] transition-colors active:scale-90"
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="btn-skeuo-blue" 
              style={{ 
                fontSize: "11px", 
                padding: "6px 16px", 
                borderRadius: "99px", 
                fontWeight: 900, 
                textTransform: "uppercase", 
                letterSpacing: "0.05em", 
                textDecoration: "none" 
              }}
            >
              Get Started
            </Link>
          </>
        )}
      </div>

      <style jsx>{`
        .nav-link-pill:hover {
          color: var(--text) !important;
          background: var(--border-2);
          transform: translateY(-1px);
        }
        .nav-link-pill:active {
          transform: scale(0.85);
          background: var(--border-3);
        }
        .btn-skeuo-blue:active {
          transform: scale(0.85) !important;
        }
      `}</style>
    </nav>
  );
}
