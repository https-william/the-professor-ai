"use client";

import { motion } from "framer-motion";

export function AmbientBackground() {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            {/* Base: Deep obsidian */}
            <div className="absolute inset-0 bg-[#050508]" />

            {/* Warm ambient glow - Top Left (subtle gold undertone) */}
            <motion.div
                animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.08, 0.12, 0.08],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px]"
                style={{ background: "radial-gradient(circle, rgba(196,163,90,0.15) 0%, transparent 70%)" }}
            />

            {/* Cool ambient glow - Bottom Right (subtle sapphire) */}
            <motion.div
                animate={{
                    scale: [1, 1.08, 1],
                    opacity: [0.06, 0.10, 0.06],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 3,
                }}
                className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px]"
                style={{ background: "radial-gradient(circle, rgba(42,67,101,0.2) 0%, transparent 70%)" }}
            />

            {/* Subtle vignette */}
            <div
                className="absolute inset-0"
                style={{
                    background: "radial-gradient(ellipse at center, transparent 0%, rgba(5,5,8,0.4) 100%)"
                }}
            />
        </div>
    );
}
