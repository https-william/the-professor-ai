"use client";

import { motion } from "framer-motion";

export function AIOrb() {
    return (
        <div className="relative flex items-center justify-center w-64 h-64">
            {/* Core */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.8, 1, 0.8],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute w-32 h-32 bg-amber-500 rounded-full blur-3xl opacity-50"
            />

            {/* Inner Rings */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute w-48 h-48 border border-amber-400/20 rounded-full border-t-amber-400/60"
            />

            <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute w-40 h-40 border border-white/20 rounded-full border-b-white/60"
            />

            {/* Center Point */}
            <motion.div
                className="w-4 h-4 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)]"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            />
        </div>
    );
}
