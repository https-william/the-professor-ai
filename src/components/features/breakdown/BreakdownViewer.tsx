"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Markdown from "@/components/ui/Markdown";
import { useToasts } from "@/components/ui/GlobalToasts";
import { cn } from "@/lib/utils";
import { 
    ChevronLeft, 
    Share2, 
    Download, 
    CheckCircle2,
    ArrowRight,
    Loader2
} from "lucide-react";
import { exportToPDF } from "@/lib/pdf-bridge";
import ProgressNodeTrack from "@/components/ui/ProgressNodeTrack";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";

interface BreakdownViewerProps {
    data: string;
    title: string;
    generationId?: string | null;
    onFinish?: () => void;
    isStreaming?: boolean;
}

// Programmatic Web Audio Synthesizer
const playResultsSound = (type: "click" | "page-turn") => {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;

        if (type === "click") {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(580, now);
            gain.gain.setValueAtTime(0.012, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.06);
        } else if (type === "page-turn") {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);
            gain.gain.setValueAtTime(0.008, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        }
    } catch (e) {}
};

export default function BreakdownViewer({ data, title, generationId, onFinish, isStreaming }: BreakdownViewerProps) {
    const router = useRouter();
    const { addToast } = useToasts();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [copySuccess, setCopySuccess] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const fullMarkdownContent = useMemo(() => {
        if (!data) return "";
        return data;
    }, [data]);

    const handleExportPDF = async () => {
        if (isExporting) return;
        setIsExporting(true);
        addToast("Preparing high-fidelity export...", "info");

        try {
            await exportToPDF("breakdown-export-container", {
                title: title,
                filename: `The_Professor_Breakdown_${title.replace(/\s+/g, '_')}`,
                author: "The Professor AI",
                markdownContent: fullMarkdownContent
            });
            addToast("PDF Export successful", "success");
        } catch (error) {
            addToast("Failed to generate PDF", "error");
        } finally {
            setIsExporting(false);
        }
    };

    const processedChapters = useMemo(() => {
        if (!data) return [];
        const rawSections = data.split(/\n### /g);
        return rawSections.map((s, i) => {
            const content = i > 0 ? "### " + s : s;
            return { text: content };
        });
    }, [data]);

    const handleCopyLink = () => {
        const url = generationId ? `${window.location.origin}/breakdown/${generationId}` : window.location.href;
        navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        addToast("Link copied to clipboard", "success");
    };

    const handleFinish = () => {
        if (onFinish) {
            onFinish();
            return;
        }
        const isSprint = sessionStorage.getItem("isExamSprint") === "true";
        if (isSprint) {
            const sprintContent = sessionStorage.getItem("examSprintContent") || "";
            const params = JSON.parse(sessionStorage.getItem("generateParams") || "{}");
            sessionStorage.setItem("generateParams", JSON.stringify({
                ...params,
                content: sprintContent,
                type: "summary",
                style: "concise"
            }));
            router.push("/summary/generate");
            addToast("Breakdown complete. Starting Summary...", "success");
        } else {
            router.push("/library");
        }
    };

    if (processedChapters.length === 0) return null;

    const currentChapter = processedChapters[currentSlide];

    return (
        <div className="h-[calc(100vh-68px)] w-full flex flex-col items-center bg-transparent overflow-hidden">
            {!onFinish && (
                <header className="w-full max-w-3xl p-6 flex items-center justify-between z-20 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => { playResultsSound("click"); router.push('/library'); }} 
                            className="p-2 rounded-full hover:bg-white/5 transition-colors text-zinc-400 hover:text-white cursor-pointer"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--emerald)] mb-0.5">The Breakdown</p>
                            <h1 className="text-sm font-bold truncate max-w-[200px] text-white">{title}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleCopyLink} 
                            className="p-2 rounded-xl hover:bg-white/5 transition-colors text-zinc-400 hover:text-white cursor-pointer"
                        >
                            <Share2 size={18} />
                        </button>
                    </div>
                </header>
            )}

            <AnimatePresence mode="wait">
                <motion.main 
                    key={currentSlide}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex-1 w-full max-w-3xl px-6 py-4 flex flex-col overflow-hidden"
                >
                    <div className="mb-6 flex-shrink-0">
                        <div className="flex items-center gap-3 mb-4">
                            <ProgressNodeTrack
                                total={processedChapters.length}
                                current={currentSlide}
                                completed={Array.from({ length: currentSlide }, (_, i) => i)}
                                activeColor="var(--emerald)"
                                completedColor="var(--emerald)"
                            />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight mb-2 text-white">
                            {currentSlide === 0 ? title : currentChapter.text.split("\n")[0].replace("### ", "")}
                        </h2>
                    </div>

                    <GlassmorphicCard intensity="medium" radius="24px" className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar mb-6">
                        <div className="font-serif prose prose-invert max-w-none text-zinc-300 text-[15px] leading-relaxed">
                            <Markdown className="reveal-ceremony font-serif">
                                {currentSlide === 0 ? currentChapter.text : currentChapter.text.split("\n").slice(1).join("\n")}
                            </Markdown>
                        </div>
                    </GlassmorphicCard>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5 pb-20 flex-shrink-0">
                        <button 
                            onClick={() => {
                                playResultsSound("page-turn");
                                setCurrentSlide(prev => Math.max(0, prev - 1));
                            }}
                            className={cn(
                                "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all text-white cursor-pointer",
                                currentSlide === 0 && "opacity-0 pointer-events-none"
                            )}
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>

                        {currentSlide < processedChapters.length - 1 ? (
                            <button 
                                onClick={() => {
                                    playResultsSound("page-turn");
                                    setCurrentSlide(prev => prev + 1);
                                }}
                                className="group flex items-center gap-4 bg-[var(--amber)] text-[var(--background)] px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover-scale-lg active:scale-95 shadow-xl shadow-[var(--amber-glow)] cursor-pointer"
                            >
                                <span>Proceed</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <button 
                                onClick={() => {
                                    playResultsSound("click");
                                    handleFinish();
                                }}
                                disabled={isStreaming}
                                className="group flex items-center gap-4 bg-[var(--emerald)] text-[var(--background)] px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover-scale-lg active:scale-95 shadow-xl shadow-[var(--emerald-glow)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <span>{isStreaming ? "Generating..." : "Finish Breakdown"}</span>
                                {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            </button>
                        )}
                    </div>
                </motion.main>
            </AnimatePresence>

            {/* Floating Glass Capsule */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 p-1.5 flex-shrink-0">
                <GlassmorphicCard intensity="heavy" radius="9999px" className="flex items-center gap-2 p-1.5 border border-white/10 shadow-2xl">
                    <button 
                        onClick={handleCopyLink}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--emerald)] text-[var(--background)] font-black text-[10px] uppercase tracking-wider transition-all hover-scale-lg active:scale-95 cursor-pointer"
                    >
                        <Share2 size={14} />
                        <span>{copySuccess ? "Copied!" : "Share Link"}</span>
                    </button>
                    <div className="w-[1px] h-4 bg-white/10 mx-1" />
                    <button 
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="p-2.5 rounded-full hover:bg-white/5 transition-colors disabled:opacity-50 text-white cursor-pointer" 
                        title="Download PDF"
                    >
                        {isExporting ? (
                            <Loader2 size={16} className="animate-spin text-[var(--amber)]" />
                        ) : (
                            <Download size={16} className="opacity-40 hover:opacity-100 transition-opacity" />
                        )}
                    </button>
                </GlassmorphicCard>
            </div>

            {/* Hidden Export Container */}
            <div className="fixed left-[-9999px] top-0 pointer-events-none">
                <div id="breakdown-export-container" className="w-[800px] bg-[var(--background)] text-zinc-100 p-20 font-sans">
                    <div className="mb-20 pb-10 border-b border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--amber)] mb-4">The Professor Breakdown Report</p>
                        <h1 className="text-5xl font-black tracking-tight leading-tight">{title}</h1>
                    </div>
                    <div className="prose prose-invert max-w-none font-serif text-[16px] leading-relaxed">
                        <Markdown>{fullMarkdownContent}</Markdown>
                    </div>
                </div>
            </div>
        </div>
    );
}
