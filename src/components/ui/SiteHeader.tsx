"use client";
import MagneticButton from "@/components/ui/MagneticButton";
import AnimatedCounter from "@/components/ui/AnimatedCounter";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { motion } from "framer-motion";
import BrandLogo from "@/components/ui/BrandLogo";
import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggle from "@/components/ui/ThemeToggle";
import DailyChallenges from "@/components/features/DailyChallenges";
import { useToasts } from "@/components/ui/GlobalToasts";
import { cn } from "@/lib/utils";
import { 
    Library, 
    BookOpen, 
    Zap, 
    Flame, 
    Bell, 
    Menu, 
    Users, 
    LayoutDashboard, 
    Lightbulb 
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   ROUTE CLASSIFICATION
   ═══════════════════════════════════════════════════

   HIDDEN   — Immersive full-screen experiences. Header = null.
   MINIMAL  — Auth / standalone pages. Logo + ThemeToggle only.
   LANDING  — Marketing home. Logo + Blog + Login CTA.
   APP      — Authenticated workspace. Full mode-switcher + stats.

   Context-awareness is derived from pathname, NOT from props.
   Individual pages do NOT render their own SiteHeader.
   ═══════════════════════════════════════════════════ */

const HIDDEN_PATHS = [
    "/arena/play",
    "/login",
    "/signup",
    "/forgot-password",
    "/blog",
];

const MINIMAL_PATHS = [
    "/onboarding", // Example of a minimal path if it existed
];

const LANDING_PATHS = ["/", "/download"];

const MODES = [
    { id: "DASHBOARD", label: "Dashboard", href: "/dashboard", color: "#10B981", glow: "rgba(16,185,129,0.35)", icon: LayoutDashboard },
    { id: "CREATE",    label: "Create",    href: "/create",    color: "#F59E0B", glow: "rgba(245,158,11,0.35)", icon: Lightbulb },
    { id: "LIBRARY",  label: "Library",   href: "/library",   color: "#10B981", glow: "rgba(16,185,129,0.35)", icon: Library },
    { id: "HUB",      label: "Hub",       href: "/hub",       color: "#8B5CF6", glow: "rgba(139,92,246,0.35)", icon: Users },
] as const;

export type AppMode = (typeof MODES)[number]["id"] | string;

interface SiteHeaderProps {
    /** Allows a page to override the active mode indicator */
    activeMode?: AppMode;
    /** Allows a page to handle mode changes itself (e.g. hub page) */
    onModeChange?: (mode: AppMode) => void;
    /** Unused — context is now derived automatically */
    showLogo?: boolean;
    /** Optional custom left-hand slot (e.g. back button) */
    leftSlot?: React.ReactNode;
}

export default function SiteHeader({ activeMode, onModeChange, showLogo, leftSlot }: SiteHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useUser();
    const { theme } = useTheme();
    const { toasts, setIsOpen: setToastsOpen } = useToasts();
    const [scrollFaded, setScrollFaded] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const unreadCount = toasts.filter(t => !t.read).length;

    /* ── Classify the current route ── */
    const isHidden  = HIDDEN_PATHS.some(p => pathname.startsWith(p));
    const isMinimal = MINIMAL_PATHS.some(p => pathname === p);
    const isLanding = LANDING_PATHS.includes(pathname);
    const isApp     = !isHidden && !isMinimal && !isLanding;

    /* ── Scroll-to-pill morphing ── */
    useEffect(() => {
        setScrollFaded(false); // Reset on route change

        const handleScroll = () => setScrollFaded(window.scrollY > 60);

        const observer = new IntersectionObserver(
            ([entry]) => setScrollFaded(!entry.isIntersecting),
            { rootMargin: "60px 0px 0px 0px", threshold: 0 }
        );

        const sentinel = document.querySelector("[data-header-sentinel]");
        if (sentinel) {
            observer.observe(sentinel);
        } else {
            window.addEventListener("scroll", handleScroll, { passive: true });
        }

        return () => {
            window.removeEventListener("scroll", handleScroll);
            observer.disconnect();
        };
    }, [pathname]);

    /* ── Auto-detect active mode from pathname ── */
    const currentMode: string = activeMode ?? (() => {
        if (pathname.startsWith("/hub"))      return "HUB";
        if (pathname.startsWith("/library"))  return "LIBRARY";
        if (pathname.startsWith("/create") || pathname.startsWith("/summary") || pathname.startsWith("/quiz") || pathname.startsWith("/flashcards")) return "CREATE";
        return "DASHBOARD";
    })();

    const activeConfig = MODES.find(m => m.id === currentMode) ?? MODES[0];

    /* ── Rules of Hooks: early return AFTER all hooks ── */
    // Hydration guard: return null ONLY if we are mounted and path is hidden.
    // During hydration (unmounted), we render nothing only if we are absolutely sure,
    // but the safer bet is to match server.
    if (mounted && isHidden) return null;
    if (!mounted && isHidden) return null;

    const handleModeChange = (mode: AppMode, href: string) => {
        if (onModeChange) { onModeChange(mode); return; }
        router.push(href);
    };

    /* ══════════════════════════════════════
       MINIMAL HEADER — Auth pages
       Only logo + theme toggle. No nav.
    ══════════════════════════════════════ */
    if (isMinimal) {
        return (
            <header className="fixed top-0 left-0 right-0 z-[10000] flex items-center justify-between px-6 py-4">
                <Link href="/" className="flex items-center gap-2.5">
                    <BrandLogo size="sm" />
                </Link>
                <ThemeToggle />
            </header>
        );
    }

    /* ══════════════════════════════════════
       SHARED PILL ANIMATION WRAPPER
    ══════════════════════════════════════ */
    return (
        <motion.header
            initial={false}
            animate={{
                top: scrollFaded ? "1.25rem" : "0rem",
                x: "-50%",
                width: scrollFaded ? "auto" : "100%",
                paddingBlock: scrollFaded ? "0.5rem" : "1.25rem",
                backgroundColor: scrollFaded
                    ? "rgba(var(--background-secondary-rgb), 0.85)"
                    : "rgba(var(--background-secondary-rgb), 0)",
                backdropFilter: scrollFaded ? "blur(32px) saturate(200%)" : "blur(0px)",
                borderRadius: scrollFaded ? "9999px" : "0px",
                borderColor: scrollFaded ? "var(--border)" : "transparent",
                boxShadow: scrollFaded
                    ? theme === "dark" 
                        ? "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08)"
                        : "0 10px 40px rgba(0,0,0,0.06), inset 0 1px 1px rgba(255,255,255,0.5)"
                    : "none",
            }}
            transition={{ 
                type: "tween", 
                duration: 0.4, 
                ease: [0.23, 1, 0.32, 1] // Custom ease-out expo
            }}
            className={cn(
                "fixed left-1/2 z-[10000] px-3 sm:px-4 md:px-8 grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4 border",
                !scrollFaded && "border-transparent"
            )}
            style={{ 
                width: scrollFaded ? "auto" : "100%",
                minWidth: scrollFaded ? "min(92vw, 640px)" : "100%" 
            }}
        >
            {/* ── LEFT: Brand / Menu ── */}
            <div className="flex items-center gap-3 justify-self-start">
                {isApp && (pathname.startsWith("/hub") || pathname.startsWith("/dashboard")) ? (
                    <motion.button
                        layoutId="header-menu"
                        whileTap={{ y: 0.5, boxShadow: "inset 0 4px 10px rgba(0,0,0,0.3)" }}
                        onClick={() => window.dispatchEvent(new CustomEvent("toggle-sidebar"))}
                        className="flex w-9 h-9 rounded-xl items-center justify-center transition-all bg-[var(--background-secondary)] border border-[var(--border)] shadow-[0_4px_10px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                        aria-label="Toggle Side Navigation Menu"
                    >
                        <Menu size={18} strokeWidth={2} className="text-[var(--foreground)]" />
                    </motion.button>
                ) : leftSlot ?? null}

                <Link
                    href={isApp ? "/dashboard" : "/"}
                    className="group w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-95"
                    style={{
                        background: "var(--background-secondary)",
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow-sm), inset 0 1px 1px rgba(255,255,255,0.1)",
                    }}
                >
                    <BrandLogo size="sm" />
                </Link>

                {!scrollFaded && (
                    <span className="hidden sm:block font-heading font-bold text-[var(--foreground)] tracking-tight text-[15px]">
                        The Professor
                    </span>
                )}
            </div>

            {/* ── CENTER: Context-aware nav (Symmetric Center) ── */}
            <div className="hidden sm:flex items-center justify-center">
                {isLanding && (
                    <div className="hidden md:flex items-center gap-2">
                        <Link
                            href="/blog"
                            className="btn-skeuo px-4 py-2 text-[11px] font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)] flex items-center gap-2 transition-colors"
                        >
                            <BookOpen size={14} strokeWidth={1.5} />
                            <span>Blog</span>
                        </Link>

                    </div>
                )}

                {isApp && (
                    <div
                        className="flex items-center rounded-full p-1"
                        style={{
                            background: "var(--background-tertiary)",
                            border: "1px solid var(--border)",
                            boxShadow: `var(--shadow-sm), 0 8px 30px ${activeConfig.glow}`,
                        }}
                    >
                        {MODES.map(({ id, label, href, color, glow }) => (
                            <motion.button
                                key={id}
                                whileTap={{ y: 0.5, scale: 0.98 }}
                                onClick={() => handleModeChange(id, href)}
                                className={cn(
                                    "px-3 sm:px-4 py-1.5 text-[10px] sm:text-[11px] font-bold tracking-wider rounded-full relative transition-all whitespace-nowrap flex items-center justify-center min-w-[40px] sm:min-w-[auto]",
                                    currentMode === id
                                        ? "text-[#08080E] shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                                        : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                )}
                            >
                                {currentMode === id && (
                                    <motion.div
                                        layoutId="global-mode-slider"
                                        className="absolute inset-0 rounded-full z-0"
                                        style={{
                                            backgroundColor: color,
                                            boxShadow: `inset 0 2px 4px rgba(255,255,255,0.35), 0 4px 16px ${glow}`,
                                        }}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10 capitalize hidden sm:inline">{label}</span>
                                <span className="relative z-10 sm:hidden">
                                     {React.createElement(MODES.find(m => m.id === id)!.icon, { size: 14, strokeWidth: 2.5 })}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── RIGHT: Stats + Actions ── */}
            <motion.div 
                layout="position" 
                className="flex items-center gap-1 sm:gap-2 justify-self-end"
                transition={{ type: "tween", duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
                {isApp && (
                    <>
                        {/* XP - Hidden on Mobile */}
                        <div
                            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-2xl"
                            style={{
                                background: "var(--background-secondary)",
                                border: "1px solid var(--border)",
                                boxShadow: "inset 0 1px 1px var(--card-border)",
                            }}
                        >
                            <Zap size={14} strokeWidth={1.5} className="text-[var(--accent)]" />
                            <AnimatedCounter value={user?.xp ?? 0} className="text-[12px] font-bold text-[var(--foreground)]" />
                        </div>

                        {/* Streak - Hidden on Mobile */}
                        <div
                            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl"
                            style={{
                                background: "var(--background-secondary)",
                                border: "1px solid var(--border)",
                                boxShadow: "inset 0 1px 1px var(--card-border)",
                            }}
                        >
                            <Flame size={14} strokeWidth={1.5} className="text-[var(--error)]" />
                            <AnimatedCounter value={user?.streak ?? 0} className="text-[12px] font-bold text-[var(--foreground)]" />
                        </div>

                        {/* Daily Challenges */}
                        <DailyChallenges />

                        {/* Notifications */}
                        <MagneticButton>
                            <motion.button
                                layoutId="header-notifications"
                                whileTap={{ y: 0.5, boxShadow: "inset 0 4px 10px rgba(0,0,0,0.3)" }}
                                onClick={() => setToastsOpen(true)}
                                className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all bg-[var(--background-secondary)] border border-[var(--border)] shadow-[0_4px_10px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
                            >
                                <Bell size={14} strokeWidth={2} className="text-[var(--foreground)]" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75" />
                                        <span className="relative flex items-center justify-center rounded-full h-3.5 w-3.5 bg-[#F59E0B] border border-[var(--background)] text-[8px] font-black text-[#08080E]">
                                            {unreadCount > 9 ? "+" : unreadCount}
                                        </span>
                                    </span>
                                )}
                            </motion.button>
                        </MagneticButton>
                    </>
                )}

                {isLanding && (
                    <motion.div 
                        layout="position"
                        transition={{ type: "tween", duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    >
                        <Link
                            href="/login"
                            className="btn-skeuo-primary px-5 py-2 text-[11px] font-black uppercase tracking-widest active:scale-95"
                        >
                            Login
                        </Link>
                    </motion.div>
                )}

                <ThemeToggle />
            </motion.div>
        </motion.header>
    );
}
