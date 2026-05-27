"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";

const STEPS = [
    { label: "Opening study vault", key: "vault" },
    { label: "Parsing raw notes & documents", key: "parsing" },
    { label: "Extracting core concepts", key: "concepts" },
    { label: "Synthesizing deep summary", key: "summary" },
    { label: "Generating active recall cards", key: "flashcards" },
    { label: "Constructing diagnostic quiz", key: "quiz" },
    { label: "Finalizing custom study roadmap", key: "roadmap" }
];

interface ProfessorCeremonyProps {
    className?: string;
}

/**
 * ProfessorCeremony — The "Tactile Loading" experience.
 * Replaces generic spinners with a beautiful active compiler terminal and radar visualizer.
 */
export default function ProfessorCeremony({ className }: ProfessorCeremonyProps) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (index >= STEPS.length - 1) return;

        const timer = setTimeout(() => {
            setIndex((prev) => prev + 1);
        }, 2200); // Progress through steps every 2.2 seconds

        return () => clearTimeout(timer);
    }, [index]);

    return (
        <div className={`flex flex-col items-center justify-center p-4 sm:p-8 w-full max-w-xl mx-auto text-center ${className}`}>
            
            {/* Visualizer: Radar Ring + Glowing Brand Logo */}
            <div className="relative w-36 h-36 flex items-center justify-center mb-8">
                {/* Neumorphic Radar dial */}
                <div className="absolute inset-0 rounded-full border border-white/5 bg-[var(--background-secondary)]/50 backdrop-blur-md shadow-inner" />
                
                {/* Rotating accent compass ticks */}
                <motion.div 
                    className="absolute inset-2 rounded-full border border-dashed border-[var(--blue)]/20"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />

                {/* Sweeping laser line */}
                <motion.div 
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-[var(--blue)]/10 to-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    style={{ originX: 0.5, originY: 0.5 }}
                />

                {/* Logo wrapper */}
                <motion.div 
                    className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden z-10"
                    animate={{ 
                        boxShadow: [
                            "0 8px 32px rgba(0,0,0,0.4)",
                            "0 8px 40px rgba(59,130,246,0.15)",
                            "0 8px 32px rgba(0,0,0,0.4)"
                        ] 
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                >
                    <BrandLogo size="sm" />
                    <motion.div 
                        className="absolute inset-x-0 bottom-0 h-1 bg-[var(--blue)]"
                        animate={{ y: ["100%", "-200%"] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                </motion.div>
            </div>

            {/* Glassmorphic Terminal Card */}
            <div className="w-full bg-[var(--card)]/90 backdrop-blur-xl border border-[var(--border)] rounded-3xl p-6 sm:p-8 text-left shadow-[0_20px_50px_rgba(0,0,0,0.35)] relative overflow-hidden mb-6">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                
                {/* Terminal Header */}
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    </div>
                    <span className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Professor Synthesis Engine v2.0</span>
                </div>

                {/* Operations Checklist */}
                <div className="space-y-3.5 font-mono text-[11px] sm:text-xs">
                    {STEPS.map((step, sIdx) => {
                        const isDone = sIdx < index;
                        const isActive = sIdx === index;
                        
                        return (
                            <div 
                                key={step.key}
                                className={`flex items-center justify-between transition-all duration-300 ${
                                    isDone ? "text-white/80" : isActive ? "text-[var(--blue)] font-bold" : "text-white/20"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    {isDone ? (
                                        <div className="w-4 h-4 rounded-full bg-[var(--blue)]/10 border border-[var(--blue)]/30 flex items-center justify-center">
                                            <Check size={10} className="text-[var(--blue)]" />
                                        </div>
                                    ) : isActive ? (
                                        <div className="w-4 h-4 rounded-full bg-[var(--blue)]/20 border border-[var(--blue)] flex items-center justify-center animate-spin">
                                            <Loader2 size={10} className="text-[var(--blue)]" />
                                        </div>
                                    ) : (
                                        <div className="w-4 h-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center" />
                                    )}
                                    <span className={isActive ? "animate-pulse" : ""}>{step.label}</span>
                                </div>
                                <span className="font-bold text-[9px]">
                                    {isDone ? "[DONE]" : isActive ? "[RUNNING]" : "[PENDING]"}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Status text */}
            <p className="text-[9px] font-mono font-black text-white/25 uppercase tracking-[0.4em] mt-4">
                The Professor • Clear Thinking
            </p>
        </div>
    );
}
