"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import SpriteAnimator from "@/components/ui/SpriteAnimator";

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
            className={`relative flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden group active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[var(--blue)] transition-transform ${className}`}
            style={{
                background:    "var(--background-secondary)",
                backdropFilter: "blur(24px) saturate(2)",
                border:        "1px solid var(--border)",
                boxShadow:     "0 4px 10px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.1)",
            }}
            whileTap={{ scale: 0.96 }}
        >
            {/* Subtle tinted backdrop */}
            <div
                className="absolute inset-0 transition-opacity duration-300"
                style={{
                    background: theme === "dark"
                        ? "color-mix(in srgb, var(--blue) 7%, transparent)"
                        : "color-mix(in srgb, var(--blue) 14%, transparent)",
                }}
            />

            <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                    key={theme}
                    initial={{ opacity: 0, scale: mounted ? 0.8 : 1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "tween", duration: 0.15, ease: "easeOut" }}
                    className="relative flex items-center justify-center"
                    style={{
                        color: theme === "dark"
                            ? "var(--foreground-secondary)"
                            : "var(--blue)",
                    }}
                >
                    {theme === "dark"
                        ? <SpriteAnimator sheetUrl="/moon_spritesheet.jpg" frameWidth={5} frameHeight={16} totalFrames={6} durationMs={700} mixBlendMode="screen" className="shrink-0 scale-125" />
                        : <SpriteAnimator sheetUrl="/sun_spritesheet.jpg" frameWidth={5} frameHeight={16} totalFrames={6} durationMs={700} mixBlendMode="screen" className="shrink-0 scale-125" />}
                </motion.div>
            </AnimatePresence>
        </motion.button>
    );
}
