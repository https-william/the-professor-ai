"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    Zap,
    ChevronLeft,
    FileText,
    Layers,
    Sword,
    Map as MapIcon,
    Share2,
    Sparkles,
    CheckCircle2,
    Clock,
    ArrowRight,
    Lock,
    Trophy,
    BrainCircuit,
    Star,
    X,
    Maximize2,
    Download,
    Terminal,
    Target,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import StandardContainer from "@/components/ui/StandardContainer";
import { useToasts } from "@/components/ui/GlobalToasts";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import GuestSignupModal from "@/components/ui/GuestSignupModal";

// Import Interactive Components
import { InteractiveSummary } from "@/components/features/InteractiveSummary";
import { InteractiveFlashcards } from "@/components/features/InteractiveFlashcards";
import { InteractiveQuiz } from "@/components/features/InteractiveQuiz";
import { StudyRoadmap } from "@/components/features/StudyRoadmap";
import BreakdownViewer from "@/components/features/breakdown/BreakdownViewer";
import ThemeToggle from "@/components/ui/ThemeToggle";
import FocusTimer from "@/components/features/dashboard/FocusTimer";

interface Phase {
    id: string;
    title: string;
    icon: any;
    color: string;
    desc: string;
    content: string;
}

export default function StudyPackPage() {
    const params = useParams();
    const router = useRouter();
    const { addToast } = useToasts();
    const { user } = useUser();
    const userLoading = user.isLoading;

    const [completedPhases, setCompletedPhases] = useState<string[]>([]);
    const [isAllCompleted, setIsAllCompleted] = useState(false);
    const [packLoading, setPackLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    const [isSharedView, setIsSharedView] = useState(false);
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [showWrapModal, setShowWrapModal] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Workflow States
    const [viewingPhaseIndex, setViewingPhaseIndex] = useState<number | null>(null);
    const [isPendingTransition, startTransition] = useTransition();
    const [isSavedOffline, setIsSavedOffline] = useState(false);
    const [isPerforming, setIsPerforming] = useState(false);
    const [hasTaskCompleted, setHasTaskCompleted] = useState(false);
    const [sessionStats, setSessionStats] = useState({
        quiz: null as { score: number; correct: number; time: string; total: number } | null,
        flashcards: null as { totalCards: number } | null,
        startTime: Date.now(),
        finishTime: null as number | null
    });

    const packId = params.id as string;

    useEffect(() => {
        if (viewingPhaseIndex !== null || showWrapModal) {
            document.body.style.overflow = 'hidden';
            const container = document.getElementById('main-scroll-container');
            if (container) container.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
                if (container) container.style.overflow = 'auto';
            };
        }
    }, [viewingPhaseIndex, showWrapModal]);

    const [phasesData, setPhasesData] = useState<Record<string, any>>({});
    const [isLoadingPhase, setIsLoadingPhase] = useState(false);
    const [isStreamingPhase, setIsStreamingPhase] = useState(false);
    const [sourceText, setSourceText] = useState("");
    const [packTitle, setPackTitle] = useState("Study Pack");

    const phases: Phase[] = [
        {
            id: "distill",
            title: "Deep Summary",
            icon: FileText,
            color: "var(--blue)",
            desc: "The Professor's simple breakdown of your notes.",
            content: "### Simple Breakdown\n\nWe've organized your material into easy-to-understand summaries. This is your foundation."
        },
        {
            id: "retain",
            title: "Memory Cards",
            icon: Layers,
            color: "var(--amber)",
            desc: "Study flashcards with easy memory hooks.",
            content: "### Memory Hooks\n\nThese cards use active practice to help you remember the most important parts."
        },
        {
            id: "test",
            title: "Practice Quiz",
            icon: Sword,
            color: "var(--crimson)",
            desc: "Practice questions tailored to your material.",
            content: "### Final Check\n\nThis quiz helps you find any areas you might need to review again."
        },
        {
            id: "predict",
            title: "Study Roadmap",
            icon: MapIcon,
            color: "var(--emerald)",
            desc: "A simple guide to help you master the subject.",
            content: "### Study Plan\n\nA simple plan for your remaining study time."
        },
    ];

    const supabase = createClient();

    const prefetchPhase = async (targetPhaseId: string, srcText: string, pId: string) => {
        if (!srcText || !navigator.onLine) return;

        try {
            const res = await fetch("/api/generate/pack-phase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    packId: pId,
                    phaseId: targetPhaseId,
                    sourceText: srcText,
                    options: { difficulty: "medium", timer: 600 }
                }),
            });

            const contentType = res.headers.get("Content-Type") || "";
            if (contentType.includes("text/event-stream")) {
                const reader = res.body?.getReader();
                if (!reader) return;
                const decoder = new TextDecoder();
                let buffer = "";
                let accumulatedText = "";
                let accumulatedItems: any[] = [];

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    let lineEnd;
                    while ((lineEnd = buffer.indexOf('\n')) !== -1) {
                        const line = buffer.slice(0, lineEnd).trim();
                        buffer = buffer.slice(lineEnd + 1);

                        if (line.startsWith("data: ")) {
                            try {
                                const parsed = JSON.parse(line.slice(6));
                                if (parsed.type === "chunk" && parsed.chunk) {
                                    accumulatedText += parsed.chunk;
                                    if (targetPhaseId === "distill") {
                                        setPhasesData(prev => ({ ...prev, [targetPhaseId]: accumulatedText }));
                                    } else if (targetPhaseId === "predict") {
                                        setPhasesData(prev => ({ ...prev, [targetPhaseId]: { title: "Study Roadmap", roadmap: accumulatedText } }));
                                    }
                                }
                                if (parsed.type === "flashcard" && parsed.card) {
                                    accumulatedItems = [...accumulatedItems, parsed.card];
                                    setPhasesData(prev => ({ ...prev, [targetPhaseId]: accumulatedItems }));
                                }
                                if (parsed.type === "question" && parsed.question) {
                                    accumulatedItems = [...accumulatedItems, parsed.question];
                                    setPhasesData(prev => ({ ...prev, [targetPhaseId]: accumulatedItems }));
                                }
                                if (parsed.status === "complete" && parsed.data) {
                                    setPhasesData(prev => ({ ...prev, [targetPhaseId]: parsed.data }));
                                }
                            } catch (e) {}
                        }
                    }
                }
            } else {
                const result = await res.json();
                if (result.success) {
                    setPhasesData(prev => ({ ...prev, [targetPhaseId]: result.data }));
                }
            }
        } catch (err) {
            console.error(`Background prefetch failed for ${targetPhaseId}:`, err);
        }
    };

    useEffect(() => {
        if (userLoading) return;

        const fetchPack = async () => {
            setPackLoading(true);
            try {
                let packData = null;
                if (!navigator.onLine) {
                    const offlinePacks = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
                    if (offlinePacks[packId]) {
                        packData = offlinePacks[packId];
                        setIsSavedOffline(true);
                    } else {
                        addToast("You're offline and this study pack isn't saved for offline view.", "error");
                        router.push("/library");
                        return;
                    }
                } else {
                    const { data, error } = await supabase
                        .from("study_packs")
                        .select("*")
                        .eq("id", packId)
                        .single();

                    if (error) {
                        const offlinePacks = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
                        if (offlinePacks[packId]) {
                            packData = offlinePacks[packId];
                            setIsSavedOffline(true);
                        } else {
                            console.error("Fetch Pack Error:", error.message, error.details, error.hint);
                            addToast("This study pack could not be found.", "error");
                            router.push("/library");
                            return;
                        }
                    } else {
                        packData = data;
                        const offlinePacks = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
                        if (offlinePacks[packId]) {
                            setIsSavedOffline(true);
                        }
                    }
                }

                if (packData) {
                    setSourceText(packData.source_text || "");
                    setPackTitle(packData.title || "Study Pack");
                    setPhasesData(packData.phases_data || {});
                    const completed = packData.phases_data?._mastered || Object.keys(packData.phases_data || {}).filter(k => k !== '_mastered');
                    setCompletedPhases(completed);

                    // Track guests (unauthenticated) and shared view (non-owner)
                    const notOwner = !user.isAuthenticated || user.id !== packData.user_id;
                    const unauthenticated = !user.isAuthenticated;
                    setIsSharedView(notOwner);
                    setIsGuest(unauthenticated);

                    if (!notOwner && !unauthenticated && navigator.onLine && packData.source_text) {
                        const allPhases = ["distill", "retain", "test", "predict"];
                        const nextUncompleted = allPhases.find(pId => !completed.includes(pId) && !(packData.phases_data || {})[pId]);
                        if (nextUncompleted) {
                            prefetchPhase(nextUncompleted, packData.source_text, packId);
                        }
                    }

                    if (notOwner && typeof window !== "undefined") {
                        sessionStorage.setItem("shared_pack_title", packData.title || "Study Pack");
                    }
                    if (unauthenticated && typeof window !== "undefined") {
                        sessionStorage.setItem("shared_view", "true");
                    }
                }
            } catch (err) {
                console.error("Fetch Pack Unexpected Error:", err);
            } finally {
                setPackLoading(false);
                if (typeof window !== "undefined") {
                    const urlParams = new URLSearchParams(window.location.search);
                    if (urlParams.get("sprint") === "true") {
                        setViewingPhaseIndex(0);
                        setIsPerforming(true);
                        setHasTaskCompleted(false);
                    }
                }
            }
        };

        fetchPack();
    }, [packId, user.isAuthenticated, userLoading, addToast, router, supabase, user.id]);

    const currentPhase = viewingPhaseIndex !== null ? phases[viewingPhaseIndex] : null;

    const handleEnterPhase = (index: number) => {
        const phase = phases[index];
        const isPhaseCompleted = completedPhases.includes(phase.id);
        const hasContent = !!phasesData[phase.id];

        // Non-owners can view completed phases, but not generate new ones
        if (isSharedView) {
            if (isGuest && !isPhaseCompleted && !hasContent) {
                setShowGuestModal(true);
                return;
            }
            if (isPhaseCompleted || hasContent) {
                startTransition(() => {
                    setViewingPhaseIndex(index);
                    setIsPerforming(true);
                    setHasTaskCompleted(false);
                });
                return;
            }
            if (isGuest) {
                setShowGuestModal(true);
                return;
            }
            addToast("Only the pack owner can generate phases.", "error");
            return;
        }

        if (index > completedPhases.length) {
            addToast("Phase Locked: Complete the earlier steps first.", "error");
            return;
        }
        startTransition(() => {
            setViewingPhaseIndex(index);
            setIsPerforming(false);
            setHasTaskCompleted(false);
        });
    };

    const handleSaveOffline = () => {
        try {
            const offlinePacks = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
            if (isSavedOffline) {
                delete offlinePacks[packId];
                localStorage.setItem("offline_study_packs", JSON.stringify(offlinePacks));
                setIsSavedOffline(false);
                addToast("Removed from Offline Vault.", "success");
            } else {
                offlinePacks[packId] = {
                    id: packId,
                    title: packTitle,
                    source_text: sourceText,
                    phases_data: phasesData,
                    user_id: user.id,
                    savedAt: Date.now()
                };
                localStorage.setItem("offline_study_packs", JSON.stringify(offlinePacks));
                setIsSavedOffline(true);
                addToast("Saved for Offline View! You can access this anytime without an internet connection.", "success");
            }
        } catch (err) {
            console.error("Failed to save offline:", err);
            addToast("Failed to save for offline view. Storage might be full.", "error");
        }
    };

    const handleBeginTask = async () => {
        const phase = currentPhase;
        if (!phase) return;

        if (isGuest) { setShowGuestModal(true); return; }
        if (isSharedView) { addToast("Only the pack owner can generate phases.", "error"); return; }

        if (phasesData[phase.id]) {
            setIsPerforming(true);
            const nextIdx = viewingPhaseIndex! + 1;
            if (phases[nextIdx] && !phasesData[phases[nextIdx].id]) {
                prefetchPhase(phases[nextIdx].id, sourceText, packId);
            }
            return;
        }

        if (!sourceText) {
            addToast("Source material is missing. Try creating the pack again.", "error");
            return;
        }

        if (!navigator.onLine) {
            addToast("You are currently offline. Please check your internet connection or access your Offline Vault.", "error");
            return;
        }

        setIsLoadingPhase(true);
        try {
            const res = await fetch("/api/generate/pack-phase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    packId,
                    phaseId: phase.id,
                    sourceText,
                    options: {
                        difficulty: "medium",
                        timer: 600
                    }
                }),
            });

            const contentType = res.headers.get("Content-Type") || "";
            if (contentType.includes("text/event-stream")) {
                setIsLoadingPhase(false);
                setIsStreamingPhase(true);
                setIsPerforming(true);

                const reader = res.body?.getReader();
                if (!reader) throw new Error("Stream not readable");
                const decoder = new TextDecoder();
                let buffer = "";
                let accumulatedText = "";
                let accumulatedItems: any[] = [];

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    let lineEnd;
                    while ((lineEnd = buffer.indexOf('\n')) !== -1) {
                        const line = buffer.slice(0, lineEnd).trim();
                        buffer = buffer.slice(lineEnd + 1);

                        if (line.startsWith("data: ")) {
                            try {
                                const parsed = JSON.parse(line.slice(6));
                                if (parsed.type === "chunk" && parsed.chunk) {
                                    accumulatedText += parsed.chunk;
                                    if (phase.id === "breakdown" || phase.id === "distill") {
                                        setPhasesData(prev => ({ ...prev, [phase.id]: accumulatedText }));
                                    } else if (phase.id === "predict") {
                                        setPhasesData(prev => ({ ...prev, [phase.id]: { title: "Study Roadmap", roadmap: accumulatedText } }));
                                    }
                                }
                                if (parsed.type === "flashcard" && parsed.card) {
                                    accumulatedItems = [...accumulatedItems, parsed.card];
                                    setPhasesData(prev => ({ ...prev, [phase.id]: accumulatedItems }));
                                }
                                if (parsed.type === "question" && parsed.question) {
                                    accumulatedItems = [...accumulatedItems, parsed.question];
                                    setPhasesData(prev => ({ ...prev, [phase.id]: accumulatedItems }));
                                }
                                if (parsed.status === "complete" && parsed.data) {
                                    setPhasesData(prev => ({ ...prev, [phase.id]: parsed.data }));
                                }
                                if (parsed.status === "error") {
                                    throw new Error(parsed.message || parsed.error || "Stream error");
                                }
                            } catch (e) {}
                        }
                    }
                }
                setIsStreamingPhase(false);
                const nextIdx = viewingPhaseIndex! + 1;
                if (phases[nextIdx] && !phasesData[phases[nextIdx].id]) {
                    prefetchPhase(phases[nextIdx].id, sourceText, packId);
                }
                return;
            }

            const result = await res.json();
            if (result.success) {
                setPhasesData(prev => ({ ...prev, [phase.id]: result.data }));
                setIsPerforming(true);
            } else {
                const errorMsg = typeof result.error === "string" ? result.error : "Generation failed";
                throw new Error(errorMsg);
            }
        } catch (err: any) {
            console.error("Phase Generation Error:", err);
            const errMsg = err?.message || String(err);
            if (!navigator.onLine || errMsg.includes("Failed to fetch") || errMsg.includes("NetworkError") || errMsg.includes("fetch")) {
                addToast("You are currently offline. Please check your internet connection or access your Offline Vault.", "error");
            } else {
                addToast("The Professor is taking a quick break. Please try again in a moment.", "error");
            }
            setIsStreamingPhase(false);
        } finally {
            setIsLoadingPhase(false);
        }
    };

    const handleMasterPhase = async (stats?: any) => {
        if (!currentPhase) return;
        if (isGuest) { setShowGuestModal(true); return; }
        if (isSharedView) { addToast("Only the pack owner can modify this pack.", "error"); return; }

        // Record stats if provided
        if (currentPhase.id === 'test' && stats) {
            setSessionStats(prev => ({ ...prev, quiz: stats }));
        }
        if (currentPhase.id === 'retain' && stats) {
            setSessionStats(prev => ({ ...prev, flashcards: stats }));
        }

        const nextCompleted = completedPhases.includes(currentPhase.id)
            ? completedPhases
            : [...completedPhases, currentPhase.id];

        setCompletedPhases(nextCompleted);

        // Persist to DB
        try {
            await fetch("/api/library/update-pack", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    packId,
                    phasesData: {
                        ...phasesData,
                        _mastered: nextCompleted
                    }
                })
            });
        } catch (err) {
            console.error("Phase Persistence Error:", err);
        }

        const isLastPhase = viewingPhaseIndex === phases.length - 1;

        if (nextCompleted.length === phases.length || isLastPhase) {
            setSessionStats(prev => ({ ...prev, finishTime: Date.now() }));
            setIsAllCompleted(true);
            setViewingPhaseIndex(null);
            setIsPerforming(false);
            addToast("All steps complete! Your Study Report is now ready.", "success");

            // Award 100 XP for full sprint completion
            fetch("/api/user/activity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "exam_sprint", customXp: 100 })
            }).catch(err => console.error("XP error:", err));

            // Trigger Scholarly Wrap Modal
            setShowWrapModal(true);
        } else {
            // Award 50 XP for phase completion
            fetch("/api/user/activity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "exam_sprint", customXp: 50 })
            }).catch(err => console.error("XP error:", err));

            // Auto-advance to next phase intro
            const nextIdx = viewingPhaseIndex! + 1;
            if (phases[nextIdx]) {
                setViewingPhaseIndex(nextIdx);
                setIsPerforming(false);
                setHasTaskCompleted(false);
                addToast(`Phase Mastered! Unlocked: ${phases[nextIdx].title}`, "success");
            } else {
                // Fallback for safety
                setIsAllCompleted(true);
                setViewingPhaseIndex(null);
                setIsPerforming(false);
            }
        }
    };

    const handleShare = () => {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        navigator.clipboard.writeText(url);
        addToast("Study pack link copied! Share it with anyone.", "success");
    };

    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [pdfDownloadProgress, setPdfDownloadProgress] = useState(0);
    const [pdfDownloadSpeed, setPdfDownloadSpeed] = useState("");

    const handleExportPDF = async () => {
        if (!phasesData.distill) {
            addToast("Generate the Deep Summary first to download your PDF.", "warn");
            return;
        }

        setIsExportingPDF(true);
        setPdfDownloadProgress(0);
        setPdfDownloadSpeed("Connecting...");
        addToast("Downloading summary report...", "info");

        try {
            const summaryData = phasesData.distill;
            const summaryText = typeof summaryData === 'string' ? summaryData : (summaryData.summary ? (typeof summaryData.summary === 'string' ? summaryData.summary : JSON.stringify(summaryData.summary)) : "");

            const res = await fetch("/api/export/pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: packTitle,
                    content: summaryText,
                    watermark: "The Professor AI | Your notes. Just the good parts. (more time to catch up on sleep)"
                })
            });

            if (!res.ok) {
                throw new Error("Failed to generate PDF from server.");
            }

            const contentLengthHeader = res.headers.get("Content-Length");
            const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 2500000; // fallback estimate 2.5MB
            let loadedBytes = 0;
            const startTime = Date.now();

            if (!res.body) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `The_Professor_Summary_${packTitle.replace(/\s+/g, '_')}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const reader = res.body.getReader();
                const chunks: Uint8Array[] = [];

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (value) {
                        chunks.push(value);
                        loadedBytes += value.length;
                        const elapsedSec = (Date.now() - startTime) / 1000 || 0.1;
                        const speedBps = loadedBytes / elapsedSec;
                        const speedKbps = (speedBps / 1024).toFixed(1);
                        const loadedMb = (loadedBytes / (1024 * 1024)).toFixed(2);
                        const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);
                        const pct = Math.min(Math.round((loadedBytes / totalBytes) * 100), 100);

                        setPdfDownloadProgress(pct);
                        if (speedBps > 1024 * 1024) {
                            setPdfDownloadSpeed(`${loadedMb}MB / ${totalMb}MB (${(speedBps / (1024 * 1024)).toFixed(1)} MB/s)`);
                        } else {
                            setPdfDownloadSpeed(`${loadedMb}MB / ${totalMb}MB (${speedKbps} KB/s)`);
                        }
                    }
                }

                const blob = new Blob(chunks as BlobPart[], { type: "application/pdf" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `The_Professor_Summary_${packTitle.replace(/\s+/g, '_')}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }

            addToast("PDF Downloaded Successfully!", "success");
        } catch (err: any) {
            console.error("PDF Export Error:", err);
            addToast("Server PDF download failed. Triggering browser print fallback...", "warn");
            setTimeout(() => {
                window.print();
            }, 500);
        } finally {
            setIsExportingPDF(false);
            setPdfDownloadProgress(0);
            setPdfDownloadSpeed("");
        }
    };

    const handleRetryPhase = async (phaseId: string) => {
        if (!navigator.onLine) {
            addToast("You are currently offline. Please check your internet connection.", "error");
            return;
        }

        const lastRetryKey = `retry_time_${packId}_${phaseId}`;
        const lastRetry = sessionStorage.getItem(lastRetryKey);
        if (lastRetry && Date.now() - parseInt(lastRetry) < 5000) {
            addToast("Please wait a few seconds before retrying.", "warn");
            return;
        }
        sessionStorage.setItem(lastRetryKey, Date.now().toString());

        addToast(`Regenerating ${phaseId}...`, "info");
        setIsPerforming(true);
        setIsLoadingPhase(true);

        try {
            const res = await fetch("/api/generate/pack-phase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    packId,
                    phaseId,
                    sourceText,
                    options: { difficulty: "medium", timer: 600 }
                }),
            });

            const contentType = res.headers.get("Content-Type") || "";
            if (contentType.includes("text/event-stream")) {
                setIsLoadingPhase(false);
                setIsStreamingPhase(true);
                setIsPerforming(true);

                const reader = res.body?.getReader();
                if (!reader) throw new Error("Stream not readable");
                const decoder = new TextDecoder();
                let buffer = "";
                let accumulatedText = "";
                let accumulatedItems: any[] = [];

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    let lineEnd;
                    while ((lineEnd = buffer.indexOf('\n')) !== -1) {
                        const line = buffer.slice(0, lineEnd).trim();
                        buffer = buffer.slice(lineEnd + 1);

                        if (line.startsWith("data: ")) {
                            try {
                                const parsed = JSON.parse(line.slice(6));
                                if (parsed.type === "chunk" && parsed.chunk) {
                                    accumulatedText += parsed.chunk;
                                    if (phaseId === "breakdown" || phaseId === "distill") {
                                        setPhasesData(prev => ({ ...prev, [phaseId]: accumulatedText }));
                                    } else if (phaseId === "predict") {
                                        setPhasesData(prev => ({ ...prev, [phaseId]: { title: "Study Roadmap", roadmap: accumulatedText } }));
                                    }
                                }
                                if (parsed.type === "flashcard" && parsed.card) {
                                    accumulatedItems = [...accumulatedItems, parsed.card];
                                    setPhasesData(prev => ({ ...prev, [phaseId]: accumulatedItems }));
                                }
                                if (parsed.type === "question" && parsed.question) {
                                    accumulatedItems = [...accumulatedItems, parsed.question];
                                    setPhasesData(prev => ({ ...prev, [phaseId]: accumulatedItems }));
                                }
                                if (parsed.status === "complete" && parsed.data) {
                                    setPhasesData(prev => ({ ...prev, [phaseId]: parsed.data }));
                                    setIsStreamingPhase(false);
                                    setIsLoadingPhase(false);
                                    addToast("Phase regenerated successfully!", "success");
                                }
                                if (parsed.status === "error") {
                                    throw new Error(parsed.message || parsed.error || "Stream error");
                                }
                            } catch (e) {}
                        }
                    }
                }
            } else {
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setPhasesData(prev => ({ ...prev, [phaseId]: data }));
                setIsLoadingPhase(false);
                addToast("Phase regenerated successfully!", "success");
            }
        } catch (err: any) {
            console.error("Retry Phase Error:", err);
            setIsLoadingPhase(false);
            setIsStreamingPhase(false);
            addToast(err.message || "Failed to regenerate phase. Please try again.", "error");
        }
    };

    const effectiveQuizScore = sessionStats.quiz?.score ?? (phasesData.test ? 92 : 0);
    const effectiveQuizTime = sessionStats.quiz?.time ?? (phasesData.test ? "3m 15s" : "Fast");
    const effectiveFlashcardsCount = sessionStats.flashcards?.totalCards ?? (phasesData.retain ? (Array.isArray(phasesData.retain) ? phasesData.retain.length : (phasesData.retain.flashcards?.length || phasesData.retain.cards?.length || 8)) : 0);

    const handleShareWrapImage = async () => {
        try {
            addToast("Generating wrap card image...", "info");
            const canvas = document.createElement("canvas");
            canvas.width = 1200;
            canvas.height = 630;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            // Background
            ctx.fillStyle = "#090A0F";
            ctx.fillRect(0, 0, 1200, 630);

            // Decorative glows
            const grad1 = ctx.createRadialGradient(200, 100, 50, 200, 100, 400);
            grad1.addColorStop(0, "rgba(59, 130, 246, 0.15)");
            grad1.addColorStop(1, "rgba(9, 10, 15, 0)");
            ctx.fillStyle = grad1;
            ctx.fillRect(0, 0, 1200, 630);

            const grad2 = ctx.createRadialGradient(1000, 500, 50, 1000, 500, 400);
            grad2.addColorStop(0, "rgba(16, 185, 129, 0.15)");
            grad2.addColorStop(1, "rgba(9, 10, 15, 0)");
            ctx.fillStyle = grad2;
            ctx.fillRect(0, 0, 1200, 630);

            // Header text
            ctx.fillStyle = "#3B82F6";
            ctx.font = "bold 24px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("SESSION WRAP 2026", 600, 100);

            ctx.fillStyle = "#FFFFFF";
            ctx.font = "italic 900 64px sans-serif";
            ctx.fillText("THE PROFESSOR'S STUDY WRAP", 600, 180);

            ctx.fillStyle = "#888888";
            ctx.font = "bold 18px sans-serif";
            ctx.fillText(`${packTitle.toUpperCase()} • SESSION ANALYTICS`, 600, 230);

            // Boxes
            const drawBox = (x: number, y: number, w: number, h: number, title: string, val: string, color: string) => {
                ctx.fillStyle = "#12141D";
                ctx.strokeStyle = "#222533";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(x, y, w, h, 20);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = color;
                ctx.font = "bold 14px sans-serif";
                ctx.textAlign = "left";
                ctx.fillText(title.toUpperCase(), x + 25, y + 40);

                ctx.fillStyle = "#FFFFFF";
                ctx.font = "italic 900 36px sans-serif";
                ctx.fillText(val, x + 25, y + 90);
            };

            drawBox(100, 280, 230, 130, "Study Topic", packTitle.length > 12 ? packTitle.substring(0, 10) + "..." : packTitle, "#3B82F6");
            drawBox(355, 280, 230, 130, "Quiz Score", `${effectiveQuizScore}%`, "#3B82F6");
            drawBox(610, 280, 230, 130, "Flashcards Reviewed", `${effectiveFlashcardsCount} cards`, "#F59E0B");
            drawBox(865, 280, 230, 130, "Study Velocity", effectiveQuizTime, "#EF4444");

            // Footer banner
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.roundRect(100, 440, 995, 100, 25);
            ctx.fill();

            ctx.fillStyle = "#000000";
            ctx.font = "italic 900 32px sans-serif";
            ctx.textAlign = "left";
            const verdictText = effectiveQuizScore >= 95 ? "EXAM READY" : effectiveQuizScore >= 80 ? "STUDY SCHOLAR" : effectiveQuizScore >= 60 ? "KNOWLEDGE BUILDER" : "CONCEPT EXPLORER";
            ctx.fillText(`VERDICT: ${verdictText}`, 140, 500);

            ctx.font = "bold 18px sans-serif";
            ctx.textAlign = "right";
            ctx.fillText("The Professor AI | Your notes. Just the good parts.", 1050, 500);

            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], "Study_Wrap.png", { type: "image/png" });
                const text = `I just wrapped up my study session with The Professor AI! 🎓\n\n🎯 Quiz Score: ${effectiveQuizScore}%\n⚡ Flashcards Reviewed: ${effectiveFlashcardsCount} cards\n⏱️ Study Velocity: ${effectiveQuizTime}\n\nYour notes. Just the good parts. Get your time back:\n${window.location.origin}`;
                
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: 'The Professor - Study Wrap',
                            text: text,
                            files: [file]
                        });
                        addToast("Shared successfully!", "success");
                        return;
                    } catch (e) {
                        console.error("Web share failed, falling back to download", e);
                    }
                }

                // Fallback download
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "The_Professor_Study_Wrap.png";
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
                addToast("Wrap card image downloaded!", "success");
            }, "image/png");

        } catch (e) {
            console.error("Image share error:", e);
            addToast("Failed to create share image.", "error");
        }
    };

    const renderPhaseInteractive = (phase: Phase) => {
        const data = phasesData[phase.id];
        if (!data && phase.id !== "retain") return null;

        switch (phase.id) {
            case "distill":
                const summaryText = typeof data === 'string' ? data : (data?.summary ? (typeof data.summary === 'string' ? data.summary : JSON.stringify(data.summary)) : "No summary available.");
                return (
                    <InteractiveSummary
                        rawText={String(sourceText).substring(0, 1000) + "..."}
                        refinedText={summaryText}
                        autoReveal={true}
                        onFinish={() => handleMasterPhase()}
                    />
                );
            case "retain":
                const rawCards = data ? (Array.isArray(data) ? data : (data.flashcards || data.cards || [])) : [];
                const cards = rawCards.map((c: any, idx: number) => ({
                    front: c?.front || c?.question || (typeof c === 'string' ? c : "Term"),
                    back: c?.back || c?.answer || (typeof c === 'string' ? c : "Definition"),
                    topic: c?.topic || "Active Recall"
                }));
                return <InteractiveFlashcards cards={cards} onFinish={(stats) => handleMasterPhase(stats)} onRetry={() => handleRetryPhase("retain")} />;
            case "test":
                const quizQuestions = Array.isArray(data) ? data : (data.questions || [data]);
                return <InteractiveQuiz questions={quizQuestions} onFinish={(stats) => handleMasterPhase(stats)} />;
            case "predict":
                return <StudyRoadmap data={data} />;
            default:
                return null;
        }
    };

    if (!isMounted || packLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 rounded-full border-4 border-[var(--blue)] border-t-transparent animate-spin shadow-[0_0_30px_var(--blue-glow)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--foreground-muted)] animate-pulse">Setting up your study lab</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent pb-16 pt-12 overflow-x-hidden transition-all duration-700">
            <StandardContainer>
                {isGuest && (
                  <div className="mb-6 p-4 rounded-2xl bg-[var(--blue)]/10 border border-[var(--blue)]/20 flex items-center justify-between gap-4">
                    <p className="text-xs text-[var(--foreground)] font-medium leading-relaxed">
                      <span className="font-black text-[var(--blue)]">Guest view.</span> Sign up to save your progress and build your own study packs.
                    </p>
                    <button
                      onClick={() => setShowGuestModal(true)}
                      className="shrink-0 px-4 py-2 rounded-xl bg-[var(--blue)] text-white text-[9px] font-black uppercase tracking-widest hover:bg-[var(--blue)]/80 transition-all active:scale-95"
                    >
                      Sign Up Free
                    </button>
                  </div>
                )}

                {/* Back Link */}
                <div className="mb-8">
                    <button
                        onClick={() => isGuest ? setShowGuestModal(true) : router.push('/library')}
                        className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-2 group"
                    >
                        <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {isGuest ? "Exit" : "Back to Library"}
                    </button>
                </div>

                {/* Hero Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 bg-[var(--background-secondary)]/40 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-[var(--border)] shadow-lg">
                    <div className="max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <div className="px-3 py-1 rounded-full bg-[var(--blue)] text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md shadow-[var(--blue-glow)]">
                                <Zap size={10} className="fill-current" /> Study Pack
                            </div>
                            <div className="text-[9px] font-black text-[var(--foreground-muted)] uppercase tracking-widest flex items-center gap-1.5">
                                <Clock size={10} /> {completedPhases.length} / {phases.length} Phases Mastered
                            </div>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-none italic mb-2">
                            Your <span className="text-[var(--blue)]">Study Guide</span> Is Ready.
                        </h1>
                        <p className="text-xs sm:text-sm text-[var(--foreground-muted)] font-medium leading-relaxed opacity-90">
                            A simple 4-step path. Finish each one to unlock your final <span className="text-[var(--foreground)] font-black">Study Report</span>.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <ThemeToggle />
                        <FocusTimer widget={true} />
                        <button
                            onClick={handleSaveOffline}
                            className={cn(
                                "flex-1 sm:flex-none px-4 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-md",
                                isSavedOffline ? "bg-[var(--emerald)]/10 border-[var(--emerald)]/30 text-[var(--emerald)]" : "bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--border)]"
                            )}
                        >
                            <Download size={12} /> {isSavedOffline ? "Saved Offline" : "Save Offline"}
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[9px] font-black uppercase tracking-widest text-[var(--foreground)] hover:bg-[var(--border)] transition-all flex items-center justify-center gap-1.5 shadow-md"
                        >
                            <Share2 size={12} /> Share Guide
                        </button>
                    </div>
                </div>

                {/* Phase Rows */}
                <div className="space-y-3 mb-12">
                    {phases.map((phase, i) => {
                        const isCompleted = completedPhases.includes(phase.id);
                        const isLocked = i > completedPhases.length;

                        return (
                            <motion.div
                                key={phase.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={cn(
                                    "group p-4 sm:p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md",
                                    isLocked ? "bg-[var(--background)] border-[var(--border)] opacity-50 grayscale" :
                                        isCompleted ? "bg-[var(--background-secondary)]/80 border-[var(--emerald)]/30 backdrop-blur-md" :
                                            "bg-[var(--background-secondary)]/80 border-[var(--border)] hover:border-[var(--blue)]/40 backdrop-blur-md shadow-xl hover-scale-sm"
                                )}
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center border transition-all shadow-inner shrink-0",
                                        isLocked ? "bg-[var(--background)] border-[var(--border)] text-[var(--foreground-muted)]" : ""
                                    )}
                                        style={!isLocked ? {
                                            background: `color-mix(in srgb, ${phase.color}, transparent 92%)`,
                                            borderColor: `color-mix(in srgb, ${phase.color}, transparent 80%)`,
                                            color: phase.color
                                        } : {}}>
                                        {isLocked ? <Lock size={20} strokeWidth={1.5} /> : <phase.icon size={24} strokeWidth={1.5} />}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Phase 0{i + 1}</span>
                                            {isCompleted && (
                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-[var(--emerald)]/10 text-[var(--emerald)] text-[8px] font-black uppercase">
                                                    <CheckCircle2 size={8} /> Mastered
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-base sm:text-lg font-black tracking-tight text-[var(--foreground)] uppercase italic leading-none truncate mb-1">
                                            {phase.title}
                                        </h3>
                                        <div className="text-xs text-[var(--foreground-muted)] font-medium leading-snug line-clamp-2 prose prose-invert prose-p:leading-snug prose-p:m-0">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {isLocked ? "Complete previous steps to unlock." : phase.desc}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]">
                                    <button
                                        onClick={() => handleEnterPhase(i)}
                                        disabled={isLocked && !isSharedView}
                                        className={cn(
                                            "flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md",
                                            isSharedView && isCompleted ? "bg-[var(--emerald)]/10 text-[var(--emerald)] border border-[var(--emerald)]/20 hover:bg-[var(--emerald)]/20" :
                                            isSharedView && !isCompleted ? "bg-[var(--blue)]/10 text-[var(--blue)] border border-[var(--blue)]/20 hover:bg-[var(--blue)]/20" :
                                            isCompleted ? "bg-[var(--emerald)]/10 text-[var(--emerald)] border border-[var(--emerald)]/20 hover:bg-[var(--emerald)]/20" :
                                                isLocked ? "bg-[var(--background)] text-[var(--foreground-muted)] border border-[var(--border)] cursor-not-allowed" :
                                                    "bg-[var(--foreground)] text-[var(--background)] hover-scale-md shadow-[0_8px_20px_rgba(255,255,255,0.1)] active:scale-[0.98]"
                                        )}
                                    >
                                        {isSharedView && isCompleted ? "VIEW" : isSharedView && !isCompleted ? "LOCKED" : isCompleted ? "REVISIT" : isLocked ? "LOCKED" : "ENTER"}
                                        {!isCompleted && !isLocked && !isSharedView && <ArrowRight size={12} />}
                                    </button>
                                    {!isLocked && !isSharedView && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const url = typeof window !== 'undefined' ? window.location.href : '';
                                                navigator.clipboard.writeText(url);
                                                addToast(`${phase.title} link copied!`, "success");
                                            }}
                                            className="p-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all active:scale-95 shadow-md"
                                            title={`Share ${phase.title}`}
                                        >
                                            <Share2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Performance Summary Section: THE STUDY WRAP BUTTON */}
                <AnimatePresence>
                    {isAllCompleted && (
                        <motion.div 
                            key="done-button-container"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-12 flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-[var(--background-secondary)] border border-[var(--border)] shadow-xl"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--emerald)]/10 text-[var(--emerald)] text-[10px] font-black uppercase tracking-widest mb-4 border border-[var(--emerald)]/20 shadow-sm">
                                <Sparkles size={12} /> All Phases Mastered
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight text-[var(--foreground)] mb-2">
                                Ready for your Scholarly Wrap?
                            </h3>
                            <p className="text-xs text-[var(--foreground-muted)] mb-6 max-w-md">
                                You've completed all required study steps. Click below to view your session analytics and Professor's review.
                            </p>
                            <button
                                onClick={() => setShowWrapModal(true)}
                                className="px-10 py-4 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover-scale-lg active:scale-95 transition-all flex items-center gap-3 group"
                            >
                                I&apos;m done! <ArrowRight size={16} className="group-hover-translate-x-sm transition-transform" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </StandardContainer>

            {/* IMMERSIVE PHASE OVERLAY */}
            <AnimatePresence>
                {currentPhase && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] bg-[var(--background)] overflow-y-auto flex flex-col"
                    >
                        {/* Immersive Header */}
                        <div className="px-4 sm:px-6 h-14 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]/80 backdrop-blur-md z-20 sticky top-0 shrink-0">
                            <div className="flex items-center gap-3 sm:gap-6">
                                <button
                                    onClick={() => setViewingPhaseIndex(null)}
                                    className="p-1.5 sm:p-2 rounded-xl hover:bg-[var(--background-secondary)] transition-colors text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-[var(--blue)] truncate">Step 0{viewingPhaseIndex! + 1}</span>
                                    <h2 className="text-base sm:text-lg font-black text-[var(--foreground)] italic uppercase tracking-tight truncate">{currentPhase.title}</h2>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                                {currentPhase.id === 'distill' && (
                                    <button
                                        onClick={handleExportPDF}
                                        disabled={isExportingPDF}
                                        className="relative hidden sm:flex px-4 py-1.5 rounded-xl bg-[var(--blue)] border border-[var(--blue-light)]/30 text-[9px] font-black uppercase tracking-widest text-white hover:bg-[var(--blue)]/80 transition-all items-center justify-center gap-1.5 shadow-md disabled:opacity-50 overflow-hidden min-w-[140px]"
                                    >
                                        {isExportingPDF && (
                                            <div 
                                                className="absolute inset-0 bg-emerald-500 transition-all duration-200 z-0 opacity-80"
                                                style={{ width: `${pdfDownloadProgress}%` }}
                                            />
                                        )}
                                        <div className="relative z-10 flex items-center gap-1.5">
                                            {isExportingPDF ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                            <span>{isExportingPDF ? (pdfDownloadSpeed ? `${pdfDownloadProgress}% (${pdfDownloadSpeed})` : "Downloading...") : "Download PDF"}</span>
                                        </div>
                                    </button>
                                )}
                                <FocusTimer widget={true} />
                                <button
                                    onClick={() => setViewingPhaseIndex(null)}
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Immersive Content Area */}
                        <div className="flex-1 w-full relative bg-[var(--background)] overflow-visible flex flex-col items-center">
                            <AnimatePresence mode="wait">
                                {!isPerforming ? (
                                    <motion.div
                                        key="intro"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.05 }}
                                        className="w-full flex flex-col items-center justify-start px-4 sm:px-8 text-center max-w-4xl mx-auto pt-8 sm:pt-16 pb-12 overflow-visible"
                                    >
                                        <div className="p-5 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] shadow-inner mb-6 shrink-0">
                                            <currentPhase.icon size={28} strokeWidth={1.5} />
                                        </div>

                                        <div className="text-center mb-6 w-full">
                                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] mb-1 block">Preparation</span>
                                            <h1 className="text-2xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight leading-none italic uppercase mb-3">
                                                {currentPhase.title}
                                            </h1>
                                            <div className="prose prose-invert max-w-xl mx-auto text-xs sm:text-sm text-[var(--foreground-muted)] font-medium leading-relaxed">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {currentPhase.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mb-6 md:mb-8">
                                            <div className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-left shadow-sm">
                                                <Terminal size={16} className="text-[var(--blue)] mb-2" />
                                                <h4 className="text-[10px] font-black text-[var(--foreground)] uppercase mb-1">How it works</h4>
                                                <p className="text-[9px] text-[var(--foreground-muted)] font-medium leading-relaxed">
                                                    Go through the material to help it stick. Finish everything for the best result.
                                                </p>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-left shadow-sm">
                                                <Target size={16} className="text-[var(--emerald)] mb-2" />
                                                <h4 className="text-[10px] font-black text-[var(--foreground)] uppercase mb-1">Goal</h4>
                                                <p className="text-[9px] text-[var(--foreground-muted)] font-medium leading-relaxed">
                                                    Aim to master the concepts or finish all items in this activity.
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleBeginTask}
                                            disabled={isLoadingPhase}
                                            className="px-8 py-3.5 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-black text-[10px] uppercase tracking-widest hover-scale-md active:scale-98 transition-all shadow-lg flex items-center gap-3 group disabled:opacity-50 shrink-0"
                                        >
                                            {isLoadingPhase ? (
                                                <>Thinking... <Loader2 size={14} className="animate-spin" /></>
                                            ) : (
                                                <>Get Started <ArrowRight size={14} className="group-hover-translate-x-sm transition-transform" /></>
                                            )}
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="task"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="w-full min-h-full overflow-visible flex flex-col items-center px-2 sm:px-4 py-4 sm:py-6 max-w-5xl mx-auto"
                                    >
                                        <div className="text-center mb-4 shrink-0">
                                            {currentPhase.id !== 'predict' && (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--background-secondary)] border border-[var(--border)] text-[8px] font-black uppercase tracking-widest text-[var(--foreground-muted)] mb-2 shadow-sm">
                                                    <div className="w-1 h-1 rounded-full bg-[var(--emerald)] animate-pulse" />
                                                    Active Session
                                                </div>
                                            )}
                                            {currentPhase.id !== 'predict' && (
                                                <h3 className="text-base sm:text-lg font-black text-[var(--foreground)] italic tracking-tight uppercase">Checking Understanding</h3>
                                            )}
                                        </div>

                                        <div className="w-full relative transition-all duration-500 bg-transparent border-none p-0 h-auto overflow-visible mb-6">
                                            {renderPhaseInteractive(currentPhase)}
                                        </div>

                                        {/* Final Phase Action - Only show for non-interactive phases */}
                                        {currentPhase.id !== 'breakdown' && currentPhase.id !== 'retain' && currentPhase.id !== 'test' && !isSharedView && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="w-full max-w-md mx-auto shrink-0 pb-6"
                                            >
                                                <button
                                                    onClick={handleMasterPhase}
                                                    className="w-full py-4 rounded-xl bg-[var(--blue)] text-white font-black text-[10px] uppercase tracking-widest shadow-xl hover-scale-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle2 size={16} /> Finish & Continue
                                                </button>
                                                <p className="text-center text-[9px] text-[var(--foreground-muted)] font-bold mt-3 uppercase tracking-widest opacity-60">
                                                    Saving progress to study library
                                                </p>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* THE PROFESSOR'S STUDY WRAP MODAL */}
            <AnimatePresence>
                {showWrapModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl p-6 sm:p-10 rounded-[3rem] bg-[var(--background-secondary)] border border-[var(--border)] shadow-2xl overflow-hidden my-auto"
                        >
                            {/* Abstract Wrapped Background Decorations */}
                            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[var(--blue)]/10 rounded-full blur-[60px] pointer-events-none" />
                            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[var(--emerald)]/10 rounded-full blur-[60px] pointer-events-none" />

                            <button
                                onClick={() => setShowWrapModal(false)}
                                className="absolute top-6 right-6 p-2 rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors z-20"
                            >
                                <X size={18} />
                            </button>

                            <div className="relative z-10 text-center mb-8">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--blue)] text-white text-[9px] font-black uppercase tracking-widest mb-4 shadow-md">
                                    <Star size={12} className="fill-current" /> SESSION WRAP 2026
                                </div>
                                <h2 className="text-2xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight italic uppercase leading-none mb-2">
                                    The Professor&apos;s <span className="text-[var(--blue)]">Study</span> Wrap
                                </h2>
                                <p className="text-[var(--foreground-muted)] font-black uppercase tracking-widest text-[9px]">
                                    {packTitle} • Session Analytics
                                </p>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 relative z-10">
                                {/* Subject Badge */}
                                <div className="group p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] shadow-md relative overflow-hidden flex flex-col justify-center border-l-4 border-l-[var(--blue)]">
                                    <h4 className="text-[7px] font-black uppercase tracking-widest text-[var(--blue)] mb-1 opacity-80">Study Topic</h4>
                                    <div className="text-xs font-black text-[var(--foreground)] truncate uppercase tracking-tight">
                                        {packTitle}
                                    </div>
                                </div>
                                {/* Quiz Achievement */}
                                <div className="group p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] shadow-md relative overflow-hidden flex flex-col justify-center">
                                    <h4 className="text-[8px] font-black uppercase tracking-widest text-[var(--blue)] mb-0.5">Quiz Score</h4>
                                    <div className="text-xl font-black text-[var(--foreground)] italic tracking-tight">
                                        {effectiveQuizScore}%
                                    </div>
                                </div>

                                {/* Flashcard Achievement */}
                                <div className="group p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] shadow-md relative overflow-hidden flex flex-col justify-center">
                                    <h4 className="text-[8px] font-black uppercase tracking-widest text-[var(--amber)] mb-0.5">Flashcards Reviewed</h4>
                                    <div className="text-xl font-black text-[var(--foreground)] italic tracking-tight">
                                        {effectiveFlashcardsCount} <span className="text-[9px] opacity-40">CARDS</span>
                                    </div>
                                </div>

                                {/* Speed Achievement */}
                                <div className="group p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] shadow-md relative overflow-hidden flex flex-col justify-center">
                                    <h4 className="text-[8px] font-black uppercase tracking-widest text-[var(--crimson)] mb-0.5">Study Velocity</h4>
                                    <div className="text-xl font-black text-[var(--foreground)] italic tracking-tight">
                                        {effectiveQuizTime}
                                    </div>
                                </div>

                                {/* Persona Badge */}
                                <div className="col-span-2 lg:col-span-4 group p-5 rounded-2xl bg-[var(--foreground)] text-[var(--background)] shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Sparkles className="w-8 h-8 group-hover-rotate-12 transition-transform shrink-0" />
                                        <div>
                                            <h4 className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-0.5">Study Status</h4>
                                            <div className="text-base sm:text-lg font-black italic tracking-tight leading-none uppercase">
                                                {effectiveQuizScore >= 95 ? "Exam Ready" : 
                                                 effectiveQuizScore >= 80 ? "Study Scholar" : 
                                                 effectiveQuizScore >= 60 ? "Knowledge Builder" : "Concept Explorer"}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-bold leading-tight opacity-80 max-w-sm text-left sm:text-right">
                                        Classification: Intellectual Rigor. You&apos;ve earned your rest today.
                                    </p>
                                </div>
                            </div>

                            <div className="p-5 sm:p-6 rounded-2xl bg-[var(--background)] border border-[var(--border)] mb-8 text-center relative overflow-hidden group shadow-md z-10">
                                <BrainCircuit className="w-6 h-6 text-[var(--blue)] mx-auto mb-3" />
                                <h4 className="text-[8px] font-black uppercase tracking-widest text-[var(--foreground-muted)] mb-2">Professor&apos;s Assessment</h4>
                                <p className="text-xs sm:text-base text-[var(--foreground)] font-black leading-relaxed italic uppercase max-w-2xl mx-auto tracking-tight">
                                    {effectiveQuizScore >= 95 
                                        ? "Flawless genius. Your bed misses you now."
                                        : effectiveQuizScore >= 80
                                        ? "Smart work. You've earned a solid break."
                                        : effectiveQuizScore >= 60
                                        ? "You passed, but let's aim higher next."
                                        : effectiveQuizScore > 0
                                        ? "Rough session. Step away, clear your mind, then try again."
                                        : "Lab is prepped. Let's get to work."}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                                <button 
                                    onClick={handleShareWrapImage}
                                    className="flex-[2] py-4 rounded-xl bg-[var(--blue)] text-white font-black text-[10px] uppercase tracking-widest shadow-lg hover-scale-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Share2 size={16} className="group-hover-rotate-sm transition-transform" /> SHARE WRAP IMAGE
                                </button>
                                <button 
                                    onClick={() => router.push('/create')}
                                    className="flex-1 py-4 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] font-black text-[10px] uppercase tracking-widest hover:bg-[var(--border)] transition-all shadow-md"
                                >
                                    CREATE NEW PACK
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <GuestSignupModal
                isOpen={showGuestModal}
                onClose={() => setShowGuestModal(false)}
                packTitle={packTitle}
            />
        </div>
    );
}
