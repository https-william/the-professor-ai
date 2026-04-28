"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { createClient } from "@/lib/supabase/client";
import Markdown from "@/components/ui/Markdown";

import { useToasts } from "@/components/ui/GlobalToasts";
import EndowmentModal from "@/components/modals/EndowmentModal";
import { useUser } from "@/context/UserContext";
import AuthInterceptor from "@/components/ui/AuthInterceptor";
import DataDustLoader from "@/components/ui/DataDustLoader";
import BrandLogo from "@/components/ui/BrandLogo";
import { cn } from "@/lib/utils";
import { 
    HelpCircle, 
    FileText, 
    AlertCircle, 
    ChevronLeft, 
    Share2, 
    Link, 
    Printer, 
    Download, 
    ChevronsDown, 
    CheckCircle2,
    ArrowRight
} from "lucide-react";

// â”€â”€ Watermarked export HTML builder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildExportHTML(title: string, bodyHTML: string) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} â€” The Professor AI</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: #08080E; color: #d1d5db; line-height: 1.7; padding: 40px 20px; }
  .page { max-width: 720px; margin: 0 auto; }
  /* Watermark header */
  .wm { display: flex; align-items: center; gap: 12px; padding-bottom: 24px; margin-bottom: 32px; border-bottom: 2px solid #ffffff20; }
  .wm-logo { 
    width: 42px; 
    height: 42px; 
    border-radius: 12px; 
    background: #fff; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    color: #000; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.5); 
  }
  .wm-logo svg { width: 28px; height: 28px; }
  .wm-text h2 { font-size: 14px; font-weight: 800; color: #F5F5F5; letter-spacing: 0.02em; }
  .wm-text p { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 3px; font-weight: 600; }
  /* Title */
  .doc-title { font-size: 28px; font-weight: 900; color: #fff; margin-bottom: 8px; line-height: 1.2; }
  .doc-meta { font-size: 11px; color: #6b7280; margin-bottom: 40px; text-transform: uppercase; letter-spacing: 1.5px; }
  /* Content */
  .content h1 { font-size: 22px; font-weight: 800; color: #fff; margin: 32px 0 12px; }
  .content h2 { font-size: 18px; font-weight: 700; color: #fff; margin: 28px 0 10px; padding-bottom: 8px; border-bottom: 1px solid #ffffff15; }
  .content h3 { font-size: 15px; font-weight: 700; color: #fff; margin: 24px 0 8px; }
  .content p { margin-bottom: 16px; font-size: 14px; }
  .content ul, .content ol { margin-bottom: 20px; padding-left: 24px; }
  .content li { margin-bottom: 8px; font-size: 14px; }
  .content strong { color: #fff; font-weight: 700; }
  .content code { background: #ffffff0d; padding: 2px 6px; border-radius: 4px; font-size: 13px; color: #A78BFA; }
  .content blockquote { border-left: 3px solid #F59E0B66; padding: 8px 16px; margin: 20px 0; color: #9ca3af; font-style: italic; background: #F59E0B08; border-radius: 0 8px 8px 0; }
  /* Footer watermark */
  .footer-wm { margin-top: 60px; padding-top: 20px; border-top: 1px solid #ffffff10; text-align: center; }
  .footer-wm p { font-size: 10px; color: #4b5563; letter-spacing: 2px; text-transform: uppercase; }
  .footer-wm a { color: #F59E0B; text-decoration: none; }
  @media print {
    body { background: #fff; color: #1f2937; padding: 20px; }
    .page { max-width: 100%; }
    .wm-logo { box-shadow: none; }
    .doc-title, .content h1, .content h2, .content h3, .content strong { color: #111827; }
    .content p, .content li { color: #374151; }
    .content code { background: #f3f4f6; color: #7c3aed; }
    .wm { border-bottom-color: #F59E0B55; }
    .footer-wm { border-top-color: #e5e7eb; }
    .footer-wm p { color: #9ca3af; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="wm">
    <div class="wm-logo">
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 90 L20 50 C20 30 35 15 50 15 C65 15 80 30 80 50 L50 90 Z" fill="black"/>
        <path d="M50 85 V35" stroke="white" stroke-width="4" stroke-linecap="round"/>
        <circle cx="50" cy="35" r="6" fill="white"/>
        <circle cx="50" cy="35" r="2.5" fill="black"/>
      </svg>
    </div>
    <div class="wm-text">
      <h2>The Professor</h2>
      <p>Autonomous Study Agent</p>
    </div>
  </div>
  <h1 class="doc-title">${title}</h1>
  <p class="doc-meta">Generated on ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  <div class="content">${bodyHTML}</div>
  <div class="footer-wm">
    <p>Curated with â™¦ by <a href="#">The Professor AI</a></p>
  </div>
</div>
</body>
</html>`;
}

// â”€â”€ Markdown Components (reusable) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Moved to src/components/ui/Markdown.tsx

function SummaryCheckpoint({ text, onCorrect }: { text: string; onCorrect: () => void }) {
    const [isAnswered, setIsAnswered] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState(false);

    // Dynamic question generation (client-side simple heuristic)
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
        <div className="mt-8 p-6 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--border)] animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center gap-2 mb-4">
                <HelpCircle size={14} strokeWidth={1.5} className="text-[var(--accent)]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] opacity-70">Knowledge Check</span>
            </div>
            <p className="text-sm font-bold text-[var(--foreground)] mb-4">{questionData.question}</p>
            <div className="grid gap-2">
                {questionData.options.map((opt, i) => (
                    <button
                        key={i}
                        onClick={() => handleAnswer(i, opt.correct)}
                        disabled={isAnswered}
                        className={`w-full p-4 rounded-xl text-left text-xs font-bold transition-all border ${
                            isAnswered 
                                ? opt.correct 
                                    ? "bg-green-500/20 border-green-500/40 text-green-400" 
                                    : selectedOption === i 
                                        ? "bg-red-500/20 border-red-500/40 text-red-400" 
                                        : "bg-[var(--foreground)]/5 border-[var(--border)] text-[var(--foreground-muted)] opacity-50"
                                : "bg-[var(--foreground)]/5 border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--foreground)]/10 hover:border-[var(--foreground)]/20"
                        }`}
                    >
                        {opt.text}
                    </button>
                ))}
            </div>
            {isAnswered && !isCorrect && (
                <p className="mt-3 text-[10px] text-red-400/60 font-medium animate-in slide-in-from-top-1">Not quite! But let&apos;s move on to keep the flow.</p>
            )}
        </div>
    );
}


function SummaryContent() {
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const searchParams = useSearchParams();
    const [summary, setSummary] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const hasStartedGeneration = useRef(false);
    const [loadingIdx, setLoadingIdx] = useState(0);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const shareMenuRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToasts();
    const { user } = useUser();
    const [isEndowmentOpen, setIsEndowmentOpen] = useState(false);
    const [visibleCount, setVisibleCount] = useState(1);
    const [checkpointPassed, setCheckpointPassed] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    const LOADING_PHRASES = [
        "Sipping digital espresso...",
        "Judging your source material...",
        "Applying the F.A.M.A.S contract...",
        "Extracting high-yield facts...",
        "Consulting the archives...",
        "Synthesizing academic payloads..."
    ];

    useEffect(() => {
        if (!isGenerating) return;
        const interval = setInterval(() => {
            setLoadingIdx(prev => (prev + 1) % LOADING_PHRASES.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [isGenerating]);

    useEffect(() => {
        const init = async () => {
            const id = searchParams.get("id");
            const mode = searchParams.get("mode");

            if (id) {
                // Fetch specific generation from Supabase
                try {
                    setIsGenerating(false);
                    const supabase = createClient();
                    const { data, error } = await supabase
                        .from("generations")
                        .select("*")
                        .eq("id", id)
                        .single();

                    if (error || !data) throw new Error("Resource not found");

                    const finalSummary = {
                        id: data.id,
                        type: "summary",
                        data: data.content?.summary || data.content?.data || "",
                        title: data.title || "Academic Summary",
                    };
                    setSummary(finalSummary);
                    sessionStorage.setItem("generatedContent", JSON.stringify(finalSummary));
                    return;
                } catch (e) {
                    console.error("Failed to load by ID:", e);
                    router.push("/create");
                    return;
                }
            }

            if (mode === "generate") {
                if (hasStartedGeneration.current) return;
                
                const paramsStr = sessionStorage.getItem("generateParams");
                if (!paramsStr) {
                    router.push("/create");
                    return;
                }
                
                hasStartedGeneration.current = true;
                const params = JSON.parse(paramsStr);
                sessionStorage.removeItem("generateParams");
                
                setIsGenerating(true);
                setSummary(null);
                setGenerationError(null);
                
                setTimeout(async () => {
                    try {
                        const response = await fetch("/api/generate/summary", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(params),
                        });

                        if (!response.ok) {
                            const errorData = await response.json().catch(() => ({}));
                            if (response.status === 402 || errorData.code === "INSUFFICIENT_CREDITS") {
                                setIsEndowmentOpen(true);
                                setIsGenerating(false);
                                return;
                            }
                            throw new Error(errorData.error || "Generation failed");
                        }

                        const data = await response.json();
                        const finalSummary = {
                            id: data.id || null,
                            type: "summary",
                            data: data.summary || data.data || "",
                            title: data.title || params.title || "Academic Summary",
                        };
                        setSummary(finalSummary);
                        if (data.xpEarned) {
                            addToast(`Summary created! +${data.xpEarned} XP`, 'xp');
                        }
                        sessionStorage.setItem("generatedContent", JSON.stringify(finalSummary));
                    } catch (e: any) {
                        console.error("Summary error:", e);
                        setGenerationError(e.message || "Summary generation failed. Credits refunded.");
                    } finally {
                        setIsGenerating(false);
                    }
                }, 1000);
            } else {
                const data = sessionStorage.getItem("generatedContent");
                if (!data) {
                    router.push("/create");
                    return;
                }
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.type === "summary" || parsed.summary) {
                        setSummary(parsed);
                    } else {
                        throw new Error("Not a summary");
                    }
                } catch {
                    router.push("/create");
                }
            }
        };
        init();
    }, [router, searchParams]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
                setIsShareOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const textSections = summary 
        ? (typeof summary.data === "string" ? summary.data : typeof summary.summary === "string" ? summary.summary : null)
        : null;

    // Calculate chapters using useMemo to avoid re-parsing on every render
    const chapters = useMemo(() => {
        if (!textSections) return [];
        const rawChapters = textSections.split(/\n## /g);
        return rawChapters.map((c: string, i: number) => (i > 0 ? "## " + c : c));
    }, [textSections]);

    // â”€â”€ Export Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const getExportHTML = () => {
        const el = document.getElementById("export-content");
        return el ? el.innerHTML : "";
    };

    const handleCopyLink = () => {
        if (summary?.id) {
            const url = `${window.location.origin}/summary?id=${summary.id}`;
            navigator.clipboard.writeText(url);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } else {
            // Fallback: copy the raw text
            const raw = textSections || "";
            navigator.clipboard.writeText(raw);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    const handleDownloadPDF = () => {
        setIsShareOpen(false);
        const html = buildExportHTML(summary.title || "Summary", getExportHTML());
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";
        document.body.appendChild(iframe);
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;
        doc.open();
        doc.write(html);
        doc.close();
        // Wait for fonts / styles to load
        setTimeout(() => {
            iframe.contentWindow?.print();
            // Clean up after print dialog closes
            setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 600);
    };

    const handleDownloadWord = () => {
        setIsShareOpen(false);
        const html = buildExportHTML(summary.title || "Summary", getExportHTML());
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${summary.title || 'Summary'}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDownloadOfflineHTML = () => {
        setIsShareOpen(false);
        const html = buildExportHTML(summary.title || "Summary", getExportHTML());
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${summary.title || 'Summary'}_Offline.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // -- Loading State
    if (isGenerating) {
        return <DataDustLoader label="Distilling Smart Summary" phrases={LOADING_PHRASES} currentPhraseIndex={loadingIdx} />;
    }

    // â”€â”€ Error State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (generationError) {
        if (generationError.toLowerCase().includes("unauthorized")) {
            return (
                <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6">
                    <AuthInterceptor />
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
                }}>
                    <AlertCircle size={30} strokeWidth={1.5} className="text-[#EF4444]" />
                </div>
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Generation Failed</h2>
                <p className="text-sm text-[var(--foreground-muted)] mb-8 text-center max-w-xs">{generationError}</p>
                <button onClick={() => router.push('/create')} className="px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.97]" style={{
                    background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#08080E",
                    boxShadow: "0 4px 16px rgba(245,158,11,0.3)",
                }}>
                    Try Again
                </button>
            </div>
        );
    }

    if (!summary) return null;

    const sections = Array.isArray(summary.data) ? summary.data : [];

    // â”€â”€ Share Menu Items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const shareActions = [
        { icon: Link, label: summary?.id ? "Copy Public Link" : "Copy Text", onClick: handleCopyLink },
        { icon: Printer, label: "Save as PDF", onClick: handleDownloadPDF },
        { icon: FileText, label: "Download .docx", onClick: handleDownloadWord },
        { icon: Download, label: "Save Offline", onClick: handleDownloadOfflineHTML },
    ];

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-32 flex flex-col items-center">
             {/* â”€â”€â”€ Persistent Share Pill â”€â”€â”€ */}
             <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 p-1.5 rounded-full bg-[var(--card)]/80 backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <button 
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)] text-black font-black text-[10px] uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                >
                    <Share2 size={14} />
                    <span>{copySuccess ? "Copied!" : "Share Link"}</span>
                </button>
                <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />
                <button 
                    onClick={handleDownloadPDF}
                    className="p-2 rounded-full hover:bg-[var(--foreground)]/5 transition-colors"
                    title="Save as PDF"
                >
                    <Download size={16} strokeWidth={1.5} className="text-[var(--foreground-muted)]" />
                </button>
             </div>

             <AnimatePresence mode="wait">
                 <motion.main 
                    key={currentSlide}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    id="export-content" 
                    className="w-full max-w-3xl mx-auto px-6 pt-32 sm:pt-40 flex-grow"
                >
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent)]">
                                Part {currentSlide + 1} of {chapters.length}
                            </span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
                            {currentSlide === 0 ? summary.title : chapters[currentSlide].split("\n")[0].replace("## ", "")}
                        </h1>
                        <div className="flex items-center gap-3 text-[10px] text-[var(--foreground-muted)] font-black uppercase tracking-[0.2em] opacity-40">
                            <FileText size={12} />
                            <span>Generated by The Professor</span>
                        </div>
                    </div>

                    <div className="prose prose-invert prose-purple max-w-none mb-20 min-h-[40vh]">
                        <Markdown>
                            {currentSlide === 0 ? chapters[0] : chapters[currentSlide].split("\n").slice(1).join("\n")}
                        </Markdown>
                    </div>
                    
                    {/* Knowledge Check every few slides or at end */}
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
                        <div className="mb-20 py-12 border-t border-[var(--border)] flex flex-col items-center animate-in fade-in zoom-in duration-700">
                             <CheckCircle2 size={32} strokeWidth={1.5} className="mb-4 text-green-500" />
                             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-green-500">Cognitive Checkpoint Verified</p>
                        </div>
                    )}

                    {/* Navigation Actions */}
                    <div className="flex items-center justify-between mt-12 pb-20 border-t border-[var(--border)] pt-8">
                        <button 
                            onClick={() => {
                                setCurrentSlide(prev => Math.max(0, prev - 1));
                                setCheckpointPassed(false);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={cn(
                                "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] transition-all",
                                currentSlide === 0 ? "opacity-0 pointer-events-none" : "opacity-100 hover:text-[var(--foreground)]"
                            )}
                        >
                            <ChevronLeft size={14} />
                            <span>Previous Segment</span>
                        </button>

                        {currentSlide < chapters.length - 1 ? (
                            <button 
                                onClick={() => {
                                    setCurrentSlide(prev => prev + 1);
                                    setCheckpointPassed(false);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="group flex items-center gap-4 bg-[var(--foreground)] text-[var(--background)] px-8 py-4 rounded-2xl font-black text-xs transition-all hover:scale-105 active:scale-95"
                            >
                                <span>Continue Deep Dive</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <button 
                                onClick={() => router.push("/dashboard")}
                                className="group flex items-center gap-4 bg-green-500 text-black px-8 py-4 rounded-2xl font-black text-xs transition-all hover:scale-105 active:scale-95"
                            >
                                <span>Complete Masterclass</span>
                                <CheckCircle2 size={16} />
                            </button>
                        )}
                    </div>
                 </motion.main>
             </AnimatePresence>

             <EndowmentModal 
                isOpen={isEndowmentOpen} 
                onClose={() => setIsEndowmentOpen(false)}
                currentCredits={user?.credits || 0}
                requiredCredits={1}
            />
        </div>
    );
}

export default function SummaryPage() {
    return (
        <div className="h-[100dvh] bg-[var(--background)] overflow-hidden relative">
            <div className="h-full overflow-y-auto relative">
                <div data-header-sentinel className="absolute top-0 h-1 w-full pointer-events-none" />
                <Suspense fallback={<DataDustLoader />}>
                    <SummaryContent />
                </Suspense>
            </div>
        </div>
    );
}

