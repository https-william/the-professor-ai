"use client";

import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
    className?: string;
    variant?: "default" | "minimal" | "floating";
}

export default function ThemeToggle({ className = "", variant = "default" }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();

    if (variant === "floating") {
        return (
            <div className={`fixed top-6 right-4 z-[10002] ${className}`}>
                <ThemeButton theme={theme} toggleTheme={toggleTheme} />
            </div>
        );
    }

    return (
        <div className={className}>
            <ThemeButton theme={theme} toggleTheme={toggleTheme} />
        </div>
    );
}

function ThemeButton({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
    return (
        <button
            onClick={toggleTheme}
            className="relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-95 shadow-lg overflow-hidden group"
            style={{
                background: "var(--background-secondary)",
                backdropFilter: "blur(24px) saturate(2)",
                border: "1px solid var(--border)",
            }}
        >
            {/* Animated background fill */}
            <div 
                className="absolute inset-0 transition-opacity duration-500"
                style={{
                    background: theme === 'dark' 
                        ? "rgba(245,158,11,0.15)" 
                        : "rgba(245,158,11,0.25)",
                    opacity: 1,
                }}
            />
            
            <AnimatePresence mode="wait">
                <motion.div 
                    key={theme}
                    initial={{ y: 20, rotate: -90, opacity: 0 }}
                    animate={{ y: 0, rotate: 0, opacity: 1 }}
                    exit={{ y: -20, rotate: 90, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="relative flex items-center justify-center"
                    style={{
                        color: theme === 'dark' 
                            ? "var(--foreground-muted)" 
                            : "var(--accent)"
                    }}
                >
                    {theme === 'dark' ? <Moon size={20} strokeWidth={1.5} /> : <Sun size={20} strokeWidth={1.5} />}
                </motion.div>
            </AnimatePresence>
        </button>
    );
}
