"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    PlusCircle, 
    Library, 
    Swords,
    User
} from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";

const navItems = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Create", href: "/create", icon: PlusCircle },
    { name: "Arena", href: "/arena", icon: Swords },
    { name: "Library", href: "/library", icon: Library },
    { name: "Profile", href: "/profile", icon: User },
];

export default function MobileNavigation() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 h-16 bg-[#0A0A0F]/90 backdrop-blur-3xl border border-white/10 z-[60] rounded-full flex items-center px-2 shadow-[0_20px_60px_rgba(0,0,0,0.6)] max-w-[min(420px,calc(100vw-2rem))] w-full justify-between">
            {navItems.map((item) => {
                const isActive = item.href === "/dashboard" 
                    ? (pathname === "/dashboard" || pathname === "/") 
                    : pathname.startsWith(item.href);
                
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="relative flex-1 h-12 flex flex-col items-center justify-center transition-all duration-300 z-10 group"
                    >
                        {isActive && (
                            <motion.div
                                layoutId="active-slider-bg"
                                className="absolute inset-1 rounded-full bg-[var(--blue)]/25 border border-[var(--blue)]/40 shadow-[0_0_20px_var(--blue-glow)] z-0"
                                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                            />
                        )}

                        <div className="relative z-10 flex flex-col items-center gap-0.5">
                            <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-[var(--blue)]" : "text-[var(--text-3)] group-hover:text-[var(--text)] transition-colors"} />
                            <span className={`text-[9px] font-mono tracking-wider uppercase ${isActive ? "text-[var(--text)] font-black" : "text-[var(--text-4)] group-hover:text-[var(--text-2)] font-bold transition-colors"}`}>
                                {item.name}
                            </span>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
