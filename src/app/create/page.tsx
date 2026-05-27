"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useIngestStore } from "@/store/useIngestStore";
import { useToasts } from "@/components/ui/GlobalToasts";
import StandardContainer from "@/components/ui/StandardContainer";
import { cn } from "@/lib/utils";
import ProfessorCeremony from "@/components/ui/ProfessorCeremony";
import GuestSignupModal from "@/components/ui/GuestSignupModal";
import { createClient } from "@/lib/supabase/client";
import { performOCR } from "@/lib/ocr-bridge";
import { motion, AnimatePresence } from "framer-motion";

import { 
    X, 
    Zap, 
    Upload, 
    AlertTriangle,
    CheckCircle2,
    Loader2,
    AlertCircle,
    FileText,
    Layers,
    Sword,
    Map as MapIcon,
    Sparkles,
    MessageCircle,
    Type,
    ArrowRight
} from "lucide-react";

const MAX_CHARS = 50000;

// High-Anticipation Loading Phrases for the file queue
const loadingPhrases = [
    "Skimming the abstract...",
    "Reviewing notes & parsing tables...",
    "Translating academic jargon into plain English...",
    "Connecting the dots across chapters...",
    "Distilling high-yield survival concepts...",
    "Almost there. Polishing the wisdom..."
];

function CreatorStudio() {
    const router = useRouter();
    const { user, spendCredits } = useUser();
    const { addToast } = useToasts();
    const { queue, addFiles, updateFileStatus, clearQueue, isProcessing } = useIngestStore();
    const supabase = createClient();

    const [inputText, setInputText] = useState("");
    const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
    const [setupError, setSetupError] = useState<string | null>(null);
    const [isGeneratingPack, setIsGeneratingPack] = useState(false);
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [missionTitle, setMissionTitle] = useState("");
    const [userEditedTitle, setUserEditedTitle] = useState(false);

    // Queue processing states
    const processedIds = useRef<Set<string>>(new Set());
    const [trickleProgress, setTrickleProgress] = useState<Record<string, number>>({});
    const [filePhraseIndex, setFilePhraseIndex] = useState<Record<string, number>>({});

    // Keep track of active phrase animation
    useEffect(() => {
        const readingItems = queue.filter(item => item.status === 'reading' || item.status === 'learning');
        if (readingItems.length === 0) return;

        const interval = setInterval(() => {
            setTrickleProgress(prev => {
                const next = { ...prev };
                readingItems.forEach(item => {
                    const current = next[item.id] || item.progress || 20;
                    if (current < 90) {
                        next[item.id] = current + Math.floor(Math.random() * 6) + 2;
                    }
                });
                return next;
            });
        }, 400);

        const phraseInterval = setInterval(() => {
            setFilePhraseIndex(prev => {
                const next = { ...prev };
                readingItems.forEach(item => {
                    const current = next[item.id] || 0;
                    next[item.id] = (current + 1) % loadingPhrases.length;
                });
                return next;
            });
        }, 2500);

        return () => {
            clearInterval(interval);
            clearInterval(phraseInterval);
        };
    }, [queue]);

    // Handle background document parsing in page
    useEffect(() => {
        const processNext = async () => {
            const nextItem = queue.find(item => item.status === 'reading' && !processedIds.current.has(item.id));
            if (!nextItem || !nextItem.file) return;

            processedIds.current.add(nextItem.id);

            try {
                updateFileStatus(nextItem.id, 'reading', 20);

                const formData = new FormData();
                formData.append("file", nextItem.file);

                const res = await fetch("/api/parse", {
                    method: "POST",
                    body: formData,
                });

                const result = await res.json().catch(() => ({ error: "Parser failed to respond" }));
                
                if (!res.ok || result.error) {
                    throw new Error(result.error || "Failed to process document");
                }

                let finalWeightText = result.text || "";

                if (result.isOcrRequired && result.images) {
                    updateFileStatus(nextItem.id, 'learning', 50);
                    const ocrText = await performOCR(result.images);
                    finalWeightText = `${result.baseText || ""}\n\n${ocrText}`;
                }

                updateFileStatus(nextItem.id, 'success', 100);
                
                if (finalWeightText) {
                    setInputText(prev => {
                        const nextVal = prev ? `${prev}\n\n${finalWeightText}` : finalWeightText;
                        return nextVal.substring(0, MAX_CHARS);
                    });
                }
            } catch (err: any) {
                console.error("Ingestion Error:", err);
                updateFileStatus(nextItem.id, 'error', 0, err.message || "Failed to parse file");
            }
        };

        if (isProcessing) {
            processNext();
        }
    }, [queue, isProcessing, updateFileStatus]);

    // Load initial title from session if present
    useEffect(() => {
        const saved = sessionStorage.getItem("lastSprintName") || "";
        if (saved) {
            setMissionTitle(saved);
            setUserEditedTitle(true);
        }
    }, []);

    // Clear queue when page mounts or unmounts
    useEffect(() => {
        clearQueue();
        return () => clearQueue();
    }, [clearQueue]);

    // Auto-suggest title based on the first few words of input
    useEffect(() => {
        if (!userEditedTitle && inputText.trim().length > 10) {
            const firstLine = inputText.split('\n')[0].trim().replace(/[#*_\-[\]()]/g, '');
            if (firstLine.length > 3) {
                const words = firstLine.split(/\s+/).slice(0, 4).join(" ");
                const cleaned = words.replace(/[^a-zA-Z0-9\s]/g, '').trim();
                if (cleaned) {
                    const capitalized = cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                    setMissionTitle(capitalized + " Prep");
                }
            }
        }
    }, [inputText, userEditedTitle]);

    useEffect(() => {
        if (typeof window !== "undefined" && !user.isAuthenticated && !user.isLoading) {
            const isGuest = sessionStorage.getItem("shared_view") === "true";
            if (isGuest) {
                setShowGuestModal(true);
            }
        }
    }, [user.isAuthenticated, user.isLoading]);

    const hasSuccess = queue.some(item => item.status === 'success') || inputText.trim().length > 50;
    const isQueueProcessing = queue.some(item => item.status === 'reading' || item.status === 'learning');

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addFiles(Array.from(e.target.files));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleGenerate = async () => {
        if (!inputText.trim()) return;

        const customTitle = missionTitle || "";

        // Deduct credits for Exam Sprint (10 credits)
        if (user.isAuthenticated) {
            const success = await spendCredits(10);
            if (!success) {
                setSetupError("Insufficient credits for Exam Sprint. Please acquire more credits.");
                return;
            }
        }

        sessionStorage.setItem("examSprintContent", inputText);
        setIsGeneratingPack(true);

        const createPack = async () => {
            const packId = crypto.randomUUID();
            const cleanTitle = customTitle || (inputText.trim() ? inputText.trim().replace(/^[^a-zA-Z0-9]+/, '').split(/\s+/).slice(0, 6).join(" ").toUpperCase() : `STUDY PACK: ${new Date().toLocaleDateString()}`);
            
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) {
                    const offlinePacks = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
                    offlinePacks[packId] = {
                        id: packId,
                        title: cleanTitle,
                        source_text: inputText,
                        phases_data: {},
                        user_id: "guest",
                        savedAt: Date.now()
                    };
                    localStorage.setItem("offline_study_packs", JSON.stringify(offlinePacks));
                    router.push(`/library/pack/${packId}?sprint=true`);
                    return;
                }

                const { error: dbError } = await supabase.from("study_packs").insert({
                    id: packId,
                    user_id: authUser.id,
                    title: cleanTitle,
                    description: "Comprehensive study sprint generated from your notes.",
                    source_text: inputText,
                    phases_data: {},
                });

                if (dbError) throw dbError;

                router.push(`/library/pack/${packId}?sprint=true`);
            } catch (err) {
                console.error("Failed to create pack in DB, falling back to offline storage:", err);
                const offlinePacks = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
                offlinePacks[packId] = {
                    id: packId,
                    title: cleanTitle,
                    source_text: inputText,
                    phases_data: {},
                    user_id: "guest",
                    savedAt: Date.now()
                };
                localStorage.setItem("offline_study_packs", JSON.stringify(offlinePacks));
                router.push(`/library/pack/${packId}?sprint=true`);
            }
        };

        createPack();
    };

    const resetSelection = () => {
        setInputText("");
        setSetupError(null);
        sessionStorage.removeItem("isExamSprint");
        sessionStorage.removeItem("examSprintContent");
        sessionStorage.removeItem("customGenerationTitle");
        setIsGeneratingPack(false);
        setMissionTitle("");
        setUserEditedTitle(false);
        clearQueue();
        processedIds.current.clear();
        setTrickleProgress({});
        setFilePhraseIndex({});
    };

    if (isGeneratingPack) {
        return (
            <div className="min-h-screen bg-transparent pt-20 flex flex-col items-center justify-center">
                <StandardContainer>
                    <div className="mb-8 text-center">
                        <button 
                            onClick={() => setIsGeneratingPack(false)}
                            className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-2 cursor-pointer"
                        >
                            <X size={14} /> Cancel Generation
                        </button>
                    </div>
                    <ProfessorCeremony className="w-full py-12" />
                </StandardContainer>
            </div>
        );
    }

    return (
        <div className="bg-[var(--bg)] text-[var(--foreground)] pb-24 pt-16 relative min-h-screen flex flex-col flex-1 overflow-x-hidden">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--blue-glow)] opacity-[0.03] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <StandardContainer>
                <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
                    {/* Header Banner */}
                    <div className="mb-10 text-center">
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 leading-none uppercase italic">
                            Exam <span className="text-[var(--blue)]">Sprint</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-[var(--foreground-muted)] font-bold leading-relaxed max-w-xl mx-auto opacity-75">
                            Your notes. Just the good parts. Let's break them down and lock them in.
                        </p>
                    </div>

                    {/* Compact Pill-Shaped Pipeline Flow */}
                    <div className="mb-8 p-4 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-md relative">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--blue)]/30" />
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mr-2 flex items-center gap-1.5 shrink-0">
                                <Sparkles size={11} className="text-[var(--blue)]" /> Sprint Pipeline:
                            </span>
                            
                            {/* Pill 1 */}
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-3)]/60 border border-[var(--border)] hover:border-[var(--blue)]/30 transition-all shrink-0">
                                <FileText size={12} className="text-[var(--blue)]" />
                                <span className="text-[10px] font-black uppercase tracking-tight">01. Summary</span>
                            </div>

                            <span className="text-[var(--foreground-muted)]/30 text-xs shrink-0">➔</span>

                            {/* Pill 2 */}
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-3)]/60 border border-[var(--border)] hover:border-[var(--amber)]/30 transition-all shrink-0">
                                <Layers size={12} className="text-[var(--amber)]" />
                                <span className="text-[10px] font-black uppercase tracking-tight">02. Cards</span>
                            </div>

                            <span className="text-[var(--foreground-muted)]/30 text-xs shrink-0">➔</span>

                            {/* Pill 3 */}
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-3)]/60 border border-[var(--border)] hover:border-[var(--crimson)]/30 transition-all shrink-0">
                                <Sword size={12} className="text-[var(--crimson)]" />
                                <span className="text-[10px] font-black uppercase tracking-tight">03. Quiz</span>
                            </div>

                            <span className="text-[var(--foreground-muted)]/30 text-xs shrink-0">➔</span>

                            {/* Pill 4 */}
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-3)]/60 border border-[var(--border)] hover:border-[var(--emerald)]/30 transition-all shrink-0">
                                <MapIcon size={12} className="text-[var(--emerald)]" />
                                <span className="text-[10px] font-black uppercase tracking-tight">04. Roadmap</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Flat 2.0 Ingestion Area */}
                    <div className="rounded-[2.5rem] bg-[var(--card)] border border-[var(--border)] shadow-xl overflow-hidden">
                        
                        {/* Tab Headers */}
                        <div className="flex bg-[var(--bg-3)]/40 border-b border-[var(--border)] p-1">
                            <button
                                onClick={() => setActiveTab('upload')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                                    activeTab === 'upload' 
                                        ? 'bg-[var(--background)] border border-[var(--border)] rounded-2xl text-[var(--foreground)] shadow-sm' 
                                        : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                )}
                            >
                                <Upload size={14} strokeWidth={2.5} />
                                Upload Study File
                            </button>
                            <button
                                onClick={() => setActiveTab('text')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                                    activeTab === 'text' 
                                        ? 'bg-[var(--background)] border border-[var(--border)] rounded-2xl text-[var(--foreground)] shadow-sm' 
                                        : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                )}
                            >
                                <Type size={14} strokeWidth={2.5} />
                                Paste Raw Text
                            </button>
                        </div>

                        {/* Workspace body */}
                        <div className="p-6 sm:p-8 space-y-6">
                            
                            {/* File Upload Ingestion Area */}
                            {activeTab === 'upload' ? (
                                <label 
                                    onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                                    onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                                    onDragOver={(e) => { e.preventDefault(); }}
                                    onDrop={handleDrop}
                                    className="block cursor-pointer group"
                                >
                                    <div 
                                        className={cn(
                                            "p-12 flex flex-col items-center justify-center text-center transition-all rounded-3xl border-2 border-dashed group-hover:border-[var(--blue)]/50 group-active:scale-[0.99]",
                                            dragActive ? "bg-[var(--blue)]/5 border-[var(--blue)]" : "bg-[var(--bg-3)]/30 border-[var(--border)]"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all shadow-xl bg-[var(--background)]",
                                            dragActive ? "bg-[var(--blue)] text-white scale-110" : "text-[var(--blue)]"
                                        )}>
                                            <Upload className="w-8 h-8" strokeWidth={2.5} />
                                        </div>
                                        <h4 className="text-lg font-black text-[var(--foreground)] mb-1">Drop notes here</h4>
                                        <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-[0.2em] font-black">PDF, PPTX, DOCX, or Images</p>
                                        <input type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.pptx,.jpg,.jpeg,.png,.webp" />
                                    </div>
                                </label>
                            ) : (
                                <div className="space-y-2 animate-in fade-in duration-300">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)]">Paste Lecture Notes</label>
                                        <span className={`text-[10px] font-mono font-black tracking-tighter ${inputText.length > MAX_CHARS * 0.8 ? 'text-[var(--crimson)]' : 'text-[var(--foreground-muted)]/40'}`}>
                                            {inputText.length > 0 ? `${inputText.length.toLocaleString()} / ${MAX_CHARS.toLocaleString()}` : ''}
                                        </span>
                                    </div>
                                    <textarea
                                        value={inputText}
                                        onChange={(e) => {
                                            if (e.target.value.length <= MAX_CHARS) setInputText(e.target.value);
                                        }}
                                        placeholder="Paste syllabus, textbook pages, raw lecture text, or transcripts here..."
                                        className="w-full h-64 p-5 rounded-2xl bg-[var(--bg-3)]/60 border border-[var(--border)] text-sm leading-relaxed outline-none font-bold text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/30 focus:border-[var(--blue)]/40 resize-none custom-scrollbar"
                                        disabled={isQueueProcessing}
                                    />
                                </div>
                            )}

                            {/* Title & Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col justify-center">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] mb-2">Sprint Name</label>
                                    <input 
                                        type="text"
                                        value={missionTitle}
                                        onChange={(e) => {
                                            setMissionTitle(e.target.value);
                                            setUserEditedTitle(true);
                                        }}
                                        placeholder="e.g., 'Bio-Chem Prep' or 'Law 101 Exam'"
                                        className="w-full bg-[var(--bg-3)]/60 border border-[var(--border)] rounded-xl px-5 py-3 text-sm font-bold text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/30 focus:border-[var(--blue)]/40 outline-none transition-all"
                                    />
                                </div>
                                <div className="p-4 rounded-xl bg-[var(--bg-3)]/40 border border-[var(--border)] flex flex-col justify-center">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">Calculated Cost</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Zap size={16} className="text-[var(--blue)] fill-current" />
                                        <span className="text-xl font-black italic tracking-tight leading-none uppercase">10 CREDITS</span>
                                    </div>
                                    <p className="text-[8px] text-[var(--foreground-muted)] mt-1 font-bold">You currently have {user.credits} credits.</p>
                                </div>
                            </div>

                            {/* Ingestion Progress Queue */}
                            {queue.length > 0 && (
                                <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] block">Professor's Feed</span>
                                    {queue.map((item) => (
                                        <div key={item.id} className="p-4 rounded-2xl bg-[var(--bg-3)]/60 border border-[var(--border)] flex gap-4 items-start shadow-sm">
                                            <div className="w-10 h-10 rounded-xl bg-[var(--background)] flex items-center justify-center shrink-0 border border-[var(--border)]">
                                                <MessageCircle className="w-5 h-5 text-[var(--blue)]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {item.status === 'success' ? (
                                                    <p className="text-xs font-bold text-[var(--foreground)] leading-snug">
                                                        "Mastered <span className="text-[var(--blue)]">{item.name}</span>."
                                                    </p>
                                                ) : item.status === 'error' ? (
                                                    <p className="text-xs font-bold text-[var(--crimson)] leading-snug">
                                                        {item.errorMessage || `Failed to read ${item.name}`}
                                                    </p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 truncate pr-2">
                                                                <Loader2 className="w-3.5 h-3.5 text-[var(--blue)] animate-spin shrink-0" />
                                                                <p className="text-[11px] font-bold text-[var(--foreground)] leading-snug truncate">
                                                                    {loadingPhrases[filePhraseIndex[item.id] || 0]} <span className="italic text-[var(--foreground-muted)]">({item.name})</span>
                                                                </p>
                                                            </div>
                                                            <span className="text-[10px] font-mono font-black text-[var(--blue)]">{trickleProgress[item.id] || item.progress || 20}%</span>
                                                        </div>
                                                        <div className="w-full bg-[var(--background)] rounded-full h-1.5 overflow-hidden border border-[var(--border)] relative">
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${trickleProgress[item.id] || item.progress || 20}%` }}
                                                                className="h-full bg-[var(--blue)] rounded-full shadow-[0_0_12px_var(--blue-glow)]"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {item.status === 'success' && <CheckCircle2 className="w-5 h-5 text-[var(--emerald)] shrink-0" />}
                                            {item.status === 'error' && <AlertCircle className="w-5 h-5 text-[var(--crimson)] shrink-0" />}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Errors */}
                            {setupError && (
                                <div className="flex items-center justify-between p-4 rounded-[20px] bg-[var(--crimson)]/10 border border-[var(--crimson)]/20 animate-in shake duration-500">
                                    <div className="flex items-center gap-2.5 text-[11px] font-black text-[var(--crimson)] uppercase tracking-wider">
                                        <AlertTriangle size={16} strokeWidth={2.5} className="shrink-0" />
                                        <span className="leading-snug">{setupError}</span>
                                    </div>
                                    <button
                                        onClick={() => { setSetupError(null); }}
                                        className="px-3 py-1.5 bg-[var(--crimson)]/20 text-[var(--crimson)] text-[9px] uppercase tracking-[0.2em] font-black rounded-lg hover:bg-[var(--crimson)]/30 transition-colors cursor-pointer shrink-0 ml-2"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            )}

                            {/* Trigger buttons */}
                            <div className="flex gap-3 pt-2">
                                {inputText.trim().length > 0 && (
                                    <button
                                        onClick={resetSelection}
                                        className="px-6 py-4 border border-[var(--border)] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--bg-3)]/60 transition-all cursor-pointer"
                                    >
                                        Clear All
                                    </button>
                                )}
                                <button
                                    onClick={handleGenerate}
                                    disabled={!hasSuccess || isQueueProcessing}
                                    className={cn(
                                        "flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 relative overflow-hidden group shadow-lg cursor-pointer",
                                        !hasSuccess || isQueueProcessing
                                            ? 'opacity-50 cursor-not-allowed bg-[var(--bg-3)]/80 border border-[var(--border)] text-[var(--foreground-muted)]/40' 
                                            : 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 active:scale-[0.98]'
                                    )}
                                >
                                    <Zap size={16} strokeWidth={2.5} className={hasSuccess && !isQueueProcessing ? "animate-pulse" : ""} />
                                    <span>Start Exam Sprint</span>
                                    <ArrowRight size={14} strokeWidth={2.5} />
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </StandardContainer>

            <GuestSignupModal
                isOpen={showGuestModal}
                onClose={() => setShowGuestModal(false)}
            />
        </div>
    );
}

export default function CreatePage() {
    return (
        <Suspense fallback={<ProfessorCeremony className="min-h-screen" />}>
            <CreatorStudio />
        </Suspense>
    );
}
