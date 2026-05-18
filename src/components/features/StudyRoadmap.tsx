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
    Zap,
    Compass,
    Milestone,
    Flame,
    ShieldAlert
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
    // Normalization and intelligent markdown parsing logic
    const normalize = (raw: any): RoadmapData => {
        if (!raw) return { roadmap: "No roadmap data available.", mostImportantTopics: ["Mastering core conceptual relationships"], commonBlindspots: ["Overlooking foundational definitions"], commonMistakes: ["Memorizing without understanding"], studySchedule: { "Phase 01": "Deep Summary & Core Concept Deconstruction" } };

        let mdObj: any = raw;
        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                mdObj = parsed.studyPlan || parsed;
            } catch {
                mdObj = { roadmap: raw };
            }
        } else if (raw.studyPlan) {
            mdObj = raw.studyPlan;
        }

        // If we already have structured fields, return them
        if (mdObj.studySchedule && Object.keys(mdObj.studySchedule).length > 0 && mdObj.mostImportantTopics && mdObj.mostImportantTopics.length > 0) {
            return mdObj;
        }

        // Otherwise, intelligently parse the markdown string with robust AI header detection
        const mdText = typeof mdObj.roadmap === 'string' ? mdObj.roadmap : typeof raw === 'string' ? raw : JSON.stringify(raw);
        const lines = mdText.split('\n');
        const mostImportantTopics: string[] = [];
        const commonBlindspots: string[] = [];
        const commonMistakes: string[] = [];
        const studySchedule: Record<string, string> = {};

        let currentSection = "";
        let scheduleIndex = 1;

        lines.forEach((line: string) => {
            const trimmed = line.trim();
            if (!trimmed) return;

            // Detect headers / sections using robust regex matching for AI variations
            if (/^(#+|\*+)?\s*([🎯📌🔑🚀]|Focus|Key|Important|Topics|Core|Summary|Main)/i.test(trimmed) && !/Blindspot|Mistake|Avoid|Pitfall|Schedule|Timeline/i.test(trimmed)) {
                currentSection = "topics";
                return;
            }
            if (/^(#+|\*+)?\s*([⚠️👁️]|Blindspot|Gap|Overlook|Missed|Unseen)/i.test(trimmed)) {
                currentSection = "blindspots";
                return;
            }
            if (/^(#+|\*+)?\s*([🛑❌⚠️]|Mistake|Avoid|Pitfall|Error|Trap|Warning)/i.test(trimmed) && !/Blindspot/i.test(trimmed)) {
                currentSection = "mistakes";
                return;
            }
            if (/^(#+|\*+)?\s*([📅⏳]|Timeline|Schedule|Sprint|Roadmap|Plan|Days|Weeks|Steps|Phases)/i.test(trimmed)) {
                currentSection = "schedule";
                return;
            }

            // Clean list items
            const cleanText = trimmed.replace(/^[-*•\d.]+\s*/, '').replace(/^[🎯⚠️🔑🛑💡🚀📌📅⏳👁️❌]+\s*/, '').trim();
            if (!cleanText || cleanText.length < 5 || cleanText.startsWith("#")) return;

            if (currentSection === "topics") {
                mostImportantTopics.push(cleanText);
            } else if (currentSection === "blindspots") {
                commonBlindspots.push(cleanText);
            } else if (currentSection === "mistakes") {
                commonMistakes.push(cleanText);
            } else if (currentSection === "schedule") {
                const match = cleanText.match(/^(Day \d+|Phase \d+|Step \d+|Week \d+|[\d]+):\s*(.*)/i);
                if (match) {
                    studySchedule[match[1]] = match[2];
                } else {
                    studySchedule[`Phase 0${scheduleIndex}`] = cleanText;
                    scheduleIndex++;
                }
            } else {
                // Fallback: if no header matched yet, categorize based on bullet indicators
                if (/^[🎯🔑📌🚀]/.test(trimmed)) {
                    mostImportantTopics.push(cleanText);
                } else if (/^[⚠️👁️]/.test(trimmed)) {
                    commonBlindspots.push(cleanText);
                } else if (/^[🛑❌]/.test(trimmed)) {
                    commonMistakes.push(cleanText);
                } else if (/^[📅⏳]/.test(trimmed) || /^(Day|Week|Phase) \d+/i.test(trimmed)) {
                    const match = cleanText.match(/^(Day \d+|Phase \d+|Step \d+|Week \d+|[\d]+):\s*(.*)/i);
                    if (match) {
                        studySchedule[match[1]] = match[2];
                    } else {
                        studySchedule[`Phase 0${scheduleIndex}`] = cleanText;
                        scheduleIndex++;
                    }
                } else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
                    mostImportantTopics.push(cleanText);
                }
            }
        });

        // Ensure fallbacks if any section is empty
        if (mostImportantTopics.length === 0) {
            mostImportantTopics.push("Mastering core conceptual relationships", "Identifying edge cases and practical applications", "Connecting theory to real-world problem solving");
        }
        if (commonBlindspots.length === 0) {
            commonBlindspots.push("Overlooking foundational definitions", "Rushing through complex practice scenarios");
        }
        if (commonMistakes.length === 0) {
            commonMistakes.push("Memorizing without understanding underlying mechanics", "Failing to test knowledge under timed conditions");
        }
        if (Object.keys(studySchedule).length === 0) {
            studySchedule["Phase 01"] = "Deep Summary & Core Concept Deconstruction";
            studySchedule["Phase 02"] = "Active Recall & Memory Card Reinforcement";
            studySchedule["Phase 03"] = "Practice Quiz & Knowledge Stress-Testing";
            studySchedule["Phase 04"] = "Final Synthesis & Exam Simulation";
        }

        return {
            mostImportantTopics,
            commonBlindspots,
            commonMistakes,
            studySchedule,
            roadmap: mdText
        };
    };

    const roadmap = normalize(data);

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
            className="w-full space-y-8 pb-12 px-2 sm:px-4 max-w-7xl mx-auto"
        >
            {/* Premium Header */}
            <div className="text-center mb-12 relative">
                <div className="absolute inset-0 -top-10 bg-gradient-to-b from-[var(--blue)]/5 via-transparent to-transparent blur-3xl pointer-events-none -z-10" />
                <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--blue)]/10 text-[var(--blue)] border border-[var(--blue)]/20 text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-sm">
                    <Compass size={14} className="animate-spin-slow" /> Strategic Blueprint
                </motion.div>
                <motion.h2 variants={item} className="text-4xl sm:text-6xl font-black tracking-tighter italic uppercase leading-none mb-4 text-[var(--foreground)]">
                    Your <span className="text-[var(--blue)]">Study</span> Path
                </motion.h2>
                <motion.p variants={item} className="text-[var(--foreground-muted)] font-medium max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed opacity-90">
                    A precision-engineered roadmap designed by The Professor to accelerate synaptic retention and guarantee mastery.
                </motion.p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Focus & Pitfalls (5 spans) */}
                <div className="lg:col-span-5 space-y-8">
                    {/* Key Focus Areas Card */}
                    <motion.div variants={item} className="p-8 rounded-[36px] bg-[var(--background-secondary)]/80 backdrop-blur-xl border border-[var(--border)] shadow-2xl relative overflow-hidden group hover:border-[var(--blue)]/40 transition-all duration-500">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[var(--blue)]/10 via-transparent to-transparent rounded-full blur-2xl pointer-events-none -z-10 group-hover:scale-125 transition-transform duration-700" />
                        <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                            <Target size={48} className="text-[var(--blue)]" />
                        </div>
                        
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-[var(--blue)]/10 flex items-center justify-center text-[var(--blue)] border border-[var(--blue)]/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                <Flame size={20} className="text-[var(--blue)]" />
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]">High-Yield Focus</h4>
                                <p className="text-[9px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest opacity-70">Core concepts to master</p>
                            </div>
                        </div>

                        <ul className="space-y-4 relative z-10">
                            {(roadmap.mostImportantTopics || []).map((topic, i) => (
                                <li key={i} className="flex items-start gap-3.5 group/item p-3.5 rounded-2xl bg-[var(--background)]/50 border border-[var(--border)]/50 hover:border-[var(--blue)]/30 hover:bg-[var(--blue)]/5 transition-all duration-300 shadow-sm">
                                    <div className="w-5 h-5 rounded-xl bg-[var(--blue)]/10 border border-[var(--blue)]/20 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:scale-110 group-hover/item:bg-[var(--blue)] group-hover/item:text-white transition-all duration-300">
                                        <Zap size={10} className="text-[var(--blue)] group-hover/item:text-white transition-colors" />
                                    </div>
                                    <span className="text-[13px] font-bold text-[var(--foreground)] leading-snug tracking-tight">
                                        {topic}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Intellectual Pitfalls Card */}
                    <motion.div variants={item} className="p-8 rounded-[36px] bg-[var(--background-secondary)]/80 backdrop-blur-xl border border-[var(--border)] shadow-2xl relative overflow-hidden group hover:border-[var(--amber)]/40 transition-all duration-500 border-l-4 border-l-[var(--amber)]">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[var(--amber)]/10 via-transparent to-transparent rounded-full blur-2xl pointer-events-none -z-10 group-hover:scale-125 transition-transform duration-700" />
                        <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                            <ShieldAlert size={48} className="text-[var(--amber)]" />
                        </div>

                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-2xl bg-[var(--amber)]/10 flex items-center justify-center text-[var(--amber)] border border-[var(--amber)]/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                <AlertTriangle size={20} className="text-[var(--amber)]" />
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]">Avoidance Map</h4>
                                <p className="text-[9px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest opacity-70">Traps & common blindspots</p>
                            </div>
                        </div>
                        
                        <div className="space-y-6 relative z-10">
                            {/* Blindspots */}
                            <div className="p-5 rounded-3xl bg-[var(--background)]/50 border border-[var(--border)]/50 shadow-sm hover:border-[var(--amber)]/30 transition-colors duration-300">
                                <div className="flex items-center gap-2 mb-3">
                                    <Eye size={14} className="text-[var(--amber)]" />
                                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--amber)] opacity-90">Cognitive Blindspots</h5>
                                </div>
                                <div className="space-y-2.5">
                                    {(roadmap.commonBlindspots || []).map((b, i) => (
                                        <div key={i} className="text-[12px] font-bold text-[var(--foreground-muted)] flex items-start gap-2.5 leading-snug">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] opacity-60 mt-1.5 shrink-0" />
                                            <span>{b}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Mistakes */}
                            <div className="p-5 rounded-3xl bg-[var(--background)]/50 border border-[var(--border)]/50 shadow-sm hover:border-[var(--crimson)]/30 transition-colors duration-300">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle size={14} className="text-[var(--crimson)]" />
                                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--crimson)] opacity-90">Fatal Mistakes</h5>
                                </div>
                                <div className="space-y-2.5">
                                    {(roadmap.commonMistakes || []).map((m, i) => (
                                        <div key={i} className="text-[12px] font-bold text-[var(--foreground-muted)] flex items-start gap-2.5 leading-snug">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--crimson)] opacity-60 mt-1.5 shrink-0" />
                                            <span>{m}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: The Timeline (7 spans) */}
                <div className="lg:col-span-7">
                    <motion.div variants={item} className="h-full p-8 sm:p-10 rounded-[40px] bg-[var(--background-secondary)]/80 backdrop-blur-xl border border-[var(--border)] shadow-2xl relative overflow-hidden flex flex-col justify-between group hover:border-[var(--blue)]/30 transition-all duration-500">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[var(--blue)]/5 via-transparent to-transparent rounded-full blur-3xl pointer-events-none -z-10 group-hover:scale-110 transition-transform duration-700" />
                        
                        <div>
                            <div className="flex items-center justify-between mb-10 pb-6 border-b border-[var(--border)]/60">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[var(--blue)]/10 flex items-center justify-center text-[var(--blue)] border border-[var(--blue)]/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                        <Calendar size={24} className="text-[var(--blue)]" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black italic uppercase tracking-tight text-[var(--foreground)]">Execution Timeline</h4>
                                        <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest opacity-70">Step-by-step master plan</p>
                                    </div>
                                </div>
                                <div className="px-4 py-2 rounded-xl bg-[var(--blue)]/10 border border-[var(--blue)]/20 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--blue)] shadow-sm">
                                    Sprint Protocol
                                </div>
                            </div>

                            <div className="relative space-y-8 pl-2 sm:pl-4 mb-8">
                                {/* Glowing Connector Line */}
                                <div className="absolute left-[27px] sm:left-[35px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-[var(--blue)] via-[var(--blue)]/40 to-transparent rounded-full" />

                                {roadmap.studySchedule && Object.entries(roadmap.studySchedule).map(([time, task], i) => (
                                    <div key={i} className="relative pl-14 sm:pl-16 group/node">
                                        {/* Animated Node */}
                                        <div className={cn(
                                            "absolute left-4 sm:left-6 top-1.5 w-5 h-5 rounded-full border-2 border-[var(--background)] z-10 transition-all duration-300 group-hover/node:scale-125 flex items-center justify-center shadow-lg",
                                            i === 0 ? "bg-[var(--blue)] shadow-[0_0_15px_var(--blue-glow)]" : "bg-[var(--background-secondary)] border-[var(--blue)]/40 group-hover/node:bg-[var(--blue)]"
                                        )}>
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                i === 0 ? "bg-white animate-pulse" : "bg-[var(--blue)] group-hover/node:bg-white"
                                            )} />
                                        </div>
                                        
                                        <div className="p-5 rounded-3xl bg-[var(--background)]/50 border border-[var(--border)]/50 hover:border-[var(--blue)]/30 hover:bg-[var(--blue)]/5 transition-all duration-300 shadow-sm group-hover/node:translate-x-1">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--blue)]">{time}</span>
                                                <Milestone size={14} className="text-[var(--foreground-muted)] opacity-40 group-hover/node:opacity-100 group-hover/node:text-[var(--blue)] transition-all" />
                                            </div>
                                            <h5 className="text-[15px] font-bold text-[var(--foreground)] leading-snug tracking-tight">{task}</h5>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Encouragement Banner */}
                        <div className="p-6 rounded-3xl bg-gradient-to-r from-[var(--blue)]/10 via-[var(--background-secondary)] to-transparent border border-[var(--blue)]/20 flex items-center justify-between gap-4 mt-6 shadow-lg">
                            <div className="flex items-center gap-3">
                                <Sparkles size={20} className="text-[var(--blue)] animate-bounce shrink-0" />
                                <p className="text-xs font-bold text-[var(--foreground)] leading-snug">
                                    &quot;Consistency is the ultimate competitive advantage. Stick to the roadmap and your future self will thank you.&quot;
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};
