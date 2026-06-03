"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    MessageSquare, 
    Brain, 
    FolderLock,
    Settings
} from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";

export default function MobileNavigation() {
    const pathname = usePathname();

    const navItems = [
        { name: "Home", href: "/dashboard", icon: LayoutDashboard },
        { name: "Chat", href: "/chat", icon: MessageSquare },
        { name: "Cards", href: "/flashcards", icon: Brain },
        { name: "Vault", href: "/offline-vault", icon: FolderLock },
        { name: "Settings", href: "/settings", icon: Settings },
    ];

    return (
        <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 h-14 bg-[var(--background)]/90 backdrop-blur-[12px] border border-[var(--border-2)] z-[60] rounded-full flex items-center px-2 shadow-[0_12px_40px_rgba(0,0,0,0.25)] max-w-[min(420px,calc(100vw-2rem))] w-full justify-between transition-all duration-300 md:hidden">
            <AnimatePresence mode="popLayout">
                {navItems.map((item) => {
                    const isActive = item.href === "/dashboard" 
                        ? (pathname === "/dashboard" || pathname === "/") 
                        : pathname.startsWith(item.href);
                    
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="relative flex-1 h-10 flex flex-col items-center justify-center transition-all duration-300 z-10 group active:scale-95"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-slider-bg"
                                    className="absolute inset-1 rounded-full z-0 bg-[var(--foreground)] border border-transparent shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                />
                            )}

                            <div className="relative z-10 flex flex-col items-center gap-0.5">
                                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-[var(--background)]" : "text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-colors"} />
                                <span className={`text-[9px] font-mono tracking-wider uppercase ${isActive ? "text-[var(--background)] font-black" : "text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] font-bold transition-colors"}`}>
                                     {item.name}
                                 </span>
                            </div>
                        </Link>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
