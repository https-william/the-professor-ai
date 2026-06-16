"use client";
 
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import BrandLogo from "@/components/ui/BrandLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { Menu, X, ChevronDown, Sparkles, LayoutDashboard, Lightbulb, Library, Swords, BookOpen, Zap } from "lucide-react";
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
    <div className="fixed top-6 left-0 right-0 z-[1000] flex justify-center px-4 md:px-6 pointer-events-none">
      <nav
        className="w-full max-w-[820px] h-14 rounded-full flex items-center justify-between pl-5 pr-2 transition-all duration-300 backdrop-blur-md border relative pointer-events-auto shadow-lg"
        style={{
          background: scrolled ? "rgba(24, 24, 27, 0.92)" : "rgba(9, 9, 11, 0.6)",
          borderColor: scrolled ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Left — Logo */}
        <Link href="/" className="flex items-center gap-2.5 active:scale-95 transition-transform">
          <BrandLogo size="sm" />
          <span className="font-heading text-sm font-black text-white tracking-tight uppercase">
            The Professor
          </span>
        </Link>

        {/* Center — Nav Links (Desktop) */}
        <div className="hidden lg:flex items-center gap-1">
          {menuItems.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-4 py-2 rounded-full font-sans text-[11px] font-black uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              {link.label}
            </Link>
          ))}

          {/* Resources Dropdown */}
          <div className="relative group">
            <button className="px-4 py-2 rounded-full font-sans text-[11px] font-black uppercase tracking-wider text-zinc-400 group-hover:text-white hover:bg-white/5 transition-all duration-200 flex items-center gap-1.5">
              Resources <ChevronDown size={12} className="transition-transform group-hover:rotate-180" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible scale-y-[0.95] origin-top group-hover:opacity-100 group-hover:visible group-hover:scale-y-100 transition-all duration-200">
              <div className="bg-zinc-900/95 border border-white/10 rounded-2xl p-2 min-w-[160px] shadow-2xl backdrop-blur-md">
                {resourceItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block px-4 py-2 text-[11px] font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all uppercase tracking-wider"
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
              className="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-sans font-black text-[11px] uppercase tracking-wider transition-all hover:shadow-[0_4px_20px_rgba(99,102,241,0.3)] active:scale-95"
            >
              Go to Hub
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-black text-zinc-400 hover:text-white transition-colors uppercase tracking-wider active:scale-95"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-sans font-black text-[11px] uppercase tracking-wider transition-all hover:shadow-[0_4px_20px_rgba(99,102,241,0.3)] active:scale-95"
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
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all"
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
              className="absolute top-16 left-0 right-0 w-full rounded-3xl p-4 bg-zinc-950/95 border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col gap-3"
            >
              <div className="flex flex-col gap-1">
                {menuItems.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 px-4 rounded-xl text-left text-xs font-black uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Collapsible Resources inside Mobile Menu */}
                <div className="flex flex-col">
                  <button
                    onClick={() => setShowResources(!showResources)}
                    className="w-full py-3 px-4 rounded-xl text-left text-xs font-black uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-white/5 flex items-center justify-between transition-all"
                  >
                    <span>Resources</span>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${showResources ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {showResources && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden pl-4 flex flex-col gap-0.5"
                      >
                        {resourceItems.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className="w-full py-2 px-4 rounded-xl text-left text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Mobile Auth CTAs */}
              <div className="h-[1px] bg-white/5 my-1" />
              <div className="flex flex-col gap-2">
                {user.isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-sans font-black text-center text-xs uppercase tracking-wider transition-all"
                  >
                    Go to Hub
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="w-full py-3 rounded-xl border border-white/10 text-center text-xs font-black uppercase tracking-wider text-white hover:bg-white/5 transition-all"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setIsOpen(false)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-sans font-black text-center text-xs uppercase tracking-wider transition-all"
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
  );
}
