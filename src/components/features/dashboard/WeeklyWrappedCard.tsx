"use client";

import Link from "next/link";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Trophy, Target, ChevronUp, ChevronDown } from "lucide-react";

export default function WeeklyWrappedCard() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    return (
        <div className="p-5 rounded-2xl bg-[var(--card)]/50 backdrop-blur-sm border border-[var(--border)] relative overflow-hidden group hover:border-[var(--accent)]/30 transition-all flex flex-col justify-between">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            
            <div className="flex items-center justify-between mb-6 relative z-10 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
                <div className="flex items-center gap-2">
                    <BarChart size={13} className="text-[var(--accent)]" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-[var(--foreground-muted)]">Weekly Wrapped</span>
                </div>
                <button className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
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
                <h3 className="text-3xl font-black text-[var(--foreground)] tracking-tight mb-1 font-heading">3.4 <span className="text-base text-[var(--foreground-muted)]">hrs</span></h3>
                <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-5 flex items-center gap-1.5">
                    <Trophy size={12} />
                    Top 15%
                </p>

                <div className="space-y-3">
                    <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[var(--foreground-muted)]">
                        <span>Flashcards</span>
                        <span className="text-[var(--foreground)]">64 cards</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--foreground)]/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: "70%" }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-[var(--accent)]" />
                    </div>

                    <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[var(--foreground-muted)] mt-3">
                        <span>Quizzes</span>
                        <span className="text-[var(--foreground)]">2 exams</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--foreground)]/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: "40%" }} transition={{ duration: 1, delay: 0.4 }} className="h-full bg-[var(--foreground)]/40" />
                    </div>
                </div>
                    
                <Link href="/analytics" className="mt-5 relative z-10 w-full py-3 rounded-xl bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 font-mono text-[9px] uppercase tracking-[0.3em] transition-colors border border-[var(--border)] text-[var(--foreground-muted)] flex items-center justify-center gap-2">
                    <Target size={12} />
                    Full Analytics
                </Link>
            </motion.div>
            )}
        </AnimatePresence>
        </div>
    );
}
