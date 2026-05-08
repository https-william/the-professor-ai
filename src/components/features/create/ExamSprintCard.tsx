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
            className="group relative w-full p-6 rounded-[32px] overflow-hidden transition-all duration-500 hover:scale-[1.01] active:scale-[0.99] border border-white/10 shadow-2xl"
            style={{
                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))",
            }}
        >
            {/* Animated Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div className="w-16 h-16 rounded-[20px] bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-12 transition-transform duration-500">
                    <Zap size={32} strokeWidth={2.5} className="text-white fill-white" />
                </div>

                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row items-center gap-2 mb-1">
                        <h2 className="text-xl font-black tracking-tight text-white">Exam Sprint</h2>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                            <Sparkles size={10} className="text-blue-400" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">High Stakes</span>
                        </div>
                    </div>
                    <p className="text-[13px] text-blue-100/60 font-medium leading-relaxed max-w-sm">
                        I have an exam in 10 hours. Distill my notes into a survival kit: Key terms, predicted questions, and a 1-page summary.
                    </p>
                </div>

                <div className="px-6 py-3 rounded-2xl bg-white text-blue-600 font-black text-xs uppercase tracking-widest shadow-xl transition-all group-hover:bg-blue-50 group-hover:px-8">
                    Initialize
                </div>
            </div>
        </button>
    );
}
