"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Bell, Wifi } from "lucide-react";
import { usePWA } from "@/context/PWAContext";

const PERKS = [
    { icon: Zap,  label: "Offline access, instant load" },
    { icon: Bell, label: "Smart study reminders"        },
    { icon: Wifi, label: "Works without internet"       },
];

export default function PWAInstallBanner() {
    const { isInstallable, installApp } = usePWA();
    const [dismissed, setDismissed] = useState(false);
    const [mounted,   setMounted]   = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted || !isInstallable || dismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                key="pwa-banner"
                initial={{ opacity: 0, y: 64, scale: 0.97 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{    opacity: 0, y: 64, scale: 0.97 }}
                transition={{ type: "tween", duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="fixed bottom-5 left-4 right-4 md:left-auto md:right-6 md:w-[340px] z-[90]"
            >
                <div
                    className="relative overflow-hidden rounded-2xl"
                    style={{
                        background: "var(--background-secondary)",
                        border: "1px solid var(--border)",
                        boxShadow: "0 20px 56px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
                    }}
                >
                    <div
                        className="absolute top-0 inset-x-0 h-[2px] pointer-events-none"
                        style={{ background: "linear-gradient(90deg,transparent,var(--accent) 40%,var(--accent-light) 60%,transparent)" }}
                    />
                    <div
                        className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
                        style={{ background: "var(--accent)", opacity: 0.1, filter: "blur(48px)" }}
                    />
                    <button
                        onClick={() => setDismissed(true)}
                        aria-label="Dismiss"
                        className="absolute top-3 right-3 z-20 w-6 h-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                        style={{ background: "color-mix(in srgb,var(--foreground) 8%,transparent)", border: "1px solid var(--border)" }}
                    >
                        <X size={11} strokeWidth={2.5} style={{ color: "var(--foreground-muted)" }} />
                    </button>

                    <div className="relative z-10 p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div
                                className="w-12 h-12 shrink-0 rounded-[13px] flex items-center justify-center"
                                style={{
                                    background: "var(--background)",
                                    border: "1px solid var(--border)",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                                    fontSize: "24px",
                                }}
                            >
                                🎓
                            </div>
                            <div className="flex-1 min-w-0 pr-5">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                                    <span className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--accent)" }}>
                                        Install App
                                    </span>
                                </div>
                                <p className="text-[14px] font-black leading-snug" style={{ color: "var(--foreground)" }}>
                                    Study smarter, anywhere.
                                </p>
                                <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                                    Add The Professor to your home screen
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 mb-4">
                            {PERKS.map(({ icon: Icon, label }) => (
                                <div key={label} className="flex items-center gap-2">
                                    <div
                                        className="w-5 h-5 shrink-0 rounded-md flex items-center justify-center"
                                        style={{ background: "color-mix(in srgb,var(--accent) 12%,transparent)" }}
                                    >
                                        <Icon size={11} strokeWidth={2.2} style={{ color: "var(--accent)" }} />
                                    </div>
                                    <span className="text-[11px] font-medium" style={{ color: "var(--foreground-secondary)" }}>
                                        {label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                transition={{ type: "tween", duration: 0.1 }}
                                onClick={installApp}
                                className="flex-1 py-2.5 rounded-xl text-[13px] font-black hover:brightness-110 active:brightness-95 transition-all"
                                style={{
                                    background: "var(--accent)",
                                    color: "#000",
                                    boxShadow: "0 4px 16px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.2)",
                                }}
                            >
                                Install Free
                            </motion.button>
                            <button
                                onClick={() => setDismissed(true)}
                                className="px-4 py-2.5 rounded-xl text-[13px] font-medium hover:brightness-110 transition-all"
                                style={{
                                    color: "var(--foreground-muted)",
                                    border: "1px solid var(--border)",
                                    background: "color-mix(in srgb,var(--foreground) 4%,transparent)",
                                }}
                            >
                                Later
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
