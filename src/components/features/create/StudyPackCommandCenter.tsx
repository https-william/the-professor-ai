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
    BrainCircuit,
    AlertTriangle
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

const PHASE_APIS: Record<string, string> = {
    breakdown: "/api/generate/breakdown",
    distill: "/api/generate/summary",
    retain: "/api/generate/flashcards",
    test: "/api/generate/quiz",
    predict: "/api/generate/roadmap",
};

import { createClient } from "@/lib/supabase/client";

export default function StudyPackCommandCenter({ sourceText, onComplete }: StudyPackCommandCenterProps) {
    const supabase = createClient();
    const [phases, setPhases] = useState<Phase[]>([
        { id: "breakdown", title: "Phase 1: Breakdown", subtitle: "Lecture Deconstruct & Deep Analysis", icon: Sparkles, status: "pending" },
        { id: "distill", title: "Phase 2: Summary", subtitle: "Deep Summaries & Analogies", icon: FileText, status: "pending" },
        { id: "retain",  title: "Phase 3: Memory",  subtitle: "Flashcards & Recall Tools", icon: Layers, status: "pending" },
        { id: "test",    title: "Phase 4: Quiz",    subtitle: "Practice Exam Questions", icon: Sword, status: "pending" },
        { id: "predict", title: "Phase 5: Roadmap", subtitle: "Study Plan & Tips", icon: MapIcon, status: "pending" },
    ]);

    const [activePhaseIndex, setActivePhaseIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const executePhase = async (phaseId: string, apiEndpoint: string): Promise<any> => {
        const res = await fetch(apiEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content: sourceText,
                context: sourceText,
                title: sourceText.trim() ? sourceText.trim().replace(/^[^a-zA-Z0-9]+/, '').split(/\s+/).slice(0, 6).join(" ").toUpperCase() : "Study Pack",
                count: 10,
                difficulty: "medium",
                format: phaseId === "distill" ? "bullets" : phaseId === "retain" ? "front_back" : phaseId === "test" ? "mcq" : undefined,
            }),
        });
        if (!res.ok) {
            const errText = await res.text().catch(() => "Unknown error");
            throw new Error(`${apiEndpoint} failed: ${res.status} ${errText}`);
        }

        const contentType = res.headers.get("Content-Type") || "";
        if (contentType.includes("text/event-stream")) {
            const reader = res.body?.getReader();
            if (!reader) throw new Error("Stream not readable");
            const decoder = new TextDecoder();
            let fullSummary = "";
            let finalPayload: any = null;
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                let lineEnd;
                while ((lineEnd = buffer.indexOf('\n')) !== -1) {
                    const line = buffer.slice(0, lineEnd).trim();
                    buffer = buffer.slice(lineEnd + 1);

                    if (line.startsWith("data: ")) {
                        try {
                            const parsed = JSON.parse(line.slice(6));
                            if (parsed.type === "chunk" && parsed.chunk) {
                                fullSummary += parsed.chunk;
                            }
                            if (parsed.status === "complete") {
                                finalPayload = parsed;
                            }
                            if (parsed.status === "error") {
                                throw new Error(parsed.message || parsed.error || "Stream error");
                            }
                        } catch (e) {}
                    }
                }
            }

            if (phaseId === "breakdown") {
                return { breakdown: fullSummary, ...finalPayload };
            }
            if (phaseId === "distill") {
                return { summary: fullSummary, ...finalPayload };
            }
            if (phaseId === "predict") {
                return { title: finalPayload?.title || "Study Roadmap", roadmap: fullSummary, ...finalPayload };
            }
            if (phaseId === "retain") {
                return finalPayload?.flashcards || finalPayload?.data || finalPayload || [];
            }
            if (phaseId === "test") {
                return finalPayload?.quiz || finalPayload?.data || finalPayload || [];
            }
            return finalPayload;
        }

        return res.json();
    };

    useEffect(() => {
        const startGeneration = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Unauthorized");

                const packId = crypto.randomUUID();

                const phaseResults: Record<string, any> = {};

                for (let i = 0; i < 1; i++) {
                    setActivePhaseIndex(i);
                    setPhases(prev => prev.map((p, idx) => idx === i ? { ...p, status: "generating" } : p));

                    const phase = phases[i];
                    const apiEndpoint = PHASE_APIS[phase.id];

                    if (apiEndpoint) {
                        try {
                            const result = await executePhase(phase.id, apiEndpoint);
                            phaseResults[phase.id] = result;
                        } catch (phaseErr: any) {
                            console.warn(`Phase ${phase.id} failed, continuing:`, phaseErr);
                        }
                    }

                    if (i === 0) {
                        const cleanTitle = sourceText.trim() ? sourceText.trim().replace(/^[^a-zA-Z0-9]+/, '').split(/\s+/).slice(0, 6).join(" ").toUpperCase() : `STUDY PACK: ${new Date().toLocaleDateString()}`;
                        const { error: dbError } = await supabase.from("study_packs").insert({
                            id: packId,
                            user_id: user.id,
                            title: cleanTitle,
                            description: "Comprehensive exam survival kit generated from your notes.",
                            source_text: sourceText,
                            phases_data: phaseResults,
                        });

                        if (dbError) throw dbError;
                    }

                    setPhases(prev => prev.map((p, idx) => idx === i ? { ...p, status: "completed" } : p));
                    setProgress(100);
                }

                // Update pack with initial phase result
                await supabase.from("study_packs").update({ phases_data: phaseResults }).eq("id", packId);

                setTimeout(() => {
                    onComplete(packId);
                }, 200);
            } catch (err: any) {
                console.error("Generation Error:", err);
                setError(err.message || "Something went wrong during generation.");
                setPhases(prev => prev.map((p, idx) => idx === activePhaseIndex ? { ...p, status: "error" } : p));
            }
        };

        startGeneration();
    }, []);

    return (
        <div className="w-full max-w-4xl mx-auto py-12 animate-in fade-in zoom-in duration-700">
            {error && (
                <div className="mb-6 p-4 rounded-3xl bg-[var(--crimson-dim)] border border-[var(--crimson-border)] flex items-center gap-3">
                    <AlertTriangle size={20} className="text-[var(--crimson)] shrink-0" />
                    <div>
                        <p className="text-[12px] font-black text-[var(--crimson)] uppercase tracking-wider">Something went wrong</p>
                        <p className="text-[11px] text-[var(--foreground-muted)] mt-1">{error}</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="ml-auto px-4 py-2 rounded-xl bg-[var(--crimson)]/20 text-[var(--crimson)] text-[10px] font-black uppercase tracking-wider hover:bg-[var(--crimson)]/30 transition-all"
                    >
                        Retry
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
                {/* Main Viewport */}
                <div className="space-y-6">
                    <div className="p-10 rounded-[48px] bg-[var(--card)] border border-[var(--border)] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] relative overflow-hidden">
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
                                        phase.status === "error" ? "bg-[var(--crimson-dim)] border-[var(--crimson)] text-[var(--crimson)]" :
                                        "bg-transparent border-[var(--border)] text-[var(--foreground-muted)]"
                                    )}>
                                        {phase.status === "completed" ? <CheckCircle2 size={24} /> : 
                                         phase.status === "generating" ? <Loader2 size={24} className="animate-spin" /> :
                                         phase.status === "error" ? <AlertTriangle size={24} /> :
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
                                            {phase.status === "error" && (
                                                <span className="text-[10px] font-black text-[var(--crimson)] uppercase tracking-widest">Skipped</span>
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

                    <div className="p-6 rounded-[32px] bg-[var(--bg-3)] border border-[var(--border)]">
                        <p className="text-[10px] font-black text-[var(--foreground-muted)]/50 uppercase tracking-[0.4em] text-center">
                            The Professor is analyzing {sourceText.length.toLocaleString()} characters of knowledge
                        </p>
                    </div>
                </div>

                {/* Info Sidebar */}
                <div className="space-y-6">
                    <div className="p-8 rounded-[40px] bg-[var(--card)] border border-[var(--border)] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)]">
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