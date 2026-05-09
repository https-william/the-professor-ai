"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
    Target, 
    Eye, 
    AlertTriangle, 
    Calendar, 
    ArrowRight, 
    Sparkles, 
    CheckCircle2,
    BookOpen,
    Zap
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface RoadmapData {
    studySchedule?: Record<string, string>;
    commonMistakes?: string[];
    commonBlindspots?: string[];
    mostImportantTopics?: string[];
    roadmap?: string; // Fallback for pure markdown
}

export const StudyRoadmap = ({ data }: { data: any }) => {
    // Normalization logic
    const normalize = (raw: any): RoadmapData => {
        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                return parsed.studyPlan || parsed.roadmap || parsed;
            } catch {
                return { roadmap: raw };
            }
        }
        return raw.studyPlan || raw.roadmap || raw;
    };

    const roadmap = normalize(data);

    // If it's just markdown fallback
    if (roadmap.roadmap && !roadmap.studySchedule) {
        return (
            <div className="p-10 sm:p-16 rounded-[48px] bg-[var(--background-secondary)] border border-[var(--border)] w-full shadow-2xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--blue)]/10 flex items-center justify-center text-[var(--blue)] border border-[var(--blue)]/20 shadow-inner">
                        <BookOpen size={28} strokeWidth={1} />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Scholarly Path</h3>
                        <p className="text-[10px] text-[var(--foreground-muted)] font-black uppercase tracking-widest mt-1">Curated Strategy</p>
                    </div>
                </div>
                <div className="prose prose-invert max-w-none prose-p:text-base prose-p:leading-relaxed prose-p:font-medium text-[var(--foreground-muted)] selection:bg-[var(--blue)] selection:text-white">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {roadmap.roadmap}
                    </ReactMarkdown>
                </div>
            </div>
        );
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="w-full space-y-6 pb-8 px-1"
        >
            {/* Header Area */}
            <div className="text-center mb-8">
                <motion.h2 variants={item} className="text-3xl sm:text-5xl font-black tracking-tighter italic uppercase leading-none mb-3">
                    Your <span className="text-[var(--blue)]">Mastery</span> Path
                </motion.h2>
                <motion.p variants={item} className="text-[var(--foreground-muted)] font-bold max-w-xl mx-auto text-[11px] sm:text-xs uppercase tracking-widest opacity-70">
                    A precision-engineered strategy for academic dominance.
                </motion.p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Focus & Pitfalls */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Key Focus Areas */}
                    <motion.div variants={item} className="p-6 rounded-[32px] bg-[var(--background-secondary)] border border-[var(--border)] shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Target size={40} />
                        </div>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-[var(--emerald)]/10 flex items-center justify-center text-[var(--emerald)] border border-[var(--emerald)]/20">
                                <Target size={16} />
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Strategic Focus</h4>
                        </div>
                        <ul className="space-y-3">
                            {(roadmap.mostImportantTopics || []).map((topic, i) => (
                                <li key={i} className="flex items-start gap-3 group/item">
                                    <div className="w-4 h-4 rounded-full bg-[var(--emerald)]/10 border border-[var(--emerald)]/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <Zap size={8} className="text-[var(--emerald)]" />
                                    </div>
                                    <span className="text-[13px] font-bold text-[var(--foreground-muted)] group-hover/item:text-[var(--foreground)] transition-colors leading-tight">
                                        {topic}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Intellectual Pitfalls */}
                    <motion.div variants={item} className="p-6 rounded-[32px] bg-[var(--background-secondary)] border border-[var(--border)] shadow-xl border-l-4 border-l-[var(--amber)]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-[var(--amber)]/10 flex items-center justify-center text-[var(--amber)] border border-[var(--amber)]/20">
                                <AlertTriangle size={16} />
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Avoidance Map</h4>
                        </div>
                        
                        <div className="space-y-5">
                            <div>
                                <h5 className="text-[9px] font-black uppercase tracking-widest text-[var(--amber)] mb-2 opacity-80">Blindspots</h5>
                                <div className="space-y-2">
                                    {(roadmap.commonBlindspots || []).map((b, i) => (
                                        <div key={i} className="text-[12px] font-bold text-[var(--foreground-muted)] flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-[var(--amber)] opacity-40" />
                                            {b}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="pt-3 border-t border-[var(--border)]">
                                <h5 className="text-[9px] font-black uppercase tracking-widest text-[var(--crimson)] mb-2 opacity-80">Mistakes</h5>
                                <div className="space-y-2">
                                    {(roadmap.commonMistakes || []).map((m, i) => (
                                        <div key={i} className="text-[12px] font-bold text-[var(--foreground-muted)] flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-[var(--crimson)] opacity-40" />
                                            {m}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: The Timeline */}
                <div className="lg:col-span-7">
                    <motion.div variants={item} className="h-full p-6 sm:p-8 rounded-[40px] bg-[var(--background-secondary)] border border-[var(--border)] shadow-2xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[var(--blue)]/10 flex items-center justify-center text-[var(--blue)] border border-[var(--blue)]/20 shadow-inner">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h4 className="text-base font-black italic uppercase tracking-tight">Timeline</h4>
                                </div>
                            </div>
                            <div className="px-3 py-1 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[8px] font-black uppercase tracking-widest">
                                14 Day Sprint
                            </div>
                        </div>

                        <div className="relative space-y-6">
                            {/* Connector Line */}
                            <div className="absolute left-4 top-6 bottom-6 w-[1px] bg-gradient-to-b from-[var(--blue)] via-[var(--blue)]/20 to-transparent" />

                            {roadmap.studySchedule && Object.entries(roadmap.studySchedule).map(([time, task], i) => (
                                <div key={i} className="relative pl-10 group">
                                    {/* Node */}
                                    <div className={cn(
                                        "absolute left-[13px] top-1 w-2.5 h-2.5 rounded-full border border-[var(--background)] z-10 transition-all group-hover:scale-125 shadow-lg",
                                        i === 0 ? "bg-[var(--blue)] shadow-[0_0_10px_var(--blue-glow)]" : "bg-[var(--border)]"
                                    )} />
                                    
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--blue)]">{time}</span>
                                        <h5 className="text-[14px] font-bold text-[var(--foreground)] leading-tight">{task}</h5>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary Action */}
                        <div className="mt-8 p-4 rounded-[24px] bg-[var(--background)] border border-[var(--border)] shadow-inner">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[var(--emerald)]/20 flex items-center justify-center text-[var(--emerald)]">
                                    <CheckCircle2 size={16} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-[var(--foreground-muted)] font-bold uppercase tracking-tight">Ultimate Scholarly Wrap Pending</p>
                                </div>
                                <ArrowRight size={14} className="text-[var(--foreground-muted)] opacity-30" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};
