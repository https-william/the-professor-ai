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
    Pause,
    ChevronDown,
    Sparkles,
    Trophy
} from "lucide-react";
import { useTimerStore } from "@/store/useTimerStore";
import { useAppPlatform } from "@/hooks/useAppPlatform";

const HIDDEN_PATHS = [
    "/arena/play",
    "/library/pack",
    "/library/pack",
    "/login",
    "/signup",
    "/forgot-password",
    "/",
    "/blog",
    "/exams",
    "/glossary",
    "/best-ai-for",
    "/tools"
];

const MINIMAL_PATHS = [
    "/onboarding",
];

const LANDING_PATHS: string[] = []; // No longer using SiteHeader for landing

const MODES = [
    { id: "DASHBOARD", label: "Dashboard", href: "/dashboard", color: "var(--emerald)", glow: "var(--emerald-glow)", icon: LayoutDashboard },
    { id: "CREATE",    label: "Create",    href: "/create",    color: "var(--blue)",    glow: "var(--blue-glow)",    icon: Lightbulb },
    { id: "LIBRARY",  label: "Library",   href: "/library",   color: "var(--violet)",  glow: "var(--violet-glow)",  icon: Library },
    { id: "HUB",      label: "Hub",       href: "/hub",       color: "var(--cyan)",    glow: "var(--cyan-glow)",    icon: Users },
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
    const { resolvedTheme } = useTheme();
    const { toasts, setIsOpen: setToastsOpen } = useToasts();
    const { isDesktop, isMobile } = useAppPlatform();
    const [mounted, setMounted] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showResourcesMenu, setShowResourcesMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const resourcesRef = useRef<HTMLDivElement>(null);

    const { isActive, timeLeft, mode, pauseTimer, startTimer } = useTimerStore();

    useEffect(() => {
        setMounted(true);
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
            if (resourcesRef.current && !resourcesRef.current.contains(e.target as Node)) {
                setShowResourcesMenu(false);
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
        
        return () => container.removeEventListener("scroll", updateScroll);
    }, [scrollY]);

    /* ── Classify the current route ── */
    const isHidden  = HIDDEN_PATHS.some(p => p === "/" ? pathname === "/" : pathname.startsWith(p));
    const isMinimal = MINIMAL_PATHS.some(p => pathname === p);
    const isLanding = LANDING_PATHS.includes(pathname) || 
                      pathname.startsWith("/blog/") || 
                      pathname.startsWith("/exams/") || 
                      pathname.startsWith("/glossary/") || 
                      pathname.startsWith("/best-ai-for/") ||
                      pathname.startsWith("/tools/");
    const isApp     = !isHidden && !isMinimal && !isLanding;

    // Map scrollY [0, 150] to transformation values
    const scrollYProgress = useTransform(scrollY, [0, 150], [0, 1]);

    // Landing-specific transformations
    const landingTop = useTransform(scrollY, [0, 150], ["0px", "16px"]);
    const landingPaddingX = useTransform(scrollY, [0, 150], isMobile ? ["1rem", "0.75rem"] : ["2rem", "1.5rem"]);
    const landingPaddingBlock = useTransform(scrollY, [0, 150], ["16px", "10px"]);
    const landingBorderRadius = useTransform(scrollY, [0, 150], ["0px", "32px"]);
    const landingWidth = useTransform(scrollYProgress, [0, 0.2], ["100%", isMobile ? "calc(100vw - 2.5rem)" : "94%"]);

    // App-specific transformations (Floating Morphing)
    const appTop = useTransform(scrollY, [0, 150], ["10px", isMobile ? "12px" : "16px"]);
    const appWidth = useTransform(scrollY, [0, 150], ["calc(100% - 2rem)", "min(600px, 90%)"]);
    const appPaddingInline = useTransform(scrollY, [0, 150], isMobile ? ["0.75rem", "0.75rem"] : ["1.5rem", "1.2rem"]);
    const appPaddingBlock = useTransform(scrollY, [0, 150], isMobile ? ["6px", "6px"] : ["12px", "10px"]);

    // Derived motion values
    const headerBgOpacity = useTransform(scrollY, [0, 150], [0, 0.98]);
    const headerBlur = useTransform(scrollY, [0, 150], [0, 24]);
    const headerScale = useTransform(scrollY, [0, 150], [1, 0.98]);

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
        return resolvedTheme === "dark"
            ? "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08)"
            : "0 10px 40px rgba(0,0,0,0.06), inset 0 1px 1px rgba(255,255,255,0.5)";
    });

    // App-page dynamic styles
    const appBgOpacity = useTransform(scrollY, [0, 60], [0.9, 0.96]);
    const appBlur = useTransform(scrollY, [0, 60], [16, 32]);
    const appBorderOpacity = useTransform(scrollY, [0, 60], [0.1, 0.2]);
    const appSaturate = useTransform(scrollY, [0, 60], [150, 200]);

    const appBg = useMotionTemplate`rgba(${resolvedTheme === "dark" ? "10, 10, 20" : "250, 250, 255"}, ${appBgOpacity})`;
    const appBackdrop = useMotionTemplate`blur(${appBlur}px) saturate(${appSaturate}%)`;
    const appBorder = useMotionTemplate`1px solid rgba(${resolvedTheme === "dark" ? "255, 255, 255" : "0, 0, 0"}, ${appBorderOpacity})`;
    
    const appShadow = useTransform(scrollY, [0, 60], [
        resolvedTheme === "dark" ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 15px rgba(0,0,0,0.05)",
        resolvedTheme === "dark" ? "0 20px 50px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1)" : "0 10px 40px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.8)"
    ]);

    const [isPill, setIsPill] = useState(false);
    useEffect(() => {
        return scrollY.on("change", (latest) => {
            setIsPill(latest > 40);
        });
    }, [scrollY]);

    const unreadCount = toasts.filter(t => !t.read).length;

    const currentMode: string = activeMode ?? (() => {
        if (pathname.startsWith("/hub"))      return "HUB";
        if (pathname.startsWith("/library"))  return "LIBRARY";
        if (pathname.startsWith("/create") || pathname.startsWith("/summary") || pathname.startsWith("/quiz") || pathname.startsWith("/flashcards")) return "CREATE";
        return "DASHBOARD";
    })();

    if (isHidden) return null;

    const handleModeChange = (mode: AppMode, href: string) => {
        if (onModeChange) { onModeChange(mode); return; }
        router.push(href);
    };

    if (isMinimal) {
        return (
            <header className="fixed top-0 left-0 right-0 z-[10000] flex items-center justify-between px-6 py-4">
                <Link href="/" className="flex items-center gap-2.5 active:scale-95 transition-transform">
                    <BrandLogo size="sm" />
                </Link>
                <ThemeToggle />
            </header>
        );
    }

    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const sidebarOffset = "0px";

    return (
        <motion.header
            suppressHydrationWarning
            initial={false}
            style={{
                top: isApp ? appTop : landingTop,
                left: `calc(50% + ${sidebarOffset})`,
                x: "-50%",
                width: isApp ? "100%" : landingWidth,
                maxWidth: isApp ? "1200px" : "840px",
                paddingInline: isApp ? appPaddingInline : landingPaddingX,
                paddingBlock: isApp ? appPaddingBlock : landingPaddingBlock,
                borderRadius: isApp ? "0px" : landingBorderRadius,
                scale: headerScale,
                backgroundColor: isApp ? "transparent" : headerBg,
                backdropFilter: isApp ? "none" : headerBackdrop,
                border: isApp ? "none" : headerBorder,
                boxShadow: isApp ? "none" : headerShadow,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
                "fixed z-[10000] items-center pointer-events-none [&>div]:pointer-events-auto transition-all duration-300",
                isApp ? "flex items-center justify-between gap-4 w-full" : "grid grid-cols-[auto_1fr_auto] gap-1.5 md:gap-4"
            )}
        >
            <div className="flex items-center gap-3">
                <Link
                    href={user.isAuthenticated ? "/dashboard" : "/"}
                    className={cn(
                        "group relative flex items-center gap-2.5 p-1.5 md:pr-4 rounded-full transition-all active:scale-95",
                        isApp ? "bg-[var(--background-secondary)] backdrop-blur-md border border-[var(--border)] shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:border-[var(--accent)] hover:shadow-[0_0_15px_var(--accent-glow)]" : "hover:bg-[var(--foreground)]/[0.08]"
                    )}
                >
                    <div
                        className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all bg-[var(--background)] border border-[var(--border)] shadow-sm group-hover:border-[var(--accent)] group-hover:shadow-[0_0_15px_var(--accent-glow)]"
                    >
                        <BrandLogo size="sm" />
                    </div>
                    {!isPill && (
                        <span className="hidden lg:block font-sans font-black text-[var(--foreground)] tracking-tighter text-sm uppercase">
                            The Professor
                        </span>
                    )}
                </Link>
            </div>

            {/* ── CENTER: Context-aware nav ── */}
            <div className="flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {isPill && (isActive || timeLeft < (mode === "focus" ? 25*60 : 5*60)) ? (
                        <motion.div
                            key="stealth-timer"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex items-center gap-3 px-5 py-2 rounded-full bg-[var(--background-secondary)] backdrop-blur-md border border-[var(--accent)] shadow-[0_0_15px_var(--accent-glow)]"
                        >
                            <span className="flex h-2 w-2 relative">
                                {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />}
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]" />
                            </span>
                            <span className="font-mono font-black tabular-nums tracking-tighter text-sm text-[var(--foreground)]">
                                {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
                            </span>
                        </motion.div>
                    ) : isLanding ? (
                        <div className="hidden lg:flex items-center gap-10">
                            <Link
                                href="/blog"
                                className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all hover:scale-110 active:scale-90"
                            >
                                Blog
                            </Link>
                            
                            <div className="relative" ref={resourcesRef}>
                                <button
                                    onClick={() => setShowResourcesMenu(!showResourcesMenu)}
                                    className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all flex items-center gap-2 hover:scale-110 active:scale-[0.85]"
                                >
                                    Resources <ChevronDown size={12} className={cn("transition-transform", showResourcesMenu && "rotate-180")} />
                                </button>
                                
                                <AnimatePresence>
                                    {showResourcesMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute left-1/2 -translate-x-1/2 mt-6 w-64 rounded-[32px] p-3 bg-[var(--bg-3)] border border-[var(--border)] shadow-2xl z-[10001]"
                                        >
                                            <div className="grid grid-cols-1 gap-2">
                                                {[
                                                    { label: "Exam Guides", href: "/exams/jamb", icon: BookOpen },
                                                    { label: "Study Persona Quiz", href: "/blog?quiz=true", icon: Sparkles },
                                                    { label: "Study Glossary", href: "/glossary", icon: Library },
                                                    { label: "AI Study Planner", href: "/tools/ai-study-planner", icon: Zap },
                                                    { label: "Best Tools", href: "/best-ai-study-tools", icon: LayoutDashboard },
                                                ].map((item) => (
                                                    <Link
                                                        key={item.label}
                                                        href={item.href}
                                                        onClick={() => setShowResourcesMenu(false)}
                                                        className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[var(--foreground)]/[0.05] transition-all group active:scale-[0.98]"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-[var(--background)] flex items-center justify-center border border-[var(--border)] group-hover:border-[var(--accent)] group-hover:text-[var(--accent)] transition-all">
                                                            <item.icon size={18} />
                                                        </div>
                                                        <span className="text-sm font-black text-[var font-black text-[var(--foreground)] tracking-tight">{item.label}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    ) : null}
                </AnimatePresence>
            </div>

            {/* ── RIGHT: Actions ── */}
            <div className="flex items-center justify-end gap-1.5 md:gap-2.5">
                {user.isAuthenticated && (
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-sm transition-all",
                        isApp ? "bg-[var(--background-secondary)] backdrop-blur-md border border-[var(--border)] shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:border-[var(--accent)]" : "bg-[var(--background)] border border-[var(--border)]"
                    )} title="Available Credits">
                        <Zap size={14} className="text-[var(--amber)] animate-pulse w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="font-mono text-[11px] md:text-xs font-bold text-[var(--foreground)] tabular-nums">
                            {user.credits ?? 100}
                        </span>
                    </div>
                )}
                <div className="hidden sm:block">
                    <ThemeToggle />
                </div>
                {isApp && (
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setToastsOpen(true)}
                        className="relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full transition-all bg-[var(--background-secondary)] backdrop-blur-md border border-[var(--border)] shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:border-[var(--accent)] hover:shadow-[0_0_15px_var(--accent-glow)] active:scale-95"
                    >
                        <Bell size={15} strokeWidth={2.5} className="text-[var(--foreground)] w-3.5 h-3.5 md:w-4 md:h-4" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 md:h-4 md:w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
                                <span className="relative flex items-center justify-center rounded-full h-3.5 w-3.5 md:h-4 md:w-4 bg-[var(--accent)] text-[8px] md:text-[9px] font-black text-white">
                                    {unreadCount}
                                </span>
                            </span>
                        )}
                    </motion.button>
                )}

                {isLanding && !user.isAuthenticated && (
                    <Link
                        href="/login"
                        className="px-6 py-2.5 rounded-2xl bg-[var(--foreground)] text-[var(--background)] text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-[0.85] transition-all shadow-xl"
                    >
                        Login
                    </Link>
                )}
                
                {user.isAuthenticated && (
                    <div className="relative" ref={menuRef}>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className={cn(
                                "w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all border border-[var(--border)] shadow-sm overflow-hidden active:scale-95",
                                isApp ? "bg-[var(--background-secondary)] backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:border-[var(--accent)] hover:shadow-[0_0_15px_var(--accent-glow)]" : "hover:border-[var(--accent)]"
                            )}
                        >
                            {user.avatar && user.avatar.length > 2 ? (
                                <img 
                                    src={user.avatar} 
                                    alt="User" 
                                    className="w-full h-full object-cover rounded-full"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = "none";
                                        target.src = "";
                                        const parent = target.parentElement;
                                        if (parent) {
                                            const fallback = document.createElement("span");
                                            fallback.className = "text-xl leading-none";
                                            fallback.textContent = "🎓";
                                            parent.appendChild(fallback);
                                        }
                                    }}
                                />
                            ) : (
                                <span className="text-base md:text-xl leading-none">🎓</span>
                            )}
                        </motion.button>

                        <AnimatePresence>
                            {showUserMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-4 w-60 rounded-[32px] p-3 bg-[var(--bg-3)] border border-[var(--border)] shadow-2xl z-[10001]"
                                >
                                    <div className="px-4 py-4 mb-2 border-b border-[var(--border)]">
                                        <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-widest mb-1">Scholar</p>
                                        <p className="text-sm font-black text-[var(--foreground)] truncate">{user.name || "Student"}</p>
                                    </div>

                                    {[
                                        { label: "Profile", icon: User, href: "/settings" },
                                        { label: "Billing", icon: CreditCard, href: "/settings" },
                                        { label: "Achievements", icon: Trophy, href: "/achievements" },
                                    ].map((item) => (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05] transition-all active:scale-95"
                                        >
                                            <item.icon size={16} />
                                            {item.label}
                                        </Link>
                                    ))}

                                    <button
                                        onClick={async () => {
                                            const supabase = createClient();
                                            await supabase.auth.signOut();
                                            router.push("/login");
                                            setShowUserMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
                                    >
                                        <LogOut size={16} />
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

