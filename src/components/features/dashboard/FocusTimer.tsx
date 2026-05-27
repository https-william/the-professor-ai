"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Clock, BookOpen, Coffee, Edit3, Brain, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTimerStore } from "@/store/useTimerStore";
import { getRandomQuote } from "@/lib/quotes";
import { useToasts } from "@/components/ui/GlobalToasts";
import { useUserStore } from "@/store/useUserStore";

export default function FocusTimer({ widget = false }: { widget?: boolean }) {
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
                setMode("shortBreak");
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
                        addToast("Distraction is the thief of retention. You've been away for a while.", "info");
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
        addToast("Archive Saved: Your study jotter has been updated.", "success");
        setShowSummary(false);
        setSummaryText("");
    };

    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const TOTAL_TIME = mode === "focus" ? 25 * 60 : mode === "shortBreak" ? 5 * 60 : 15 * 60;
    const progress = 1 - (timeLeft / TOTAL_TIME);

    if (widget) {
        return (
            <div 
                onClick={() => { if (typeof window !== "undefined" && window.innerWidth < 640) handleToggle(); }}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] shadow-sm shrink-0 max-w-full overflow-hidden cursor-pointer sm:cursor-default"
                title="Timer (Tap to toggle on mobile)"
            >
                <Clock size={14} className={isActive ? "text-[var(--blue)] animate-pulse shrink-0" : "text-[var(--foreground-muted)] shrink-0"} />
                <span className="font-mono text-xs font-black tabular-nums text-[var(--foreground)] shrink-0">
                    {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
                </span>
                
                {/* Mode Selectors — Persistent & Clear Toggle — Hidden on Mobile */}
                <div className="hidden sm:flex items-center gap-0.5 sm:gap-1 bg-[var(--background)] p-0.5 rounded-xl border border-[var(--border)] mx-0.5 sm:mx-1 shrink-0">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setMode("focus"); setQuote({ text: "", author: "" }); }}
                        className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${mode === "focus" ? "bg-[var(--blue)] text-white shadow-md shadow-blue-500/20 scale-[1.02]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"}`}
                        title="Study Session (25m)"
                    >
                        <Brain size={12} className="shrink-0" />
                        <span className="hidden sm:inline">Study</span>
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setMode(mode === "shortBreak" ? "longBreak" : "shortBreak"); setQuote({ text: "", author: "" }); }}
                        className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${mode !== "focus" ? "bg-amber-500 text-black shadow-md shadow-amber-500/20 scale-[1.02]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"}`}
                        title={mode === "longBreak" ? "Long Break (15m)" : "Short Break (5m)"}
                    >
                        <Coffee size={12} className="shrink-0" />
                        <span className="hidden sm:inline">{mode === "longBreak" ? "Break (15)" : "Break (5)"}</span>
                    </button>
                </div>

                <div className="hidden sm:flex items-center gap-0.5 sm:gap-1 border-l border-[var(--border)] pl-1 sm:pl-2 shrink-0">
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleToggle(); }}
                        className="w-6 sm:w-7 h-6 sm:h-7 rounded-xl flex items-center justify-center bg-[var(--background)] hover:bg-[var(--border)] text-[var(--foreground)] transition-colors shadow-sm"
                        title={isActive ? "Pause" : "Start"}
                    >
                        {isActive ? <Pause size={12} className="fill-current" /> : <Play size={12} className="fill-current ml-0.5" />}
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleReset(); }}
                        className="w-6 sm:w-7 h-6 sm:h-7 rounded-xl flex items-center justify-center bg-[var(--background)] hover:bg-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                        title="Reset"
                    >
                        <RotateCcw size={12} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-[32px] bg-[var(--bg-2)]/50 backdrop-blur-xl border border-[var(--border)] relative overflow-hidden group hover:border-[var(--blue)]/30 transition-all flex flex-col h-full shadow-lg">
            {/* Ambient background blur */}
            <div className={`absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl opacity-[0.15] transition-colors duration-1000 ${mode === "focus" ? "bg-[var(--blue)]" : "bg-[var(--cyan)]"}`} />
            
            <div className="flex items-center gap-2 mb-6 relative z-10">
                <Clock size={14} className={mode === "focus" ? "text-[var(--blue)]" : "text-[var(--cyan)]"} />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-black text-[var(--text-3)]">Midnight Scholar</span>
                {isActive && (
                    <span className={`ml-auto w-2 h-2 rounded-full animate-pulse ${mode === "focus" ? "bg-[var(--blue)] shadow-[0_0_8px_var(--blue)]" : "bg-[var(--cyan)] shadow-[0_0_8px_var(--cyan)]"}`} />
                )}
            </div>

            {/* Persistent Mode Toggle Bar */}
            <div className="flex items-center justify-center gap-1.5 p-1 rounded-2xl bg-[var(--background)] border border-[var(--border)] mb-6 relative z-10 shadow-inner">
                <button 
                    onClick={() => { setMode("focus"); setQuote({ text: "", author: "" }); }} 
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${mode === "focus" ? "bg-[var(--blue)] text-white shadow-lg shadow-blue-500/20 scale-[1.02]" : "text-[var(--text-3)] hover:text-[var(--text)]"}`}
                >
                    <Brain size={13} />
                    <span>Study (25m)</span>
                </button>
                <button 
                    onClick={() => { setMode("shortBreak"); setQuote({ text: "", author: "" }); }} 
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${mode === "shortBreak" ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-[1.02]" : "text-[var(--text-3)] hover:text-[var(--text)]"}`}
                >
                    <Coffee size={13} />
                    <span>Break (5m)</span>
                </button>
                <button 
                    onClick={() => { setMode("longBreak"); setQuote({ text: "", author: "" }); }} 
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${mode === "longBreak" ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20 scale-[1.02]" : "text-[var(--text-3)] hover:text-[var(--text)]"}`}
                >
                    <BookOpen size={13} />
                    <span>Rest (15m)</span>
                </button>
            </div>

            <div className="flex flex-col items-center justify-center py-2 flex-1 relative z-10">
                <div className="relative flex items-center justify-center w-40 h-40 mb-6">
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
                                filter: isActive ? ["drop-shadow(0 0 4px var(--blue-glow))", "drop-shadow(0 0 12px var(--blue-glow))", "drop-shadow(0 0 4px var(--blue-glow))"] : "none"
                            }}
                            transition={{ 
                                strokeDashoffset: { ease: "linear", duration: 1 },
                                filter: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                            }}
                        />
                        <defs>
                            <linearGradient id="accent-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="var(--blue)" />
                                <stop offset="100%" stopColor="var(--blue-border)" />
                            </linearGradient>
                            <linearGradient id="secondary-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="var(--cyan)" />
                                <stop offset="100%" stopColor="var(--cyan-border)" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-[var(--text)] tabular-nums tracking-tighter font-mono leading-none">
                            {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
                        </span>
                        <span className="text-[10px] font-black text-[var(--text-3)] uppercase tracking-widest mt-2">
                            {mode === "focus" ? "Deep Work" : mode === "shortBreak" ? "Short Rest" : "Long Rest"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleToggle} 
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all text-black ${
                            mode === "focus" ? "bg-[var(--blue)] hover:bg-[var(--blue-dim)] shadow-[0_0_25px_var(--blue-glow)]" : "bg-[var(--cyan)] hover:bg-[var(--cyan-dim)] shadow-[0_0_25px_var(--cyan-glow)]"
                        }`}
                    >
                        {isActive ? <Pause size={22} className="fill-current" /> : <Play size={22} className="fill-current ml-1" />}
                    </button>
                    <button 
                        onClick={handleReset} 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[var(--bg-2)] border border-[var(--border)] active:scale-95 transition-all text-[var(--text-3)] hover:text-[var(--text)] hover:border-[var(--text)]/30 shadow-sm"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>
            
            <div className="mt-6 min-h-[44px] flex items-center justify-center border-t border-[var(--border)] pt-4">
                <AnimatePresence mode="wait">
                    {isActive && mode === "focus" && quote.text ? (
                        <motion.div 
                            key="quote"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-center px-4"
                        >
                            <p className="text-[11px] font-bold text-[var(--text-2)] italic leading-relaxed">"{quote.text}"</p>
                            <p className="text-[8px] font-black uppercase tracking-widest text-[var(--text-3)] mt-1.5">— {quote.author}</p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="break-sugg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-center gap-4 font-mono text-[10px] uppercase tracking-widest text-[var(--text-3)] flex-wrap px-2 text-center items-center font-bold"
                        >
                            <span className="flex items-center gap-1.5 text-[var(--cyan)]"><Coffee size={12} /> Hydrate</span>
                            <span className="flex items-center gap-1.5 text-[var(--blue)]"><BookOpen size={12} /> Rest Eyes</span>
                            <span className="flex items-center gap-1.5 text-purple-400"><Sparkles size={12} /> Stretch</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Study Jotter Modal */}
            <AnimatePresence>
                {showSummary && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute inset-0 bg-[var(--bg)]/95 backdrop-blur-xl z-50 flex flex-col p-6 rounded-[32px] border border-[var(--border)] shadow-2xl"
                    >
                        <div className="flex items-center gap-2 mb-4 text-[var(--blue)]">
                            <Edit3 size={18} />
                            <h4 className="text-sm font-black uppercase tracking-widest">Study Jotter</h4>
                        </div>
                        <p className="text-xs text-[var(--text-2)] mb-4 font-bold leading-relaxed">What concept did you learn in the last 25 minutes?</p>
                        
                        <textarea 
                            value={summaryText}
                            onChange={(e) => setSummaryText(e.target.value)}
                            placeholder="I finally understood the mechanics of..."
                            className="w-full flex-1 bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl p-4 text-sm text-[var(--text)] resize-none focus:border-[var(--blue)]/50 focus:ring-1 focus:ring-[var(--blue)]/50 outline-none transition-all"
                        />
                        
                        <div className="flex gap-3 mt-6">
                            <button 
                                onClick={() => setShowSummary(false)}
                                className="flex-1 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest bg-[var(--bg-2)] border border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
                            >
                                Dismiss
                            </button>
                            <button 
                                onClick={saveSummary}
                                disabled={!summaryText.trim()}
                                className="flex-1 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest bg-[var(--blue)] text-black disabled:opacity-50 shadow-lg shadow-blue-500/20 transition-all hover:opacity-90"
                            >
                                Log Study
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

