"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

export const InteractiveQuiz = () => {
    const [selected, setSelected] = useState<number | null>(null);
    const [showBridge, setShowBridge] = useState(false);

    const options = [
        "A: Linear Velocity",
        "B: Angular Momentum",
        "C: Centripetal Acceleration",
        "D: Inertial Framing"
    ];

    const handleSelect = (idx: number) => {
        setSelected(idx);
        if (idx !== 1) { // Wrong answer triggers bridge
            setTimeout(() => setShowBridge(true), 600);
        }
    };

    return (
        <div className="relative w-full h-full p-8 flex flex-col cursor-default">
            {/* Question Area */}
            <div className="space-y-6 relative z-10">
                <div className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)]">
                    <h4 className="text-[13px] font-bold leading-relaxed text-[var(--foreground)]">
                        Why does a figure skater spin faster when they pull their arms in?
                    </h4>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                    {options.map((opt, i) => (
                        <button 
                            key={i}
                            onClick={() => handleSelect(i)}
                            className={cn(
                                "w-full p-4 text-left text-xs font-bold transition-all rounded-2xl relative overflow-hidden flex items-center gap-3",
                                selected === i 
                                    ? (i === 1 
                                        ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] scale-[1.02]" 
                                        : "bg-red-500/10 text-red-400 ring-1 ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)] scale-[1.02]")
                                    : "bg-transparent border border-white/5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5"
                            )}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>

            {/* Intuition Bridge Overlay */}
            <AnimatePresence>
                {showBridge && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-4 z-40 rounded-[2rem] bg-[var(--background)] border border-[var(--accent)]/40 p-6 md:p-8 shadow-[0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col"
                    >
                        <div className="absolute inset-0 backdrop-blur-3xl bg-[var(--background)]/80 z-0" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[var(--accent)]/5 rounded-full blur-[100px] animate-pulse z-0" />
                        
                        <div className="relative z-10 h-full flex flex-col">
                            <div className="flex items-center gap-2 mb-5">
                                <div className="p-1.5 rounded-lg bg-[var(--accent-bg)]">
                                    <Zap size={14} strokeWidth={1.5} className="text-[var(--accent)]" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">Adaptive Intuition Bridge</span>
                            </div>
                            
                            <h5 className="text-base font-black text-[var(--foreground)] mb-3 tracking-tight">Let&apos;s build the concept first...</h5>
                            <p className="text-[12px] text-[var(--foreground-secondary)] leading-relaxed mb-8">
                                Think of it like a garden hose. If you narrow the opening, the water must rush out <span className="text-[var(--accent)] font-bold">faster</span> to keep the same amount flowing.
                            </p>

                        </div>

                        <button 
                            onClick={() => { setShowBridge(false); setSelected(null); }}
                            className="btn-skeuo-primary mt-auto w-full py-3.5 text-[11px] font-black uppercase tracking-widest active:scale-[0.98] transition-all"
                        >
                            Try Analogy Route
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
