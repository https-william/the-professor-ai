"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    PlusCircle, 
    Library, 
    Swords
} from "lucide-react";
import { useAppPlatform } from "@/hooks/useAppPlatform";

const navItems = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Create", href: "/create", icon: PlusCircle, highlight: true },
    { name: "Arena", href: "/arena", icon: Swords },
    { name: "Library", href: "/library", icon: Library },
];

export default function MobileNavigation() {
    const pathname = usePathname();
    const { isMobile } = useAppPlatform();

    if (!isMobile) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-[var(--background)]/80 backdrop-blur-2xl border-t border-[var(--border)] z-[60] safe-area-bottom pb-safe flex items-center justify-around px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            {navItems.map((item) => {
                const isActive = item.href === "/dashboard" 
                    ? pathname === "/dashboard" 
                    : pathname.startsWith(item.href);
                
                if (item.highlight) {
                    return (
                        <Link 
                            key={item.name} 
                            href={item.href}
                            className="relative -top-6 flex flex-col items-center gap-1 group"
                        >
                            <div className="w-14 h-14 rounded-full bg-[var(--accent)] text-[var(--background)] flex items-center justify-center shadow-[0_8px_20px_var(--accent-glow)] active:scale-90 transition-transform">
                                <item.icon size={28} strokeWidth={2.5} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground)] mt-1">{item.name}</span>
                        </Link>
                    );
                }

                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
                            isActive ? "text-[var(--accent)] scale-110" : "text-[var(--foreground-muted)] active:scale-95"
                        }`}
                    >
                        <div className="relative">
                            <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                            {isActive && (
                                <motion.div 
                                    layoutId="mobilenav-active"
                                    className="absolute -bottom-1 left-1.5 right-1.5 h-0.5 bg-[var(--accent)] rounded-full"
                                />
                            )}
                        </div>
                        <span className={`text-[10px] font-bold tracking-tight ${isActive ? "text-[var(--foreground)]" : ""}`}>
                            {item.name}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}
