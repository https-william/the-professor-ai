"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    Search,
    Plus,
    User
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
    { id: "dashboard", label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { id: "library", label: "Search", href: "/library", icon: Search },
    { id: "create", label: "Create", href: "/create", icon: Plus, isFloating: true },
    { id: "profile", label: "You", href: "/profile", icon: User },
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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-zinc-950 border-t border-zinc-900 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] px-6 flex items-center justify-around">
            {TABS.map((tab) => {
                const isActive = pathname.startsWith(tab.href);
                const Icon = tab.icon;

                if (tab.isFloating) {
                    return (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            className="relative flex flex-col items-center justify-center -translate-y-4 transition-all"
                        >
                            <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform">
                                <Icon size={24} className="text-zinc-950 stroke-[3px]" />
                            </div>
                            <span 
                                className={cn(
                                    "text-[10px] mt-1 tracking-tight transition-all duration-300",
                                    isActive ? "font-semibold text-zinc-100" : "font-normal text-zinc-500"
                                )}
                            >
                                {tab.label}
                            </span>
                        </Link>
                    );
                }

                return (
                    <Link
                        key={tab.id}
                        href={tab.href}
                        className="flex flex-col items-center justify-center py-1 transition-all active:scale-95"
                    >
                        <Icon 
                            size={20} 
                            strokeWidth={isActive ? 2.5 : 2}
                            fill={isActive ? "currentColor" : "none"}
                            className={cn(
                                "transition-colors duration-300",
                                isActive ? "text-white" : "text-zinc-500"
                            )}
                        />
                        <span 
                            className={cn(
                                "text-[10px] mt-1 tracking-tight transition-colors duration-300",
                                isActive ? "font-semibold text-zinc-100" : "font-normal text-zinc-500"
                            )}
                        >
                            {tab.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
