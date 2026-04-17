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

    useEffect(() => {
        const handleScroll = () => {
            setScrollFaded(window.scrollY > 60);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const currentMode = activeMode || (() => {
        if (pathname.startsWith("/hub")) return "HUB";
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
            case "HUB": router.push("/hub"); break;
        }
    };

    const activeConfig = MODES.find(m => m.id === currentMode) || MODES[0];

    return (
        <div className="contents">
            {/* ═══ LEFT SLOT: Toggle & Logo ═══ */}
            {(showLogo || leftSlot) && (
                <div className="fixed top-6 left-4 z-[10001] flex items-center gap-3">
                    {leftSlot}
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="group w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-95 shadow-lg bg-[var(--background-secondary)]"
                        style={{
                            backdropFilter: "blur(24px) saturate(2)",
                            WebkitBackdropFilter: "blur(24px) saturate(2)",
                            border: "1px solid var(--border)",
                            boxShadow: "var(--shadow-lg), inset 0 1px 1px var(--card-border)",
                        }}
                    >
                        <BrandLogo size="sm" />
                    </button>
                </div>
            )}

            {/* ═══ CENTER: Floating 3D Mode Pill - Non-distracting ═══ */}
            {pathname !== "/" && !pathname.startsWith("/chat") && !pathname.startsWith("/quiz") && !pathname.startsWith("/flashcards") ? (
                <div
                    className="fixed bottom-6 md:top-6 md:bottom-auto left-1/2 -translate-x-1/2 z-[9999] flex items-center rounded-full p-1 bg-[var(--background-tertiary)]/80"
                    style={{
                        backdropFilter: "blur(32px) saturate(2)",
                        WebkitBackdropFilter: "blur(24px) saturate(1.8)",
                        border: "1px solid var(--border)",
                        boxShadow: `var(--shadow-lg), 0 12px 40px ${activeConfig.glow}`,
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
                            <span className="relative z-10 drop-shadow-lg">{id}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="fixed top-6 right-16 z-[9999] flex items-center gap-2">
                    <Link
                        href="/library"
                        className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[11px] font-bold text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] transition-all bg-[var(--background-secondary)]/60 backdrop-blur-xl border border-[var(--border)] shadow-xl"
                    >
                        <Library size={14} strokeWidth={1.5} className="flex items-center justify-center overflow-hidden" />
                        <span>Library</span>
                    </Link>
                    <Link
                        href="/blog"
                        className="hidden lg:inline-flex px-3 py-2 rounded-2xl text-[11px] font-bold text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] transition-all bg-[var(--background-secondary)]/60 backdrop-blur-xl border border-[var(--border)] shadow-xl"
                    >
                        <BookOpen size={14} strokeWidth={1.5} className="flex items-center justify-center overflow-hidden" />
                    </Link>
                    <Link
                        href="/login"
                        className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#08080E] text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[#F59E0B]/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Login
                    </Link>
                </div>
            )}

            {/* ═══ RIGHT: Floating Stat Badges ═══ */}
            <div
                className={`fixed top-6 right-4 z-[9998] flex items-center gap-2 transition-opacity duration-500 ${
                    scrollFaded ? "opacity-50" : "opacity-100"
                }`}
            >
                {pathname !== "/" && (
                    <>
                        <div
                            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[var(--background-secondary)]/70 backdrop-blur-md border border-[var(--border)]"
                        >
                            <Zap size={16} strokeWidth={1.5} className="text-[var(--accent)] flex items-center justify-center overflow-hidden" />
                            <span className="text-[12px] font-bold text-[var(--foreground)]">{user?.xp || 0}</span>
                        </div>
                        <div
                            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[var(--background-secondary)]/70 backdrop-blur-md border border-[var(--border)]"
                        >
                            <Flame size={16} strokeWidth={1.5} className="text-[var(--error)] flex items-center justify-center overflow-hidden" />
                            <span className="text-[12px] font-bold text-[var(--foreground)]">{user?.streak || 0}</span>
                        </div>
                        <DailyChallenges />
                        <button
                            onClick={() => setToastsOpen(true)}
                            className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--background-secondary)]/70 backdrop-blur-md border border-[var(--border)] relative transition-all hover:bg-[var(--accent-bg)] shadow-[var(--shadow-sm)]"
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
                    </>
                )}

                <ThemeToggle />
            </div>
        </div>
    );
}
