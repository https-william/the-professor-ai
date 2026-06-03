"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useToasts } from "@/components/ui/GlobalToasts";
import { 
    ChevronLeft, 
    Share2, 
    CheckCircle2, 
    Network,
    MapIcon
} from "lucide-react";
import { StudyRoadmap } from "@/components/features/StudyRoadmap";

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
    const { addToast } = useToasts();
    const [copySuccess, setCopySuccess] = useState(false);

    const handleCopyLink = () => {
        const url = generationId ? `${window.location.origin}/roadmap/${generationId}` : window.location.href;
        navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        addToast("Link copied to clipboard", "success");
    };

    // Determine if we should render the legacy timeline or the rich StudyRoadmap component
    const isLegacyArray = Array.isArray(phases) && phases.length > 0 && typeof phases[0] === 'object' && 'phase' in phases[0];

    return (
        <div className="min-h-screen w-full flex flex-col items-center bg-transparent">
            {/* Header */}
            <header className="w-full max-w-5xl p-6 flex items-center justify-between z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/library')} className="p-2 rounded-full hover:bg-white/5 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-0.5">Curriculum</p>
                        <h1 className="text-sm font-bold truncate max-w-[200px]">{title}</h1>
                    </div>
                </div>
                <button onClick={handleCopyLink} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                    <Share2 size={18} />
                </button>
            </header>

            <main className="flex-1 w-full max-w-5xl px-4 sm:px-6 py-12">
                {isLegacyArray ? (
                    <>
                        <div className="mb-20">
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-20 mb-4 block">Architectural Thesis</span>
                            <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight mb-8">{title}</h2>
                            <p className="text-lg opacity-40 font-medium leading-relaxed max-w-2xl">
                                This syllabus represents an optimized cognitive path through the material, structured for maximum retention and sequential progression.
                            </p>
                        </div>

                        <div className="relative">
                            {/* Vertical Line */}
                            <div className="absolute left-3 md:left-7 top-0 bottom-0 w-px bg-white/5" />

                            <div className="space-y-16 relative z-10">
                                {(phases as Phase[]).map((phase, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1 }}
                                        key={idx} 
                                        className="relative pl-10 md:pl-20 group"
                                    >
                                        {/* Indicator */}
                                        <div className="absolute left-1 md:left-5 top-1.5 w-4 h-4 rounded-full bg-[#0A0A0F] border-2 border-white/10 flex items-center justify-center group-hover:border-[var(--foreground)] transition-colors">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-[var(--foreground)] transition-colors" />
                                        </div>

                                        <div className="p-6 md:p-10 rounded-[28px] md:rounded-[40px] bg-white/[0.02] border border-white/5 transition-all group-hover:border-white/10 group-hover:bg-white/[0.04] shadow-2xl">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                                                <span className="self-start px-3 py-1 rounded-lg bg-white/10 text-[var(--foreground)] text-[10px] font-black uppercase tracking-widest">Phase {idx + 1}</span>
                                                <h3 className="text-xl font-bold">{phase.phase}</h3>
                                            </div>
                                            <p className="text-sm opacity-40 leading-relaxed mb-8">{phase.description}</p>
                                            
                                            {phase.milestones && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {phase.milestones.map((m, i) => (
                                                        <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-black/40 border border-white/5">
                                                            <CheckCircle2 size={16} className="text-[var(--foreground)] shrink-0" />
                                                            <span className="text-[12px] opacity-60 font-medium leading-tight">{m}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-32 py-20 border-t border-white/5 flex flex-col items-center text-center opacity-10">
                            <Network size={40} className="mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.6em]">The Professor Integrity Network</p>
                            <p className="text-[8px] mt-3 tracking-[0.3em]">ALGORITHM VERIFIED ARCHITECTURE v4.2</p>
                        </div>
                    </>
                ) : (
                    <StudyRoadmap data={phases} />
                )}
            </main>
        </div>
    );
}
