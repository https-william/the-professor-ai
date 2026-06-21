"use client";
import MagneticButton from "@/components/ui/MagneticButton";
import AnimatedCounter from "@/components/ui/AnimatedCounter";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { isAdmin } from "@/lib/admin";
import { motion, AnimatePresence } from "framer-motion";
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
    Trophy,
    PlusCircle,
    Sword,
    Swords
} from "lucide-react";
import { useTimerStore } from "@/store/useTimerStore";
import { useAppPlatform } from "@/hooks/useAppPlatform";

const HIDDEN_PATHS = [
    "/arena/play",
    "/library/pack",
    "/summary",
    "/flashcards",
    "/quiz",
    "/roadmap",
    "/breakdown",
    "/eli5",
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
    { id: "ARENA",    label: "Arena",     href: "/arena",     color: "var(--cyan)",    glow: "var(--cyan-glow)",    icon: Swords },
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

    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const container = document.getElementById("main-scroll-container");
        const target = (container && container.scrollHeight > window.innerHeight && window.getComputedStyle(container).overflowY === 'auto') ? container : window;
        
        const updateScroll = () => {
            const top = target === window ? window.scrollY : (container ? container.scrollTop : 0);
            setScrolled(top > 40);
        };

        target.addEventListener("scroll", updateScroll, { passive: true });
        updateScroll();
        
        return () => target.removeEventListener("scroll", updateScroll);
    }, []);

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

    const isPill = scrolled;

    const unreadCount = toasts.filter(t => !t.read).length;

    const currentMode: string = activeMode ?? (() => {
        if (pathname.startsWith("/arena"))    return "ARENA";
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
        <header
            suppressHydrationWarning
            style={{
                top: isApp ? "12px" : "16px",
                left: "50%",
                transform: "translateX(-50%)",
                width: isApp ? "calc(100% - 2rem)" : (isMobile ? "calc(100vw - 2rem)" : "94%"),
                maxWidth: isApp ? "1200px" : "840px",
                padding: isApp ? "8px 16px" : (isMobile ? "10px 16px" : "12px 24px"),
                borderRadius: isApp ? "24px" : "9999px",
                backgroundColor: scrolled 
                    ? (resolvedTheme === "dark" ? "rgba(9, 9, 11, 0.70)" : "rgba(255, 255, 255, 0.75)")
                    : (resolvedTheme === "dark" ? "rgba(9, 9, 11, 0.40)" : "rgba(255, 255, 255, 0.45)"),
                backdropFilter: "blur(20px) saturate(160%)",
                border: resolvedTheme === "dark"
                    ? "1px solid rgba(255, 255, 255, 0.08)"
                    : "1px solid rgba(15, 23, 42, 0.08)",
                boxShadow: scrolled 
                    ? (resolvedTheme === "dark" 
                        ? "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08)" 
                        : "0 10px 40px rgba(0,0,0,0.06), inset 0 1px 1px rgba(255,255,255,0.5)") 
                    : (resolvedTheme === "dark"
                        ? "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.05)"
                        : "0 8px 32px rgba(15, 23, 42, 0.03), inset 0 1px 1px rgba(255,255,255,0.4)"),
            }}
            className={cn(
                "fixed z-[10000] items-center pointer-events-none [&>div]:pointer-events-auto transition-all duration-300 ease-in-out",
                isApp ? "flex items-center justify-between gap-4 w-full" : "grid grid-cols-[auto_1fr_auto] gap-1.5 md:gap-4"
            )}
        >
            <div className="flex items-center gap-3">
                <Link
                    href={user.isAuthenticated ? "/dashboard" : "/"}
                    className={cn(
                    "group relative flex items-center gap-2.5 p-1.5 md:pr-4 rounded-full transition-all active:scale-95",
                    isApp ? "bg-zinc-950/45 backdrop-blur-2xl border border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:border-white/20" : "hover:bg-white/[0.08]"
                )}
            >
                <div
                    className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all bg-zinc-900 border border-white/5 shadow-sm group-hover:border-white/20"
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
                                className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all hover-scale-xl active:scale-[0.90]"
                            >
                                Blog
                            </Link>
                            
                            <div className="relative" ref={resourcesRef}>
                                <button
                                    onClick={() => setShowResourcesMenu(!showResourcesMenu)}
                                    className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all flex items-center gap-2 hover-scale-xl active:scale-[0.85]"
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
                                                        <span className="text-sm font-black text-[var(--foreground)] tracking-tight">{item.label}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    ) : isApp ? (
                        <div className="hidden md:flex items-center gap-1 p-1 bg-zinc-950/45 backdrop-blur-2xl border border-white/5 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                            {[
                                { name: "Home", href: "/dashboard", icon: LayoutDashboard },
                                { name: "Create", href: "/create", icon: PlusCircle },
                                { name: "Library", href: "/library", icon: Library },
                                { name: "Arena", href: "/arena", icon: Swords },
                                { name: "Profile", href: "/profile", icon: User },
                            ].map((item) => {
                                const isActive = item.href === "/dashboard"
                                    ? (pathname === "/dashboard" || pathname === "/")
                                    : (item.href === "/arena" ? pathname.startsWith("/arena") : pathname.startsWith(item.href));
                                
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "relative px-4 py-2 rounded-full text-xs font-bold tracking-tight transition-all duration-300 flex items-center gap-1.5 active:scale-95 group",
                                            isActive ? "text-[var(--background)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="header-active-bg"
                                                className="absolute inset-0 bg-[var(--foreground)] rounded-full z-0 shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                                                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                                            />
                                        )}
                                        <span className="relative z-10 flex items-center gap-1.5">
                                            <item.icon size={13} strokeWidth={isActive ? 2.5 : 2} className="transition-transform duration-300 group-hover:scale-110" />
                                            <span>{item.name}</span>
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : null}
                </AnimatePresence>
            </div>

            {/* ── RIGHT: Actions ── */}
            <div className="flex items-center justify-end gap-1.5 md:gap-2.5">
                {user.isAuthenticated && user.planStatus === 'free' && (
                    <Link 
                        href="/settings/billing"
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent)]/10 hover:bg-[var(--accent)] hover:text-black text-[var(--accent)] font-sans font-black text-[9px] uppercase tracking-wider transition-all border border-[var(--accent)]/25 active:scale-95 shadow-sm"
                    >
                        <Sparkles size={10} /> Upgrade
                    </Link>
                )}
                {user.isAuthenticated && (
                    <>
                        {/* XP Reserves */}
                        <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-sm transition-all",
                            isApp ? "bg-zinc-950/45 backdrop-blur-2xl border border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:border-white/20" : "bg-zinc-950/45 border border-white/5"
                        )} title="Study XP Reserves">
                            <Trophy size={14} className="text-[#F59E0B] w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="font-mono text-[11px] md:text-xs font-bold text-[var(--foreground)] tabular-nums">
                                {user.xp?.toLocaleString() ?? "0"} XP
                            </span>
                        </div>

                        {/* AI Credits */}
                        <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-sm transition-all",
                            isApp ? "bg-zinc-950/45 backdrop-blur-2xl border border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:border-white/20" : "bg-zinc-950/45 border border-white/5"
                        )} title="Available AI Credits">
                            <Zap size={14} className="text-[var(--amber)] animate-pulse w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="font-mono text-[11px] md:text-xs font-bold text-[var(--foreground)] tabular-nums">
                                {user.credits ?? 100} Credits
                            </span>
                        </div>
                    </>
                )}
                <div className="hidden sm:block">
                    <ThemeToggle />
                </div>
                {isApp && (
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setToastsOpen(true)}
                        className="relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full transition-all bg-zinc-950/45 backdrop-blur-2xl border border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:border-white/20 active:scale-95"
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
                        className="px-6 py-2.5 rounded-2xl bg-[var(--foreground)] text-[var(--background)] text-[11px] font-black uppercase tracking-widest hover-scale-lg active:scale-[0.85] transition-all shadow-xl"
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
                                "w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all border border-white/5 shadow-sm overflow-hidden active:scale-95",
                                isApp ? "bg-zinc-950/45 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:border-white/20" : "hover:border-white/20"
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
                                    className="absolute right-0 mt-4 w-60 rounded-[32px] p-3 bg-zinc-950/90 border border-white/5 backdrop-blur-2xl shadow-2xl z-[10001]"
                                >
                                    <div className="px-4 py-4 mb-2 border-b border-[var(--border)]">
                                        <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-widest mb-1">Scholar</p>
                                        <p className="text-sm font-black text-[var(--foreground)] truncate">{user.name || "Student"}</p>
                                    </div>

                                    {(() => {
                                        const menuItems = [
                                            { label: "Profile", icon: User, href: "/settings" },
                                            { label: "Billing", icon: CreditCard, href: "/settings/billing" },
                                            { label: "Achievements", icon: Trophy, href: "/achievements" },
                                        ];

                                        if (isAdmin(user.email, user.role)) {
                                            menuItems.push({ label: "Admin Atrium", icon: Users, href: "/admin" });
                                        }

                                        return menuItems.map((item) => (
                                            <Link
                                                key={item.label}
                                                href={item.href}
                                                onClick={() => setShowUserMenu(false)}
                                                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05] transition-all active:scale-95"
                                            >
                                                <item.icon size={16} />
                                                {item.label}
                                            </Link>
                                        ));
                                    })()}

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
        </header>
    );
}

