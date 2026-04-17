"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { createClient } from "@/lib/supabase/client";
import Markdown from "@/components/ui/Markdown";
import SiteHeader from "@/components/ui/SiteHeader";
import { useToasts } from "@/components/ui/GlobalToasts";
import EndowmentModal from "@/components/modals/EndowmentModal";
import { useUser } from "@/context/UserContext";
import AuthInterceptor from "@/components/ui/AuthInterceptor";
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
    CheckCircle2 
} from "lucide-react";

// ── Watermarked export HTML builder ──────────────────────────────────
function buildExportHTML(title: string, bodyHTML: string) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — The Professor AI</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: #08080E; color: #d1d5db; line-height: 1.7; padding: 40px 20px; }
  .page { max-width: 720px; margin: 0 auto; }
  /* Watermark header */
  .wm { display: flex; align-items: center; gap: 12px; padding-bottom: 24px; margin-bottom: 32px; border-bottom: 2px solid #F59E0B33; }
  .wm-logo { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #F59E0B, #D97706); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; color: #06060B; box-shadow: 0 0 16px #F59E0B55; }
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
    <div class="wm-logo">P</div>
    <div class="wm-text">
      <h2>The Professor</h2>
      <p>Autonomous Study Agent</p>
    </div>
  </div>
  <h1 class="doc-title">${title}</h1>
  <p class="doc-meta">Generated on ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  <div class="content">${bodyHTML}</div>
  <div class="footer-wm">
    <p>Curated with ♦ by <a href="#">The Professor AI</a></p>
  </div>
</div>
</body>
</html>`;
}

// ── Markdown Components (reusable) ──────────────────────────────────
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

    // ── Export Handlers ──────────────────────────────────────────────

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

    // ── Loading State ───────────────────────────────────────────────
    if (isGenerating) {
        return (
            <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-x-0 top-16 flex flex-col items-center opacity-[0.15] pointer-events-none z-0 px-6">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--foreground)]/20 animate-pulse mb-6" />
                    <div className="w-1/3 h-8 rounded-lg bg-[var(--foreground)]/20 animate-pulse mb-12" />
                    <div className="w-full max-w-3xl space-y-6">
                        <div className="w-full h-32 rounded-3xl bg-[var(--foreground)]/20 animate-pulse" />
                        <div className="w-full h-24 rounded-3xl bg-[var(--foreground)]/20 animate-pulse delay-75" />
                        <div className="w-full h-40 rounded-3xl bg-[var(--foreground)]/20 animate-pulse delay-150" />
                    </div>
                </div>

                <div className="absolute w-[600px] h-[600px] rounded-full animate-pulse opacity-20 z-0" 
                     style={{ background: "radial-gradient(circle, rgba(139,92,246,0.1), transparent 60%)", filter: "blur(80px)" }} />
                
                {/* Central Console */}
                <div className="relative z-10 w-full max-w-md mx-auto animate-in zoom-in-95 duration-700 mt-20">
                    <div className="p-1 rounded-3xl" style={{ background: "linear-gradient(135deg, var(--accent-glow), rgba(0,0,0,0) 50%, var(--accent-glow))" }}>
                        <div className="p-8 rounded-[28px] bg-[var(--card)]/90 backdrop-blur-2xl border border-[var(--border)] shadow-2xl flex flex-col items-center">
                            
                            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center relative">
                                <div className="absolute inset-0 rounded-full border-2 border-[var(--accent)]/20 border-t-[var(--accent)] animate-spin" style={{ animationDuration: '1.5s' }} />
                                <FileText size={20} strokeWidth={1.5} className="text-[var(--accent)] animate-pulse" />
                            </div>
                            
                            {/* Simulated Terminal */}
                            <div className="w-full bg-[var(--background-secondary)] rounded-xl p-5 border border-[var(--border)] mb-5 h-28 relative overflow-hidden flex flex-col justify-end">
                                <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-[var(--background-secondary)] to-transparent z-10" />
                                <div className="font-mono text-[11px] flex flex-col gap-2 relative z-0">
                                    <span className="text-[var(--foreground-muted)] truncate">&gt; Analyzing your material...</span>
                                    <span className="text-[var(--foreground-muted)] truncate">&gt; Building summary structure...</span>
                                    <span className="text-[var(--accent)] truncate animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <b key={loadingIdx}>&gt; {LOADING_PHRASES[loadingIdx]}</b>
                                        <span className="animate-pulse">_</span>
                                    </span>
                                </div>
                            </div>

                            {/* Progress Line */}
                            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--accent)] rounded-full w-full animate-pulse opacity-50" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Error State ─────────────────────────────────────────────────
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

    // ── Share Menu Items ────────────────────────────────────────────
    const shareActions = [
        { icon: Link, label: summary?.id ? "Copy Public Link" : "Copy Text", onClick: handleCopyLink },
        { icon: Printer, label: "Save as PDF", onClick: handleDownloadPDF },
        { icon: FileText, label: "Download .docx", onClick: handleDownloadWord },
        { icon: Download, label: "Save Offline", onClick: handleDownloadOfflineHTML },
    ];

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute w-[600px] h-[600px] top-[-10%] right-[-10%] rounded-full bg-[var(--accent)]/5 blur-3xl" />
                <div className="absolute w-[400px] h-[400px] bottom-[10%] left-[-5%] rounded-full bg-[var(--secondary)]/5 blur-3xl" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-5 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/create")}
                        className="p-2 -ml-2 rounded-xl hover:bg-[var(--background-tertiary)] transition-all"
                    >
                        <ChevronLeft size={20} strokeWidth={1.5} />
                    </button>
                    <div>
                        <h1 className="text-sm font-bold text-[var(--foreground)] line-clamp-1 max-w-[200px] sm:max-w-none">{summary.title || "Smart Summary"}</h1>
                        <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider font-semibold">Review Notes</p>
                    </div>
                </div>

                {/* Share Button + Dropdown */}
                <div className="relative" ref={shareMenuRef}>
                    <button 
                        onClick={() => setIsShareOpen(!isShareOpen)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] text-[var(--foreground-secondary)] bg-[var(--card)] hover:border-[var(--accent)]/30 hover:text-[var(--accent)] transition-all text-sm font-medium"
                    >
                        <Share2 size={18} strokeWidth={1.5} />
                        <span className="hidden sm:inline">Share</span>
                    </button>

                    {isShareOpen && (
                        <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl shadow-black/30 py-1.5 z-50 overflow-hidden"
                             style={{ animation: 'fadeInScale 150ms ease-out' }}>
                            <div className="px-3 py-2 mb-1">
                                <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-[0.15em]">Share & Export</p>
                            </div>
                            {shareActions.map((action, i) => (
                                <button 
                                    key={i}
                                    onClick={action.onClick}
                                    className="w-full text-left px-3 py-2.5 text-[13px] text-[var(--foreground-secondary)] hover:bg-[var(--accent)]/8 hover:text-[var(--foreground)] transition-colors flex items-center gap-3"
                                >
                                    <action.icon size={16} strokeWidth={1.5} className="opacity-60" />
                                    {action.label}
                                    {action.icon === Link && copySuccess && (
                                        <span className="ml-auto text-[10px] text-green-400 font-bold">Copied!</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-5 py-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                {/* Clean title — no purple icon */}
                <div className="mb-10">
                    <h2 className="text-2xl md:text-3xl font-black text-[var(--foreground)] tracking-tight leading-tight">{summary.title || "Subject Summary"}</h2>
                    <p className="text-xs text-[var(--foreground-muted)] mt-2 uppercase tracking-widest font-semibold">
                        {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                <div className="space-y-6" id="export-content">
                    {textSections ? (
                        <div className="relative">
                            <div className="space-y-8">
                                {chapters.slice(0, visibleCount).map((chapter: string, idx: number) => (
                                    <motion.div 
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5 }}
                                        className="p-6 md:p-8 rounded-2xl md:rounded-[32px] bg-[var(--card)]/50 border border-[var(--border)] shadow-2xl shadow-black/10 backdrop-blur-xl relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--accent)]/5 to-transparent blur-2xl" />
                                        <article className="max-w-none text-[var(--foreground-secondary)] selection:bg-[var(--accent)]/20 relative z-10">
                                            <Markdown>
                                                {chapter}
                                            </Markdown>
                                        </article>

                                        {idx === visibleCount - 1 && visibleCount < chapters.length && !checkpointPassed && (
                                            <SummaryCheckpoint 
                                                text={chapter} 
                                                onCorrect={() => {
                                                    setCheckpointPassed(true);
                                                    addToast("Checkpoint cleared! +5 XP", "xp");
                                                    fetch("/api/user/activity", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({ type: "daily_challenge", customXp: 5 })
                                                    }).catch(() => {});
                                                }} 
                                            />
                                        )}
                                        
                                        {idx === visibleCount - 1 && visibleCount < chapters.length && checkpointPassed && (
                                            <div className="mt-10 pt-8 border-t border-[var(--border)] flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent)]/40 mb-4 text-center">Insight Digested • Processing Next Stage {visibleCount}/{chapters.length}</p>
                                                <button 
                                                    onClick={() => {
                                                        setVisibleCount(prev => prev + 1);
                                                        setCheckpointPassed(false);
                                                        addToast("Next insight unlocked", "success", "auto_awesome");
                                                    }}
                                                    className="px-8 py-4 rounded-2xl bg-white text-[#06060B] font-black text-sm tracking-wide shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
                                                >
                                                    <ChevronsDown size={18} strokeWidth={2} />
                                                    Unlock Next Insight
                                                </button>
                                            </div>
                                        )}

                                        {idx === chapters.length - 1 && chapters.length > 1 && (
                                            <div className="mt-8 pt-6 border-t border-[var(--border)] flex justify-center opacity-20">
                                                <CheckCircle2 size={14} strokeWidth={1.5} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest ml-2">Final Insight Reached</span>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        sections.map((section: any, idx: number) => (
                            <div 
                                key={idx} 
                                className="group p-8 md:p-10 rounded-[32px] bg-[var(--card)]/80 border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all duration-500 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[var(--foreground)]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                {section.heading && (
                                    <h3 className="text-xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-4 font-sans tracking-tight">
                                        <div className="w-1 h-8 rounded-full bg-gradient-to-b from-[var(--accent)] to-[var(--secondary)]" />
                                        {section.heading}
                                    </h3>
                                )}
                                
                                <div className="max-w-none text-[var(--foreground-secondary)] leading-relaxed font-serif text-[15px]">
                                    <Markdown>
                                        {section.content || section.text || section.body || JSON.stringify(section)}
                                    </Markdown>
                                </div>
                                <div className="mt-8 pt-6 border-t border-[var(--border)] flex justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                                    <CheckCircle2 size={14} strokeWidth={1.5} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            <EndowmentModal 
                isOpen={isEndowmentOpen} 
                onClose={() => setIsEndowmentOpen(false)}
                currentCredits={user.credits}
                requiredCredits={1}
            />
        </div>
    );
}

export default function SummaryPage() {
    return (
        <div className="h-[100dvh] bg-[var(--background)] overflow-hidden relative">
            <SiteHeader showLogo />
            <div className="h-full overflow-y-auto pt-24">
                <Suspense fallback={<div className="flex h-full bg-[var(--background)] items-center justify-center text-[var(--foreground-muted)]">Loading...</div>}>
                    <SummaryContent />
                </Suspense>
            </div>
        </div>
    );
}
