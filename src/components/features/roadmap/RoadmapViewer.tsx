"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useToasts } from "@/components/ui/GlobalToasts";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import { 
    ChevronLeft, 
    Share2, 
    CheckCircle2, 
    Network,
    MapIcon,
    Compass,
    Check
} from "lucide-react";
import { StudyRoadmap } from "@/components/features/StudyRoadmap";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import ProgressNodeTrack from "@/components/ui/ProgressNodeTrack";

interface Phase {
    phase: string;
    description: string;
    milestones: string[];
}

interface RoadmapViewerProps {
    phases: any; // Can be Phase[] or { roadmap: string } or string
    title: string;
    generationId?: string | null;
}

export default function RoadmapViewer({ phases, title, generationId }: RoadmapViewerProps) {
    const router = useRouter();
    const { user } = useUser();
    const { addToast } = useToasts();
    const [copySuccess, setCopySuccess] = useState(false);
    const [completedLegacyPhases, setCompletedLegacyPhases] = useState<number[]>([]);

    // Check if phases represents the legacy simple array syllabus
    const isLegacyArray = Array.isArray(phases) && phases.length > 0 && typeof phases[0] === 'object' && 'phase' in phases[0];

    // Load legacy checklist from localStorage if relevant
    useEffect(() => {
        if (isLegacyArray && generationId) {
            try {
                const saved = localStorage.getItem(`roadmap_legacy_local_${generationId}`);
                if (saved) {
                    setCompletedLegacyPhases(JSON.parse(saved));
                }
            } catch (e) {
                console.warn(e);
            }
        }
    }, [isLegacyArray, generationId]);

    const handleCopyLink = () => {
        const url = generationId ? `${window.location.origin}/roadmap/${generationId}` : window.location.href;
        navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        addToast("Link copied to clipboard! 🔗", "success");
    };

    const handleToggleLegacyPhase = (idx: number) => {
        const isCompleted = completedLegacyPhases.includes(idx);
        const next = isCompleted
            ? completedLegacyPhases.filter(i => i !== idx)
            : [...completedLegacyPhases, idx];
        
        setCompletedLegacyPhases(next);
        if (generationId) {
            try {
                localStorage.setItem(`roadmap_legacy_local_${generationId}`, JSON.stringify(next));
            } catch (e) {
                console.warn(e);
            }
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center bg-transparent select-none pb-16">
            {/* Header */}
            <header className="w-full max-w-5xl p-6 flex items-center justify-between z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/library')} className="p-2.5 rounded-full bg-[var(--background-secondary)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--foreground)] transition-colors cursor-pointer">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--amber)] mb-0.5">Syllabus Path</p>
                        <h1 className="text-sm font-bold truncate max-w-[200px] sm:max-w-xs text-[var(--foreground)]">{title}</h1>
                    </div>
                </div>
                <button onClick={handleCopyLink} className="p-2.5 rounded-xl bg-[var(--background-secondary)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--foreground-secondary)] transition-all cursor-pointer flex items-center gap-2">
                    <Share2 size={16} />
                    <span className="text-[11px] font-bold hidden sm:inline">Share</span>
                </button>
            </header>

            <main className="flex-1 w-full max-w-5xl px-4 sm:px-6 py-6 md:py-10">
                {isLegacyArray ? (
                    <div className="max-w-4xl mx-auto space-y-12">
                        {/* Summary Kicker */}
                        <div className="text-center md:text-left mb-16 relative">
                            <div className="absolute inset-0 -top-10 bg-gradient-to-b from-[var(--amber)]/5 via-transparent to-transparent blur-3xl pointer-events-none -z-10" />
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--amber)]/10 text-[var(--amber)] border border-[var(--amber)]/20 text-[9px] font-black uppercase tracking-wider mb-4">
                                <Compass size={12} className="animate-spin-slow" /> Syllabus Roadmap
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter leading-tight mb-4 uppercase italic">
                                {title}
                            </h2>
                            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] font-medium leading-relaxed max-w-2xl">
                                This syllabus represents an optimized cognitive path through the material, structured for maximum retention and sequential progression.
                            </p>
                        </div>

                        {/* Timeline */}
                        <div className="relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[17px] sm:left-[35px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-[var(--amber)] via-[var(--amber)]/30 to-transparent rounded-full" />

                            <div className="space-y-10 relative z-10">
                                {(phases as Phase[]).map((phase, idx) => {
                                    const isChecked = completedLegacyPhases.includes(idx);
                                    return (
                                        <motion.div 
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: idx * 0.08 }}
                                            key={idx} 
                                            className="relative pl-12 sm:pl-20 group flex items-start gap-4"
                                        >
                                            {/* Checklist Indicator */}
                                            <button 
                                                onClick={() => handleToggleLegacyPhase(idx)}
                                                className={`absolute left-2 sm:left-6 top-2 w-5 h-5 rounded-full border z-10 transition-all duration-300 flex items-center justify-center shadow-md cursor-pointer ${
                                                    isChecked 
                                                        ? "bg-[var(--emerald)] border-[var(--emerald)] text-zinc-950 scale-110" 
                                                        : "bg-[var(--background-secondary)] border border-[var(--border-2)] text-[var(--foreground)] hover:border-[var(--amber)]"
                                                }`}
                                            >
                                                {isChecked ? (
                                                    <Check size={12} strokeWidth={3.5} />
                                                ) : (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--foreground-muted)]/40 group-hover:bg-[var(--foreground)]" />
                                                )}
                                            </button>

                                            {/* Content Card */}
                                            <GlassmorphicCard 
                                                intensity="medium" 
                                                className={`flex-1 p-6 md:p-8 transition-all hover:border-[var(--amber)]/30 ${
                                                    isChecked ? "opacity-75 border-[var(--emerald)]/20" : ""
                                                }`}
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                                                    <span className={`self-start px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                                                        isChecked 
                                                            ? "bg-[var(--emerald-dim)] text-[var(--emerald)] border border-[var(--emerald-border)]" 
                                                            : "bg-[var(--amber-dim)]/20 text-[var(--amber)] border border-[var(--amber-border)]"
                                                    }`}>
                                                        Phase {idx + 1}
                                                    </span>
                                                    <h3 className={`text-lg font-bold tracking-tight ${
                                                        isChecked ? "text-[var(--foreground-muted)] line-through" : "text-[var(--foreground)]"
                                                    }`}>
                                                        {phase.phase}
                                                    </h3>
                                                </div>
                                                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed mb-6 font-serif">
                                                    {phase.description}
                                                </p>
                                                
                                                {phase.milestones && phase.milestones.length > 0 && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                        {phase.milestones.map((m, i) => (
                                                            <div key={i} className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                                                                <CheckCircle2 size={14} className="text-[var(--emerald)] shrink-0" />
                                                                <span className="text-[11px] text-[var(--foreground-secondary)] font-semibold leading-tight">{m}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </GlassmorphicCard>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer Integrity Indicator */}
                        <div className="mt-24 py-12 border-t border-white/5 flex flex-col items-center text-center opacity-15">
                            <Network size={32} className="mb-3 text-[var(--amber)]" />
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[var(--foreground)]">Strategic Syllabus Engine</p>
                            <p className="text-[7px] mt-2 tracking-[0.25em] font-mono text-[var(--foreground-muted)]">ALGORITHM VERIFIED ARCHITECTURE v4.3</p>
                        </div>
                    </div>
                ) : (
                    <StudyRoadmap data={phases} generationId={generationId || undefined} />
                )}
            </main>
        </div>
    );
}
