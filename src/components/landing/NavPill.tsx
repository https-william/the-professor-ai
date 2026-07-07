"use client";
 
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import BrandLogo from "@/components/ui/BrandLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { Menu, X, ChevronDown, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NavPill() {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    const container = document.getElementById("main-scroll-container");
    const target = (container && container.scrollHeight > window.innerHeight && window.getComputedStyle(container).overflowY === 'auto') ? container : window;
    const onScroll = () => {
      const top = target === window ? window.scrollY : (container ? container.scrollTop : 0);
      setScrolled(top > 80);
    };
    target.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => target.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuItems = [
    { label: "AI Tools", href: "/tools/ai-study-planner" },
    { label: "Blog", href: "/blog" },
  ];

  const resourceItems = [
    { label: "JAMB 2026", href: "/exams/jamb" },
    { label: "WAEC 2026", href: "/exams/waec" },
    { label: "SAT Guide", href: "/exams/sat" },
    { label: "Glossary", href: "/glossary" },
  ];

  return (
    <>
      {/* Top viewport scroll mask to prevent cut-off elements showing above navbar */}
      <div className="fixed top-0 left-0 right-0 h-10 bg-gradient-to-b from-[var(--bg)] via-[var(--bg)]/90 to-transparent pointer-events-none z-[999]" />
      <div className="fixed top-6 left-0 right-0 z-[1000] flex justify-center px-4 md:px-6 pointer-events-none">
        <nav
          className={`w-full max-w-[820px] h-14 rounded-full flex items-center justify-between pl-5 pr-2 transition-all duration-300 backdrop-blur-md border relative pointer-events-auto shadow-lg ${
            scrolled 
              ? "bg-[var(--bg-2)]/95 border-[var(--border-2)]" 
              : "bg-[var(--bg)]/70 border-[var(--border)]"
          }`}
        >
          {/* Left — Logo */}
          <Link href="/" className="flex items-center gap-2.5 active:scale-95 transition-transform">
            <BrandLogo size="sm" />
            <span className="font-heading text-sm font-black text-[var(--foreground)] tracking-tight uppercase">
              The Professor
            </span>
          </Link>

          {/* Center — Nav Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-1">
            {menuItems.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-4 py-2 rounded-full font-sans text-[11px] font-black uppercase tracking-wider text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]/40 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}

            {/* Resources Dropdown */}
            <div className="relative group">
              <button className="px-4 py-2 rounded-full font-sans text-[11px] font-black uppercase tracking-wider text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] hover:bg-[var(--border)]/40 transition-all duration-200 flex items-center gap-1.5 cursor-pointer">
                Resources <ChevronDown size={12} className="transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible scale-y-[0.95] origin-top group-hover:opacity-100 group-hover:visible group-hover:scale-y-100 transition-all duration-200">
                <div className="bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl p-2 min-w-[160px] shadow-2xl backdrop-blur-md">
                  {resourceItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="block px-4 py-2 text-[11px] font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]/40 rounded-lg transition-all uppercase tracking-wider text-decoration-none"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right — Actions (Desktop) */}
          <div className="hidden lg:flex items-center gap-2.5">
            <ThemeToggle />
            {user.isAuthenticated ? (
              <Link
                href="/dashboard"
                className="px-5 py-2 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-light)] text-white font-sans font-black text-[11px] uppercase tracking-wider transition-all hover:shadow-[0_4px_12px_rgba(74,124,245,0.25)] active:scale-95 text-decoration-none"
              >
                Go to Hub
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-black text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors uppercase tracking-wider active:scale-95 text-decoration-none"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-light)] text-white font-sans font-black text-[11px] uppercase tracking-wider transition-all hover:shadow-[0_4px_12px_rgba(74,124,245,0.25)] active:scale-95 text-decoration-none"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Right — Actions (Mobile/Tablet Toggle) */}
          <div className="flex lg:hidden items-center gap-1.5">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-9 h-9 rounded-full bg-[var(--border)]/40 border border-[var(--border)] flex items-center justify-center text-[var(--foreground)] active:scale-95 transition-all"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>

          {/* Mobile Dropdown Panel */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-16 left-0 right-0 w-full rounded-3xl p-4 bg-[var(--bg-2)] border border-[var(--border)] backdrop-blur-2xl shadow-2xl flex flex-col gap-3"
              >
                <div className="flex flex-col gap-1">
                  {menuItems.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2.5 rounded-xl font-sans text-xs font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]/40 transition-all text-decoration-none"
                    >
                      {link.label}
                    </Link>
                  ))}
                  
                  <div className="h-[1px] bg-[var(--border)] my-1" />
                  <span className="px-4 py-1 text-[10px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">
                    Resources
                  </span>
                  {resourceItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 rounded-xl font-sans text-xs font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]/40 transition-all text-decoration-none"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="h-[1px] bg-[var(--border)]" />

                <div className="flex flex-col gap-2 pt-1">
                  {user.isAuthenticated ? (
                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="w-full py-3 rounded-xl bg-[var(--blue)] text-white font-sans font-black text-center text-xs uppercase tracking-wider transition-all hover:bg-[var(--blue-light)] text-decoration-none"
                    >
                      Go to Hub
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsOpen(false)}
                        className="w-full py-3 rounded-xl border border-[var(--border)] text-center text-xs font-black uppercase tracking-wider text-[var(--foreground)] hover:bg-[var(--border)]/40 transition-all text-decoration-none"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setIsOpen(false)}
                        className="w-full py-3 rounded-xl bg-[var(--blue)] text-white font-sans font-black text-center text-xs uppercase tracking-wider transition-all hover:bg-[var(--blue-light)] text-decoration-none"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </div>
    </>
  );
}
