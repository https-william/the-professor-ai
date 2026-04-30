"use client";
import MagneticButton from "@/components/ui/MagneticButton";
import AnimatedCounter from "@/components/ui/AnimatedCounter";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useMotionTemplate } from "framer-motion";
import BrandLogo from "@/components/ui/BrandLogo";
import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
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
    Lightbulb,
    User,
    LogOut,
    Settings,
    CreditCard,
    Play,
    Pause
} from "lucide-react";
import { useTimerStore } from "@/store/useTimerStore";

const HIDDEN_PATHS = [
    "/arena/play",
    "/login",
    "/signup",
    "/forgot-password",
    "/blog",
    "/flashcards",
    "/quiz",
    "/summary",
    "/roadmap",
    "/match",
];

const MINIMAL_PATHS = [
    "/onboarding",
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
    activeMode?: AppMode;
    onModeChange?: (mode: AppMode) => void;
    showLogo?: boolean;
    leftSlot?: React.ReactNode;
}

export default function SiteHeader({ activeMode, onModeChange, showLogo, leftSlot }: SiteHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useUser();
    const { theme } = useTheme();
    const { toasts, setIsOpen: setToastsOpen } = useToasts();
    const [mounted, setMounted] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const { isActive, timeLeft, mode, pauseTimer, startTimer } = useTimerStore();

    useEffect(() => {
        setMounted(true);
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const scrollY = useMotionValue(0);

    useEffect(() => {
        const container = document.getElementById("main-scroll-container");
        if (!container) return;
        
        const updateScroll = () => {
            scrollY.set(container.scrollTop);
        };

        container.addEventListener("scroll", updateScroll, { passive: true });
        updateScroll();
        
        // Safety sync for initial render
        setTimeout(updateScroll, 100);
        setTimeout(updateScroll, 1000);
        
        return () => container.removeEventListener("scroll", updateScroll);
    }, [scrollY]);

    /* ── Classify the current route ── */
    const isHidden  = HIDDEN_PATHS.some(p => pathname.startsWith(p));
    const isMinimal = MINIMAL_PATHS.some(p => pathname === p);
    const isLanding = LANDING_PATHS.includes(pathname);
    const isApp     = !isHidden && !isMinimal && !isLanding;

    // Map scrollY [0, 150] to transformation values
    // Map scrollY [0, 150] to a normalized progress value [0, 1]
    const scrollYProgress = useTransform(scrollY, [0, 150], [0, 1]);

    // Use percentage-based centering for zero-jitter responsive alignment
    const headerLeft = useTransform(scrollYProgress, [0, 1], ["50%", "50%"]);
    const headerX = useTransform(scrollYProgress, [0, 1], ["-50%", "-50%"]);
    const headerWidth = useTransform(scrollYProgress, [0, 0.2], [isApp ? "95%" : "100%", "90%"]);
    const headerMaxWidth = useTransform(scrollYProgress, [0, 0.2], [isApp ? "1152px" : "100vw", "1152px"]);

    const headerPaddingX = useTransform(scrollY, [0, 150], ["2rem", "1rem"]);
    const headerTop = useTransform(scrollY, [0, 150], ["0px", "16px"]);
    const headerPaddingBlock = useTransform(scrollY, [0, 150], ["16px", "8px"]);
    const headerBorderRadius = useTransform(scrollY, [0, 150], ["0px", "28px"]);
    const headerBgOpacity = useTransform(scrollY, [0, 150], [0, 0.98]);
    const headerBlur = useTransform(scrollY, [0, 150], [0, 24]);
    const headerScale = useTransform(scrollY, [0, 150], [1, 0.98]);

    // Derived motion values (hoisted to avoid re-creation)
    const headerBg = useTransform(headerBgOpacity, (o) =>
        `rgba(var(--background-secondary-rgb), ${o})`
    );
    const headerBackdrop = useTransform(headerBlur, (b) =>
        `blur(${b}px) saturate(180%)`
    );
    const headerBorder = useTransform(headerBgOpacity, (o) =>
        o > 0.1 ? "1px solid var(--border)" : "1px solid transparent"
    );
    const headerShadow = useTransform(headerBgOpacity, (o) => {
        if (o < 0.1) return "none";
        return theme === "dark"
            ? "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08)"
            : "0 10px 40px rgba(0,0,0,0.06), inset 0 1px 1px rgba(255,255,255,0.5)";
    });

    const [isPill, setIsPill] = useState(false);
    useEffect(() => {
        return scrollY.on("change", (latest) => {
            setIsPill(latest > 60);
        });
    }, [scrollY]);

    const unreadCount = toasts.filter(t => !t.read).length;

    /* ── Auto-detect active mode from pathname ── */
    const currentMode: string = activeMode ?? (() => {
        if (pathname.startsWith("/hub"))      return "HUB";
        if (pathname.startsWith("/library"))  return "LIBRARY";
        if (pathname.startsWith("/create") || pathname.startsWith("/summary") || pathname.startsWith("/quiz") || pathname.startsWith("/flashcards")) return "CREATE";
        return "DASHBOARD";
    })();

    const activeConfig = MODES.find(m => m.id === currentMode) ?? MODES[0];

    if (mounted && isHidden) return null;
    if (!mounted && isHidden) return null;

    const handleModeChange = (mode: AppMode, href: string) => {
        if (onModeChange) { onModeChange(mode); return; }
        router.push(href);
    };

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

    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;

    return (
        <motion.header
            initial={false}
            style={{ 
                top: headerTop,
                left: headerLeft,
                x: headerX,
                width: headerWidth,
                maxWidth: headerMaxWidth,
                paddingInline: headerPaddingX,
                paddingBlock: headerPaddingBlock,
                borderRadius: headerBorderRadius,
                scale: headerScale,
                backgroundColor: headerBg,
                backdropFilter: headerBackdrop,
                border: headerBorder,
                boxShadow: headerShadow,
            }}
            transition={{ 
                type: "tween",
                ease: [0.16, 1, 0.3, 1],
                duration: 0.4
            }}
            className="fixed z-[10000] grid grid-cols-[auto_1fr_auto] items-center gap-4 pointer-events-auto transition-shadow"
        >
            <div className="flex items-center gap-3">
                <AnimatePresence>
                    {!isApp && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Link
                                href={user.isAuthenticated ? "/dashboard" : "/"}
                                className="group relative flex items-center gap-3 p-1 rounded-xl transition-all"
                            >
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                                    style={{
                                        background: "var(--background-secondary)",
                                        border: "1px solid var(--border)",
                                        boxShadow: "var(--shadow-sm), inset 0 1px 1px rgba(255,255,255,0.1)",
                                    }}
                                >
                                    <BrandLogo size="sm" />
                                </div>
                                {!isPill && (
                                    <span className="hidden lg:block font-sans font-black text-[var(--foreground)] tracking-tighter text-[16px] uppercase">
                                        The Professor
                                    </span>
                                )}
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── CENTER: Context-aware nav ── */}
            <div className="flex items-center justify-center pointer-events-auto">
                <AnimatePresence mode="wait">
                    {isPill && (isActive || timeLeft < (mode === "focus" ? 25*60 : 5*60)) ? (
                        <motion.div
                            key="stealth-timer"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "tween", duration: 0.3 }}
                            className="flex items-center gap-3 px-4 py-1.5 rounded-full"
                            style={{
                                background: "var(--background-tertiary)",
                                border: mode === "focus" ? "1px solid var(--accent)" : "1px solid var(--secondary)",
                                boxShadow: mode === "focus" ? "0 0 10px var(--accent-glow)" : "0 0 10px var(--secondary-bg)",
                            }}
                        >
                            <span className="flex h-2 w-2 relative">
                                {isActive && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${mode === "focus" ? "bg-[var(--accent)]" : "bg-[var(--secondary)]"}`} />}
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${mode === "focus" ? "bg-[var(--accent)]" : "bg-[var(--secondary)]"}`} />
                            </span>
                            <span className="font-mono font-black tabular-nums tracking-tighter text-sm text-[var(--foreground)]">
                                {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
                            </span>
                            <button 
                                onClick={() => isActive ? pauseTimer() : startTimer()} 
                                className="ml-2 hover:text-[var(--foreground)] text-[var(--foreground-muted)] transition-colors"
                            >
                                {isActive ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current ml-0.5" />}
                            </button>
                        </motion.div>
                    ) : isLanding ? (
                        <motion.div 
                            key="landing-nav"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            transition={{ type: "tween", duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="flex items-center"
                        >
                            <Link
                                href="/blog"
                                className="btn-skeuo px-5 py-2 text-[11px] font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)] flex items-center gap-2 transition-colors"
                            >
                                <BookOpen size={14} strokeWidth={1.5} />
                                <span>Blog</span>
                            </Link>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="app-nav"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            transition={{ type: "tween", duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="hidden md:flex items-center rounded-full p-1"
                            style={{
                                background: "var(--background-tertiary)",
                                border: "1px solid var(--border)",
                                boxShadow: "var(--shadow-sm)",
                            }}
                        >
                            {MODES.map((modeConfig) => (
                                <button
                                    key={modeConfig.id}
                                    onClick={() => handleModeChange(modeConfig.id as AppMode, modeConfig.href)}
                                    className={`relative px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all ${
                                        currentMode === modeConfig.id
                                            ? "text-[var(--background)]"
                                            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                    }`}
                                >
                                    {currentMode === modeConfig.id && (
                                        <motion.div
                                            layoutId="active-pill"
                                            className="absolute inset-0 bg-[var(--foreground)] rounded-full"
                                            transition={{ type: "tween", duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <modeConfig.icon size={12} strokeWidth={2.5} />
                                        {modeConfig.label}
                                    </span>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── RIGHT: Actions ── */}
            <div className="flex items-center justify-end gap-2">
                {isApp && (
                    <>
                        <div className="hidden sm:block">
                            <DailyChallenges />
                        </div>

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
                            style={{ background: "var(--foreground)", color: "var(--background)", boxShadow: "none" }}
                        >
                            Login
                        </Link>
                    </motion.div>
                )}
                {user.isAuthenticated && (
                    <div className="relative" ref={menuRef}>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all bg-[var(--background-secondary)] border border-[var(--border)] shadow-[var(--shadow-sm),inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-[0.98]"
                        >
                            <span className="text-lg">{user.avatar || "🎓"}</span>
                        </motion.button>

                        <AnimatePresence>
                            {showUserMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ type: "tween", duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                    className="absolute right-0 mt-3 w-56 rounded-2xl p-2 z-[10001] bg-[var(--background-secondary)]/95 backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_40px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]"
                                >
                                    <div className="px-3 py-2.5 mb-2 border-b border-[var(--border)]">
                                        <p className="text-xs font-black text-[var(--foreground-muted)] uppercase tracking-widest mb-0.5">Account</p>
                                        <p className="text-sm font-bold text-[var(--foreground)] truncate">{user.name || "Student"}</p>
                                    </div>

                                    {[
                                        { label: "Profile", icon: User, href: "/settings" },
                                        { label: "Settings", icon: Settings, href: "/settings" },
                                        { label: "Billing", icon: CreditCard, href: "/settings" },
                                    ].map((item) => (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.03] transition-all"
                                        >
                                            <item.icon size={16} strokeWidth={2} />
                                            {item.label}
                                        </Link>
                                    ))}

                                    <button
                                        onClick={async () => {
                                            const supabase = createClient();
                                            await fetch('/api/auth/signout', { method: 'POST' });
                                            await supabase.auth.signOut();
                                            router.push("/login");
                                            setShowUserMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 mt-2 rounded-xl text-sm font-medium text-red-500/70 hover:text-red-500 hover:bg-red-500/5 transition-all"
                                    >
                                        <LogOut size={16} strokeWidth={2} />
                                        Sign Out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </motion.header>
    );
}
