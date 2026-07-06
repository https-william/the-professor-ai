"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Sparkles, AlertCircle } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";
import { useUser } from "@/context/UserContext";
import DopamineWaitingRoom from "@/components/ui/DopamineWaitingRoom";

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
 * Replaces generic spinners with a beautiful terminal progress tracker.
 * Free tier users go through a visible queue stage before processing starts.
 */
export default function ProfessorCeremony({ className }: ProfessorCeremonyProps) {
    const { user } = useUser();
    
    // Fetch real queue position for Free plan. Plus & Unlimited bypass queue (queuePosition = 0)
    const isFreePlan = user?.planStatus === "free";
    const [queuePosition, setQueuePosition] = useState(isFreePlan ? 1 : 0);
    const [index, setIndex] = useState(0);
    const [secondsLeft, setSecondsLeft] = useState(15);

    // Poll the backend queue endpoint every 3 seconds for free plan users
    useEffect(() => {
        if (!isFreePlan) {
            setQueuePosition(0);
            return;
        }

        const checkQueue = () => {
            fetch("/api/generate/queue")
                .then((res) => res.json())
                .then((data) => {
                    if (data && typeof data.queuePosition === "number") {
                        // If queuePosition is 1, it means they are first in line and can start generating (position 0)
                        setQueuePosition(data.queuePosition > 1 ? data.queuePosition - 1 : 0);
                    }
                })
                .catch((err) => console.error("Queue check failed:", err));
        };

        checkQueue();
        const interval = setInterval(checkQueue, 3000);
        return () => clearInterval(interval);
    }, [isFreePlan]);

    // Decrement countdown every second
    useEffect(() => {
        if (queuePosition > 0) return;
        if (secondsLeft <= 0) return;
        const timer = setInterval(() => {
            setSecondsLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [secondsLeft, queuePosition]);

    // Advance generation steps after queue reaches 0
    useEffect(() => {
        if (queuePosition > 0) return;
        if (index >= STEPS.length - 1) return;

        const timer = setTimeout(() => {
            setIndex((prev) => prev + 1);
        }, 2200); // Progress through steps every 2.2 seconds

        return () => clearTimeout(timer);
    }, [index, queuePosition]);

    return (
        <div className={`flex flex-col items-center justify-center p-4 sm:p-6 w-full max-w-xl mx-auto text-center ${className}`}>
            
            {/* Dopamine Ramp: Live extraction pills and study fact previews */}
            <DopamineWaitingRoom mode="summary" title="Synthesizing study vault..." />

            {/* 15-Second Anticipation Countdown Bar */}
            {queuePosition === 0 && (
                <div className="w-full max-w-xl mx-auto mb-4 sm:mb-6 p-3 sm:p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between text-left font-mono">
                    <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-white/60">Anticipation Phase</span>
                        <p className="text-[10px] text-[var(--foreground-muted)]">Synthesizing study pack contents...</p>
                    </div>
                    <div className="text-right shrink-0">
                        <span className="text-2xl font-black text-white">{secondsLeft}s</span>
                    </div>
                </div>
            )}

            {/* Glassmorphic Terminal Card */}
            <div className="w-full bg-zinc-950/45 backdrop-blur-2xl border border-white/5 rounded-3xl p-4 sm:p-8 text-left shadow-[0_20px_50px_rgba(0,0,0,0.35)] relative overflow-hidden mb-4 sm:mb-6">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                
                {/* Terminal Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6 pb-2 sm:pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    </div>
                    <span className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)]">The Professor AI Study Prep v2.0</span>
                </div>

                <AnimatePresence mode="wait">
                    {queuePosition > 0 ? (
                        /* Queue State (Conversion Nudge) */
                        <motion.div
                            key="queue-screen"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                                <AlertCircle className="text-amber-500 w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-[11px] font-bold text-amber-500 uppercase tracking-widest">Free Generation Queue</h4>
                                    <p className="text-[10px] text-[var(--foreground-muted)] mt-1">Free tier generations are processed in sequence. Please stay on this tab.</p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center py-4 bg-black/20 rounded-2xl border border-white/5 text-center">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] mb-1">Your Position</span>
                                <h3 className="text-4xl font-black text-[var(--foreground)] tracking-tight animate-pulse">#{queuePosition}</h3>
                                <p className="text-[10px] text-white/40 mt-1 font-mono">Estimated wait: ~{queuePosition * 3} seconds</p>
                            </div>

                            {/* Skip the Line Banner (Hidden during payment freeze) */}
                            {false && (
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="text-left">
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-white/80 uppercase tracking-wider">
                                            <Sparkles size={11} /> Skip the Line
                                        </div>
                                        <p className="text-[10px] text-[var(--foreground-muted)] mt-0.5">Plus & Unlimited scholars bypass queues instantly.</p>
                                    </div>
                                    <button 
                                        onClick={() => window.location.href = "/settings/billing"}
                                        className="px-4 py-2 bg-white text-black hover:bg-white/80 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all shadow-md"
                                    >
                                        Upgrade ➔
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        /* Operations Checklist (Processing State) */
                        <motion.div
                            key="processing-screen"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-2 sm:space-y-3.5 font-mono text-[11px] sm:text-xs"
                        >
                            {STEPS.map((step, sIdx) => {
                                const isDone = sIdx < index;
                                const isActive = sIdx === index;
                                
                                return (
                                    <div 
                                        key={step.key}
                                        className={`flex items-center justify-between transition-all duration-300 ${
                                            isDone ? "text-white/80" : isActive ? "text-white font-bold" : "text-white/25"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isDone ? (
                                                <div className="w-4 h-4 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                                                    <Check size={10} className="text-white" />
                                                </div>
                                            ) : isActive ? (
                                                <div className="w-4 h-4 rounded-full bg-white/10 border border-white flex items-center justify-center animate-spin">
                                                    <Loader2 size={10} className="text-white" />
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Status text */}
            <p className="text-[9px] font-mono font-black text-white/20 uppercase tracking-[0.4em] mt-2">
                The Professor • Clear Thinking
            </p>
        </div>
    );

}
