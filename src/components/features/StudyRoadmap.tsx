"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
    Compass,
    Calendar, 
    Download, 
    Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToasts } from "@/components/ui/GlobalToasts";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";

interface RoadmapData {
    studySchedule?: Record<string, string>;
    mostImportantTopics?: string[];
    roadmap?: string;
}

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
    const [completedPhases, setCompletedPhases] = useState<string[]>([]);

    const normalize = (raw: any): RoadmapData => {
        if (!raw) return { roadmap: "No roadmap data available.", mostImportantTopics: [], studySchedule: {} };

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

        if (mdObj.studySchedule && Object.keys(mdObj.studySchedule).length > 0) {
            return mdObj;
        }

        const mdText = typeof mdObj.roadmap === 'string' ? mdObj.roadmap : typeof raw === 'string' ? raw : JSON.stringify(raw);
        const lines = mdText.split('\n');
        const mostImportantTopics: string[] = [];
        const studySchedule: Record<string, string> = {};
        let scheduleIndex = 1;

        lines.forEach((line: string) => {
            const trimmed = line.trim();
            if (!trimmed) return;

            const cleanText = trimmed.replace(/^[-*•\d.]+\s*/, '').replace(/^[🎯⚠️🔑🛑💡🚀📌📅⏳👁️❌]+\s*/, '').trim();
            if (!cleanText || cleanText.length < 5 || cleanText.startsWith("#")) return;

            if (/^(Day \d+|Phase \d+|Step \d+|Week \d+|[\d]+):\s*(.*)/i.test(cleanText)) {
                const match = cleanText.match(/^(Day \d+|Phase \d+|Step \d+|Week \d+|[\d]+):\s*(.*)/i);
                if (match) {
                    studySchedule[match[1]] = match[2];
                }
            } else {
                studySchedule[`Phase 0${scheduleIndex}`] = cleanText;
                scheduleIndex++;
            }
        });

        if (Object.keys(studySchedule).length === 0) {
            studySchedule["Phase 01"] = "Deconstruct Core Lectures & Summarize Key Concepts";
            studySchedule["Phase 02"] = "Master Core Vocabulary & Active Recall Cards";
            studySchedule["Phase 03"] = "Complete Concept Spot Checks & Verify Gaps";
            studySchedule["Phase 04"] = "Take Mock Exam & Final Review";
        }

        return {
            mostImportantTopics: mdObj.mostImportantTopics || ["Core conceptual relationships"],
            studySchedule,
            roadmap: mdText
        };
    };

    const roadmap = normalize(data);

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
            addToast("ICS Calendar exported! 📅", "success");
        } catch (e) {
            addToast("Failed to generate calendar file", "error");
        }
    };

    const scheduleEntries = Object.entries(roadmap.studySchedule || {});
    const totalSteps = scheduleEntries.length;
    const progressPercent = totalSteps > 0 ? Math.round((completedPhases.length / totalSteps) * 100) : 0;

    if (isStreaming) {
        return (
            <div className="p-6 rounded-2xl bg-[var(--background-secondary)]/80 backdrop-blur-xl border border-[var(--border)] shadow-md w-full max-w-xl mx-auto space-y-4">
                <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">Generating Study Roadmap...</span>
                </div>
                <div className="h-2 w-full bg-[var(--background)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--blue)] animate-pulse w-2/3" />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 pb-6 px-2 max-w-3xl mx-auto select-none">
            
            {/* Symmetrical Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-2.5">
                    <Compass size={16} className="text-[var(--blue)] shrink-0" />
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-[var(--foreground)]">
                            Study Path
                        </h2>
                        <p className="text-[10px] text-[var(--foreground-muted)] font-bold">
                            Sequential Timeline
                        </p>
                    </div>
                </div>

                <button 
                    onClick={handleExportICS}
                    className="px-3.5 py-1.5 rounded-xl bg-[var(--blue)]/10 hover:bg-[var(--blue)]/20 border border-[var(--blue)]/20 text-[10px] font-black uppercase tracking-wider text-[var(--blue)] transition-all flex items-center gap-1.5 shadow-sm"
                    title="Export timeline to Calendar"
                >
                    <Download size={12} />
                    <span>Calendar (.ics)</span>
                </button>
            </div>

            {/* Overall Syllabus Progress Bar (Sleek & Compact) */}
            <div className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)]">
                <div className="flex justify-between text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider mb-2">
                    <span>Syllabus Velocity</span>
                    <span>{progressPercent}% Complete</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--background)] rounded-full overflow-hidden border border-[var(--border)]/45">
                    <div 
                        className="h-full bg-gradient-to-r from-[var(--blue)] to-indigo-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(74,124,245,0.3)]"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* High-Yield Topics Tag Panel */}
            {roadmap.mostImportantTopics && roadmap.mostImportantTopics.length > 0 && (
                <div className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)] block mb-2.5">Focus Priorities</span>
                    <div className="flex flex-wrap gap-1.5">
                        {roadmap.mostImportantTopics.map((topic, i) => (
                            <span 
                                key={i}
                                className="px-2.5 py-1 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[10px] font-semibold text-[var(--foreground-secondary)]"
                            >
                                {topic}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Timeline Checklist */}
            <div className="relative space-y-4 pl-3">
                {/* Connector Line */}
                <div className="absolute left-[21px] top-4 bottom-4 w-[1px] bg-gradient-to-b from-[var(--blue)] via-[var(--blue)]/30 to-transparent pointer-events-none" />

                {scheduleEntries.map(([timeLabel, taskText], i) => {
                    const isChecked = completedPhases.includes(timeLabel);

                    return (
                        <div key={i} className="relative pl-10 group/node flex items-start gap-4">
                            
                            {/* Checkbox Node */}
                            <button 
                                onClick={() => handleTogglePhase(timeLabel)}
                                className={cn(
                                    "absolute left-2 top-1.5 w-5 h-5 rounded-full border z-10 transition-all duration-300 flex items-center justify-center shadow-sm",
                                    isChecked 
                                        ? "bg-emerald-500 border-emerald-500 text-zinc-950 scale-105 shadow-[0_0_10px_rgba(43,178,136,0.3)]" 
                                        : "bg-[var(--background)] border-[var(--border)] text-white hover:border-[var(--blue)]"
                                )}
                            >
                                {isChecked ? (
                                    <Check size={11} strokeWidth={3.5} />
                                ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--foreground-muted)]/30 group-hover/node:bg-[var(--blue)]" />
                                )}
                            </button>

                            {/* Node Card */}
                            <div className={cn(
                                "flex-1 p-4.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 shadow-xs",
                                isChecked 
                                    ? "bg-emerald-500/[0.03] border-emerald-500/20 opacity-85" 
                                    : "bg-[var(--background-secondary)] border-[var(--border)] hover:border-[var(--blue)]/35 hover:bg-[var(--background)]"
                            )}>
                                <div className="flex flex-col gap-1 text-left">
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-wider font-mono",
                                        isChecked ? "text-emerald-400" : "text-[var(--blue)]"
                                    )}>
                                        {timeLabel}
                                    </span>
                                    <p className={cn(
                                        "text-xs sm:text-sm font-semibold tracking-tight leading-snug",
                                        isChecked ? "text-zinc-500 line-through" : "text-[var(--foreground-secondary)]"
                                    )}>
                                        {taskText}
                                    </p>
                                </div>
                            </div>

                        </div>
                    );
                })}
            </div>

        </div>
    );
};
