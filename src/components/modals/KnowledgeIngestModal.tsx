"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIngestStore } from "@/store/useIngestStore";
import { performOCR } from "@/lib/ocr-bridge";
import { X, Upload, CheckCircle2, Loader2, AlertCircle, MessageCircle, Type, Zap, BookOpen, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToasts } from "@/components/ui/GlobalToasts";

/* ═══ Claymorphic style helpers ═══ */
const clay = {
    textarea: {
        background: "rgba(255, 255, 255, 0.02)",
        borderRadius: "20px",
        border: "1px solid var(--border)",
        color: "var(--text)",
        resize: "none",
        outline: "none",
        fontSize: "14px",
        padding: "16px",
        width: "100%",
        minHeight: "100px",
    } as React.CSSProperties,
};

interface KnowledgeIngestModalProps {
    onSuccess?: (text: string) => void;
    onStartSprint?: () => void;
    title?: string;
    description?: string;
    isSprint?: boolean;
}

export default function KnowledgeIngestModal({ onSuccess, onStartSprint, title, description, isSprint }: KnowledgeIngestModalProps) {
    const { isModalOpen, closeModal, queue, addFiles, updateFileStatus } = useIngestStore();
    const { addToast } = useToasts();
    const [dragActive, setDragActive] = useState(false);
    const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
    const [pastedText, setPastedText] = useState("");
    const [isPasting, setIsPasting] = useState(false);
    const processedIds = useRef<Set<string>>(new Set());

    const hasSuccess = queue.some(item => item.status === 'success');
    const isProcessing = queue.some(item => item.status === 'uploading' || item.status === 'reading' || item.status === 'learning');

    // Prevent scroll when open
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = "hidden";
            const mainContainer = document.getElementById("main-scroll-container");
            if (mainContainer) mainContainer.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
            const mainContainer = document.getElementById("main-scroll-container");
            if (mainContainer) mainContainer.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isModalOpen]);

    // High-Anticipation Loading Phrases & Trickle State
    const loadingPhrases = [
        "Skimming the abstract...",
        "Reviewing notes & parsing tables...",
        "Translating academic jargon into plain English...",
        "Connecting the dots across chapters...",
        "Distilling high-yield survival concepts...",
        "Almost there. Polishing the wisdom..."
    ];
    const [trickleProgress, setTrickleProgress] = useState<Record<string, number>>({});
    const [phraseIndex, setPhraseIndex] = useState<Record<string, number>>({});

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
            setPhraseIndex(prev => {
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

    // Real Processor
    useEffect(() => {
        const processNext = async () => {
            const nextItem = queue.find(item => item.status === 'uploading' && !processedIds.current.has(item.id));
            if (!nextItem || !nextItem.file) return;

            processedIds.current.add(nextItem.id);

            // Check if the file can be processed entirely on the client side (.txt, .md)
            const isTextFile = nextItem.file && (nextItem.name.endsWith('.txt') || nextItem.name.endsWith('.md'));
            if (isTextFile) {
                try {
                    updateFileStatus(nextItem.id, 'reading', 30);
                    const reader = new FileReader();
                    const text = await new Promise<string>((resolve, reject) => {
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = () => reject(new Error("Failed to read local text file."));
                        reader.readAsText(nextItem.file!);
                    });
                    
                    updateFileStatus(nextItem.id, 'success', 100);
                    
                    const finalWeightText = text.trim();
                    if (finalWeightText) {
                        if (onSuccess) {
                            onSuccess(finalWeightText);
                        }
                    } else {
                        throw new Error("Text file is empty.");
                    }
                } catch (err: any) {
                    console.error("Local Ingestion Error:", err);
                    updateFileStatus(nextItem.id, 'error', 0, err.message || "Failed to process text file locally");
                    addToast(`Failed to process text file: ${err.message}`, "error");
                }
                return;
            }

            try {
                // Initial progress bump
                updateFileStatus(nextItem.id, 'uploading', 5);

                const formData = new FormData();
                formData.append("file", nextItem.file);

                // Use XMLHttpRequest to get real upload progress!
                const uploadFile = () => {
                    return new Promise<{ text?: string; isOcrRequired?: boolean; images?: { data: string; ext: string }[]; baseText?: string; error?: string }>((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open("POST", "/api/parse");

                        xhr.upload.onprogress = (event) => {
                            if (event.lengthComputable) {
                                const percentComplete = Math.min(99, Math.round((event.loaded / event.total) * 100));
                                updateFileStatus(nextItem.id, 'uploading', percentComplete);
                            }
                        };

                        xhr.onload = () => {
                            if (xhr.status >= 200 && xhr.status < 300) {
                                try {
                                    const result = JSON.parse(xhr.responseText);
                                    resolve(result);
                                } catch (e) {
                                    reject(new Error("Parser returned invalid response."));
                                }
                            } else {
                                try {
                                    const result = JSON.parse(xhr.responseText);
                                    reject(new Error(result.error || "Failed to upload document."));
                                } catch {
                                    if (xhr.status === 413) {
                                        reject(new Error("File is too large for the server. Try converting it to TXT or splitting it into smaller files."));
                                    } else if (xhr.status === 406) {
                                        reject(new Error("The file format is unacceptable or headers are mismatched."));
                                    } else {
                                        reject(new Error(`Failed to upload document (HTTP status code: ${xhr.status}).`));
                                    }
                                }
                            }
                        };

                        xhr.onerror = () => reject(new Error("Network connection error during upload. Please check your connection."));
                        xhr.send(formData);
                    });
                };

                const result = await uploadFile();
                
                // Now we enter the 'reading' (AI processing) phase
                updateFileStatus(nextItem.id, 'reading', 0);

                let finalWeightText = result.text || "";

                if (result.isOcrRequired && result.images) {
                    updateFileStatus(nextItem.id, 'learning', 50); // Show OCR phase
                    console.log("[Parser] OCR Phase Started for images:", result.images.length);
                    const ocrText = await performOCR(result.images);
                    finalWeightText = `${result.baseText || ""}\n\n${ocrText}`;
                }

                updateFileStatus(nextItem.id, 'success', 100);
                
                if (onSuccess && finalWeightText) {
                    onSuccess(finalWeightText);
                }
            } catch (err: any) {
                console.error("Ingestion Error:", err);
                updateFileStatus(nextItem.id, 'error', 0, err.message || "Failed to parse file");
                addToast(err.message || "Failed to parse file", "error");
            }
        };

        if (isProcessing) {
            processNext();
        }
    }, [queue, isProcessing, updateFileStatus, onSuccess]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const validFiles: File[] = [];
            for (const file of files) {
                if (file.size > 10 * 1024 * 1024) {
                    addToast(`File ${file.name} is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please upload files under 10MB.`, "error");
                } else {
                    validFiles.push(file);
                }
            }
            if (validFiles.length > 0) addFiles(validFiles);
        }
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files) {
            const files = Array.from(e.dataTransfer.files);
            const validFiles: File[] = [];
            for (const file of files) {
                if (file.size > 10 * 1024 * 1024) {
                    addToast(`File ${file.name} is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please upload files under 10MB.`, "error");
                } else {
                    validFiles.push(file);
                }
            }
            if (validFiles.length > 0) addFiles(validFiles);
        }
    };

    const handleTextSubmit = async () => {
        if (!pastedText.trim()) return;
        setIsPasting(true);
        const tempId = Math.random().toString(36).substring(7);
        addFiles([new File([pastedText], "Pasted Knowledge.txt")], [tempId]);
        setPastedText("");
        setIsPasting(false);
    };

    const handleStartAction = () => {
        if (onStartSprint) {
            onStartSprint();
        }
        closeModal();
    };

    return (
        <AnimatePresence>
            {isModalOpen && (
                <div className="fixed inset-0 z-[100005] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={closeModal}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg overflow-hidden border border-[var(--border)] shadow-2xl flex flex-col max-h-[85vh]"
                    style={{
                        background: "var(--background)",
                        borderRadius: "32px",
                    }}
                >
                    {/* Header */}
                    <div className="p-6 flex items-center justify-between border-b border-[var(--border)] shrink-0">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
                                isSprint ? "bg-[var(--blue)] border-[var(--blue)] text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "bg-[var(--accent-bg)] border-[var(--accent-glow)] text-[var(--accent)]"
                            )}>
                                {isSprint ? <Zap className="w-5 h-5 fill-current" /> : <BookOpen className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight">
                                    {title || (isSprint ? "Exam Sprint" : "Share Notes")}
                                </h3>
                                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[var(--foreground-muted)]">
                                    {description || "Upload study materials for your Professor"}
                                </p>
                            </div>
                        </div>
                        <button onClick={closeModal} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content Area (Scrollable) */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {/* Tabs */}
                        <div className="flex gap-2 p-1 bg-[var(--background-secondary)] rounded-2xl border border-[var(--border)]">
                            <button 
                                onClick={() => setActiveTab('upload')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeTab === 'upload' ? 'bg-[var(--foreground)] text-[var(--background)] shadow-lg scale-[1.02]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                )}
                            >
                                <Upload className="w-3.5 h-3.5" strokeWidth={3} />
                                Upload File
                            </button>
                            <button 
                                onClick={() => setActiveTab('text')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeTab === 'text' ? 'bg-[var(--foreground)] text-[var(--background)] shadow-lg scale-[1.02]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                )}
                            >
                                <Type className="w-3.5 h-3.5" strokeWidth={3} />
                                Paste Text
                            </button>
                        </div>
                        
                        {activeTab === 'upload' ? (
                            <label 
                                onDragEnter={() => setDragActive(true)}
                                onDragLeave={() => setDragActive(false)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={onDrop}
                                className="block cursor-pointer group"
                            >
                                <div 
                                    className={cn(
                                        "p-10 flex flex-col items-center justify-center text-center transition-all rounded-3xl border-2 border-dashed group-hover:border-[var(--blue)]/50 group-active:scale-[0.98]",
                                        dragActive ? "bg-[var(--blue-dim)] border-[var(--blue)]" : "bg-[var(--background-secondary)] border-[var(--border)]"
                                    )}
                                >
                                    <div className={cn(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all shadow-xl",
                                        dragActive ? "bg-[var(--blue)] text-white scale-110" : "bg-[var(--background)] text-[var(--blue)] group-hover-scale-sm"
                                    )}>
                                        <Upload className="w-8 h-8" strokeWidth={3} />
                                    </div>
                                    <h4 className="text-lg font-black text-[var(--foreground)] mb-1">Drop notes here</h4>
                                    <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-[0.2em] font-black">PDF, PPTX, DOCX, or Images</p>
                                    <input type="file" multiple className="hidden" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.pptx,.jpg,.jpeg,.png,.webp" />
                                </div>
                            </label>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <textarea
                                    style={clay.textarea}
                                    placeholder="Paste your syllabus, raw lecture transcript, or study notes directly..."
                                    value={pastedText}
                                    onChange={(e) => setPastedText(e.target.value)}
                                    disabled={isPasting}
                                    className="custom-scrollbar bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground)]"
                                />
                                <button
                                    onClick={handleTextSubmit}
                                    disabled={!pastedText.trim() || isPasting}
                                    className={cn(
                                        "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl",
                                        !pastedText.trim() || isPasting ? 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] border border-[var(--border)] opacity-50' : 'bg-[var(--blue)] text-white hover-scale-sm active:scale-[0.98] shadow-[0_8px_24px_rgba(59,130,246,0.3)]'
                                    )}
                                >
                                    {isPasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                    Process Material
                                </button>
                            </div>
                        )}

                        {/* File Queue */}
                        {queue.length > 0 && (
                            <div className="space-y-3 pb-2">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)]">Professor's Analysis</span>
                                </div>
                                
                                {queue.map((item) => (
                                    <div key={item.id} className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] flex gap-4 items-start animate-in slide-in-from-bottom-2 duration-300 shadow-sm">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--background)] flex items-center justify-center shrink-0 border border-[var(--border)]">
                                            <MessageCircle className="w-5 h-5 text-[var(--blue)]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {item.status === 'success' ? (
                                                <p className="text-sm font-bold text-[var(--foreground)] leading-snug truncate">
                                                    "Mastered <span className="text-[var(--blue)]">{item.name}</span>."
                                                </p>
                                            ) : item.status === 'error' ? (
                                                <p className="text-sm font-bold text-[var(--crimson)] leading-snug">
                                                    {item.errorMessage || `Failed to read ${item.name}`}
                                                </p>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 truncate pr-2">
                                                            <Loader2 className="w-4 h-4 text-[var(--blue)] animate-spin shrink-0" />
                                                            <p className="text-xs font-bold text-[var(--foreground)] leading-snug truncate">
                                                                {item.status === 'uploading' ? (
                                                                    <span>Uploading document ({item.progress}%)</span>
                                                                ) : (
                                                                    <span>
                                                                        {item.status === 'learning' ? (
                                                                            "Performing optical character recognition (OCR)..."
                                                                        ) : (
                                                                            (trickleProgress[item.id] || 0) <= 35 
                                                                                ? "Reading file structure..." 
                                                                                : (trickleProgress[item.id] || 0) <= 70 
                                                                                ? "Parsing key formulas & concepts..." 
                                                                                : "Formatting recall modules..."
                                                                        )}
                                                                    </span>
                                                                )}
                                                                <span className="italic text-[var(--foreground-muted)]"> ({item.name})</span>
                                                            </p>
                                                        </div>
                                                        <span className="text-[10px] font-mono font-black text-[var(--blue)]">
                                                            {item.status === 'uploading' 
                                                                ? Math.round(item.progress * 0.3) 
                                                                : Math.round(30 + (trickleProgress[item.id] || item.progress || 0) * 0.65)}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-[var(--background)] rounded-full h-2 overflow-hidden border border-[var(--border)] shadow-inner relative">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${item.status === 'uploading' 
                                                                ? Math.round(item.progress * 0.3) 
                                                                : Math.round(30 + (trickleProgress[item.id] || item.progress || 0) * 0.65)}%` }}
                                                            transition={{ type: "spring", stiffness: 60, damping: 15 }}
                                                            className={cn(
                                                                "h-full rounded-full transition-all duration-300",
                                                                item.status === 'uploading' 
                                                                    ? "bg-gradient-to-r from-[var(--blue)] to-[var(--violet)] shadow-[0_0_12px_var(--blue-glow)]"
                                                                    : "bg-gradient-to-r from-[var(--amber)] to-[var(--blue)] shadow-[0_0_12px_var(--amber)]"
                                                            )}
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                                    </div>
                                                    
                                                    {/* High-Anticipation Phrase Display */}
                                                    {item.status !== 'uploading' && (
                                                        <p className="text-[10px] font-medium text-[var(--foreground-muted)] italic pl-6 animate-pulse">
                                                            {loadingPhrases[phraseIndex[item.id] || 0]}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {item.status === 'success' && <CheckCircle2 className="w-5 h-5 text-[var(--emerald)] shrink-0" />}
                                        {item.status === 'error' && <AlertCircle className="w-5 h-5 text-[var(--crimson)] shrink-0" />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer (Fixed) */}
                    <div className="p-6 bg-[var(--background-secondary)] border-t border-[var(--border)] flex items-center justify-between gap-4 shrink-0">
                         <div className="hidden sm:flex items-center gap-2 text-[9px] text-[var(--foreground-muted)] font-black uppercase tracking-widest opacity-60">
                             <Zap className="w-3 h-3 text-[var(--blue)]" /> Secure Link
                         </div>
                         <div className="flex items-center gap-3 flex-1 sm:flex-none">
                            <button 
                                onClick={closeModal}
                                className="flex-1 sm:flex-none px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-[var(--foreground-muted)] transition-all hover:text-[var(--foreground)] active:scale-[0.95]"
                            >
                                Dismiss
                            </button>
                            <button 
                                onClick={handleStartAction}
                                disabled={isProcessing || !hasSuccess}
                                className={cn(
                                    "flex-1 sm:flex-none px-10 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.95]",
                                    isProcessing || !hasSuccess
                                    ? "bg-[var(--background-secondary)] text-[var(--foreground-muted)] border border-[var(--border)] opacity-50 cursor-not-allowed"
                                    : "bg-[var(--blue)] text-white hover-scale-lg shadow-[0_8px_32px_rgba(59,130,246,0.4)]"
                                )}
                            >
                                {isSprint ? "START SPRINT" : "GENERATE"}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                         </div>
                    </div>
                </motion.div>
            </div>
            )}
        </AnimatePresence>
    );
}
