"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    Library, 
    Plus, 
    Swords, 
    UserCircle 
} from "lucide-react";
import { useIngestStore } from "@/store/useIngestStore";

export default function MobileNavigation() {
    const pathname = usePathname();
    const { openModal } = useIngestStore();

    const navItems = [
        { name: "Home", href: "/dashboard", icon: LayoutDashboard },
        { name: "Library", href: "/library", icon: Library },
        { name: "Create", href: "action:create", icon: Plus, isAction: true },
        { name: "Arena", href: "/arena", icon: Swords },
        { name: "Profile", href: "/profile", icon: UserCircle },
    ];

    return (
        <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 h-14 bg-[var(--background)]/90 backdrop-blur-[12px] border border-[var(--border-2)] z-[60] rounded-full flex items-center px-2 shadow-[0_12px_40px_rgba(0,0,0,0.25)] max-w-[min(420px,calc(100vw-2rem))] w-full justify-between transition-all duration-300 md:hidden">
            <AnimatePresence mode="popLayout">
                {navItems.map((item) => {
                    const isActive = !item.isAction && (item.href === "/dashboard" 
                        ? (pathname === "/dashboard" || pathname === "/") 
                        : pathname.startsWith(item.href));
                    
                    if (item.isAction) {
                        return (
                            <button
                                key={item.name}
                                onClick={openModal}
                                className="relative flex-1 h-11 flex flex-col items-center justify-center transition-all duration-300 z-10 active:scale-95 cursor-pointer border-0 bg-transparent"
                            >
                                <div className="relative z-10 flex flex-col items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--blue)] to-[var(--blue-light)] shadow-md shadow-[var(--blue-glow)]">
                                    <item.icon size={16} strokeWidth={3} className="text-white" />
                                </div>
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="relative flex-1 h-11 flex flex-col items-center justify-center transition-all duration-300 z-10 group active:scale-95 text-decoration-none"
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
