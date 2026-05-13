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
import { useAppPlatform } from "@/hooks/useAppPlatform";
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
    const { isMobile } = useAppPlatform();

    if (!isMobile) return null;

    return (
        <div className="fixed bottom-6 left-4 right-4 h-18 bg-[var(--background-secondary)]/90 backdrop-blur-2xl border border-[var(--border)] z-[60] rounded-[2.5rem] flex items-center justify-around px-2 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
            {navItems.map((item) => {
                const isActive = item.href === "/dashboard" 
                    ? (pathname === "/dashboard" || pathname === "/") 
                    : pathname.startsWith(item.href);
                
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                            "relative flex flex-col items-center justify-center transition-all duration-500",
                            isActive ? "w-16 h-16 -mt-10" : "w-12 h-12"
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="active-fab-bg"
                                className="absolute inset-0 rounded-full bg-[var(--background)] border-4 border-[var(--background-secondary)] shadow-[0_10px_30px_var(--accent-glow)] z-0"
                                transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                            />
                        )}

                        <div className="relative z-10 flex flex-col items-center">
                            {isActive ? (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex flex-col items-center"
                                >
                                    <BrandLogo size="sm" className="mb-1" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--accent)] leading-none">
                                        {item.name}
                                    </span>
                                </motion.div>
                            ) : (
                                <div className="flex flex-col items-center gap-1 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                                    <item.icon size={18} strokeWidth={2} />
                                    <span className="text-[8px] font-black uppercase tracking-widest leading-none">
                                        {item.name}
                                    </span>
                                </div>
                            )}
                        </div>

                        {isActive && (
                            <motion.div 
                                layoutId="active-glow"
                                className="absolute -bottom-1 w-1 h-1 bg-[var(--accent)] rounded-full shadow-[0_0_10px_var(--accent-glow)]"
                            />
                        )}
                    </Link>
                );
            })}
        </div>
    );
}

// Helper for class names since it might not be imported in this file
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
