"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/ui/SiteHeader";
import { useToasts } from "@/components/ui/GlobalToasts";
import { motion, AnimatePresence } from "framer-motion";
import EndowmentModal from "@/components/modals/EndowmentModal";
import { 
    Map as MapIcon, 
    AlertCircle, 
    ChevronLeft, 
    GraduationCap, 
    Zap, 
    Share, 
    Link as LinkIcon, 
    FileDown, 
    CheckCircle2, 
    Network 
} from "lucide-react";

function RoadmapContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, refreshUser } = useUser();
    const { addToast } = useToasts();
    
    const [roadmap, setRoadmap] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const hasStartedGeneration = useRef(false);
    const [isEndowmentOpen, setIsEndowmentOpen] = useState(false);

    useEffect(() => {
        const init = async () => {
            const id = searchParams.get("id");
            const mode = searchParams.get("mode");

            if (id) {
                try {
                    setIsGenerating(false);
                    const supabase = createClient();
                    const { data, error } = await supabase
                        .from("generations")
                        .select("*")
                        .eq("id", id)
                        .single();

                    if (error || !data) throw new Error("Route not found");

                    const finalRoadmap = {
                        id: data.id,
                        type: "roadmap",
                        data: data.content?.phases || data.content || [],
                        title: data.title || "Academic Roadmap",
                    };
                    setRoadmap(finalRoadmap);
                    return;
                } catch (e) {
                    console.error("Load error:", e);
                    router.push("/create");
                    return;
                }
            }

            if (mode === "generate") {
                if (hasStartedGeneration.current) return;
                
                const paramsStr = sessionStorage.getItem("generateParams");
                if (!paramsStr) {
                    router.push("/create"); return;
                }
                
                hasStartedGeneration.current = true;
                const params = JSON.parse(paramsStr);
                sessionStorage.removeItem("generateParams");
                
                setIsGenerating(true);
                setRoadmap(null);
                setGenerationError(null);
                
                const titleFromContent = params.content?.substring(0, 100) || "Study Roadmap";
                
                try {
                    const response = await fetch("/api/generate/roadmap", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                            title: titleFromContent, 
                            context: params.content 
                        }),
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        console.error("[Roadmap] error response:", errorData);
                        if (response.status === 402 || errorData.code === "INSUFFICIENT_CREDITS") {
                            setIsEndowmentOpen(true);
                            setIsGenerating(false);
                            return;
                        }
                        throw new Error(errorData.error || "Architectural synthesis failed");
                    }
                    
                    const data = await response.json();
                    
                    if (!data.roadmap) throw new Error("Synthesis payload missing");

                    setRoadmap({
                        id: data.roadmap.id,
                        type: "roadmap",
                        data: data.roadmap.content?.phases || data.roadmap.content || [],
                        title: data.roadmap.title || "Academic Roadmap"
                    });

                    if (data.xpEarned) {
                        addToast(`Syllabus Architected! +${data.xpEarned} XP`, 'xp');
                    }
                    
                    refreshUser();

                } catch (e: any) {
                    console.error("Roadmap error:", e);
                    console.error("Response status:", e?.response?.status);
                    console.error("Response data:", e?.response?.data);
                    const errorMessage = e?.response?.data?.error || e.message || "Generation failed";
                    setGenerationError(errorMessage);
                } finally {
                    setIsGenerating(false);
                }
            } else {
                router.push("/create");
            }
        };
        init();
    }, [router, searchParams]);

    const [isShareOpen, setIsShareOpen] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const handleCopyLink = () => {
        if (roadmap?.id) {
            const url = `${window.location.origin}/roadmap?id=${roadmap.id}`;
            navigator.clipboard.writeText(url);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    if (isGenerating) {
        return (
            <div className="min-h-screen bg-[#06060B] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
                 <div className="absolute inset-0 flex flex-col p-6 opacity-[0.05] pointer-events-none z-0">
                    <div className="max-w-3xl w-full mx-auto space-y-4 pt-20">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className="flex gap-4">
                                <div className="w-12 h-12 rounded-full bg-white animate-pulse shrink-0" />
                                <div className="flex-1 h-20 rounded-2xl bg-white animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="relative z-10 text-center animate-in zoom-in-95 duration-700">
                    <div className="w-20 h-20 mx-auto mb-8 rounded-3xl nm-flat flex items-center justify-center relative">
                        <div className="absolute inset-0 rounded-3xl border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
                        <MapIcon size={30} strokeWidth={1.5} className="text-purple-500" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight mb-2">Architecting Syllabus</h2>
                    <p className="text-white/30 text-[10px] uppercase tracking-[0.5em] font-black">Phased Implementation Strategy</p>
                </div>
            </div>
        );
    }

    if (generationError) {
        return (
            <div className="min-h-screen bg-[#06060B] text-white flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 nm-flat text-red-500">
                    <AlertCircle size={30} strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-bold mb-2">Synthesis Failed</h2>
                <p className="text-sm text-white/30 mb-8 text-center max-w-xs">{generationError}</p>
                <button onClick={() => router.push('/create')} className="px-8 py-4 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                    Restart Process
                </button>
            </div>
        );
    }

    if (!roadmap) return null;

    const sections = Array.isArray(roadmap.data) ? roadmap.data : [];

    return (
        <div className="min-h-screen bg-[#06060B] text-white pb-32 print:bg-white print:text-black print:pb-0">
            <style jsx global>{`
                @media print {
                    header, 
                    .no-print,
                    .nm-flat,
                    .nm-inset,
                    button,
                    nav,
                    .absolute.left-6 {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                    }
                    .p-8 {
                        padding: 1.5rem !important;
                        border: 1px solid #eee !important;
                        border-radius: 1rem !important;
                        background: transparent !important;
                        box-shadow: none !important;
                        margin-bottom: 1rem !important;
                        page-break-inside: avoid;
                    }
                    .bg-[#06060B] {
                        background: white !important;
                    }
                    .text-white\/40, .text-white\/60, .text-white\/30, .text-white\/20 {
                        color: #444 !important;
                    }
                    .text-white {
                        color: black !important;
                    }
                    .nm-inset-bezel {
                        background: #f9f9f9 !important;
                        border: 1px solid #eee !important;
                        box-shadow: none !important;
                    }
                    .nm-flat {
                        box-shadow: none !important;
                    }
                }
            `}</style>
            
            <main className="relative z-10 max-w-5xl mx-auto px-6 pt-32 sm:pt-40">
                <div className="mb-16 print:mb-8">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 mb-4 block print:text-black/40">Architectural Thesis</span>
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight print:text-black">{roadmap.title}</h2>
                    <p className="mt-6 text-white/40 text-lg font-medium leading-relaxed max-w-2xl print:text-black/60">This syllabus represents an optimized cognitive path through the material, structured into chronological phases designed for maximum retention.</p>
                </div>

                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-white/5" />

                    <div className="space-y-12 relative z-10">
                        {sections.map((phase: any, idx: number) => (
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={idx} 
                                className="relative pl-16 group"
                            >
                                {/* Dot */}
                                <div className="absolute left-4 top-0 w-4 h-4 rounded-full bg-[#06060B] border-2 border-white/10 flex items-center justify-center group-hover:border-purple-500 transition-colors">
                                    <div className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-purple-500 transition-colors" />
                                </div>

                                <div className="p-8 rounded-[32px] nm-flat border border-white/5 transition-all group-hover:border-purple-500/20">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="px-3 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-widest">Phase {idx + 1}</span>
                                        <h3 className="text-lg font-bold text-white/90">{phase.phase || phase.topic}</h3>
                                    </div>
                                    <p className="text-sm text-white/40 leading-relaxed mb-6">{phase.description || phase.summary}</p>
                                    
                                    {phase.milestones && (
                                        <div className="space-y-3">
                                            {phase.milestones.map((m: string, i: number) => (
                                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl nm-inset-bezel bg-black/20">
                                                    <CheckCircle2 size={14} strokeWidth={1.5} className="text-purple-400" />
                                                    <span className="text-[12px] text-white/60 font-medium">{m}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Proof of Structure */}
                <div className="mt-20 py-12 border-t border-white/5 flex flex-col items-center text-center opacity-20">
                    <Network size={36} strokeWidth={1.5} className="mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">The Professor Integrity Network</p>
                    <p className="text-[9px] mt-2 tracking-[0.2em]">ALGORITHM VERIFIED ARCHITECTURE v4.2</p>
                </div>
            </main>

            <EndowmentModal 
                isOpen={isEndowmentOpen} 
                onClose={() => setIsEndowmentOpen(false)}
                currentCredits={user?.credits || 0}
                requiredCredits={1}
            />
        </div>
    );
}

export default function RoadmapPage() {
    return (
        <div className="min-h-screen bg-[#06060B]">
            <Suspense fallback={<div className="min-h-screen bg-[#06060B] flex items-center justify-center">Loading...</div>}>
                <RoadmapContent />
            </Suspense>
        </div>
    );
}
