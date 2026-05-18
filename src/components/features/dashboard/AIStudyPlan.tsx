"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, ChevronUp, ChevronDown, Zap } from "lucide-react";
import Markdown from "@/components/ui/Markdown";
import Link from "next/link";

interface AIStudyPlanProps {
    studyPlan: string | null;
    planLoading: boolean;
}

export default function AIStudyPlan({ studyPlan, planLoading }: AIStudyPlanProps) {
    const [expanded, setExpanded] = useState(false);
 
    if (planLoading) {
        return (
            <div className="w-full p-12 flex flex-col items-center justify-center min-h-[250px] bg-[var(--bg-2)]/50 backdrop-blur-xl border border-[var(--border)] rounded-[40px] transition-all">
                <div className="relative">
                    <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        className="w-16 h-16 rounded-full border-2 border-dashed border-[var(--blue)]/30"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Brain size={24} className="text-[var(--blue)] animate-pulse" />
                    </div>
                </div>
                <p className="mt-8 text-xs font-black text-[var(--text-2)] uppercase tracking-widest animate-pulse font-sans">Brewing your custom study matrix...</p>
                <p className="mt-2 text-[10px] text-[var(--text-3)] text-center max-w-xs">The Professor is analyzing your onboarding goals to craft the perfect strategy.</p>
            </div>
        );
    }
 
    if (!studyPlan) {
        return (
            <div className="w-full p-10 flex flex-col items-center justify-center min-h-[200px] bg-[var(--bg-2)]/50 backdrop-blur-xl border border-[var(--border)] rounded-[40px] transition-all text-center">
                <Brain size={32} className="text-[var(--text-3)] mb-4" />
                <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider mb-1">AI Study Strategist</h3>
                <p className="text-xs text-[var(--text-3)] max-w-md mb-6">Its real job is to analyze your education level and study goals to build an actionable, personalized roadmap. Configure your Groq API key to unlock this feature.</p>
                <Link href="/settings" className="px-4 py-2 rounded-xl bg-[var(--blue)] text-black font-black text-[10px] uppercase tracking-wider hover:opacity-90 transition-opacity">Configure Groq API Key</Link>
            </div>
        );
    }
 
    return (
        <div className="w-full p-10 relative overflow-hidden bg-[var(--bg-2)]/50 backdrop-blur-xl border border-[var(--border)] rounded-[40px] transition-all group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--blue)]/5 rounded-full blur-[80px] pointer-events-none translate-x-1/3 -translate-y-1/3 group-hover:bg-[var(--blue)]/10 transition-colors" />
 
            <div className="relative z-10">
                <div
                    className={`max-w-none text-[15px] leading-relaxed overflow-hidden transition-all duration-700 ease-out font-sans ${
                        expanded ? "max-h-[2000px]" : "max-h-[320px]"
                    }`}
                >
                    <div className="dashboard-markdown prose-neutral prose-invert md:prose-lg max-w-none">
                        <Markdown>{studyPlan}</Markdown>
                    </div>
                </div>
 
                {/* Fade overlay when collapsed */}
                {!expanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/90 to-transparent pointer-events-none" />
                )}
 
                <div className="mt-8 flex items-center justify-between relative z-10">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-2 text-[10px] font-black text-[var(--blue)] hover:text-[var(--text)] transition-colors font-sans uppercase tracking-[0.2em]"
                    >
                        <div className="w-6 h-6 rounded-lg bg-[var(--blue-dim)] flex items-center justify-center">
                            {expanded ? <ChevronUp size={14} strokeWidth={2.5} /> : <ChevronDown size={14} strokeWidth={2.5} />}
                        </div>
                        {expanded ? "Collapse Syllabus" : "Analyze Full Roadmap"}
                    </button>
                    
                    <Link href="/create" className="flex items-center gap-2 group/btn">
                         <span className="text-[10px] font-black text-[var(--text-3)] opacity-0 group-hover/btn:opacity-100 transition-opacity uppercase tracking-widest">Execute Goal</span>
                         <div className="w-10 h-10 rounded-full bg-[var(--text)] flex items-center justify-center text-[var(--bg)] shadow-lg hover:scale-110 active:scale-95 transition-all">
                            <Zap size={16} strokeWidth={2.5} fill="currentColor" />
                         </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
