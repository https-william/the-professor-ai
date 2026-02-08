"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    MessageSquare,
    Swords,
    BookOpen,
    Settings,
    HelpCircle,
    ChevronRight,
    Menu,
    X
} from "lucide-react";

const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Professor", href: "/professor", icon: MessageSquare },
    { label: "Arena", href: "/arena", icon: Swords },
    { label: "Library", href: "/library", icon: BookOpen },
];

const bottomItems = [
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Help & Support", href: "/help", icon: HelpCircle },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Mobile Hamburger Trigger */}
            <button
                onClick={toggleSidebar}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#0F0F11] border border-[#1F1F23] text-white shadow-lg"
            >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Backdrop for mobile */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleSidebar}
                        className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />
                )}
            </AnimatePresence>

            <aside className={cn(
                "fixed left-0 top-0 h-screen w-[260px] bg-[#0F0F11] border-r border-[#1F1F23] flex flex-col z-40 transition-transform duration-300 ease-in-out lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo */}
                <div className="h-16 px-5 flex items-center border-b border-[#1F1F23]">
                    <Link href="/dashboard" className="flex items-center gap-3 group" onClick={() => setIsOpen(false)}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6366F1]/20 group-hover:shadow-[#6366F1]/30 transition-shadow">
                            <span className="text-white text-sm font-bold">P</span>
                        </div>
                        <div>
                            <span className="text-[15px] font-semibold text-white tracking-tight">The Professor</span>
                            <div className="text-[10px] text-[#71717A] uppercase tracking-wider">AI Study Assistant</div>
                        </div>
                    </Link>
                </div>

                {/* Main Nav */}
                <nav className="flex-1 px-3 py-5 overflow-y-auto">
                    <div className="text-[10px] font-semibold text-[#52525B] uppercase tracking-wider px-3 mb-3">
                        Main Menu
                    </div>
                    <div className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                                    <motion.div
                                        whileHover={{ x: 2 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all",
                                            isActive
                                                ? "bg-[#6366F1]/10 text-white"
                                                : "text-[#A1A1AA] hover:text-white hover:bg-[#16161A]"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={cn("w-[18px] h-[18px]", isActive && "text-[#6366F1]")} />
                                            {item.label}
                                        </div>
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeNav"
                                                className="w-1 h-4 bg-[#6366F1] rounded-full"
                                            />
                                        )}
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Bottom Nav */}
                <div className="px-3 py-4 border-t border-[#1F1F23]">
                    <div className="space-y-1">
                        {bottomItems.map((item) => (
                            <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                                <motion.div
                                    whileHover={{ x: 2 }}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-[#71717A] hover:text-white hover:bg-[#16161A] transition-colors"
                                >
                                    <item.icon className="w-[18px] h-[18px]" />
                                    {item.label}
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* User Profile */}
                <div className="px-3 py-4 border-t border-[#1F1F23]">
                    <motion.div
                        whileHover={{ backgroundColor: 'rgba(22, 22, 26, 0.8)' }}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors"
                    >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center ring-2 ring-[#1F1F23]">
                            <span className="text-xs font-semibold text-white">SC</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-white truncate">Scholar</div>
                            <div className="text-[11px] text-[#52525B]">Free Plan</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#52525B]" />
                    </motion.div>
                </div>
            </aside>
        </>
    );
}
