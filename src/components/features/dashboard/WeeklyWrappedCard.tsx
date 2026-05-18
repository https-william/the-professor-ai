"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Trophy, Target, ChevronUp, ChevronDown } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";

export default function WeeklyWrappedCard() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { xp } = useUserStore();

    // Dynamically derive stats from XP so new users see 0 and active users see real progress
    const hoursStudied = xp > 0 ? (xp * 1.5 / 60).toFixed(1) : "0";
    const percentile = xp > 0 ? `Top ${Math.max(1, Math.min(50, Math.floor(50 - xp / 10)))}%` : "Getting Started";
    const flashcardsCount = xp > 0 ? Math.max(5, Math.floor(xp * 0.4)) : 0;
    const quizzesCount = xp > 0 ? Math.max(1, Math.floor(xp / 15)) : 0;
    const cardsWidth = xp > 0 ? `${Math.min(100, Math.max(25, (flashcardsCount / 50) * 100))}%` : "0%";
    const examsWidth = xp > 0 ? `${Math.min(100, Math.max(35, (quizzesCount / 10) * 100))}%` : "0%";

    return (
        <div className="p-5 rounded-2xl bg-[var(--bg-2)]/50 backdrop-blur-xl border border-[var(--border)] relative overflow-hidden group hover:border-[var(--blue)]/30 transition-all flex flex-col justify-between">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            
            <div className="flex items-center justify-between mb-6 relative z-10 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
                <div className="flex items-center gap-2">
                    <BarChart size={13} className="text-[var(--blue)]" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-[var(--text-3)]">Weekly Wrapped</span>
                </div>
                <button className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors">
                    {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
            </div>
 
            <AnimatePresence initial={false}>
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="relative z-10 flex-1 flex flex-col justify-center overflow-hidden"
                    >
                <h3 className="text-3xl font-black text-[var(--text)] tracking-tight mb-1 font-sans">{hoursStudied} <span className="text-base text-[var(--text-3)]">hrs</span></h3>
                <p className="text-xs font-black text-[var(--blue)] uppercase tracking-wider mb-5 flex items-center gap-1.5">
                    <Trophy size={12} />
                    {percentile}
                </p>
 
                <div className="space-y-3">
                    <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[var(--text-3)]">
                        <span>Flashcards</span>
                        <span className="text-[var(--text)] font-black">{flashcardsCount} cards</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--text)]/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: cardsWidth }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-[var(--blue)]" />
                    </div>
 
                    <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[var(--text-3)] mt-3">
                        <span>Quizzes</span>
                        <span className="text-[var(--text)] font-black">{quizzesCount} exams</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--text)]/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: examsWidth }} transition={{ duration: 1, delay: 0.4 }} className="h-full bg-[var(--cyan)]" />
                    </div>
                </div>
                    
                <Link href="/analytics" className="mt-5 relative z-10 w-full py-3 rounded-xl bg-[var(--bg-2)]/50 hover:bg-[var(--bg-2)] font-mono text-[9px] uppercase tracking-[0.3em] transition-colors border border-[var(--border)] text-[var(--text-3)] flex items-center justify-center gap-2">
                    <Target size={12} />
                    Full Analytics
                </Link>
            </motion.div>
            )}
        </AnimatePresence>
        </div>
    );
}
