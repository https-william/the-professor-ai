"use client";

import { useState, useEffect } from "react";
import { 
    Zap, 
    FileText, 
    Layers, 
    Sword, 
    Map as MapIcon, 
    CheckCircle2, 
    Loader2, 
    ArrowRight,
    Sparkles,
    ChevronRight,
    Clock,
    BrainCircuit
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface StudyPackCommandCenterProps {
    sourceText: string;
    onComplete: (packId: string) => void;
}

type PhaseStatus = "pending" | "generating" | "completed" | "error";

interface Phase {
    id: string;
    title: string;
    subtitle: string;
    icon: any;
    status: PhaseStatus;
    result?: any;
}

import { createClient } from "@/lib/supabase/client";

export default function StudyPackCommandCenter({ sourceText, onComplete }: StudyPackCommandCenterProps) {
    const supabase = createClient();
    const [phases, setPhases] = useState<Phase[]>([
        { id: "distill", title: "Phase 1: Summary", subtitle: "Deep Summaries & Analogies", icon: FileText, status: "pending" },
        { id: "retain",  title: "Phase 2: Memory",  subtitle: "Flashcards & Recall Tools", icon: Layers, status: "pending" },
        { id: "test",    title: "Phase 3: Quiz",    subtitle: "Practice Exam Questions", icon: Sword, status: "pending" },
        { id: "predict", title: "Phase 4: Roadmap", subtitle: "Study Plan & Mastery", icon: MapIcon, status: "pending" },
    ]);

    const [activePhaseIndex, setActivePhaseIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const startGeneration = async () => {
            try {
                // 1. Initialize Record in Supabase
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Unauthorized");

                const packId = crypto.randomUUID();

                // Start the visual generation loop
                for (let i = 0; i < phases.length; i++) {
                    setActivePhaseIndex(i);
                    setPhases(prev => prev.map((p, idx) => idx === i ? { ...p, status: "generating" } : p));
                    
                    // Small visual delay to show progress to user
                    await new Promise(resolve => setTimeout(resolve, 800));
                    
                    if (i === 0) {
                        // Create the pack record on the first phase "completion" (initialization)
                        const { error: dbError } = await supabase.from("study_packs").insert({
                            id: packId,
                            user_id: user.id,
                            title: `Study Pack: ${new Date().toLocaleDateString()}`,
                            description: "Comprehensive exam survival kit generated from your notes.",
                            source_text: sourceText,
                            phases_data: {}
                        });

                        if (dbError) throw dbError;
                    }
                    
                    setPhases(prev => prev.map((p, idx) => idx === i ? { ...p, status: "completed" } : p));
                    setProgress((i + 1) * 25);
                }
                
                // Finalization
                setTimeout(() => {
                    onComplete(packId);
                }, 500);
            } catch (err: any) {
                console.error("Generation Error:", err);
                setError(err.message);
            }
        };

        startGeneration();
    }, []);

    return (
        <div className="w-full max-w-4xl mx-auto py-12 animate-in fade-in zoom-in duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
                {/* Main Viewport */}
                <div className="space-y-6">
                    <div className="p-10 rounded-[48px] bg-white border border-[var(--border)] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                            <Sparkles className="w-12 h-12 text-[var(--accent)] opacity-10 animate-pulse" />
                        </div>

                        <div className="mb-12">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="px-3 py-1 rounded-full bg-[var(--accent-bg)]/20 border border-[var(--accent)]/30 text-[var(--accent)] text-[10px] font-black uppercase tracking-widest">
                                    Exam Sprint v2.0
                                </div>
                                <div className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={12} /> Writing...
                                </div>
                            </div>
                            <h2 className="text-4xl font-black text-[var(--foreground)] tracking-tighter uppercase italic leading-[0.9]">
                                Creating Your <br/> <span className="text-[var(--accent)]">Study Guide</span>
                            </h2>
                        </div>

                        <div className="space-y-8">
                            {phases.map((phase, i) => (
                                <div key={phase.id} className={cn(
                                    "flex items-start gap-6 transition-all duration-500",
                                    i > activePhaseIndex ? "opacity-30 blur-[2px]" : "opacity-100"
                                )}>
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all duration-700",
                                        phase.status === "completed" ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-[0_0_20px_var(--accent-glow)]" :
                                        phase.status === "generating" ? "bg-transparent border-[var(--accent)] text-[var(--accent)] animate-pulse" :
                                        "bg-transparent border-[var(--border)] text-[var(--foreground-muted)]"
                                    )}>
                                        {phase.status === "completed" ? <CheckCircle2 size={24} /> : 
                                         phase.status === "generating" ? <Loader2 size={24} className="animate-spin" /> :
                                         <phase.icon size={24} />}
                                    </div>

                                    <div className="flex-1 pt-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className={cn(
                                                "text-lg font-black uppercase tracking-tight transition-colors",
                                                i === activePhaseIndex ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]"
                                            )}>
                                                {phase.title}
                                            </h4>
                                            {phase.status === "generating" && (
                                                <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest animate-pulse">Processing...</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-[var(--foreground-muted)] font-medium">{phase.subtitle}</p>
                                        
                                        {phase.status === "generating" && (
                                            <div className="mt-4 h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: "100%" }}
                                                    transition={{ duration: 0.8 }}
                                                    className="h-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)]"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 rounded-[32px] bg-white/[0.02] border border-white/5">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] text-center">
                            The Professor is analyzing {sourceText.length.toLocaleString()} characters of knowledge
                        </p>
                    </div>
                </div>

                {/* Info Sidebar */}
                <div className="space-y-6">
                    <div className="p-8 rounded-[40px] bg-white border border-[var(--border)] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)]">
                        <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-widest mb-6">Pack Contents</h3>
                        <ul className="space-y-4">
                            {[
                                "30+ Study Flashcards",
                                "Easy-to-follow Analogies",
                                "15 Practice Questions",
                                "Custom Study Plan",
                                "Study Area Check"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-xs font-bold text-[var(--foreground-muted)]">
                                    <ChevronRight size={14} className="text-[var(--accent)]" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="p-8 rounded-[40px] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <BrainCircuit className="w-12 h-12 absolute -bottom-2 -right-2 opacity-10 rotate-12" />
                        <h3 className="text-lg font-black uppercase tracking-tight mb-2">The Study Lab</h3>
                        <p className="text-xs font-bold opacity-80 leading-relaxed mb-6">
                            The Professor is organizing your notes into simple, high-yield study materials for you.
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                            <Sparkles size={12} /> Smart Study
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
