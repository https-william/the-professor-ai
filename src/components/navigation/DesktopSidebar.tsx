"use client";

import { useState, useRef, useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
    LayoutDashboard, 
    PlusCircle, 
    Library, 
    Settings, 
    History,
    GraduationCap,
    Zap,
    TrendingUp,
    Download,
    User,
    Users,
    LogOut,
    ChevronUp,
    Sun,
    Moon,
    Trophy,
    Swords
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { usePWA } from "@/context/PWAContext";
import { useAppPlatform } from "@/hooks/useAppPlatform";
import { useUser } from "@/context/UserContext";
import BrandLogo from "@/components/ui/BrandLogo";
import AnimatedCounter from "@/components/ui/AnimatedCounter";

const bottomItems = [
    { label: "Settings", href: "/settings", icon: Settings },
];

export default function DesktopSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { isDesktop } = useAppPlatform();
    const { user } = useUser();
    const { theme, resolvedTheme, toggleTheme } = useTheme();
    const { isInstallable, installApp } = usePWA();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        await supabase.auth.signOut();
        router.push('/login');
    };

    const HIDDEN_PATHS = ["/login", "/signup", "/forgot-password", "/onboarding", "/library/pack"];
    const isHidden = HIDDEN_PATHS.some(p => pathname.startsWith(p)) || pathname === "/";

    if (isHidden) return null;

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-14 lg:w-20 lg:hover:w-64 group bg-[var(--background)]/90 backdrop-blur-lg border-r border-[var(--border)] z-50 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden shadow-[10px_0_40px_rgba(0,0,0,0.1)] hidden lg:flex flex-col">
            <div className="flex flex-col h-full py-4 lg:py-8">
                {/* Logo Section */}
                <div className="px-2 md:px-5 mb-6 md:mb-8 flex justify-center">
                    <BrandLogo size="sm" />
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-3 space-y-2.5">
                    <Link
                        href="/dashboard"
                        className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 relative group/item border ${
                            pathname === "/dashboard"
                            ? "bg-[var(--foreground)] text-[var(--background)] border-transparent shadow-md"
                            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] bg-[var(--bg-3)]/20 hover:bg-[var(--foreground)]/[0.04] border-[var(--border)]"
                        }`}
                    >
                        <div className={`shrink-0 w-6 h-6 flex items-center justify-center transition-transform duration-300 ${pathname === "/dashboard" ? "scale-110" : "group-hover/item:scale-110"}`}>
                            <LayoutDashboard size={20} strokeWidth={pathname === "/dashboard" ? 2.5 : 2} />
                        </div>
                        <span className={`font-sans font-black text-sm tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap`}>
                            Study Lounge
                        </span>
                    </Link>

                    <Link
                        href="/review"
                        className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 relative group/item border ${
                            pathname === "/review"
                            ? "bg-[var(--foreground)] text-[var(--background)] border-transparent shadow-md"
                            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] bg-[var(--bg-3)]/20 hover:bg-[var(--foreground)]/[0.04] border-[var(--border)]"
                        }`}
                    >
                        <div className={`shrink-0 w-6 h-6 flex items-center justify-center transition-transform duration-300 ${pathname === "/review" ? "scale-110" : "group-hover/item:scale-110"}`}>
                            <History size={20} strokeWidth={pathname === "/review" ? 2.5 : 2} />
                        </div>
                        <span className={`font-sans font-black text-sm tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap`}>
                            Daily Recall
                        </span>
                    </Link>

                    <Link
                        href="/tools/ai-study-planner"
                        className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 relative group/item border ${
                            pathname === "/tools/ai-study-planner"
                            ? "bg-[var(--foreground)] text-[var(--background)] border-transparent shadow-md"
                            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] bg-[var(--bg-3)]/20 hover:bg-[var(--foreground)]/[0.04] border-[var(--border)]"
                        }`}
                    >
                        <div className={`shrink-0 w-6 h-6 flex items-center justify-center transition-transform duration-300 ${pathname === "/tools/ai-study-planner" ? "scale-110" : "group-hover/item:scale-110"}`}>
                            <Zap size={20} strokeWidth={pathname === "/tools/ai-study-planner" ? 2.5 : 2} />
                        </div>
                        <span className={`font-sans font-black text-sm tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap`}>
                            Study Lab
                        </span>
                    </Link>

                    <Link
                        href="/library"
                        className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 relative group/item border ${
                            pathname === "/library"
                            ? "bg-[var(--foreground)] text-[var(--background)] border-transparent shadow-md"
                            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] bg-[var(--bg-3)]/20 hover:bg-[var(--foreground)]/[0.04] border-[var(--border)]"
                        }`}
                    >
                        <div className={`shrink-0 w-6 h-6 flex items-center justify-center transition-transform duration-300 ${pathname === "/library" ? "scale-110" : "group-hover/item:scale-110"}`}>
                            <Library size={20} strokeWidth={pathname === "/library" ? 2.5 : 2} />
                        </div>
                        <span className={`font-sans font-black text-sm tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap`}>
                            My Library
                        </span>
                    </Link>

                    <Link
                        href="/arena"
                        className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 relative group/item border ${
                            pathname.startsWith("/arena")
                            ? "bg-[var(--foreground)] text-[var(--background)] border-transparent shadow-md"
                            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] bg-[var(--bg-3)]/20 hover:bg-[var(--foreground)]/[0.04] border-[var(--border)]"
                        }`}
                    >
                        <div className={`shrink-0 w-6 h-6 flex items-center justify-center transition-transform duration-300 ${pathname.startsWith("/arena") ? "scale-110" : "group-hover/item:scale-110"}`}>
                            <Swords size={20} strokeWidth={pathname.startsWith("/arena") ? 2.5 : 2} />
                        </div>
                        <span className={`font-sans font-black text-sm tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap`}>
                            Focus Lobbies
                        </span>
                    </Link>
                </nav>
                {/* Profile/Footer Section */}
                <div className="px-4 mt-auto space-y-2">

                    {isInstallable && (
                        <button
                            onClick={installApp}
                            className="w-full flex items-center gap-4 p-3 rounded-2xl text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all duration-300"
                        >
                            <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                                <Download size={20} strokeWidth={2} />
                            </div>
                            <span className="font-sans font-bold text-sm tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                                Install App
                            </span>
                        </button>
                    )}


                    {/* Profile Dropdown */}
                    <div className="relative pt-2" ref={menuRef}>
                        <AnimatePresence>
                            {showProfileMenu && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute bottom-full left-0 w-64 mb-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden z-50"
                                >
                                    <div className="p-4 border-b border-[var(--border)] bg-[var(--background)]/50">
                                        <p className="text-[13px] font-semibold text-[var(--foreground)] truncate">{user?.email}</p>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <Link href="/settings" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[var(--foreground-secondary)] hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)] transition-colors">
                                            <Settings size={16} />
                                            Settings & Preferences
                                        </Link>
                                        <Link href="/achievements" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-[var(--amber)] hover:bg-[var(--amber)]/10 transition-colors">
                                            <Trophy size={16} />
                                            Trophy Room & Achievements
                                        </Link>
                                        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-500 hover:bg-red-500/10 transition-colors">
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button 
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="w-full flex items-center gap-4 p-3 rounded-2xl border border-transparent hover:border-[var(--border)] hover:bg-[var(--foreground)]/[0.02] transition-all duration-300 group/profile"
                        >
                            <div className="w-6 h-6 shrink-0 rounded-full bg-gradient-to-tr from-[var(--blue)] to-[var(--blue-light)] flex items-center justify-center text-white font-bold text-[10px] uppercase">
                                {user?.email?.charAt(0) || <User size={14} />}
                            </div>
                            <div className="flex-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="font-sans font-bold text-sm tracking-tight text-[var(--foreground)] truncate max-w-[120px]">
                                    {user?.email?.split('@')[0] || "Profile"}
                                </span>
                                <ChevronUp size={16} className={`text-[var(--foreground-muted)] transition-transform duration-300 ${showProfileMenu ? "rotate-180" : ""}`} />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}
