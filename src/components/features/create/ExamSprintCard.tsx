"use client";

import React from "react";
import { Zap, Sparkles } from "lucide-react";

interface ExamSprintCardProps {
    onClick: () => void;
}

export default function ExamSprintCard({ onClick }: ExamSprintCardProps) {
    return (
        <button
            onClick={onClick}
            className="group relative w-full p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] overflow-hidden transition-all duration-700 hover-lift-lg active:scale-[0.98] border border-[var(--border)] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] bg-[var(--card)]/80 backdrop-blur-xl"
        >
            {/* Ambient Depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--blue-dim)]/5 to-transparent opacity-50" />
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-[var(--blue-glow)] opacity-[0.05] rounded-full blur-3xl group-hover-scale-lg transition-transform duration-1000" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 sm:gap-8 lg:gap-10 text-center lg:text-left">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl sm:rounded-[28px] lg:rounded-[32px] bg-gradient-to-br from-[var(--blue)] to-[var(--blue-dark)] flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(59,130,246,0.5)] group-hover-rotate-6 transition-transform duration-700 shrink-0">
                    <Zap className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white fill-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-3">
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--foreground)]">Exam Sprint</h2>
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--blue)]/10 border border-[var(--blue)]/20 text-[var(--blue)] shadow-sm">
                            <Sparkles size={14} className="fill-current" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em]">High Stakes</span>
                        </div>
                    </div>
                    <p className="text-sm sm:text-base text-[var(--foreground-muted)] font-bold leading-relaxed max-w-xl">
                        I have an exam coming up. Distill my notes into a study guide: Key terms, predicted questions, and a 1-page summary.
                    </p>
                </div>

                <div className="px-8 py-3.5 sm:px-12 sm:py-5 rounded-full bg-[var(--background)] border border-[var(--blue)]/20 text-[var(--blue)] font-black text-xs sm:text-sm uppercase tracking-[0.3em] shadow-[0_15px_30px_-10px_rgba(59,130,246,0.3)] transition-all group-hover:bg-[var(--blue)] group-hover:text-white group-hover-scale-sm active:scale-95 group-hover:shadow-[0_20px_40px_-10px_rgba(59,130,246,0.5)]">
                    I'm ready
                </div>
            </div>
        </button>
    );
}
