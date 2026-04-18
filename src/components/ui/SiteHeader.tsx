"use client";

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
    Bell 
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   MODE CONFIG
   ═══════════════════════════════════════════════════ */
const MODES = [
    { id: "DASHBOARD", color: "#10B981", glow: "rgba(16,185,129,0.35)" },
    { id: "CREATE", color: "#F59E0B", glow: "rgba(245,158,11,0.35)" },
    { id: "LIBRARY", color: "#10B981", glow: "rgba(16,185,129,0.35)" },
    { id: "HUB", color: "#8B5CF6", glow: "rgba(139,92,246,0.35)" },
] as const;

export type AppMode = (typeof MODES)[number]["id"] | string;

interface SiteHeaderProps {
    activeMode?: AppMode;
    onModeChange?: (mode: AppMode) => void;
    showLogo?: boolean;
    leftSlot?: React.ReactNode;
}

export default function SiteHeader({ activeMode, onModeChange, showLogo = false, leftSlot }: SiteHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useUser();
    const { theme, toggleTheme } = useTheme();
    const { toasts, setIsOpen: setToastsOpen } = useToasts();
    const [scrollFaded, setScrollFaded] = useState(false);
    const unreadCount = toasts.filter(t => !t.read).length;

    // Paths where the header should NOT be shown (Immersive modes)
    const isHiddenPath = pathname.startsWith("/chat") || 
                         pathname.startsWith("/quiz") || 
                         pathname.startsWith("/flashcards") || 
                         pathname.startsWith("/review") || 
                         pathname.startsWith("/create") || 
                         pathname.startsWith("/arena/");

    if (isHiddenPath) return null;

    useEffect(() => {
        // Fallback for pages that scroll on window
        const handleScroll = () => {
            if (window.scrollY > 60) setScrollFaded(true);
            else setScrollFaded(false);
        };

        // MutationObserver / IntersectionObserver approach for internal scrollers
        const observer = new IntersectionObserver(
            ([entry]) => {
                // If sentinel is NOT intersecting with the margin, we've scrolled 60px
                setScrollFaded(!entry.isIntersecting);
            },
            { 
                rootMargin: "60px 0px 0px 0px", // Trigger when sentinel moves more than 60px past the top
                threshold: 0 
            }
        );

        // Try to find a sentinel in the DOM
        const sentinel = document.querySelector('[data-header-sentinel]');
        if (sentinel) {
            observer.observe(sentinel);
        } else {
            window.addEventListener("scroll", handleScroll, { passive: true });
        }

        return () => {
            window.removeEventListener("scroll", handleScroll);
            observer.disconnect();
        };
    }, [pathname]); // Re-run on navigation to find new sentinels

    const currentMode = activeMode || (() => {
        if (pathname.startsWith("/hub")) return "HUB";
        if (pathname.startsWith("/library")) return "LIBRARY";
        if (pathname.startsWith("/create") || pathname.startsWith("/flashcards") || pathname.startsWith("/quiz") || pathname.startsWith("/summary")) return "CREATE";
        if (pathname.startsWith("/dashboard")) return "DASHBOARD";
        return "DASHBOARD"; // Fallback cleanly to Dashboard
    })();

    const handleModeChange = (mode: AppMode) => {
        if (onModeChange) { onModeChange(mode); return; }
        const searchParams = new URLSearchParams(window.location.search);
        const threadId = searchParams.get("t");
        
        switch (mode) {
            case "DASHBOARD": router.push("/dashboard"); break;
            case "CHAT": router.push(`/chat${threadId ? `?t=${threadId}` : ""}`); break;
            case "CREATE": router.push(`/create${threadId ? `?t=${threadId}` : ""}`); break;
            case "LIBRARY": router.push("/library"); break;
            case "HUB": router.push("/hub"); break;
        }
    };

    const activeConfig = MODES.find(m => m.id === currentMode) || MODES[0];

    return (
        <motion.header 
            initial={false}
            animate={{
                top: scrollFaded ? "1.25rem" : "0rem",
                x: "-50%",
                width: scrollFaded ? "auto" : "100%",
                paddingBlock: scrollFaded ? "0.5rem" : "1.5rem",
                backgroundColor: scrollFaded ? "rgba(var(--background-secondary-rgb), 0.8)" : "rgba(var(--background-secondary-rgb), 0)",
                backdropFilter: scrollFaded ? "blur(32px) saturate(180%)" : "blur(0px) saturate(100%)",
                borderRadius: scrollFaded ? "9999px" : "0px",
                borderColor: scrollFaded ? "var(--border)" : "transparent",
                boxShadow: scrollFaded ? "0 20px 50px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)" : "none",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
                "fixed left-1/2 z-[10000] px-4 md:px-8 flex items-center justify-between gap-4 border",
                !scrollFaded && "border-transparent"
            )}
            style={{
                minWidth: scrollFaded ? "min(95vw, 600px)" : "100%",
            }}
        >
            {/* ═══ BRAND / LEFT ═══ */}
            <div className="flex items-center gap-3">
                {pathname.startsWith("/hub") || pathname.startsWith("/dashboard") ? (
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
                        className="flex w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl items-center justify-center interactive-glass transition-all active:scale-90"
                        style={{
                            background: "var(--background-secondary)",
                            backdropFilter: "blur(24px)",
                            border: "1px solid var(--border)",
                            boxShadow: "var(--shadow-sm), inset 0 1px 1px var(--card-border)",
                        }}
                    >
                        <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-[var(--foreground)]">
                            menu
                        </span>
                    </button>
                ) : leftSlot}
                <Link
                    href="/"
                    className="group w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-95 shadow-lg bg-[var(--background-secondary)] border border-[var(--border)]"
                >
                    <BrandLogo size="sm" />
                </Link>
                {!scrollFaded && (
                     <span className="hidden sm:inline-block font-heading font-bold text-[var(--foreground)] tracking-tight">The Professor</span>
                )}
            </div>

            {/* ═══ CENTER NAV / APP ═══ */}
            {pathname !== "/" && !pathname.startsWith("/chat") && !pathname.startsWith("/quiz") && !pathname.startsWith("/flashcards") ? (
                <div
                    className="flex items-center rounded-full p-1 bg-[var(--background-tertiary)]/80 border border-[var(--border)]"
                    style={{
                        boxShadow: `var(--shadow-sm), 0 12px 40px ${activeConfig.glow}`,
                    }}
                >
                    {MODES.map(({ id, color, glow }) => (
                        <button
                            key={id}
                            onClick={() => handleModeChange(id)}
                            className={`px-3 sm:px-4 py-2 text-[10px] sm:text-[11px] font-bold tracking-wider rounded-full relative interactive-glass ${
                                currentMode === id ? "text-[#08080E]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]"
                            }`}
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
                            <span className="relative z-10 drop-shadow-lg lowercase capitalize">{id.toLowerCase()}</span>
                        </button>
                    ))}
                </div>
            ) : pathname === "/" ? (
                /* ═══ CENTER NAV / LANDING (Hidden when scrolled for cleaner look, or kept) ═══ */
                <div className="hidden md:flex items-center gap-2">
                     <Link
                        href="/blog"
                        className="btn-skeuo px-4 py-2 text-[11px] font-bold text-[var(--foreground-muted)] hover:text-[var(--accent)] flex items-center gap-2"
                    >
                        <BookOpen size={14} strokeWidth={1.5} />
                        <span>Blog</span>
                    </Link>
                </div>
            ) : null}

            {/* ═══ STATS / TOGGLE / RIGHT ═══ */}
            <div className="flex items-center gap-2">
                {pathname !== "/" && (
                    <div className="flex items-center gap-2 mr-2">
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[var(--background-secondary)]/70 backdrop-blur-md border border-[var(--border)] shadow-inner">
                            <Zap size={16} strokeWidth={1.5} className="text-[var(--accent)]" />
                            <span className="text-[12px] font-bold text-[var(--foreground)]">{user?.xp || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[var(--background-secondary)]/70 backdrop-blur-md border border-[var(--border)] shadow-inner">
                            <Flame size={16} strokeWidth={1.5} className="text-[var(--error)]" />
                            <span className="text-[12px] font-bold text-[var(--foreground)]">{user?.streak || 0}</span>
                        </div>
                        <DailyChallenges />
                        <button
                            onClick={() => setToastsOpen(true)}
                            className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--background-secondary)]/70 backdrop-blur-md border border-[var(--border)] relative transition-all hover:bg-[var(--accent-bg)] shadow-inner"
                        >
                            <Bell size={16} strokeWidth={1.5} className="text-[var(--foreground)]" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75"></span>
                                    <span className="relative flex items-center justify-center rounded-full h-3.5 w-3.5 bg-[#F59E0B] border border-[var(--background)] text-[8px] font-black text-[#08080E] font-mono shadow-sm">
                                        {unreadCount > 9 ? '+' : unreadCount}
                                    </span>
                                </span>
                            )}
                        </button>
                    </div>
                )}
                
                {pathname === "/" && (
                     <Link
                        href="/login"
                        className="btn-skeuo-primary px-6 py-2.5 text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all mr-2"
                    >
                        Login
                    </Link>
                )}

                <ThemeToggle />
            </div>
        </motion.header>
    );
}
