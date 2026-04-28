"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function FocusTimer() {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<"focus" | "break">("focus");

    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
        } else if (timeLeft === 0) {
            // Auto switch when hit 0
            setIsActive(false);
            if (mode === "focus") {
                setMode("break");
                setTimeLeft(5 * 60);
            } else {
                setMode("focus");
                setTimeLeft(25 * 60);
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode]);

    const toggle = () => setIsActive(!isActive);
    
    const reset = () => {
        setIsActive(false);
        setMode("focus");
        setTimeLeft(25 * 60);
    };

    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const progress = 1 - (timeLeft / (mode === "focus" ? 25 * 60 : 5 * 60));

    return (
        <div className="p-5 rounded-2xl bg-[var(--card)]/50 backdrop-blur-sm border border-[var(--border)] relative overflow-hidden group hover:border-[var(--accent)]/30 transition-all">
            {/* Ambient background blur */}
            <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 transition-colors duration-1000 ${mode === "focus" ? "bg-[var(--accent)]" : "bg-blue-400"}`} />
            
            <div className="flex items-center gap-2 mb-4">
                <Clock size={13} className={mode === "focus" ? "text-[var(--accent)]" : "text-blue-400"} />
                <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-[var(--foreground-muted)]">Pomodoro</span>
                {isActive && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
            </div>

            <div className="flex flex-col items-center justify-center py-2">
                <div className="relative flex items-center justify-center w-32 h-32 mb-4">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="44" fill="transparent" stroke="var(--border)" strokeWidth="2" strokeDasharray="276" />
                        <motion.circle 
                            cx="50" cy="50" r="44" fill="transparent" 
                            stroke={mode === "focus" ? "var(--accent)" : "rgb(96 165 250)"} 
                            strokeWidth="4" 
                            strokeLinecap="round"
                            strokeDasharray="276" 
                            initial={{ strokeDashoffset: 276 }}
                            animate={{ strokeDashoffset: 276 - (276 * progress) }}
                            transition={{ ease: "linear", duration: 1 }}
                        />
                    </svg>
                    <span className="absolute text-2xl font-black text-[var(--foreground)] tabular-nums tracking-tighter font-mono">
                        {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={toggle} 
                        className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--background-secondary)] border border-[var(--border)] active:scale-95 transition-all text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-black hover:border-transparent"
                    >
                        {isActive ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current ml-0.5" />}
                    </button>
                    <button 
                        onClick={reset} 
                        className="w-10 h-10 rounded-xl flex items-center justify-center bg-transparent border border-[var(--border)] active:scale-95 transition-all text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            </div>
            
            <div className="mt-3 flex justify-center gap-3 font-mono text-[9px] uppercase tracking-widest text-[var(--foreground-muted)]">
                <button onClick={() => { setMode("focus"); setTimeLeft(25*60); setIsActive(false); }} className={mode === "focus" ? "text-[var(--foreground)]" : "hover:text-[var(--foreground)]"}>Focus 25m</button>
                <button onClick={() => { setMode("break"); setTimeLeft(5*60); setIsActive(false); }} className={mode === "break" ? "text-[var(--foreground)]" : "hover:text-[var(--foreground)]"}>Break 5m</button>
            </div>
        </div>
    );
}
