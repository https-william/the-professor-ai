"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    PlusCircle, 
    Library, 
    Swords, 
    Settings, 
    History,
    GraduationCap,
    Zap,
    TrendingUp,
    Download
} from "lucide-react";
import { usePWA } from "@/context/PWAContext";
import { useAppPlatform } from "@/hooks/useAppPlatform";
import { useUser } from "@/context/UserContext";
import BrandLogo from "@/components/ui/BrandLogo";
import AnimatedCounter from "@/components/ui/AnimatedCounter";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Create", href: "/create", icon: PlusCircle },
    { name: "Library", href: "/library", icon: Library },
    { name: "Arena", href: "/arena", icon: Swords },
    { name: "Activity", href: "/activity", icon: History },
];

export default function DesktopSidebar() {
    const pathname = usePathname();
    const { isDesktop } = useAppPlatform();
    const { user } = useUser();
    const { isInstallable, installApp } = usePWA();

    if (!isDesktop) return null;

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-20 hover:w-64 group bg-[var(--background)]/80 backdrop-blur-2xl border-r border-[var(--border)] z-50 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden shadow-[10px_0_40px_rgba(0,0,0,0.1)]">
            <div className="flex flex-col h-full py-8">
                {/* Logo Section */}
                <div className="px-5 mb-12 flex items-center gap-4">
                    <BrandLogo size="sm" className="shrink-0" />
                    <span className="font-sans font-black text-lg tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                        THE <span className="text-[var(--foreground)] font-black">PROFESSOR</span>
                    </span>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 relative group/item ${
                                    isActive 
                                    ? "bg-[var(--accent)]/10 text-[var(--accent)]" 
                                    : "text-[var(--foreground-muted)] hover:bg-[var(--foreground)]/[0.03] hover:text-[var(--foreground)]"
                                }`}
                            >
                                <div className={`shrink-0 w-6 h-6 flex items-center justify-center transition-transform duration-300 ${isActive ? "scale-110" : "group-hover/item:scale-110"}`}>
                                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                                </div>
                                <span className={`font-sans font-bold text-sm tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap ${isActive ? "text-[var(--foreground)]" : ""}`}>
                                    {item.name}
                                </span>
                                
                                {isActive && (
                                    <motion.div 
                                        layoutId="sidebar-active"
                                        className="absolute left-0 w-1 h-6 bg-[var(--accent)] rounded-r-full"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Profile/Footer Section */}
                <div className="px-4 mt-auto space-y-2">
                    <Link
                        href="/settings"
                        className="flex items-center gap-4 p-3 rounded-2xl text-[var(--foreground-muted)] hover:bg-[var(--foreground)]/[0.03] hover:text-[var(--foreground)] transition-all duration-300"
                    >
                        <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                            <Settings size={20} strokeWidth={1.5} />
                        </div>
                        <span className="font-sans font-bold text-sm tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                            Settings
                        </span>
                    </Link>
                    
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

                    <div className="p-3 rounded-2xl bg-[var(--foreground)]/[0.02] border border-[var(--border)]/50 group-hover:p-4 transition-all duration-300 overflow-hidden relative">
                        <div className="flex items-center gap-4">
                            <div className="w-6 h-6 shrink-0 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                                <Zap size={14} className="text-[var(--accent)]" />
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Credits</p>
                                <p className="text-xs font-bold text-[var(--foreground)]">
                                    <AnimatedCounter value={user?.credits ?? 0} /> Remaining
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
