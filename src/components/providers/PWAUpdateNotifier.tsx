"use client";

import { useEffect } from "react";
import { usePWA } from "@/context/PWAContext";
import { RefreshCw, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PWAUpdateNotifier() {
    const { isUpdateAvailable } = usePWA();

    return (
        <AnimatePresence>
            {isUpdateAvailable && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-[100005] bg-[var(--foreground)] text-[var(--background)] px-6 py-3.5 shadow-2xl border-b border-white/10 flex items-center justify-between gap-4"
                >
                    <div className="flex items-center gap-3 mx-auto md:mx-0">
                        <div className="w-8 h-8 rounded-lg bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center shrink-0 shadow-md">
                            <Sparkles className="w-4 h-4 animate-spin" />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-black tracking-tight leading-tight">
                                A fresh batch of knowledge just dropped.
                            </p>
                            <p className="text-[10px] md:text-xs font-bold opacity-80 leading-tight">
                                Let&apos;s refresh the page before your notes get stale. My treat.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-[var(--background)] text-[var(--foreground)] hover-scale-lg active:scale-[0.95] transition-all rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-2"
                        >
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Update Now
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
