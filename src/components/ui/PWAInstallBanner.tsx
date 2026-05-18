"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Download } from "lucide-react";
import { usePWA } from "@/context/PWAContext";
import BrandLogo from "@/components/ui/BrandLogo";
import { useAppPlatform } from "@/hooks/useAppPlatform";

export default function PWAInstallBanner() {
    const { isInstallable, installApp } = usePWA();
    const { isMobile } = useAppPlatform();
    const [dismissed, setDismissed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const snoozeUntil = localStorage.getItem("pwa-banner-snooze");
        if (snoozeUntil && Date.now() < parseInt(snoozeUntil)) {
            setDismissed(true);
        }
    }, []);

    const handleDismiss = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setDismissed(true);
        // Snooze for 24 hours
        localStorage.setItem("pwa-banner-snooze", (Date.now() + 24 * 60 * 60 * 1000).toString());
    };

    if (!mounted || !isInstallable || dismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                key="pwa-banner"
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="fixed bottom-6 right-6 z-[95] hidden md:block"
            >
                <div 
                    className="group relative w-[280px] p-4 rounded-[2rem] bg-[var(--background-secondary)]/90 backdrop-blur-2xl border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                    {/* Ambient Glow */}
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-[var(--accent)]/10 blur-3xl rounded-full transition-opacity duration-500 group-hover:opacity-100" />
                    
                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] flex items-center justify-center shadow-lg shadow-black/20">
                                    <BrandLogo size="sm" />
                                </div>
                                <div>
                                    <h4 className="text-[13px] font-bold text-[var(--foreground)] leading-tight">Your Study Cave</h4>
                                    <p className="text-[10px] text-[var(--foreground-muted)] font-medium">Your notes. Even offline. Just the good parts.</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleDismiss}
                                className="p-1 rounded-full text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5 transition-all"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-[10px] text-[var(--foreground-secondary)] font-medium">
                                <Sparkles size={12} className="text-[var(--accent)]" />
                                <span>Zero distractions. Instant launch.</span>
                            </div>
                        </div>

                        <button
                            onClick={installApp}
                            className="w-full py-2.5 px-4 rounded-2xl bg-[var(--foreground)] text-[var(--background)] text-[12px] font-black uppercase tracking-wider shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <Download size={14} />
                            {isMobile ? "Save to Home" : "Save for Offline"}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Mobile Version: Compact Pill */}
            {!dismissed && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed bottom-6 left-6 right-6 z-[95] md:hidden"
                >
                <div 
                    className="w-full p-3 rounded-full bg-[var(--foreground)] text-[var(--background)] shadow-[0_15px_40px_rgba(0,0,0,0.4)] flex items-center justify-between px-5 border border-white/10"
                >
                    <button
                        onClick={installApp}
                        className="flex items-center gap-3 flex-1"
                    >
                        <div className="w-7 h-7 rounded-full bg-[var(--background)] flex items-center justify-center p-1.5 shadow-sm">
                            <BrandLogo size="xs" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.05em]">Your Study Cave, Offline</span>
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                        className="p-2 rounded-full hover:bg-black/10 transition-colors ml-2"
                        aria-label="Dismiss"
                    >
                        <X size={16} className="opacity-60" />
                    </button>
                </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
