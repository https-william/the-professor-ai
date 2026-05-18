"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
    LayoutDashboard, 
    Sparkles, 
    Library, 
    Globe,
    User
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
    { id: "dashboard", label: "Home", href: "/dashboard", icon: LayoutDashboard, color: "var(--emerald)" },
    { id: "create", label: "Create", href: "/create", icon: Sparkles, color: "var(--blue)" },
    { id: "library", label: "Library", href: "/library", icon: Library, color: "var(--violet)" },
    { id: "hub", label: "Hub", href: "/hub", icon: Globe, color: "var(--cyan)" },
    { id: "profile", label: "You", href: "/profile", icon: User, color: "var(--blue)" },
];

export default function BottomTabs() {
    const pathname = usePathname();

    // Hide BottomTabs on Landing page and completely immersive modes
    const isHiddenPath = pathname === "/" || 
                         pathname.startsWith("/arena/") ||
                         pathname.startsWith("/quiz/") || 
                         pathname.startsWith("/flashcards/") ||
                         pathname.startsWith("/auth") ||
                         pathname.startsWith("/login") ||
                         pathname.startsWith("/signup");

    if (isHiddenPath) return null;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-6 pt-2 pointer-events-none">
            <div 
                className={cn(
                    "mx-auto max-w-md w-full pointer-events-auto",
                    "bg-[var(--background-secondary)]/85 backdrop-blur-lg",
                    "border border-[var(--border)]",
                    "rounded-[2.5rem] shadow-2xl",
                    "flex items-center justify-around p-2",
                    "relative overflow-hidden"
                )}
                style={{
                    boxShadow: "0 20px 50px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)"
                }}
            >
                {/* Subtle Refraction Shine */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                {TABS.map((tab) => {
                    const isActive = pathname.startsWith(tab.href);
                    
                    return (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            className="relative flex flex-col items-center justify-center py-2 px-3 transition-all active:scale-90"
                        >
                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        layoutId="bottom-tab-active"
                                        className="absolute inset-0 rounded-2xl z-0"
                                        style={{
                                            backgroundColor: `color-mix(in srgb, ${tab.color} 15%, transparent)`,
                                            border: `1px solid color-mix(in srgb, ${tab.color} 30%, transparent)`
                                        }}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </AnimatePresence>

                            <tab.icon 
                                size={22} 
                                strokeWidth={isActive ? 2.5 : 2}
                                className={cn(
                                    "relative z-10 transition-colors duration-300",
                                    isActive ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]"
                                )}
                                style={{
                                    color: isActive ? tab.color : undefined,
                                    filter: isActive ? `drop-shadow(0 0 8px ${tab.color})` : "none"
                                }}
                            />
                            
                            <span 
                                className={cn(
                                    "text-[10px] font-bold mt-1 tracking-tight relative z-10 transition-opacity duration-300",
                                    isActive ? "opacity-100" : "opacity-0 h-0"
                                )}
                                style={{ color: isActive ? tab.color : undefined }}
                            >
                                {tab.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
            
            {/* iOS/Android Home Indicator Spacer */}
            <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
    );
}
