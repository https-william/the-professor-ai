"use client";

import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const apps = [
    { id: "professor", icon: Bot, name: "Professor", path: "/professor" },
];

export function FloatingDock() {
    const [hovered, setHovered] = useState<string | null>(null);
    const pathname = usePathname();

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-2 px-4 py-3 bg-[#0c0c10]/90 backdrop-blur-xl border border-[#1f1f24] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                {apps.map((app) => {
                    const isActive = pathname === app.path;
                    const isHovered = hovered === app.id;

                    return (
                        <Link key={app.id} href={app.path}>
                            <motion.div
                                className="relative"
                                onMouseEnter={() => setHovered(app.id)}
                                onMouseLeave={() => setHovered(null)}
                            >
                                <motion.div
                                    className={cn(
                                        "w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200",
                                        isActive
                                            ? "bg-[#C4A35A] text-[#050508]"
                                            : "bg-[#1a1a1f] text-[#8a8680] hover:text-[#F5F0E8] hover:bg-[#252528]"
                                    )}
                                    animate={{
                                        scale: isHovered && !isActive ? 1.05 : 1,
                                    }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                >
                                    <app.icon className="w-5 h-5" />
                                </motion.div>

                                {/* Tooltip */}
                                {isHovered && (
                                    <motion.span
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        className="absolute -top-10 left-1/2 -translate-x-1/2 text-xs font-medium text-[#F5F0E8] bg-[#1a1a1f] border border-[#2a2a30] px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg"
                                    >
                                        {app.name}
                                    </motion.span>
                                )}

                                {/* Active indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeIndicator"
                                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C4A35A]"
                                    />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
