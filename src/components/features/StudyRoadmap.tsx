"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    ShieldAlert,
    Volume2,
    Settings,
    Download,
    Baby,
    Lightbulb,
    Type,
    Check,
    MessageSquare,
    Sparkle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToasts } from "@/components/ui/GlobalToasts";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import OdometerCounter from "@/components/ui/OdometerCounter";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

interface RoadmapData {
    studySchedule?: Record<string, string>;
    commonMistakes?: string[];
    commonBlindspots?: string[];
    mostImportantTopics?: string[];
    roadmap?: string; // Fallback for pure markdown
}

// Local Nigerian Analogies catalog for avoidance map tips
const NIGERIAN_ANALOGIES: Record<string, string> = {
    "foundational": "Like building a duplex starting from the parlor ceiling. You must lay the solid block foundation first, otherwise wet season rain will meet you inside.",
    "cramming": "Like cramming the direction to Balogun market, but you don't know the names of the streets. One road block or Danfo diversion and you are completely lost.",
    "practice": "Like driving a danfo bus on the Third Mainland Bridge with no brakes. Slow down small, make you no go land inside lagoon.",
    "testing": "Like bragging that you can dribble like Jay-Jay Okocha because you watch highlights, until they put you on the pitch at National Stadium.",
    "blindspots": "Like walking past a NEPA pole with naked wires during rainy season. Keep your eyes open, make you no go shock.",
    "consistency": "Like fetching water into a basket. If you stop halfway, you go come back meet empty basket. Keep the pace steady."
};

const getAnalogyText = (tip: string): string => {
    const lower = tip.toLowerCase();
    if (lower.includes("foundation") || lower.includes("definition") || lower.includes("concept")) {
        return NIGERIAN_ANALOGIES.foundational;
    }
    if (lower.includes("memoriz") || lower.includes("cram") || lower.includes("understand")) {
        return NIGERIAN_ANALOGIES.cramming;
    }
    if (lower.includes("practice") || lower.includes("scenari")) {
        return NIGERIAN_ANALOGIES.practice;
    }
    if (lower.includes("test") || lower.includes("quiz") || lower.includes("exam")) {
        return NIGERIAN_ANALOGIES.testing;
    }
    if (lower.includes("time") || lower.includes("schedule") || lower.includes("sprint")) {
        return NIGERIAN_ANALOGIES.consistency;
    }
    return NIGERIAN_ANALOGIES.blindspots;
};

export const StudyRoadmap = ({ 
    data, 
    isStreaming = false, 
    generationId,
    title = "Academic Roadmap"
}: { 
    data: any; 
    isStreaming?: boolean; 
    generationId?: string; 
    title?: string;
}) => {
    const { user } = useUser();
    const { addToast } = useToasts();

    // Checkbox tracking state
    const [completedPhases, setCompletedPhases] = useState<string[]>([]);
    
    // Customization / Adjustment states
    const [examDate, setExamDate] = useState("");
    const [isDyslexiaMode, setIsDyslexiaMode] = useState(false);
    const [activeAnalogy, setActiveAnalogy] = useState<string | null>(null);
    const [playingPhaseTTS, setPlayingPhaseTTS] = useState<string | null>(null);

    // AI Plan Adjuster states
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [adjustPrompt, setAdjustPrompt] = useState("");
    const [adjustedScheduleText, setAdjustedScheduleText] = useState<string | null>(null);

    // Normalization logic
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

        if (mdObj.studySchedule && Object.keys(mdObj.studySchedule).length > 0 && mdObj.mostImportantTopics && mdObj.mostImportantTopics.length > 0) {
            return mdObj;
        }

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

        if (mostImportantTopics.length === 0) {
            mostImportantTopics.push("Mastering core conceptual relationships", "Identifying edge cases and practical applications");
        }
        if (commonBlindspots.length === 0) {
            commonBlindspots.push("Overlooking foundational definitions");
        }
        if (commonMistakes.length === 0) {
            commonMistakes.push("Memorizing without understanding mechanics");
        }
        if (Object.keys(studySchedule).length === 0) {
            studySchedule["Phase 01"] = "Deep Summary & Core Concept Deconstruction";
            studySchedule["Phase 02"] = "Active Recall & Memory Card Reinforcement";
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

    // Synchronize checklist state on mount
    useEffect(() => {
        const loadChecklist = async () => {
            if (!generationId) return;
            if (user) {
                try {
                    const supabase = createClient();
                    const { data: dbData } = await supabase
                        .from('user_bookmarks')
                        .select('*')
                        .eq('pack_id', generationId)
                        .eq('surface', 'roadmap')
                        .maybeSingle();
                    if (dbData?.position_data?.completedPhases) {
                        setCompletedPhases(dbData.position_data.completedPhases);
                    }
                } catch (e) {
                    console.warn("Failed to load checklist bookmarks", e);
                }
            } else {
                try {
                    const saved = localStorage.getItem(`roadmap_local_${generationId}`);
                    if (saved) {
                        setCompletedPhases(JSON.parse(saved));
                    }
                } catch (e) {
                    console.warn("Failed to load local roadmap checklist", e);
                }
            }
        };
        loadChecklist();
    }, [generationId, user]);

    // Handle phase checkbox toggle
    const handleTogglePhase = async (phaseKey: string) => {
        const isCompleted = completedPhases.includes(phaseKey);
        const updated = isCompleted 
            ? completedPhases.filter(k => k !== phaseKey)
            : [...completedPhases, phaseKey];

        setCompletedPhases(updated);

        if (!isCompleted) {
            addToast("Step completed! Keep up the momentum! 🚀", "success");
        }

        if (generationId) {
            if (user) {
                try {
                    const supabase = createClient();
                    await supabase
                        .from('user_bookmarks')
                        .upsert({
                            user_id: user.id,
                            pack_id: generationId,
                            surface: 'roadmap',
                            position_data: { completedPhases: updated },
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'user_id,pack_id,surface' });
                } catch (e) {
                    console.warn("Failed to update database bookmarks", e);
                }
            } else {
                try {
                    localStorage.setItem(`roadmap_local_${generationId}`, JSON.stringify(updated));
                } catch (e) {
                    console.warn("Failed to update local storage roadmap state", e);
                }
            }
        }
    };

    // Recalculate study velocity based on chosen exam date
    const getCalendarStatus = () => {
        if (!examDate) return null;
        const examTime = new Date(examDate).getTime();
        const nowTime = new Date().getTime();
        const diffDays = Math.max(0, Math.ceil((examTime - nowTime) / (1000 * 60 * 60 * 24)));
        const totalSteps = Object.keys(roadmap.studySchedule || {}).length;

        let statusText = "Steady tempo recommended! ☕";
        let colorClass = "text-[var(--emerald)] bg-[var(--emerald-dim)]/10 border-[var(--emerald-border)]";
        if (diffDays === 0) {
            statusText = "Exam is today! Speed run now! 🚨";
            colorClass = "text-red-400 bg-red-950/20 border-red-950/40";
        } else if (diffDays < totalSteps) {
            statusText = "Fast pace required! Sprint mode active! 🏃";
            colorClass = "text-[var(--amber)] bg-[var(--amber-dim)]/10 border-[var(--amber-border)] animate-pulse";
        } else if (diffDays >= totalSteps * 3) {
            statusText = "Relaxed pace. Deep learning focus! 📚";
            colorClass = "text-[var(--blue)] bg-[var(--blue-dim)]/10 border-[var(--blue-border)]";
        }

        return {
            daysRemaining: diffDays,
            statusText,
            colorClass
        };
    };

    const calendarInfo = getCalendarStatus();

    // Export to ICS calendar sync utility
    const handleExportICS = () => {
        try {
            const steps = Object.entries(roadmap.studySchedule || {});
            if (steps.length === 0) return;

            let icsContent = [
                "BEGIN:VCALENDAR",
                "VERSION:2.0",
                "PRODID:-//The Professor AI//Study Plan//EN",
                "CALSCALE:GREGORIAN",
                "METHOD:PUBLISH"
            ].join("\r\n") + "\r\n";

            const today = new Date();

            steps.forEach(([timeLabel, taskText], index) => {
                const eventDate = new Date(today);
                eventDate.setDate(today.getDate() + index + 1);
                const dateStr = eventDate.toISOString().split('T')[0].replace(/-/g, '');

                icsContent += [
                    "BEGIN:VEVENT",
                    `UID:event_${index}_${Date.now()}@theprofessor.ai`,
                    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                    `DTSTART;VALUE=DATE:${dateStr}`,
                    `SUMMARY:Study: ${timeLabel} - ${taskText.substring(0, 40)}`,
                    `DESCRIPTION:${taskText} (Syllabus: ${title})`,
                    "STATUS:CONFIRMED",
                    "SEQUENCE:0",
                    "END:VEVENT"
                ].join("\r\n") + "\r\n";
            });

            icsContent += "END:VCALENDAR";

            const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `study_plan_${title.toLowerCase().replace(/\s+/g, '_')}.ics`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            addToast("ICS Calendar downloaded! Import into Google Calendar or Outlook 📅", "success");
        } catch (e) {
            addToast("Failed to generate calendar file", "error");
        }
    };

    // Text-To-Speech Narrator using browser SpeechSynthesis
    const handlePlayTTS = (text: string, phaseKey: string) => {
        if (playingPhaseTTS === phaseKey) {
            window.speechSynthesis.cancel();
            setPlayingPhaseTTS(null);
            return;
        }

        window.speechSynthesis.cancel();
        setPlayingPhaseTTS(phaseKey);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setPlayingPhaseTTS(null);
        utterance.onerror = () => setPlayingPhaseTTS(null);
        window.speechSynthesis.speak(utterance);
    };

    // "Ask the Professor" AI Plan Adjuster
    const handleAdjustRoadmap = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            addToast("Please sign up or log in to adjust study schedules with AI! 💡", "info");
            return;
        }
        if (!adjustPrompt.trim() || isAdjusting) return;
        setIsAdjusting(true);
        setAdjustedScheduleText("");

        try {
            const res = await fetch("/api/roadmap/adjust", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    schedule: roadmap.studySchedule,
                    userPrompt: adjustPrompt
                })
            });

            if (!res.ok) {
                if (res.status === 402) {
                    addToast("Insufficient credits! Please upgrade your plan.", "error");
                } else {
                    addToast("Failed to adjust study plan.", "error");
                }
                setIsAdjusting(false);
                return;
            }

            const reader = res.body?.getReader();
            if (!reader) {
                setIsAdjusting(false);
                return;
            }

            const decoder = new TextDecoder();
            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                setAdjustedScheduleText(buffer);
            }
        } catch (err) {
            addToast("Error contacting the Professor.", "error");
        } finally {
            setIsAdjusting(false);
        }
    };

    // Calculate progression metrics
    const scheduleEntries = Object.entries(roadmap.studySchedule || {});
    const totalSteps = scheduleEntries.length;
    const progressPercent = totalSteps > 0 ? Math.round((completedPhases.length / totalSteps) * 100) : 0;

    // Render streaming loader
    if (isStreaming) {
        const textContent = typeof data === 'string' ? data : (data?.roadmap || JSON.stringify(data || ""));
        return (
            <div className="p-8 rounded-[36px] bg-[var(--background-secondary)]/80 backdrop-blur-xl border border-[var(--border)] shadow-2xl w-full max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
                    <div className="w-2 h-2 rounded-full bg-[var(--blue-light)] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Professor's Roadmap Stream</span>
                </div>
                <MarkdownRenderer content={textContent} isStreaming={true} />
            </div>
        );
    }

    return (
        <div className="w-full space-y-8 pb-12 px-2 sm:px-4 max-w-7xl mx-auto select-none">
            
            {/* Symmetrical Header */}
            <div className="text-center mb-10 relative">
                <div className="absolute inset-0 -top-10 bg-gradient-to-b from-[var(--blue)]/5 via-transparent to-transparent blur-3xl pointer-events-none -z-10" />
                
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--blue)]/10 text-[var(--blue)] border border-[var(--blue)]/20 text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-sm">
                    <Compass size={14} className="animate-spin-slow" /> Study Plan Blueprint
                </div>
                <h2 className="text-4xl sm:text-5xl font-black tracking-tighter italic uppercase leading-none mb-4 text-[var(--foreground)]">
                    Your <span className="text-[var(--blue)]">Study</span> Path
                </h2>
                <p className="text-[var(--foreground-muted)] font-medium max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed opacity-95">
                    A customized sequential timeline structured to guide your daily revisions, manage traps, and ensure you pass easily.
                </p>
            </div>

            {/* Upper Widgets Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-5xl mx-auto">
                
                {/* Progress Gauge */}
                <GlassmorphicCard intensity="medium" className="md:col-span-4 p-5 flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">Syllabus Completion</span>
                        <span className="text-xs font-bold text-zinc-300">
                            {completedPhases.length} of {totalSteps} phases checked
                        </span>
                        <div className="mt-1">
                            <OdometerCounter value={progressPercent} suffix="%" className="text-2xl font-black text-[var(--blue)]" />
                        </div>
                    </div>
                    {/* SVG Circular completion meter */}
                    <div className="relative w-16 h-16 shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" fill="transparent" />
                            <circle 
                                cx="32" 
                                cy="32" 
                                r="26" 
                                stroke="var(--blue)" 
                                strokeWidth="3.5" 
                                fill="transparent" 
                                strokeDasharray={2 * Math.PI * 26}
                                strokeDashoffset={(2 * Math.PI * 26) * (1 - progressPercent / 100)}
                                className="transition-all duration-700"
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-[var(--blue)]">
                            {progressPercent}%
                        </span>
                    </div>
                </GlassmorphicCard>

                {/* Exam Date Recalculator */}
                <GlassmorphicCard intensity="medium" className="md:col-span-5 p-5 flex flex-col justify-between gap-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">Target Exam Date</span>
                            <span className="text-[11px] font-bold text-zinc-300">Set deadline to compute pace</span>
                        </div>
                        <input 
                            type="date"
                            value={examDate}
                            onChange={(e) => setExamDate(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--blue)]/40 outline-none"
                        />
                    </div>
                    {calendarInfo && (
                        <div className={cn("p-2 rounded-lg border text-[10px] font-bold flex items-center justify-between gap-2 transition-all", calendarInfo.colorClass)}>
                            <span>{calendarInfo.statusText}</span>
                            <span className="font-mono">{calendarInfo.daysRemaining} days left</span>
                        </div>
                    )}
                </GlassmorphicCard>

                {/* Toolbar Widgets */}
                <GlassmorphicCard intensity="medium" className="md:col-span-3 p-5 flex flex-col justify-between gap-2.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">Study Toolkit</span>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleExportICS}
                            className="flex-1 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-wider hover:bg-white/10 text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-1.5 shadow"
                            title="Export timeline events to Calendar"
                        >
                            <Download size={13} />
                            <span>Export (.ics)</span>
                        </button>
                        <button 
                            onClick={() => setIsDyslexiaMode(!isDyslexiaMode)}
                            className={cn("p-2 rounded-xl border transition-all flex items-center justify-center", 
                                isDyslexiaMode 
                                    ? 'bg-[var(--emerald)]/10 border-[var(--emerald)]/30 text-[var(--emerald)]' 
                                    : 'bg-white/5 border-white/5 text-[var(--foreground-muted)] hover:text-white'
                            )}
                            title="Dyslexia typography adjustments"
                        >
                            <Type size={14} />
                        </button>
                    </div>
                </GlassmorphicCard>

            </div>

            {/* Split layout: Avoidance Map Left, Timeline Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
                
                {/* Left Column: Avoidance & Pitfalls (5 spans) */}
                <div className="lg:col-span-5 space-y-6">
                    
                    {/* Focus Points Card */}
                    <GlassmorphicCard intensity="medium" className="p-6 overflow-hidden relative group hover:border-[var(--blue)]/40 transition-all duration-500">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--blue)]/10 via-transparent to-transparent rounded-full blur-2xl pointer-events-none -z-10" />
                        <div className="absolute top-6 right-6 opacity-5">
                            <Target size={40} className="text-[var(--blue)]" />
                        </div>
                        
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 rounded-xl bg-[var(--blue)]/10 flex items-center justify-center border border-[var(--blue)]/20 shadow-inner">
                                <Flame size={18} className="text-[var(--blue)]" />
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]">High-Yield Focus</h4>
                                <p className="text-[9px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest opacity-60">Syllabus priorities</p>
                            </div>
                        </div>

                        <ul className="space-y-3 relative z-10">
                            {(roadmap.mostImportantTopics || []).map((topic, i) => (
                                <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/40 border border-white/5 hover:border-[var(--blue)]/30 hover:bg-[var(--blue)]/5 transition-all duration-300 shadow-sm">
                                    <div className="w-5 h-5 rounded-lg bg-[var(--blue)]/10 border border-[var(--blue)]/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <Zap size={10} className="text-[var(--blue)]" />
                                    </div>
                                    <span className={cn("text-xs font-semibold text-zinc-200 leading-relaxed", isDyslexiaMode ? "font-sans tracking-wide" : "font-serif")}>
                                        {topic}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </GlassmorphicCard>

                    {/* Avoidance Map Card */}
                    <GlassmorphicCard intensity="medium" className="p-6 border-l-4 border-l-[var(--amber)] overflow-hidden relative group hover:border-[var(--amber)]/40 transition-all duration-500">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--amber)]/10 via-transparent to-transparent rounded-full blur-2xl pointer-events-none -z-10" />
                        <div className="absolute top-6 right-6 opacity-5">
                            <ShieldAlert size={40} className="text-[var(--amber)]" />
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 rounded-xl bg-[var(--amber)]/10 flex items-center justify-center border border-[var(--amber)]/20 shadow-inner">
                                <AlertTriangle size={18} className="text-[var(--amber)]" />
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--foreground)]">Avoidance Map</h4>
                                <p className="text-[9px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest opacity-60">Avoid traps & blindspots</p>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            
                            {/* Blindspots block */}
                            <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 hover:border-[var(--amber)]/20 transition-all duration-300">
                                <div className="flex items-center gap-2 mb-2">
                                    <Eye size={12} className="text-[var(--amber)]" />
                                    <span className="text-[9px] font-black uppercase tracking-wider text-[var(--amber)]">Cognitive Blindspots</span>
                                </div>
                                <div className="space-y-2">
                                    {(roadmap.commonBlindspots || []).map((b, i) => (
                                        <div key={i} className="text-xs font-semibold text-zinc-300 flex items-start gap-2 leading-relaxed">
                                            <button 
                                                onClick={() => setActiveAnalogy(activeAnalogy === `b_${i}` ? null : `b_${i}`)}
                                                className="mt-0.5 p-1 rounded bg-[var(--amber)]/10 text-[var(--amber)] border border-[var(--amber)]/20 shrink-0 hover:bg-[var(--amber)]/20"
                                                title="View Nigerian Analogy explanation"
                                            >
                                                <Lightbulb size={10} />
                                            </button>
                                            <div className="flex flex-col gap-1 w-full">
                                                <span className={isDyslexiaMode ? "font-sans tracking-wide" : "font-serif"}>{b}</span>
                                                {activeAnalogy === `b_${i}` && (
                                                    <div className="mt-1.5 p-2.5 rounded-lg bg-[var(--amber)]/5 border border-[var(--amber)]/20 text-[10px] italic text-[var(--amber)] leading-relaxed font-sans animate-in slide-in-from-top-1 duration-200">
                                                        {getAnalogyText(b)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Mistakes block */}
                            <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 hover:border-[var(--crimson)]/20 transition-all duration-300">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle size={12} className="text-[var(--crimson)]" />
                                    <span className="text-[9px] font-black uppercase tracking-wider text-[var(--crimson)]">Fatal Mistakes</span>
                                </div>
                                <div className="space-y-2">
                                    {(roadmap.commonMistakes || []).map((m, i) => (
                                        <div key={i} className="text-xs font-semibold text-zinc-300 flex items-start gap-2 leading-relaxed">
                                            <button 
                                                onClick={() => setActiveAnalogy(activeAnalogy === `m_${i}` ? null : `m_${i}`)}
                                                className="mt-0.5 p-1 rounded bg-red-950/30 text-red-400 border border-red-500/20 shrink-0 hover:bg-red-950/50"
                                                title="View Nigerian Analogy explanation"
                                            >
                                                <Lightbulb size={10} />
                                            </button>
                                            <div className="flex flex-col gap-1 w-full">
                                                <span className={isDyslexiaMode ? "font-sans tracking-wide" : "font-serif"}>{m}</span>
                                                {activeAnalogy === `m_${i}` && (
                                                    <div className="mt-1.5 p-2.5 rounded-lg bg-red-950/10 border border-red-500/10 text-[10px] italic text-red-400 leading-relaxed font-sans animate-in slide-in-from-top-1 duration-200">
                                                        {getAnalogyText(m)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </GlassmorphicCard>

                </div>

                {/* Right Column: Execution Checklist Timeline (7 spans) */}
                <div className="lg:col-span-7 space-y-6">
                    
                    <GlassmorphicCard intensity="heavy" className="p-6 sm:p-8 overflow-hidden relative group hover:border-[var(--blue)]/30 transition-all duration-500">
                        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-[var(--blue)]/5 via-transparent to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

                        {/* Title Row */}
                        <div className="flex items-center justify-between mb-8 pb-5 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[var(--blue)]/10 flex items-center justify-center border border-[var(--blue)]/20 shadow-inner">
                                    <Calendar size={20} className="text-[var(--blue)]" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black italic uppercase tracking-tight text-[var(--foreground)]">Execution Timeline</h4>
                                    <p className="text-[9px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest opacity-60">Interactive Study Steps</p>
                                </div>
                            </div>
                            <div className="px-3 py-1 rounded bg-[var(--blue)]/10 border border-[var(--blue)]/20 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--blue)]">
                                Sprint Protocol
                            </div>
                        </div>

                        {/* Interactive Nodes list */}
                        <div className="relative space-y-6 pl-2 sm:pl-4">
                            {/* Connector Line */}
                            <div className="absolute left-[17px] sm:left-[21px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-[var(--blue)] via-[var(--blue)]/30 to-transparent rounded-full pointer-events-none" />

                            {scheduleEntries.map(([timeLabel, taskText], i) => {
                                const isChecked = completedPhases.includes(timeLabel);
                                const isPlaying = playingPhaseTTS === timeLabel;

                                return (
                                    <div key={i} className="relative pl-10 sm:pl-12 group/node flex items-start gap-4">
                                        
                                        {/* Clickable timeline checkbox node */}
                                        <button 
                                            onClick={() => handleTogglePhase(timeLabel)}
                                            className={cn(
                                                "absolute left-2.5 sm:left-3.5 top-1 w-5 h-5 rounded-full border z-10 transition-all duration-300 flex items-center justify-center shadow-md",
                                                isChecked 
                                                    ? "bg-[var(--emerald)] border-[var(--emerald)] text-zinc-950 scale-110 shadow-[0_0_10px_rgba(43,178,136,0.3)]" 
                                                    : "bg-zinc-900 border-white/10 text-white hover:border-[var(--blue)]"
                                            )}
                                        >
                                            {isChecked ? (
                                                <Check size={12} strokeWidth={3.5} />
                                            ) : (
                                                <span className="w-1.5 h-1.5 rounded-full bg-white/25 group-hover/node:bg-white" />
                                            )}
                                        </button>

                                        {/* Step card container */}
                                        <div className={cn(
                                            "flex-1 p-4 rounded-2xl border transition-all duration-300 shadow-sm flex items-start justify-between gap-3",
                                            isChecked 
                                                ? "bg-[var(--emerald-dim)]/5 border-[var(--emerald-border)] opacity-85" 
                                                : "bg-zinc-950/40 border-white/5 hover:border-[var(--blue)]/30 hover:bg-[var(--blue)]/5"
                                        )}>
                                            <div className="flex flex-col gap-0.5">
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase tracking-[0.2em]",
                                                    isChecked ? "text-[var(--emerald)]" : "text-[var(--blue)]"
                                                )}>
                                                    {timeLabel}
                                                </span>
                                                <h5 className={cn(
                                                    "text-sm font-bold tracking-tight leading-snug",
                                                    isChecked ? "text-zinc-400 line-through font-medium" : "text-[var(--foreground)]",
                                                    isDyslexiaMode ? "font-sans tracking-wide text-base leading-relaxed" : "font-serif"
                                                )}>
                                                    {taskText}
                                                </h5>
                                            </div>

                                            {/* Audio TTS trigger */}
                                            <button 
                                                onClick={() => handlePlayTTS(taskText, timeLabel)}
                                                className={cn("p-1.5 rounded-lg border transition-all shrink-0 mt-0.5", 
                                                    isPlaying 
                                                        ? 'bg-[var(--amber)]/10 border-[var(--amber)]/30 text-[var(--amber)]' 
                                                        : 'bg-white/5 border-white/5 text-[var(--foreground-muted)] hover:text-white'
                                                )}
                                                title="Read phase description"
                                            >
                                                <Volume2 size={12} />
                                            </button>
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    </GlassmorphicCard>

                    {/* AI Plan Adjuster Card */}
                    <GlassmorphicCard intensity="medium" className="p-6">
                        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-white/5">
                            <div className="w-8 h-8 rounded-lg bg-[var(--violet)]/10 flex items-center justify-center border border-[var(--violet)]/20 shadow-inner animate-pulse">
                                <Sparkle size={16} className="text-[var(--violet)]" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-[var(--foreground)]">Ask the Professor</h4>
                                <p className="text-[9px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest opacity-60">Adjust study timelines via AI</p>
                            </div>
                        </div>

                        <form onSubmit={handleAdjustRoadmap} className="space-y-4">
                            <textarea 
                                value={adjustPrompt}
                                onChange={e => setAdjustPrompt(e.target.value)}
                                placeholder="E.g., I only have 3 days instead of 7 to study. Shorten this schedule or show me which steps to skip..."
                                className="w-full h-18 p-3 rounded-xl bg-zinc-950/60 border border-white/10 text-xs text-[var(--foreground)] placeholder-white/20 focus:outline-none focus:border-[var(--violet)]/40 resize-none"
                            />
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-[8px] text-[var(--foreground-muted)]/50 font-mono">Cost: 1 Credit</span>
                                <button 
                                    type="submit"
                                    disabled={isAdjusting || !adjustPrompt.trim()}
                                    className="px-4 py-2 rounded-xl bg-[var(--violet)] text-zinc-950 hover:opacity-95 font-black text-[10px] uppercase tracking-wider cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                                >
                                    <MessageSquare size={12} />
                                    {isAdjusting ? "Consulting..." : "Consult Professor"}
                                </button>
                            </div>
                        </form>

                        {/* Streamed AI suggestion rendering */}
                        {adjustedScheduleText && (
                            <div className="mt-5 p-4 rounded-2xl bg-zinc-950/70 border border-[var(--violet)]/20 text-xs text-zinc-200 leading-relaxed animate-in fade-in duration-300">
                                <div className="flex items-center gap-1.5 mb-2 text-[9px] font-black uppercase tracking-wider text-[var(--violet)]">
                                    <Baby size={12} />
                                    <span>Professor's Response</span>
                                </div>
                                <p className={cn("leading-relaxed", isDyslexiaMode ? "font-sans text-sm tracking-wide" : "font-serif text-sm italic")}>
                                    {adjustedScheduleText}
                                </p>
                            </div>
                        )}
                    </GlassmorphicCard>

                </div>

            </div>

        </div>
    );
};
