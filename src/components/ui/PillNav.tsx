"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PillNavProps {
    items: { id: string; label: string; icon?: any }[];
    activeId: string;
    onSelect: (id: string) => void;
    className?: string;
}

export const PillNav = ({ items, activeId, onSelect, className }: PillNavProps) => {
    return (
        <div className={cn("flex items-center gap-2 p-1 rounded-full bg-[var(--card)]/50 backdrop-blur-sm border border-[var(--border)]", className)}>
            {items.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className={cn(
                        "relative px-4 py-2 rounded-full text-sm font-medium transition-colors z-10",
                        activeId === item.id ? "text-white" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    )}
                >
                    {activeId === item.id && (
                        <motion.div
                            layoutId="pill-nav"
                            className="absolute inset-0 bg-[var(--accent)] rounded-full -z-10 shadow-lg shadow-[var(--accent)]/20"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <span className="flex items-center gap-2">
                        {item.icon && <item.icon size={18} strokeWidth={1.5} />}
                        {item.label}
                    </span>
                </button>
            ))}
        </div>
    );
};
