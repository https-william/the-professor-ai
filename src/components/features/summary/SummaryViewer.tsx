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
    ArrowRight
} from "lucide-react";

interface SummaryViewerProps {
    data: string;
    title: string;
    generationId?: string | null;
}

function SummaryCheckpoint({ text, onCorrect }: { text: string; onCorrect: () => void }) {
    const [isAnswered, setIsAnswered] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState(false);

    const questionData = useMemo(() => {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        const importantSentence = sentences.find(s => s.length > 30 && s.length < 100) || sentences[0];
        const words = importantSentence.split(" ").filter(w => w.length > 5);
        const keyword = words[Math.floor(Math.random() * words.length)]?.replace(/[.,!]/g, "") || "this section";
        
        return {
            question: `What was a key focus of this section?`,
            options: [
                { text: keyword, correct: true },
                { text: "General overview", correct: false },
                { text: "Unrelated details", correct: false }
            ].sort(() => Math.random() - 0.5)
        };
    }, [text]);

    const handleAnswer = (idx: number, correct: boolean) => {
        if (isAnswered) return;
        setSelectedOption(idx);
        setIsCorrect(correct);
        setIsAnswered(true);
        if (correct) onCorrect();
    };

    return (
        <div className="mt-8 p-8 rounded-[32px] bg-white/[0.03] border border-white/5 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
                <HelpCircle size={14} className="text-[#F59E0B]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Knowledge Check</span>
            </div>
            <p className="text-base font-bold mb-6">{questionData.question}</p>
            <div className="grid gap-3">
                {questionData.options.map((opt, i) => (
                    <button
                        key={i}
                        onClick={() => handleAnswer(i, opt.correct)}
                        disabled={isAnswered}
                        className={cn(
                            "w-full p-5 rounded-2xl text-left text-sm font-medium transition-all border",
                            isAnswered 
                                ? opt.correct 
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                    : selectedOption === i 
                                        ? "bg-red-500/10 border-red-500/20 text-red-400" 
                                        : "bg-white/5 border-white/5 opacity-30"
                                : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                        )}
                    >
                        {opt.text}
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

    const chapters = useMemo(() => {
        if (!data) return [];
        const rawChapters = data.split(/\n## /g);
        return rawChapters.map((c: string, i: number) => (i > 0 ? "## " + c : c));
    }, [data]);

    const handleCopyLink = () => {
        const url = generationId ? `${window.location.origin}/summary/${generationId}` : window.location.href;
        navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        addToast("Link copied to clipboard", "success");
    };

    if (chapters.length === 0) return null;

    return (
        <div className="min-h-screen w-full flex flex-col items-center bg-transparent">
            {/* Header */}
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
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                                Segment {currentSlide + 1} / {chapters.length}
                            </span>
                        </div>
                        <h2 className="text-4xl font-black tracking-tight leading-tight mb-6">
                            {currentSlide === 0 ? title : chapters[currentSlide].split("\n")[0].replace("## ", "")}
                        </h2>
                    </div>

                    <div className="prose prose-invert prose-emerald max-w-none mb-20">
                        <Markdown>
                            {currentSlide === 0 ? chapters[0] : chapters[currentSlide].split("\n").slice(1).join("\n")}
                        </Markdown>
                    </div>

                    {((currentSlide + 1) % 2 === 0 || currentSlide === chapters.length - 1) && !checkpointPassed && (
                        <div className="mb-20">
                            <SummaryCheckpoint 
                                text={chapters[currentSlide]} 
                                onCorrect={() => {
                                    setCheckpointPassed(true);
                                    addToast("Insight verified!", "success");
                                }} 
                            />
                        </div>
                    )}

                    {checkpointPassed && (
                        <div className="mb-20 py-16 border-t border-white/5 flex flex-col items-center animate-in fade-in zoom-in duration-700">
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

                        {currentSlide < chapters.length - 1 ? (
                            <button 
                                onClick={() => {
                                    setCurrentSlide(prev => prev + 1);
                                    setCheckpointPassed(false);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="group flex items-center gap-4 bg-white text-black px-8 py-4 rounded-2xl font-black text-xs transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
                            >
                                <span>Continue</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <button 
                                onClick={() => router.push("/library")}
                                className="group flex items-center gap-4 bg-emerald-500 text-black px-8 py-4 rounded-2xl font-black text-xs transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/10"
                            >
                                <span>Finish Masterclass</span>
                                <CheckCircle2 size={16} />
                            </button>
                        )}
                    </div>
                </motion.main>
            </AnimatePresence>

            {/* Floating Share/Download */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 p-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
                <button 
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 text-black font-black text-[10px] uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                >
                    <Share2 size={14} />
                    <span>{copySuccess ? "Copied!" : "Share Link"}</span>
                </button>
                <div className="w-[1px] h-4 bg-white/10 mx-1" />
                <button className="p-3 rounded-full hover:bg-white/5 transition-colors" title="Download PDF">
                    <Download size={16} className="opacity-40" />
                </button>
            </div>
        </div>
    );
}
