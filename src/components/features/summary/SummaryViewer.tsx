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
import { downloadSummaryOffline } from "@/lib/offline-download";

interface SummaryViewerProps {
    data: string;
    title: string;
    generationId?: string | null;
}

function SummaryCheckpoint({ block, onCorrect }: { block: any; onCorrect: () => void }) {
    const [isAnswered, setIsAnswered] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    const handleAnswer = (idx: number) => {
        if (isAnswered) return;
        setSelectedOption(idx);
        setIsAnswered(true);
        if (idx === block.correctIndex) onCorrect();
    };

    return (
        <div className="mt-8 p-8 rounded-[32px] bg-white/[0.03] border border-white/5 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-6">
                <HelpCircle size={14} className="text-[#F59E0B]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Knowledge Check</span>
            </div>
            <p className="text-base font-bold mb-6 leading-relaxed">{block.question}</p>
            <div className="grid gap-3">
                {block.options.map((opt: string, i: number) => (
                    <button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        disabled={isAnswered}
                        className={cn(
                            "w-full p-5 rounded-2xl text-left text-sm font-medium transition-all border",
                            isAnswered 
                                ? i === block.correctIndex 
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                    : selectedOption === i 
                                        ? "bg-red-500/10 border-red-500/20 text-red-400" 
                                        : "bg-white/5 border-white/5 opacity-30"
                                : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <span>{opt}</span>
                            {isAnswered && i === block.correctIndex && <CheckCircle2 size={16} />}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function SummaryViewer({ data, title, generationId }: SummaryViewerProps) {
    const router = useRouter();
    const { addToast } = useToasts();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [checkpointPassed, setCheckpointPassed] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
 
    const handleExportHTML = () => {
        addToast("Compiling offline HTML document...", "info");
        try {
            const container = document.querySelector("#summary-export-container .prose");
            const renderedHtml = container ? container.innerHTML : "";
            
            if (!renderedHtml) {
                addToast("Failed to compile content", "error");
                return;
            }
 
            downloadSummaryOffline(title, renderedHtml);
            addToast("HTML Download successful", "success");
        } catch (error) {
            addToast("Failed to compile HTML", "error");
        }
    };

    const fullMarkdownContent = useMemo(() => {
        if (!data) return "";
        // Clean up knowledge check markers and "Checking Understanding" headings for the export
        return data
            .replace(/\[KNOWLEDGE_CHECK\]\s*\{[\s\S]*?\}/g, "")
            .replace(/([#*\s_]*)(Checking\s+Understanding|CHECKINGUNDERSTANDING|CheckingUnderstanding|checking\s+understanding)([#*\s_:]*)(\n|$)/gi, "\n");
    }, [data]);

    const handleExportPDF = async () => {
        if (isExporting) return;
        setIsExporting(true);
        addToast("Preparing high-fidelity export...", "info");

        try {
            await exportToPDF("summary-export-container", {
                title: title,
                filename: `The_Professor_${title.replace(/\s+/g, '_')}`,
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
        // Completely strip out [KNOWLEDGE_CHECK] and its trailing JSON block from the data before splitting
        const cleanData = data.replace(/\[KNOWLEDGE_CHECK\][\s\S]*?(\n\n|\n#|$)/g, "\n\n");
        const rawSections = cleanData.split(/\n## /g);
        return rawSections.map((s, i) => {
            const cleanText = i > 0 ? "## " + s : s;
            return { text: cleanText, checkpoint: null };
        });
    }, [data]);

    const handleCopyLink = () => {
        const url = generationId ? `${window.location.origin}/summary/${generationId}` : window.location.href;
        navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        addToast("Link copied to clipboard", "success");
    };

    const handleFinish = () => {
        const isSprint = sessionStorage.getItem("isExamSprint") === "true";
        if (isSprint) {
            // Keep content, but change type for the next tool in sprint
            const sprintContent = sessionStorage.getItem("examSprintContent") || "";
            const params = JSON.parse(sessionStorage.getItem("generateParams") || "{}");
            sessionStorage.setItem("generateParams", JSON.stringify({
                ...params,
                content: sprintContent,
                type: "flashcards",
                count: 15,
                difficulty: "medium"
            }));
            router.push("/flashcards/generate");
            addToast("Summary complete. Starting Memory Drill...", "success");
        } else {
            router.push("/library");
        }
    };

    if (processedChapters.length === 0) return null;

    const currentChapter = processedChapters[currentSlide];

    return (
        <div className="min-h-screen w-full flex flex-col items-center bg-transparent">
            <header className="w-full max-w-5xl p-6 flex items-center justify-between z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/library')} className="p-2 rounded-full hover:bg-white/5 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#10B981] mb-0.5">Synthesis</p>
                        <h1 className="text-sm font-bold truncate max-w-[200px]">{title}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleCopyLink} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <Share2 size={18} />
                    </button>
                </div>
            </header>

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
                                Chapter {currentSlide + 1} / {processedChapters.length}
                            </span>
                        </div>
                        <h2 className="text-4xl font-black tracking-tight leading-tight mb-6">
                            {currentSlide === 0 ? title : currentChapter.text.split("\n")[0].replace("## ", "")}
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

                    {currentChapter.checkpoint && !checkpointPassed && (
                        <div className="mb-32">
                            <SummaryCheckpoint 
                                block={currentChapter.checkpoint} 
                                onCorrect={() => {
                                    setCheckpointPassed(true);
                                    addToast("Insight verified!", "success");
                                }} 
                            />
                        </div>
                    )}

                    {checkpointPassed && (
                        <div className="mb-32 py-16 border-t border-white/5 flex flex-col items-center animate-in fade-in zoom-in duration-700">
                             <CheckCircle2 size={40} className="mb-4 text-emerald-500" />
                             <p className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">Cognitive Alignment Secured</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5 pb-20">
                        <button 
                            onClick={() => {
                                setCurrentSlide(prev => Math.max(0, prev - 1));
                                setCheckpointPassed(false);
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
                                    setCheckpointPassed(false);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="group flex items-center gap-4 bg-[var(--accent)] text-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover-scale-lg active:scale-95 shadow-xl shadow-amber-500/10"
                            >
                                <span>Proceed</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <button 
                                onClick={handleFinish}
                                className="group flex items-center gap-4 bg-emerald-500 text-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover-scale-lg active:scale-95 shadow-xl shadow-emerald-500/10"
                            >
                                <span>Finish Summary</span>
                                <CheckCircle2 size={16} />
                            </button>
                        )}
                    </div>
                </motion.main>
            </AnimatePresence>

            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 p-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
                <button 
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 text-black font-black text-[10px] uppercase tracking-wider transition-all hover-scale-lg active:scale-95"
                >
                    <Share2 size={14} />
                    <span>{copySuccess ? "Copied!" : "Share Link"}</span>
                </button>
                <div className="w-[1px] h-4 bg-white/10 mx-1" />
                <div className="relative">
                    <button 
                        onClick={() => setShowDownloadMenu(prev => !prev)}
                        disabled={isExporting}
                        className="p-3 rounded-full hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center justify-center" 
                        title="Download options"
                    >
                        {isExporting ? (
                            <Loader2 size={16} className="animate-spin text-[var(--accent)]" />
                        ) : (
                            <Download size={16} className="opacity-40 hover:opacity-100 transition-opacity" />
                        )}
                    </button>
                    
                    <AnimatePresence>
                        {showDownloadMenu && (
                            <>
                                <div className="fixed inset-0 z-[-1]" onClick={() => setShowDownloadMenu(false)} />
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute bottom-14 right-0 min-w-[160px] bg-zinc-950 border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 z-[110]"
                                >
                                    <button
                                        onClick={async () => {
                                            setShowDownloadMenu(false);
                                            await handleExportPDF();
                                        }}
                                        className="w-full px-4 py-2.5 rounded-xl text-left text-[10px] font-black uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                                    >
                                        <FileText size={12} />
                                        <span>Download PDF</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDownloadMenu(false);
                                            handleExportHTML();
                                        }}
                                        className="w-full px-4 py-2.5 rounded-xl text-left text-[10px] font-black uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                                    >
                                        <Download size={12} />
                                        <span>Download HTML</span>
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Hidden Export Container */}
            <div className="fixed left-[-9999px] top-0 pointer-events-none">
                <div id="summary-export-container" className="w-[800px] bg-[#040406] text-[#F2EDE4] p-20 font-sans">
                    <style dangerouslySetInnerHTML={{ __html: `
                        #summary-export-container table {
                            width: 100% !important;
                            border-collapse: collapse !important;
                            margin: 32px 0 !important;
                            border: 1px solid rgba(242, 237, 228, 0.15) !important;
                            background: rgba(255, 255, 255, 0.01) !important;
                            display: table !important;
                        }
                        #summary-export-container th {
                            background-color: rgba(242, 237, 228, 0.05) !important;
                            color: #F2EDE4 !important;
                            font-weight: 800 !important;
                            text-transform: uppercase !important;
                            letter-spacing: 0.1em !important;
                            font-size: 11px !important;
                            padding: 14px 20px !important;
                            border-bottom: 2px solid rgba(242, 237, 228, 0.15) !important;
                            border-right: 1px solid rgba(242, 237, 228, 0.1) !important;
                        }
                        #summary-export-container td {
                            padding: 14px 20px !important;
                            border-bottom: 1px solid rgba(242, 237, 228, 0.1) !important;
                            border-right: 1px solid rgba(242, 237, 228, 0.05) !important;
                            color: rgba(242, 237, 228, 0.85) !important;
                            font-size: 14px !important;
                        }
                        #summary-export-container tr:last-child td {
                            border-bottom: none !important;
                        }
                        #summary-export-container tr td:last-child, #summary-export-container tr th:last-child {
                            border-right: none !important;
                        }
                        #summary-export-container tr:nth-child(even) {
                            background-color: rgba(242, 237, 228, 0.02) !important;
                        }
                    `}} />
                    <div className="mb-20 pb-10 border-b border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--accent)] mb-4">Official Synthesis Report</p>
                        <h1 className="text-5xl font-black tracking-tight leading-tight">{title}</h1>
                    </div>
                    <div className="prose prose-invert max-w-none">
                        <Markdown>{fullMarkdownContent}</Markdown>
                    </div>
                </div>
            </div>
        </div>
    );
}
