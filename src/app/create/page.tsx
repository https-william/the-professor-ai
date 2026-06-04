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
import { useAppPlatform } from "@/hooks/useAppPlatform";

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
    const { queue, addFiles, addLocalPaths, updateFileStatus, clearQueue, isProcessing } = useIngestStore();
    const { isDesktop } = useAppPlatform();
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
    const [customStatusMsg, setCustomStatusMsg] = useState<Record<string, string>>({});

    // Keep track of active phrase animation
    useEffect(() => {
        const readingItems = queue.filter(item => (item.status === 'reading' || item.status === 'learning') && !customStatusMsg[item.id]);
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
    }, [queue, customStatusMsg]);

    // Handle background document parsing in page
    useEffect(() => {
        const processNext = async () => {
            const nextItem = queue.find(item => item.status === 'reading' && !processedIds.current.has(item.id));
            if (!nextItem || (!nextItem.file && !nextItem.path)) return;

            processedIds.current.add(nextItem.id);

            // Handle native desktop parsing via Rust command
            if (nextItem.path) {
                try {
                    updateFileStatus(nextItem.id, 'reading', 20);
                    const { invoke } = await import("@tauri-apps/api/core");
                    updateFileStatus(nextItem.id, 'reading', 50);

                    const extractedText = await invoke<string>("extract_document_text", { filePath: nextItem.path });

                    updateFileStatus(nextItem.id, 'success', 100);
                    if (extractedText) {
                        setInputText(prev => {
                            const nextVal = prev ? `${prev}\n\n${extractedText}` : extractedText;
                            return nextVal.substring(0, MAX_CHARS);
                        });
                    }
                } catch (err: any) {
                    console.error("Tauri Local Ingestion Error:", err);
                    updateFileStatus(nextItem.id, 'error', 0, err.message || "Failed to extract text locally");
                }
                return;
            }

            // Web-based parsing logic
            try {
                updateFileStatus(nextItem.id, 'reading', 20);

                const formData = new FormData();
                formData.append("file", nextItem.file!);

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
                    
                    const isLimited = !!result.isOcrLimited;
                    const limitCount = result.ocrLimitCount || 15;
                    const totalPages = result.images.length;

                    const ocrText = await performOCR(result.images, (curr, total) => {
                        const pct = Math.round(50 + (curr / total) * 45); // Scale OCR progress from 50% to 95%
                        setTrickleProgress(prev => ({ ...prev, [nextItem.id]: pct }));
                        setCustomStatusMsg(prev => ({ 
                            ...prev, 
                            [nextItem.id]: isLimited 
                                ? `OCR Limit (first ${limitCount} pgs): parsing page ${curr} of ${total}...` 
                                : `Performing OCR: parsing page ${curr} of ${total}...` 
                        }));
                    });

                    if (isLimited) {
                        setCustomStatusMsg(prev => ({ 
                            ...prev, 
                            [nextItem.id]: `OCR complete: parsed first ${limitCount} pages.` 
                        }));
                    } else {
                        setCustomStatusMsg(prev => ({ 
                            ...prev, 
                            [nextItem.id]: `OCR complete: parsed all ${totalPages} pages.` 
                        }));
                    }

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
            const files = Array.from(e.dataTransfer.files);
            const localPaths = files.filter(f => (f as any).path).map(f => ({ name: f.name, path: (f as any).path }));
            if (isDesktop && localPaths.length > 0) {
                addLocalPaths(localPaths);
            } else {
                addFiles(files);
            }
        }
    };

    const handleUploadClick = async (e: React.MouseEvent) => {
        if (isDesktop) {
            e.preventDefault();
            try {
                const { open } = await import("@tauri-apps/plugin-dialog");
                const selected = await open({
                    multiple: true,
                    filters: [{
                        name: 'Study Materials',
                        extensions: ['pdf', 'docx', 'pptx', 'txt']
                    }]
                });
                
                if (selected) {
                    const paths = Array.isArray(selected) ? selected : [selected];
                    const localFiles = paths.map(p => {
                        const name = p.split(/[/\\]/).pop() || p;
                        return { name, path: p };
                    });
                    addLocalPaths(localFiles);
                }
            } catch (err) {
                console.error("Tauri dialog open error:", err);
            }
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
                        <div className="p-8 sm:p-12 space-y-10 bg-[var(--card)] relative">
                            
                            {/* File Upload Ingestion Area */}
                            {activeTab === 'upload' ? (
                                <div 
                                    onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                                    onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                                    onDragOver={(e) => { e.preventDefault(); }}
                                    onDrop={handleDrop}
                                    onClick={handleUploadClick}
                                    className="block cursor-pointer group"
                                >
                                    <div 
                                        className={cn(
                                            "p-16 flex flex-col items-center justify-center text-center transition-all duration-300 rounded-[2rem]",
                                            "shadow-[inset_6px_6px_12px_rgba(0,0,0,0.2),_inset_-6px_-6px_12px_rgba(255,255,255,0.05)]",
                                            "border border-[var(--border)]",
                                            dragActive ? "bg-[var(--blue)]/[0.04] border-[var(--blue)]/50 scale-[0.99]" : "bg-[var(--bg-3)]/20 border-[var(--border)] hover:bg-[var(--bg-3)]/30"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 bg-[var(--background)]",
                                            "shadow-[4px_4px_10px_rgba(0,0,0,0.3),_-4px_-4px_10px_rgba(255,255,255,0.05)] border border-[var(--border)]",
                                            dragActive ? "bg-[var(--blue)] text-white scale-110" : "text-[var(--blue)]"
                                        )}>
                                            <Upload className="w-9 h-9" strokeWidth={2} />
                                        </div>
                                        <h4 className="text-xl font-black text-[var(--foreground)] mb-2">Drop notes here</h4>
                                        <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-[0.2em] font-black">PDF, PPTX, DOCX, or Images</p>
                                        {!isDesktop && (
                                            <input type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.pptx,.jpg,.jpeg,.png,.webp" />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 animate-in fade-in duration-300">
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
                                        className="w-full h-80 p-6 rounded-[2rem] bg-[var(--bg-3)]/30 border border-[var(--border)] text-sm leading-relaxed outline-none font-bold text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/30 focus:border-[var(--blue)]/40 resize-none custom-scrollbar shadow-[inset_6px_6px_12px_rgba(0,0,0,0.2),_inset_-6px_-6px_12px_rgba(255,255,255,0.05)]"
                                        disabled={isQueueProcessing}
                                    />
                                </div>
                            )}

                            {/* Title & Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col justify-center">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] mb-3">Sprint Name</label>
                                    <input 
                                        type="text"
                                        value={missionTitle}
                                        onChange={(e) => {
                                            setMissionTitle(e.target.value);
                                            setUserEditedTitle(true);
                                        }}
                                        placeholder="e.g., 'Bio-Chem Prep' or 'Law 101 Exam'"
                                        className="w-full bg-[var(--bg-3)]/20 border border-[var(--border)] rounded-2xl px-6 py-4 text-sm font-bold text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/30 focus:border-[var(--blue)]/40 outline-none transition-all shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),_inset_-4px_-4px_8px_rgba(255,255,255,0.05)]"
                                    />
                                </div>
                                <div className="p-5 rounded-2xl bg-[var(--bg-3)]/20 border border-[var(--border)] flex flex-col justify-center shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),_inset_-4px_-4px_8px_rgba(255,255,255,0.05)]">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">Calculated Cost</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Zap size={16} className="text-[var(--blue)] fill-current" />
                                        <span className="text-xl font-black italic tracking-tight leading-none uppercase">10 CREDITS</span>
                                    </div>
                                    <p className="text-[8px] text-[var(--foreground-muted)] mt-1.5 font-bold">You currently have {user.credits} credits.</p>
                                </div>
                            </div>

                            {/* Ingestion Progress Queue */}
                            {queue.length > 0 && (
                                <div className="space-y-4 pt-6 border-t border-[var(--border)] flex flex-col items-center justify-center">
                                    {queue.map((item) => (
                                        <div 
                                            key={item.id} 
                                            className="p-5 sm:p-6 rounded-[2rem] bg-[var(--card)]/90 border border-white/5 shadow-[0_15px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl flex flex-col gap-4 relative overflow-hidden animate-in fade-in duration-300"
                                        >
                                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                            
                                            <div className="flex gap-4 items-start w-full">
                                                {/* Left Column: Visualizer Status Indicator */}
                                                <div className="relative w-10 h-10 rounded-xl bg-[var(--background-secondary)] flex items-center justify-center shrink-0 border border-[var(--border)] overflow-hidden shadow-inner">
                                                    {item.status === 'success' ? (
                                                        <div className="absolute inset-0 bg-[var(--emerald)]/10 flex items-center justify-center">
                                                            <CheckCircle2 className="w-5 h-5 text-[var(--emerald)]" />
                                                        </div>
                                                    ) : item.status === 'error' ? (
                                                        <div className="absolute inset-0 bg-[var(--crimson)]/10 flex items-center justify-center">
                                                            <AlertCircle className="w-5 h-5 text-[var(--crimson)]" />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* Spinning Accent Ring */}
                                                            <motion.div 
                                                                className="absolute inset-0.5 rounded-lg border border-dashed border-[var(--blue)]/30"
                                                                animate={{ rotate: 360 }}
                                                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                                            />
                                                            <Loader2 className="w-5 h-5 text-[var(--blue)] animate-spin relative z-10" />
                                                        </>
                                                    )}
                                                </div>

                                                {/* Middle: Content Info */}
                                                <div className="flex-1 min-w-0">
                                                    {item.status === 'success' ? (
                                                        <p className="text-xs font-black text-[var(--foreground)] leading-snug">
                                                            Mastered <span className="text-[var(--blue)] italic font-black uppercase">{item.name}</span>.
                                                        </p>
                                                    ) : item.status === 'error' ? (
                                                        <p className="text-xs font-black text-[var(--crimson)] leading-snug uppercase">
                                                            {item.errorMessage || `Failed to read ${item.name}`}
                                                        </p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between gap-4">
                                                                <p className="text-[11px] font-black text-[var(--foreground)] leading-snug truncate pr-2">
                                                                    {customStatusMsg[item.id] || loadingPhrases[filePhraseIndex[item.id] || 0]}
                                                                </p>
                                                                <span className="text-[10px] font-mono font-black text-[var(--blue)] shrink-0">{trickleProgress[item.id] || item.progress || 20}%</span>
                                                            </div>
                                                            <div className="w-full bg-[var(--background)] rounded-full h-1.5 overflow-hidden border border-[var(--border)] relative shadow-inner">
                                                                <motion.div 
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${trickleProgress[item.id] || item.progress || 20}%` }}
                                                                    className="h-full bg-gradient-to-r from-[var(--blue-light)] to-[var(--blue)] rounded-full shadow-[0_0_12px_var(--blue-glow)]"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bottom: Ingestion Monospace Terminal Log */}
                                            <div className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-[10px] text-[var(--foreground-muted)] space-y-1.5 select-none relative overflow-hidden">
                                                {/* Terminal Top Dot Controls */}
                                                <div className="flex items-center gap-1.5 text-white/30 border-b border-white/5 pb-2 mb-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
                                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
                                                    <span className="ml-1 text-[8px] font-black uppercase tracking-[0.25em]">Ingestion Pipeline Console</span>
                                                </div>
                                                
                                                <p className="text-white/60"><span className="text-[var(--blue)]">&gt;</span> PIPELINE INITIALIZED: {item.name}</p>
                                                {item.file && (
                                                    <p className="text-white/40"><span className="text-[var(--blue)]">&gt;</span> Payload details: {(item.file.size / (1024 * 1024)).toFixed(2)} MB | MIME: {item.file.type || "unknown"}</p>
                                                )}
                                                
                                                {item.status === 'reading' && (
                                                    <p className="text-[var(--blue)] animate-pulse"><span className="text-[var(--blue)]">&gt;</span> STATUS: Extracting text stream & de-formatting tables...</p>
                                                )}
                                                {item.status === 'learning' && (
                                                    <>
                                                        <p className="text-amber-500/80"><span className="text-amber-500/80">&gt;</span> STATUS: Scanned document detected. OCR Engine active.</p>
                                                        <p className="text-[var(--blue)] animate-pulse"><span className="text-[var(--blue)]">&gt;</span> {customStatusMsg[item.id] || "Initializing WASM Tesseract workers..."}</p>
                                                    </>
                                                )}
                                                {item.status === 'success' && (
                                                    <>
                                                        <p className="text-[var(--emerald)] font-bold"><span className="text-[var(--emerald)]">&gt;</span> STATUS: 100% of notes successfully absorbed.</p>
                                                        <p className="text-white/35"><span className="text-white/35">&gt;</span> SYSTEM: Study pack ready for compilation.</p>
                                                    </>
                                                )}
                                                {item.status === 'error' && (
                                                    <p className="text-[var(--crimson)] font-bold"><span className="text-[var(--crimson)]">&gt;</span> FATAL ERROR: {item.errorMessage || "Failed to parse document content."}</p>
                                                )}
                                            </div>
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
