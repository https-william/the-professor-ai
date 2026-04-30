"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Clock, BookOpen, Coffee, Edit3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTimerStore } from "@/store/useTimerStore";
import { getRandomQuote } from "@/lib/quotes";
import { useToasts } from "@/components/ui/GlobalToasts";
import { useUserStore } from "@/store/useUserStore";

export default function FocusTimer() {
    const { 
        timeLeft, 
        isActive, 
        mode, 
        startTimer, 
        pauseTimer, 
        resetTimer, 
        tickTimer, 
        setMode, 
        syncHydration 
    } = useTimerStore();

    const { addToast } = useToasts();
    const { updateUser, xp } = useUserStore();

    const [quote, setQuote] = useState({ text: "", author: "" });
    const [showSummary, setShowSummary] = useState(false);
    const [summaryText, setSummaryText] = useState("");
    const lastHiddenTime = useRef<number | null>(null);

    // Hydration sync & Interval
    useEffect(() => {
        syncHydration();
        let interval: any = null;
        
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                tickTimer();
            }, 1000);
        } else if (isActive && timeLeft <= 0) {
            // Timer Finished!
            pauseTimer();
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 500]); // Celebration vibration
            }
            
            if (mode === "focus") {
                // Award XP
                updateUser({ xp: xp + 15 });
                addToast("Focus Complete: +15 XP gained. The Professor is pleased.", "success");
                setShowSummary(true);
                setMode("break");
            } else {
                addToast("Break Over: Return to your scholarly duties.", "info");
                setMode("focus");
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode, tickTimer, pauseTimer, setMode, syncHydration, addToast, updateUser, xp]);

    // Anti-distraction Penalty
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                lastHiddenTime.current = Date.now();
            } else {
                if (isActive && mode === "focus" && lastHiddenTime.current) {
                    const hiddenDuration = Date.now() - lastHiddenTime.current;
                    if (hiddenDuration > 30000) { // 30 seconds
                        addToast("Distraction is the thief of mastery. You've been away for a while.", "info");
                        if (navigator.vibrate) navigator.vibrate(200);
                    }
                }
                lastHiddenTime.current = null;
                syncHydration(); // Sync time when coming back
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [isActive, mode, addToast, syncHydration]);

    // Fetch quote on start
    useEffect(() => {
        if (isActive && mode === "focus" && !quote.text) {
            setQuote(getRandomQuote());
        }
    }, [isActive, mode, quote]);

    const handleToggle = () => {
        if (isActive) {
            pauseTimer();
        } else {
            startTimer();
            if (navigator.vibrate) navigator.vibrate(50);
        }
    };

    const handleReset = () => {
        resetTimer();
        setQuote({ text: "", author: "" });
    };

    const saveSummary = () => {
        if (!summaryText.trim()) return;
        addToast("Archive Saved: Your strategic jotter has been updated.", "success");
        setShowSummary(false);
        setSummaryText("");
    };

    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const TOTAL_TIME = mode === "focus" ? 25 * 60 : 5 * 60;
    const progress = 1 - (timeLeft / TOTAL_TIME);

    return (
        <div className="p-5 rounded-[32px] bg-[var(--card)]/50 backdrop-blur-xl border border-[var(--card-border)] relative overflow-hidden group hover:border-[var(--accent)]/30 transition-all flex flex-col h-full">
            {/* Ambient background blur */}
            <div className={`absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl opacity-[0.15] transition-colors duration-1000 ${mode === "focus" ? "bg-[var(--accent)]" : "bg-[var(--secondary)]"}`} />
            
            <div className="flex items-center gap-2 mb-4 relative z-10">
                <Clock size={13} className={mode === "focus" ? "text-[var(--accent)]" : "text-[var(--secondary)]"} />
                <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-[var(--foreground-muted)]">Midnight Scholar</span>
                {isActive && (
                    <span className={`ml-auto w-1.5 h-1.5 rounded-full animate-pulse ${mode === "focus" ? "bg-[var(--accent)]" : "bg-[var(--secondary)]"}`} />
                )}
            </div>

            <div className="flex flex-col items-center justify-center py-4 flex-1 relative z-10">
                <div className="relative flex items-center justify-center w-36 h-36 mb-6">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {/* Background Track */}
                        <circle cx="50" cy="50" r="44" fill="transparent" stroke="var(--border)" strokeWidth="2" strokeDasharray="276" />
                        
                        {/* Liquid Breathing Progress */}
                        <motion.circle 
                            cx="50" cy="50" r="44" fill="transparent" 
                            stroke={mode === "focus" ? "url(#accent-gradient)" : "url(#secondary-gradient)"} 
                            strokeWidth="4" 
                            strokeLinecap="round"
                            strokeDasharray="276" 
                            initial={{ strokeDashoffset: 276 }}
                            animate={{ 
                                strokeDashoffset: 276 - (276 * progress),
                                filter: isActive ? ["drop-shadow(0 0 4px rgba(245,158,11,0.2))", "drop-shadow(0 0 12px rgba(245,158,11,0.6))", "drop-shadow(0 0 4px rgba(245,158,11,0.2))"] : "none"
                            }}
                            transition={{ 
                                strokeDashoffset: { ease: "linear", duration: 1 },
                                filter: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                            }}
                        />
                        <defs>
                            <linearGradient id="accent-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="var(--accent-light)" />
                                <stop offset="100%" stopColor="var(--accent-dark)" />
                            </linearGradient>
                            <linearGradient id="secondary-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="var(--secondary-light)" />
                                <stop offset="100%" stopColor="var(--secondary-dark)" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-[var(--foreground)] tabular-nums tracking-tighter font-mono leading-none">
                            {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
                        </span>
                        <span className="text-[9px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest mt-1">
                            {mode === "focus" ? "Deep Work" : "Rest Phase"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleToggle} 
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all text-black ${
                            mode === "focus" ? "bg-[var(--accent)] hover:bg-[var(--accent-light)] shadow-[0_0_20px_var(--accent-glow)]" : "bg-[var(--secondary)] hover:bg-[var(--secondary-light)] shadow-[0_0_20px_var(--secondary-bg)]"
                        }`}
                    >
                        {isActive ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-1" />}
                    </button>
                    <button 
                        onClick={handleReset} 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--background-secondary)] border border-[var(--border)] active:scale-95 transition-all text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/30"
                    >
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>
            
            <div className="mt-4 min-h-[40px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {isActive && mode === "focus" && quote.text ? (
                        <motion.div 
                            key="quote"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-center px-4"
                        >
                            <p className="text-[11px] font-medium text-[var(--foreground-secondary)] italic leading-relaxed">"{quote.text}"</p>
                            <p className="text-[8px] font-black uppercase tracking-widest text-[var(--foreground-muted)] mt-1.5">— {quote.author}</p>
                        </motion.div>
                    ) : mode === "break" ? (
                        <motion.div 
                            key="break-sugg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-center gap-3 font-mono text-[9px] uppercase tracking-widest text-[var(--secondary)] flex-wrap px-2 text-center"
                        >
                            <span className="flex items-center gap-1"><Coffee size={10} /> Hydrate</span>
                            <span className="flex items-center gap-1"><BookOpen size={10} /> Rest Eyes</span>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="controls"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-center gap-4 font-mono text-[9px] uppercase tracking-widest text-[var(--foreground-muted)]"
                        >
                            <button onClick={() => { setMode("focus"); setQuote({ text: "", author: "" }); }} className={(mode as string) === "focus" ? "text-[var(--accent)] font-bold" : "hover:text-[var(--foreground)]"}>Focus 25m</button>
                            <button onClick={() => { setMode("break"); setQuote({ text: "", author: "" }); }} className={(mode as string) === "break" ? "text-[var(--secondary)] font-bold" : "hover:text-[var(--foreground)]"}>Break 5m</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Strategic Jotter Modal */}
            <AnimatePresence>
                {showSummary && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute inset-0 bg-[var(--card)]/95 backdrop-blur-xl z-50 flex flex-col p-6 rounded-[32px] border border-[var(--border)]"
                    >
                        <div className="flex items-center gap-2 mb-4 text-[var(--accent)]">
                            <Edit3 size={16} />
                            <h4 className="text-sm font-black uppercase tracking-widest">Strategic Jotter</h4>
                        </div>
                        <p className="text-xs text-[var(--foreground-secondary)] mb-4">What concept did you master in the last 25 minutes?</p>
                        
                        <textarea 
                            value={summaryText}
                            onChange={(e) => setSummaryText(e.target.value)}
                            placeholder="I finally understood the mechanics of..."
                            className="w-full flex-1 bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl p-4 text-sm text-[var(--foreground)] resize-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/50 outline-none transition-all"
                        />
                        
                        <div className="flex gap-2 mt-4">
                            <button 
                                onClick={() => setShowSummary(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-xs bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                            >
                                Dismiss
                            </button>
                            <button 
                                onClick={saveSummary}
                                disabled={!summaryText.trim()}
                                className="flex-1 py-3 rounded-xl font-bold text-xs bg-[var(--accent)] text-black disabled:opacity-50"
                            >
                                Log Mastery
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
