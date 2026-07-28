"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

interface ThemeToggleProps {
    className?: string;
    variant?: "default" | "minimal" | "floating";
}

export default function ThemeToggle({ className = "", variant = "default" }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();
    return <ThemeButton theme={theme} toggleTheme={toggleTheme} className={className} />;
}

function ThemeButton({ theme, toggleTheme, className = "" }: { theme: string; toggleTheme: () => void; className?: string }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return <div className={`w-9 h-9 rounded-xl ${className}`} />;
    }

    return (
        <motion.button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className={`relative flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden group active:scale-[0.95] focus-visible:ring-2 focus-visible:ring-[var(--amber)] transition-all ${className}`}
            style={{
                background:    "var(--background-secondary)",
                backdropFilter: "blur(24px) saturate(2)",
                border:        "1px solid var(--border)",
                boxShadow:     "0 4px 10px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.1)",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {/* Subtle tinted backdrop */}
            <div
                className="absolute inset-0 transition-opacity duration-300"
                style={{
                    background: theme === "dark"
                        ? "color-mix(in srgb, var(--amber) 8%, transparent)"
                        : "color-mix(in srgb, var(--amber) 16%, transparent)",
                }}
            />

            <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                    key={theme}
                    initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
                    transition={{ type: "spring", stiffness: 350, damping: 22 }}
                    className="relative flex items-center justify-center"
                >
                    {theme === "dark" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--amber)] shrink-0">
                            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="currentColor" fillOpacity="0.2" />
                        </svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--amber)] shrink-0">
                            <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.25" />
                            <path d="M12 2v2" />
                            <path d="M12 20v2" />
                            <path d="m4.93 4.93 1.41 1.41" />
                            <path d="m17.66 17.66 1.41 1.41" />
                            <path d="M2 12h2" />
                            <path d="M20 12h2" />
                            <path d="m6.34 17.66-1.41 1.41" />
                            <path d="m19.07 4.93-1.41 1.41" />
                        </svg>
                    )}
                </motion.div>
            </AnimatePresence>
        </motion.button>
    );
}
