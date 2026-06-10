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
    Type,
    ArrowRight,
    Lock,
    Sparkle
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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [inputText, setInputText] = useState("");
    const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
    const [setupError, setSetupError] = useState<string | null>(null);
    const [isGeneratingPack, setIsGeneratingPack] = useState(false);
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [missionTitle, setMissionTitle] = useState("");
    const [userEditedTitle, setUserEditedTitle] = useState(false);

    // Hover hesitation tracking
    const [hoverStartTime, setHoverStartTime] = useState<number | null>(null);
    const [isHesitating, setIsHesitating] = useState(false);

    const handleMouseEnter = () => {
        setHoverStartTime(Date.now());
    };

    const handleMouseLeave = () => {
        setHoverStartTime(null);
        setIsHesitating(false);
    };

    useEffect(() => {
        if (hoverStartTime === null) return;
        const interval = setInterval(() => {
            if (Date.now() - hoverStartTime > 500) {
                setIsHesitating(true);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [hoverStartTime]);

    // Demo loader
    const loadDemo = (type: 'mitosis' | 'contract') => {
        if (type === 'mitosis') {
            setInputText(
                "Mitosis is a process of cell duplication, or reproduction, during which one cell gives rise to two genetically identical daughter cells. It is divided into five main phases: Prophase, Prometaphase, Metaphase, Anaphase, and Telophase. During Prophase, chromatin condenses into visible chromosomes. Prometaphase involves nuclear envelope breakdown. Metaphase aligns chromosomes at the equatorial plate. Anaphase separates sister chromatids to opposite poles. Telophase reconstructs the nuclear envelopes around the separated sets of chromosomes, followed by Cytokinesis which splits the cell cytoplasm."
            );
            setMissionTitle("Mitosis Cell Division Prep");
            setUserEditedTitle(true);
            addToast("Biology (Mitosis) demo notes loaded. Tap 'Start Exam Sprint' below!", "success");
        } else if (type === 'contract') {
            setInputText(
                "A contract is a legally binding agreement between two or more parties. The essential elements of a contract are: Offer, Acceptance, Consideration, Intention to create legal relations, and Capacity. An Offer is an expression of willingness to contract on specific terms. Acceptance is the unconditional assent to all the terms of the offer. Consideration represents the price paid for the promise, which must have some economic value. Both parties must intend for the agreement to have legal consequences. Finally, the parties must possess the legal capacity to contract (e.g., being of sound mind and legal age)."
            );
            setMissionTitle("Contract Law 101 Prep");
            setUserEditedTitle(true);
            addToast("Contract Law demo notes loaded. Tap 'Start Exam Sprint' below!", "success");
        }
        setActiveTab('text');
    };

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
    const showConfigAndActions = inputText.trim().length > 0 || queue.length > 0;

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
        e.preventDefault();
        e.stopPropagation();
        
        if (isDesktop) {
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
        } else {
            // Programmatically trigger hidden native file selector on web
            fileInputRef.current?.click();
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
            <div className="min-h-[calc(100vh-5rem)] bg-transparent pt-20 flex flex-col items-center justify-center relative overflow-hidden">
                {/* CSS grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-40 z-0" />
                <StandardContainer className="relative z-10">
                    <div className="mb-8 text-center">
                        <button 
                            onClick={() => setIsGeneratingPack(false)}
                            className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] hover:text-white transition-colors inline-flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl bg-white/5 border border-white/5"
                        >
                            <X size={12} /> Cancel Generation
                        </button>
                    </div>
                    <ProfessorCeremony className="w-full py-12" />
                </StandardContainer>
            </div>
        );
    }

    return (
        <div className="bg-transparent text-[var(--foreground)] pb-28 pt-20 relative flex flex-col flex-1 overflow-x-clip">
            {/* $45,200 Luxury Visual Assets */}
            
            {/* Grid Line Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-60 z-0" />
            
            {/* Ambient Radial Halos */}
            <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#10B981]/5 via-[#6366F1]/5 to-transparent rounded-full blur-[110px] pointer-events-none z-0" />
            <div className="absolute bottom-[-150px] right-[-100px] w-[500px] h-[500px] bg-[#3B82F6]/5 rounded-full blur-[130px] pointer-events-none z-0" />

            <StandardContainer className="relative z-10">
                <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-600 max-w-4xl mx-auto space-y-10">
                    
                    {/* Header Banner */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-md">
                            <Sparkle size={12} className="text-[var(--accent)] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)]">
                                Lab Session for {user.firstName || (user.name !== "Scholar" ? user.name?.split(" ")[0] : null) || user.username || "Scholar"}
                            </span>
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-black tracking-[-0.03em] leading-[0.9] uppercase italic">
                            Exam <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">Sprint</span>
                        </h1>
                        <p className="text-sm text-[var(--foreground-muted)] max-w-xl mx-auto font-medium opacity-80 leading-relaxed">
                            Upload your slides or paste text. The Professor will deconstruct the noise and give you just the good parts.
                        </p>
                    </div>

                    {/* Compact Pill-Shaped Pipeline Flow */}
                    <div className="p-1 border border-white/5 rounded-3xl bg-zinc-950/40 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                        <div className="flex flex-wrap items-center gap-1.5 p-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mr-2 flex items-center gap-1.5 shrink-0 ml-2">
                                <Sparkles size={11} className="text-[#F59E0B]" /> Ingest Pipeline:
                            </span>
                            
                            {/* Pill 1 */}
                            <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/25 transition-all shrink-0">
                                <FileText size={12} className="text-emerald-400" />
                                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">01. Summary</span>
                            </div>

                            <span className="text-[var(--foreground-muted)]/30 text-[10px] shrink-0 font-bold">➔</span>

                            {/* Pill 2 */}
                            <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/25 transition-all shrink-0">
                                <Layers size={12} className="text-indigo-400" />
                                <span className="text-[9px] font-black uppercase tracking-wider text-indigo-400">02. Cards</span>
                            </div>

                            <span className="text-[var(--foreground-muted)]/30 text-[10px] shrink-0 font-bold">➔</span>

                            {/* Pill 3 */}
                            <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-red-500/25 transition-all shrink-0">
                                <Sword size={12} className="text-red-400" />
                                <span className="text-[9px] font-black uppercase tracking-wider text-red-400">03. Quiz</span>
                            </div>

                            <span className="text-[var(--foreground-muted)]/30 text-[10px] shrink-0 font-bold">➔</span>

                            {/* Pill 4 */}
                            <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-amber-500/25 transition-all shrink-0">
                                <MapIcon size={12} className="text-amber-400" />
                                <span className="text-[9px] font-black uppercase tracking-wider text-amber-400">04. Roadmap</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Flat 2.0 Ingestion Area - $45,200 Double-Elevated Glassmorphism Card */}
                    <div className="rounded-[2.5rem] bg-zinc-950/45 backdrop-blur-2xl border border-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden">
                        
                        {/* Tab Headers */}
                        <div className="flex bg-white/[0.02] border-b border-white/5 p-2 gap-2">
                            <button
                                onClick={() => setActiveTab('upload')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2.5 py-4 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer rounded-2xl",
                                    activeTab === 'upload' 
                                        ? 'bg-white/10 text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/5' 
                                        : 'text-[var(--foreground-muted)] hover:text-white hover:bg-white/[0.02]'
                                )}
                            >
                                <Upload size={14} strokeWidth={2.5} />
                                Upload Study File
                            </button>
                            <button
                                onClick={() => setActiveTab('text')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2.5 py-4 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer rounded-2xl",
                                    activeTab === 'text' 
                                        ? 'bg-white/10 text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/5' 
                                        : 'text-[var(--foreground-muted)] hover:text-white hover:bg-white/[0.02]'
                                )}
                            >
                                <Type size={14} strokeWidth={2.5} />
                                Paste Raw Text
                            </button>
                        </div>

                        {/* Workspace body */}
                        <div className="p-8 sm:p-12 space-y-8 relative">
                            
                            {/* Hidden file input for web, fully controlled by fileInputRef */}
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                multiple 
                                className="hidden" 
                                onChange={handleFileSelect} 
                                accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.pptx,.jpg,.jpeg,.png,.webp" 
                            />

                            {/* File Upload Ingestion Area */}
                            {activeTab === 'upload' ? (
                                <div className="space-y-6">
                                    <div 
                                        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                                        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                                        onDragOver={(e) => { e.preventDefault(); }}
                                        onDrop={handleDrop}
                                        onClick={handleUploadClick}
                                        className={cn(
                                            "py-16 px-6 flex flex-col items-center justify-center text-center transition-all duration-350 rounded-3xl border border-dashed cursor-pointer relative overflow-hidden group select-none",
                                            dragActive 
                                                ? "bg-white/[0.04] border-white/30 scale-[0.99] shadow-inner" 
                                                : "bg-white/[0.01] border-white/10 hover:bg-white/[0.03] hover:border-white/20"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 bg-white/5 border border-white/5 shadow-lg group-hover:scale-110 group-hover:bg-white/10 group-hover:border-white/10",
                                            dragActive ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "text-white"
                                        )}>
                                            <Upload className="w-6 h-6" strokeWidth={2} />
                                        </div>
                                        <h4 className="text-sm font-black text-white tracking-wide">Drag & drop your notes here, or click to browse</h4>
                                        <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-[0.15em] font-bold mt-2">Supports PDF, PPTX, DOCX, TXT, or Images</p>
                                        
                                        {/* Hover Highlight Ring */}
                                        <div className="absolute inset-0 border border-white/0 group-hover:border-white/5 rounded-3xl pointer-events-none transition-all duration-300" />
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-[var(--foreground-muted)] opacity-60">No materials handy? Try a demo:</span>
                                        <button 
                                            onClick={() => loadDemo('mitosis')}
                                            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black uppercase tracking-wider text-white transition-all cursor-pointer shadow-md hover-scale-md active:scale-95"
                                        >
                                            Biology (Mitosis)
                                        </button>
                                        <button 
                                            onClick={() => loadDemo('contract')}
                                            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black uppercase tracking-wider text-white transition-all cursor-pointer shadow-md hover-scale-md active:scale-95"
                                        >
                                            Contract Law
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)]">Paste Lecture Notes</label>
                                        <span className={`text-[10px] font-mono font-black tracking-tighter ${inputText.length > MAX_CHARS * 0.8 ? 'text-red-400' : 'text-[var(--foreground-muted)]/40'}`}>
                                            {inputText.length > 0 ? `${inputText.length.toLocaleString()} / ${MAX_CHARS.toLocaleString()}` : ''}
                                        </span>
                                    </div>
                                    <div className="relative group rounded-3xl overflow-hidden border border-white/5 focus-within:border-white/20 transition-all bg-white/[0.01]">
                                        <textarea
                                            value={inputText}
                                            onChange={(e) => {
                                                if (e.target.value.length <= MAX_CHARS) setInputText(e.target.value);
                                            }}
                                            placeholder="Paste your syllabus, textbook pages, raw lecture text, or class transcripts here..."
                                            className="w-full h-52 p-6 bg-transparent text-xs leading-relaxed outline-none font-bold text-white placeholder:text-[var(--foreground-muted)]/35 resize-none custom-scrollbar transition-all"
                                            disabled={isQueueProcessing}
                                        />
                                    </div>
                                </div>
                            )}

                            <AnimatePresence>
                                {showConfigAndActions && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-8 overflow-hidden"
                                    >
                                        {/* Title & Stats */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                                            <div className="flex flex-col space-y-2.5">
                                                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)]">
                                                    Sprint Name
                                                </label>
                                                <div className="relative rounded-2xl border border-white/5 focus-within:border-white/20 transition-all bg-white/[0.01] overflow-hidden">
                                                    <input 
                                                        type="text"
                                                        value={missionTitle}
                                                        onChange={(e) => {
                                                            setMissionTitle(e.target.value);
                                                            setUserEditedTitle(true);
                                                        }}
                                                        placeholder="e.g., 'Bio-Chem Prep' or 'Law 101 Exam'"
                                                        className="w-full bg-transparent px-5 py-4 text-xs font-bold text-white placeholder:text-[var(--foreground-muted)]/30 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-center shadow-lg relative">
                                                <div className="absolute top-0 right-0 p-3 opacity-10">
                                                    <Zap size={24} className="text-[#F59E0B]" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)]">Calculated Cost</span>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <Zap size={14} className="text-emerald-400 fill-current" />
                                                    <span className="text-lg font-black italic tracking-tight leading-none uppercase text-white">10 CREDITS</span>
                                                </div>
                                                <p className="text-[10px] text-[var(--foreground-muted)] mt-2 font-bold">You currently have {user.credits} credits.</p>
                                            </div>
                                        </div>

                                        {/* Ingestion Progress Queue */}
                                        {queue.length > 0 && (
                                            <div className="space-y-4 pt-6 border-t border-white/5 w-full">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-2">
                                                    Ingestion Queue
                                                </h3>
                                                <div className="grid gap-3 w-full">
                                                    {queue.map((item) => (
                                                        <div 
                                                            key={item.id} 
                                                            className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col gap-4 relative overflow-hidden animate-in fade-in duration-300 w-full"
                                                        >
                                                            <div className="flex items-center justify-between gap-4 w-full">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white shrink-0">
                                                                        <FileText size={18} />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <h4 className="text-xs font-black text-white truncate">{item.name}</h4>
                                                                        {item.file && (
                                                                            <p className="text-[9px] text-[var(--foreground-muted)] font-mono font-bold uppercase">{(item.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="shrink-0">
                                                                    {item.status === 'success' && (
                                                                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-400">Ready</span>
                                                                    )}
                                                                    {item.status === 'error' && (
                                                                        <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] font-black uppercase text-red-400">Error</span>
                                                                    )}
                                                                    {(item.status === 'reading' || item.status === 'learning') && (
                                                                        <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase text-white flex items-center gap-1.5">
                                                                            <Loader2 size={10} className="animate-spin text-white" />
                                                                            <span>Ingesting</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Progress / Status Description */}
                                                            {item.status === 'error' ? (
                                                                <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide flex items-center gap-1.5">
                                                                    <AlertCircle size={12} />
                                                                    <span>{item.errorMessage || "Failed to process document."}</span>
                                                                </p>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between gap-4">
                                                                        <p className="text-[10px] font-bold text-[var(--foreground-muted)]">
                                                                            {customStatusMsg[item.id] || (item.status === 'success' ? "All notes successfully absorbed" : loadingPhrases[filePhraseIndex[item.id] || 0])}
                                                                        </p>
                                                                        <span className="text-[10px] font-mono font-black text-white">
                                                                            {item.status === 'success' ? 100 : (trickleProgress[item.id] || item.progress || 20)}%
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
                                                                        <motion.div 
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${item.status === 'success' ? 100 : (trickleProgress[item.id] || item.progress || 20)}%` }}
                                                                            className="h-full bg-white rounded-full shadow-[0_0_10px_white]"
                                                                            transition={{ ease: "easeOut" }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Errors */}
                                        {setupError && (
                                            <div className="flex items-center justify-between p-5 rounded-2xl bg-red-500/10 border border-red-500/20 animate-in shake duration-500">
                                                <div className="flex items-center gap-2.5 text-[11px] font-black text-red-400 uppercase tracking-wider">
                                                    <AlertTriangle size={16} strokeWidth={2.5} className="shrink-0" />
                                                    <span className="leading-snug">{setupError}</span>
                                                </div>
                                                <button
                                                    onClick={() => { setSetupError(null); }}
                                                    className="px-3 py-1.5 bg-red-500/20 text-red-400 text-[9px] uppercase tracking-[0.2em] font-black rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer shrink-0 ml-2"
                                                >
                                                    Dismiss
                                                </button>
                                            </div>
                                        )}

                                        {/* Trigger buttons */}
                                        <div className="flex gap-4 pt-2">
                                            {inputText.trim().length > 0 && (
                                                <button
                                                    onClick={resetSelection}
                                                    className="px-8 py-5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                                                >
                                                    Clear All
                                                </button>
                                            )}
                                            <button
                                                onClick={handleGenerate}
                                                onMouseEnter={handleMouseEnter}
                                                onMouseLeave={handleMouseLeave}
                                                disabled={!hasSuccess || isQueueProcessing}
                                                className={cn(
                                                    "flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 relative overflow-hidden group shadow-2xl cursor-pointer",
                                                    !hasSuccess || isQueueProcessing
                                                        ? 'opacity-40 cursor-not-allowed bg-white/5 border border-white/5 text-white/20 shadow-none' 
                                                        : isHesitating
                                                            ? 'bg-gradient-to-r from-emerald-500 to-indigo-500 text-black shadow-[0_0_35px_rgba(16,185,129,0.35)] scale-[1.01] border border-white/10'
                                                            : 'bg-white text-black hover:bg-white/95 active:scale-[0.98]'
                                                )}
                                            >
                                                <Zap size={16} strokeWidth={2.5} className={hasSuccess && !isQueueProcessing ? "animate-pulse" : ""} />
                                                <span>Start Exam Sprint</span>
                                                <ArrowRight size={14} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

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
