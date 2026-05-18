"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Markdown from "@/components/ui/Markdown";
import { useToasts } from "@/components/ui/GlobalToasts";
import { cn } from "@/lib/utils";
import { 
    HelpCircle, 
    FileText, 
    ChevronLeft, 
    Share2, 
    Download, 
    CheckCircle2,
    ArrowRight,
    Loader2
} from "lucide-react";
import { exportToPDF } from "@/lib/pdf-bridge";

interface BreakdownViewerProps {
    data: string;
    title: string;
    generationId?: string | null;
    onFinish?: () => void;
    isStreaming?: boolean;
}

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
                author: "The Professor AI"
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
        <div className="min-h-screen w-full flex flex-col items-center bg-transparent">
            {!onFinish && (
                <header className="w-full max-w-5xl p-6 flex items-center justify-between z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/library')} className="p-2 rounded-full hover:bg-white/5 transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#10B981] mb-0.5">The Breakdown</p>
                            <h1 className="text-sm font-bold truncate max-w-[200px]">{title}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleCopyLink} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
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
                    className="flex-1 w-full max-w-3xl px-6 py-12"
                >
                    <div className="mb-16">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                                Section {currentSlide + 1} / {processedChapters.length}
                            </span>
                        </div>
                        <h2 className="text-4xl font-black tracking-tight leading-tight mb-6">
                            {currentSlide === 0 ? title : currentChapter.text.split("\n")[0].replace("### ", "")}
                        </h2>
                    </div>

                    <div className="mb-32">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSlide}
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.1
                                        }
                                    }
                                }}
                            >
                                <Markdown className="reveal-ceremony">
                                    {currentSlide === 0 ? currentChapter.text : currentChapter.text.split("\n").slice(1).join("\n")}
                                </Markdown>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5 pb-20">
                        <button 
                            onClick={() => {
                                setCurrentSlide(prev => Math.max(0, prev - 1));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={cn(
                                "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all",
                                currentSlide === 0 && "opacity-0 pointer-events-none"
                            )}
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>

                        {currentSlide < processedChapters.length - 1 ? (
                            <button 
                                onClick={() => {
                                    setCurrentSlide(prev => prev + 1);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="group flex items-center gap-4 bg-[var(--accent)] text-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-amber-500/10"
                            >
                                <span>Proceed</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <button 
                                onClick={handleFinish}
                                disabled={isStreaming}
                                className="group flex items-center gap-4 bg-emerald-500 text-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>{isStreaming ? "Generating..." : "Finish Breakdown"}</span>
                                {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            </button>
                        )}
                    </div>
                </motion.main>
            </AnimatePresence>

            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 p-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
                <button 
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 text-black font-black text-[10px] uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                >
                    <Share2 size={14} />
                    <span>{copySuccess ? "Copied!" : "Share Link"}</span>
                </button>
                <div className="w-[1px] h-4 bg-white/10 mx-1" />
                <button 
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="p-3 rounded-full hover:bg-white/5 transition-colors disabled:opacity-50" 
                    title="Download PDF"
                >
                    {isExporting ? (
                        <Loader2 size={16} className="animate-spin text-[var(--accent)]" />
                    ) : (
                        <Download size={16} className="opacity-40 hover:opacity-100 transition-opacity" />
                    )}
                </button>
            </div>

            {/* Hidden Export Container */}
            <div className="fixed left-[-9999px] top-0 pointer-events-none">
                <div id="breakdown-export-container" className="w-[800px] bg-[#040406] text-[#F2EDE4] p-20 font-sans">
                    <div className="mb-20 pb-10 border-b border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--accent)] mb-4">The Professor Breakdown Report</p>
                        <h1 className="text-5xl font-black tracking-tight leading-tight">{title}</h1>
                    </div>
                    <div className="prose prose-invert prose-amber max-w-none">
                        <Markdown>{fullMarkdownContent}</Markdown>
                    </div>
                </div>
            </div>
        </div>
    );
}
