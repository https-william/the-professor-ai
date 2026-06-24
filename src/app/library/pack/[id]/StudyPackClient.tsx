"use client";

import React, { useEffect, useState, useTransition, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import remarkGfm from "remark-gfm";
import dynamic from "next/dynamic";

const ReactMarkdown = dynamic(() => import("react-markdown"), {
    ssr: false,
    loading: () => <div className="animate-pulse text-[var(--foreground-muted)] text-xs">Generating study guide preview...</div>
});
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
import Markdown, { BubblyThinkingLoader } from "@/components/ui/Markdown";
import { smartFetch } from "@/lib/fetch-client";
import { downloadFlashcardsOffline, downloadQuizOffline, downloadSummaryOffline, getFlashcardsHtmlString, getQuizHtmlString, getSummaryHtmlString } from "@/lib/offline-download";
import JSZip from "jszip";

// Import Interactive Components
import { InteractiveSummary } from "@/components/features/InteractiveSummary";
import { InteractiveFlashcards } from "@/components/features/InteractiveFlashcards";
import { InteractiveQuiz } from "@/components/features/InteractiveQuiz";
import { StudyRoadmap } from "@/components/features/StudyRoadmap";
import BreakdownViewer from "@/components/features/breakdown/BreakdownViewer";
import ThemeToggle from "@/components/ui/ThemeToggle";
import FocusTimer from "@/components/features/dashboard/FocusTimer";
import WorkspaceLayout from "@/components/generative/WorkspaceLayout";

interface Phase {
    id: string;
    title: string;
    icon: any;
    color: string;
    desc: string;
    content: string;
}

export function convertKnowledgeChecksToMarkdown(text: string): string {
    if (!text) return "";
    let processed = text.replace(/([#*\s_]*)(Checking\s+Understanding|CHECKINGUNDERSTANDING|CheckingUnderstanding|checking\s+understanding)([#*\s_:]*)(\n|$)/gi, "\n");

    processed = processed.replace(/\[KNOWLEDGE_CHECK\]\s*(\{[\s\S]*?\})/g, (match, jsonStr) => {
        try {
            const parsed = JSON.parse(jsonStr);
            const question = parsed.question || "";
            const options = parsed.options || [];
            const correctIndex = parsed.correctIndex ?? 0;
            
            let markdown = `\n\n> 💡 **Professor's Spot Check**\n> \n> **Question:** ${question}\n> \n`;
            options.forEach((opt: string, idx: number) => {
                if (idx === correctIndex) {
                    markdown += `> * **✓ ${opt} (Correct)**\n`;
                } else {
                    markdown += `> * ${opt}\n`;
                }
            });
            markdown += `\n`;
            return markdown;
        } catch (e) {
            return "";
        }
    });

    return processed.replace(/\[KNOWLEDGE_CHECK\]/g, "");
}

export default function StudyPackPage() {
    const params = useParams();
    const router = useRouter();
    const { addToast } = useToasts();
    const { user, refreshUser } = useUser();
    const userLoading = user.isLoading;

    const [completedPhases, setCompletedPhases] = useState<string[]>([]);
    const [isAllCompleted, setIsAllCompleted] = useState(false);
    const [packLoading, setPackLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    const [isSharedView, setIsSharedView] = useState(false);
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [showWrapModal, setShowWrapModal] = useState(false);
    const [wrapSlide, setWrapSlide] = useState(0);

    const [isSprint, setIsSprint] = useState(false);
    const [isGenerativeMode, setIsGenerativeMode] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (window.location.search.includes('sprint=true')) {
            setIsSprint(true);
            // setIsGenerativeMode(true); // Removed based on user request
        }
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

    const phaseContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (showWrapModal) {
            document.body.style.overflow = 'hidden';
            const container = document.getElementById('main-scroll-container');
            if (container) container.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
                if (container) container.style.overflow = 'auto';
            };
        }
    }, [showWrapModal]);

    // Auto-scroll to phase when it opens
    useEffect(() => {
        if (viewingPhaseIndex !== null && phaseContainerRef.current) {
            setTimeout(() => {
                phaseContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [viewingPhaseIndex]);

    const [phasesData, setPhasesData] = useState<Record<string, any>>({});
    const [isLoadingPhase, setIsLoadingPhase] = useState(false);
    const [isStreamingPhase, setIsStreamingPhase] = useState(false);
    const [generatingPhases, setGeneratingPhases] = useState<Record<string, 'loading' | 'streaming' | null>>({});
    const [sourceText, setSourceText] = useState("");
    const [packTitle, setPackTitle] = useState("Study Pack");

    // Change tab title dynamically when user unfocuses, using brand-voice Nigeria names & prompts
    useEffect(() => {
        const originalTitle = document.title;
        const prompts = [
            "Almost there...",
            "Bolu, the exam hall is waiting...",
            "Amaka, the clock is ticking...",
            "Focus up! Just the good parts.",
            "Your group chat can wait...",
            "Concentrate, Midnight Scholar!"
        ];

        const handleVisibilityChange = () => {
            if (document.hidden) {
                const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
                document.title = randomPrompt;
            } else {
                document.title = originalTitle;
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.title = originalTitle;
        };
    }, [packTitle]);

    // IndexedDB & Image base64 conversion utilities
    function openProfessorDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            if (typeof window === "undefined") {
                reject(new Error("IndexedDB is only available in the browser"));
                return;
            }
            const request = indexedDB.open("ProfessorOffline", 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains("savedPacks")) {
                    db.createObjectStore("savedPacks", { keyPath: "id" });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function imageUrlToBase64(url: string): Promise<string> {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error("Failed to convert image to base64:", url, e);
            return url;
        }
    }

    async function embedImagesInPhasesData(data: any): Promise<any> {
        if (!data) return data;

        if (typeof data === "string") {
            const imageRegex = /https?:\/\/[^\s\)]+\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?[^\s\)]+)?/g;
            const matches = data.match(imageRegex);
            if (!matches) return data;

            let processedText = data;
            for (const url of Array.from(new Set(matches))) {
                if (url.startsWith("data:")) continue;
                const base64 = await imageUrlToBase64(url);
                processedText = processedText.replaceAll(url, base64);
            }
            return processedText;
        }

        if (Array.isArray(data)) {
            return Promise.all(data.map(item => embedImagesInPhasesData(item)));
        }

        if (typeof data === "object") {
            const result: any = {};
            for (const key of Object.keys(data)) {
                result[key] = await embedImagesInPhasesData(data[key]);
            }
            return result;
        }

        return data;
    }

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

        setGeneratingPhases(prev => ({ ...prev, [targetPhaseId]: 'loading' }));
        try {
            const res = await smartFetch("/api/generate/pack-phase", {
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
                setGeneratingPhases(prev => ({ ...prev, [targetPhaseId]: 'streaming' }));
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
            console.error("Prefetch Phase Error:", err);
        } finally {
            setGeneratingPhases(prev => ({ ...prev, [targetPhaseId]: null }));
        }
    };

    useEffect(() => {
        if (userLoading) return;

        const fetchPack = async () => {
            setPackLoading(true);
            let packData: any = null;
            try {
                if (!navigator.onLine) {
                    try {
                        const db = await openProfessorDB();
                        const tx = db.transaction("savedPacks", "readonly");
                        const store = tx.objectStore("savedPacks");
                        packData = await new Promise((resolve) => {
                            const req = store.get(packId);
                            req.onsuccess = () => resolve(req.result);
                            req.onerror = () => resolve(null);
                        });
                    } catch (dbErr) {
                        console.error("IndexedDB load error:", dbErr);
                    }

                    if (packData) {
                        setIsSavedOffline(true);
                    } else {
                        // Fallback to localStorage
                        const offlinePacks = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
                        if (offlinePacks[packId]) {
                            packData = offlinePacks[packId];
                            setIsSavedOffline(true);
                        } else {
                            addToast("You're offline and this study pack isn't saved for offline view.", "error");
                            router.push("/library");
                            return;
                        }
                    }
                } else {
                    
                    const { data: spData } = await supabase
                        .from("study_packs")
                        .select("*")
                        .eq("id", packId)
                        .maybeSingle();
                    
                    if (spData) {
                        packData = spData;
                    } else {
                        // Fallback to generations table
                        const { data: genData } = await supabase
                            .from("generations")
                            .select("*")
                            .eq("id", packId)
                            .maybeSingle();
                        
                        if (genData) {
                            packData = {
                                id: genData.id,
                                title: genData.title || "Untitled Study Pack",
                                type: "exam_sprint",
                                created_at: genData.created_at,
                                phases_data: genData.phases_data,
                                source_text: genData.source_text
                            };
                        }
                    }

                    if (!packData) {
                        // Try IndexedDB first
                        try {
                            const db = await openProfessorDB();
                            const tx = db.transaction("savedPacks", "readonly");
                            const store = tx.objectStore("savedPacks");
                            packData = await new Promise((resolve) => {
                                const req = store.get(packId);
                                req.onsuccess = () => resolve(req.result);
                                req.onerror = () => resolve(null);
                            });
                        } catch (dbErr) {
                            console.error("IndexedDB fallback error:", dbErr);
                        }

                        if (packData) {
                            setIsSavedOffline(true);
                        } else {
                            // Fallback to localStorage
                            const offlinePacks = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
                            if (offlinePacks[packId]) {
                                packData = offlinePacks[packId];
                                setIsSavedOffline(true);
                            } else {
                                console.error("Fetch Pack Error: Pack not found in either table");
                                addToast("This study pack could not be found.", "error");
                                router.push("/library");
                                return;
                            }
                        }
                    } else {
                        // Check if saved in IndexedDB
                        try {
                            const db = await openProfessorDB();
                            const tx = db.transaction("savedPacks", "readonly");
                            const store = tx.objectStore("savedPacks");
                            const saved = await new Promise((resolve) => {
                                const req = store.get(packId);
                                req.onsuccess = () => resolve(req.result);
                                req.onerror = () => resolve(null);
                            });
                            if (saved) {
                                setIsSavedOffline(true);
                            } else {
                                const offlinePacks = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
                                if (offlinePacks[packId]) {
                                    setIsSavedOffline(true);
                                }
                            }
                        } catch (e) {
                            const offlinePacks = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
                            if (offlinePacks[packId]) {
                                setIsSavedOffline(true);
                            }
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
                if (typeof window !== "undefined" && packData) {
                    const urlParams = new URLSearchParams(window.location.search);
                    if (urlParams.get("sprint") === "true") {
                        setIsSprint(true);
                        setViewingPhaseIndex(0);
                        const hasMaterials = !!(packData.phases_data && packData.phases_data[phases[0].id]);
                        setIsPerforming(hasMaterials);
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

    const handleSaveOffline = async () => {
        try {
            if (isSavedOffline) {
                // Delete from IndexedDB
                try {
                    const db = await openProfessorDB();
                    const tx = db.transaction("savedPacks", "readwrite");
                    const store = tx.objectStore("savedPacks");
                    store.delete(packId);
                    await new Promise<void>((resolve, reject) => {
                        tx.oncomplete = () => resolve();
                        tx.onerror = () => reject(tx.error);
                    });
                } catch (dbErr) {
                    console.error("IndexedDB delete error:", dbErr);
                }

                // Delete from localStorage fallback
                const offlinePacks = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
                delete offlinePacks[packId];
                localStorage.setItem("offline_study_packs", JSON.stringify(offlinePacks));

                setIsSavedOffline(false);
                addToast("Removed from Offline Vault.", "success");
            } else {
                addToast("Saving for offline view. Processing media...", "info", undefined, undefined, false, undefined, true);

                let processedPhasesData = phasesData;
                try {
                    processedPhasesData = await embedImagesInPhasesData(phasesData);
                } catch (imgErr) {
                    console.error("Image processing error:", imgErr);
                }

                const packToSave = {
                    id: packId,
                    title: packTitle,
                    source_text: sourceText,
                    phases_data: processedPhasesData,
                    user_id: user.id,
                    type: "study_pack",
                    savedAt: new Date().toISOString()
                };

                // Save to IndexedDB
                try {
                    const db = await openProfessorDB();
                    const tx = db.transaction("savedPacks", "readwrite");
                    const store = tx.objectStore("savedPacks");
                    store.put(packToSave);
                    await new Promise<void>((resolve, reject) => {
                        tx.oncomplete = () => resolve();
                        tx.onerror = () => reject(tx.error);
                    });
                } catch (dbErr) {
                    console.error("IndexedDB shadow save error:", dbErr);
                }

                // Save to localStorage fallback
                const offlinePacks = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
                offlinePacks[packId] = {
                    id: packId,
                    title: packTitle,
                    source_text: sourceText,
                    phases_data: processedPhasesData,
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
        setGeneratingPhases(prev => ({ ...prev, [phase.id]: 'loading' }));
        setIsPerforming(true); // Transition immediately to task view so bubbly loader can display
        try {
            const res = await smartFetch("/api/generate/pack-phase", {
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
                setGeneratingPhases(prev => ({ ...prev, [phase.id]: 'streaming' }));
                // isPerforming is already set to true

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
                            let parsed: any = null;
                            try {
                                parsed = JSON.parse(line.slice(6));
                            } catch (e) {
                                // Ignore json parse errors for incomplete chunks
                            }

                            if (parsed) {
                                if (parsed.status === "error") {
                                    throw new Error(parsed.message || parsed.error || "Stream error");
                                }
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
                            }
                        }
                    }
                }
                setIsStreamingPhase(false);

                // Safety validation: verify some study data was successfully accumulated
                const currentData = phasesData[phase.id];
                const hasAccumulated = (typeof currentData === 'string' && currentData.trim() !== '') || 
                                       (Array.isArray(currentData) && currentData.length > 0) || 
                                       (currentData && typeof currentData === 'object' && Object.keys(currentData).length > 0);

                if (!hasAccumulated && !accumulatedText && accumulatedItems.length === 0) {
                    throw new Error("No study materials were generated. Please try again.");
                }

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
            setIsPerforming(false);
        } finally {
            setIsLoadingPhase(false);
            setIsStreamingPhase(false);
            setGeneratingPhases(prev => ({ ...prev, [phase.id]: null }));
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
            supabase.auth.getSession().then(({ data: { session } }: any) => {
                fetch("/api/user/activity", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
                    },
                    body: JSON.stringify({ type: "exam_sprint", customXp: 100 })
                }).then(() => refreshUser()).catch((err: any) => console.error("XP error:", err));
            }).catch((err: any) => console.error("Session fetch error for activity:", err));

            // Trigger Bedtime Verdict Modal
            setShowWrapModal(true);
        } else {
            // Award 50 XP for phase completion
            supabase.auth.getSession().then(({ data: { session } }: any) => {
                fetch("/api/user/activity", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
                    },
                    body: JSON.stringify({ type: "exam_sprint", customXp: 50 })
                }).then(() => refreshUser()).catch((err: any) => console.error("XP error:", err));
            }).catch((err: any) => console.error("Session fetch error for activity:", err));

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

    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    const [showFullExportMenu, setShowFullExportMenu] = useState(false);
    const [isExportingFullPDF, setIsExportingFullPDF] = useState(false);
    const [fullPdfDownloadProgress, setFullPdfDownloadProgress] = useState(0);
    const [fullPdfDownloadSpeed, setFullPdfDownloadSpeed] = useState("");

    const compileFullPackMarkdown = () => {
        let md = `# ${packTitle || "Study Pack"} — Complete Study Blueprint\n`;
        md += `*Generated by The Professor AI | Your notes. Just the good parts.*\n\n---\n\n`;

        // 1. Distill / Deep Summary
        md += `## 1. Deep Summary & Core Concepts\n\n`;
        if (phasesData.distill) {
            const summaryData = phasesData.distill;
            const summaryText = typeof summaryData === 'string' 
                ? summaryData 
                : (summaryData.summary ? (typeof summaryData.summary === 'string' ? summaryData.summary : JSON.stringify(summaryData.summary)) : "");
            md += convertKnowledgeChecksToMarkdown(summaryText) + `\n\n`;
        } else {
            md += `*Phase not generated yet. Use the Creator Studio to deconstruct your notes.*\n\n`;
        }
        md += `---\n\n`;

        // 2. Flashcards / Active Recall
        md += `## 2. Active Recall Flashcards\n\n`;
        if (phasesData.retain) {
            const rawCards = Array.isArray(phasesData.retain) 
                ? phasesData.retain 
                : (phasesData.retain.flashcards || phasesData.retain.cards || []);
            if (rawCards.length > 0) {
                md += `| Term / Question | Definition / Answer |\n| --- | --- |\n`;
                rawCards.forEach((c: any) => {
                    const q = c?.front || c?.question || (typeof c === 'string' ? c : "Term");
                    const a = c?.back || c?.answer || (typeof c === 'string' ? c : "Definition");
                    const cleanQ = q.replace(/\|/g, "\\|");
                    const cleanA = a.replace(/\|/g, "\\|");
                    md += `| **${cleanQ}** | ${cleanA} |\n`;
                });
                md += `\n`;
            } else {
                md += `*No flashcards found in this pack.*\n\n`;
            }
        } else {
            md += `*Phase not generated yet. Click "Active Recall" in your study steps to create flashcards.*\n\n`;
        }
        md += `---\n\n`;

        // 3. Quiz
        md += `## 3. Practice Quiz & AI Tutor Explanations\n\n`;
        if (phasesData.test) {
            const quizQuestions = Array.isArray(phasesData.test) ? phasesData.test : (phasesData.test.questions || [phasesData.test]);
            if (quizQuestions.length > 0) {
                quizQuestions.forEach((q: any, idx: number) => {
                    const questionText = q?.question || "";
                    const options = q?.options || [];
                    const correctAnswer = q?.answer || "";
                    const explanation = q?.explanation || "";
                    
                    md += `### Q${idx + 1}: ${questionText}\n`;
                    options.forEach((opt: string) => {
                        md += `- [ ] ${opt}\n`;
                    });
                    md += `\n**Correct Answer:** *${correctAnswer}*\n\n`;
                    if (explanation) {
                        md += `> 💡 **Professor's Tutor Analogy:**\n> ${explanation}\n\n`;
                    }
                });
            } else {
                md += `*No quiz questions found in this pack.*\n\n`;
            }
        } else {
            md += `*Phase not generated yet. Click "Practice Quiz" in your study steps to generate.*\n\n`;
        }
        md += `---\n\n`;

        // 4. Roadmap
        md += `## 4. Revision Roadmap & Avoidance Map\n\n`;
        if (phasesData.predict) {
            const roadmapText = typeof phasesData.predict === 'string'
                ? phasesData.predict
                : (phasesData.predict.roadmap || phasesData.predict.content || JSON.stringify(phasesData.predict));
            md += roadmapText + `\n\n`;
        } else {
            md += `*Phase not generated yet. Click "Revision Roadmap" in your study steps to generate.*\n\n`;
        }

        return md;
    };

    const handleExportFullPackMarkdown = () => {
        try {
            const markdownContent = compileFullPackMarkdown();
            const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `The_Professor_Full_Study_Pack_${packTitle.replace(/\s+/g, '_')}.md`;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
            addToast("Full study pack Markdown downloaded!", "success");
        } catch (err) {
            console.error(err);
            addToast("Failed to download Markdown.", "error");
        }
    };

    const handleExportFullPackPDF = async () => {
        setIsExportingFullPDF(true);
        addToast("Generating complete offline study pack...", "info");

        try {
            const zip = new JSZip();

            if (phasesData.distill) {
                const summaryData = phasesData.distill;
                const summaryText = typeof summaryData === 'string' ? summaryData : (summaryData.summary ? (typeof summaryData.summary === 'string' ? summaryData.summary : JSON.stringify(summaryData.summary)) : "");
                zip.file(`The_Professor_Summary_${packTitle.replace(/\s+/g, '_')}.html`, getSummaryHtmlString(packTitle, summaryText));
            }

            if (phasesData.flashcards) {
                zip.file(`The_Professor_Flashcards_${packTitle.replace(/\s+/g, '_')}.html`, getFlashcardsHtmlString(packTitle, phasesData.flashcards));
            }

            if (phasesData.quiz) {
                zip.file(`The_Professor_Quiz_${packTitle.replace(/\s+/g, '_')}.html`, getQuizHtmlString(packTitle, phasesData.quiz));
            }

            const blob = await zip.generateAsync({ type: "blob" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `The_Professor_Study_Pack_${packTitle.replace(/\s+/g, '_')}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            addToast("Full Pack ZIP Downloaded Successfully!", "success");
        } catch (err: any) {
            console.error(err);
            addToast("Failed to compile ZIP. Downloading Markdown instead...", "warn");
            handleExportFullPackMarkdown();
        } finally {
            setIsExportingFullPDF(false);
            setFullPdfDownloadProgress(0);
            setFullPdfDownloadSpeed("");
        }
    };
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
        addToast("Downloading summary report...", "info", undefined, undefined, false, undefined, true);

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
            // Silent fallback to browser print
            setTimeout(() => {
                window.print();
            }, 500);
        } finally {
            setIsExportingPDF(false);
            setPdfDownloadProgress(0);
            setPdfDownloadSpeed("");
        }
    };

    const handleExportHTML = () => {
        if (!phasesData.distill) {
            addToast("Generate the Deep Summary first to download your HTML.", "warn");
            return;
        }
        addToast("Compiling offline HTML document...", "info");
        try {
            const container = document.querySelector("#summary-export-container .prose");
            const renderedHtml = container ? container.innerHTML : "";
            
            if (!renderedHtml) {
                addToast("Failed to compile content", "error");
                return;
            }

            downloadSummaryOffline(packTitle, renderedHtml);
            addToast("HTML Download successful", "success");
        } catch (error) {
            addToast("Failed to compile HTML", "error");
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

        addToast(`Regenerating ${phaseId}...`, "info", undefined, undefined, false, undefined, true);
        setIsPerforming(true);
        setIsLoadingPhase(true);
        setPhasesData(prev => {
            const copy = { ...prev };
            delete copy[phaseId];
            return copy;
        });

        try {
            const res = await smartFetch("/api/generate/pack-phase", {
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
                            let parsed: any = null;
                            try {
                                parsed = JSON.parse(line.slice(6));
                            } catch (e) {
                                // Ignore partial json parse errors
                            }

                            if (parsed) {
                                if (parsed.status === "error") {
                                    throw new Error(parsed.message || parsed.error || "Stream error");
                                }
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
                            }
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

    const userFirstName = user.firstName || (user.name !== "Scholar" ? user.name?.split(" ")[0] : null) || user.username || user.email?.split("@")[0] || "Scholar";

    const getStudyArchetype = () => {
        const durationMs = sessionStats.finishTime ? (sessionStats.finishTime - sessionStats.startTime) : 0;
        const minutes = durationMs / 60000;
        
        if (durationMs > 0 && minutes < 3) {
            return {
                title: "The Blitz Synthesizer",
                description: "You don't read text, you absorb it. You sprinted through this pack, skipping the fluff. You want your time back."
            };
        }
        if (effectiveQuizScore >= 80) {
            return {
                title: "The High-Yield Sniper",
                description: "You hit the target with surgical precision. 80%+ accuracy. The details had nowhere to hide. You're here to conquer the calendar."
            };
        }
        if (effectiveFlashcardsCount >= 15) {
            return {
                title: "The Active Recall Purist",
                description: "No passive highlighting. You grilled yourself on cards. You know memory is built under pressure. Elite."
            };
        }
        return {
            title: "The Focused Refiner",
            description: "Methodical, focused, and steady. You took your time to connect the dots. You're building memory that won't fade."
        };
    };

    const studyArchetype = getStudyArchetype();

    const renderPhaseInteractive = (phase: Phase) => {
        const data = phasesData[phase.id];
        const isPhaseLoading = isLoadingPhase || generatingPhases[phase.id] === 'loading';
        const isPhaseStreaming = isStreamingPhase || generatingPhases[phase.id] === 'streaming';
        const isCurrentlyGenerating = isPhaseLoading || isPhaseStreaming;
        
        if (!data && phase.id !== "retain" && !isCurrentlyGenerating) return null;

        // If actively generating but no items are generated yet, render bubbly loader
        if (isCurrentlyGenerating && (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'string' && data.length === 0))) {
            return (
                <div className="p-12 rounded-[2.5rem] bg-[var(--background-secondary)]/80 backdrop-blur-xl border border-[var(--border)] shadow-2xl flex items-center justify-center min-h-[300px] w-full max-w-2xl mx-auto">
                    <BubblyThinkingLoader />
                </div>
            );
        }

        switch (phase.id) {
            case "distill":
                const summaryText = typeof data === 'string' ? data : (data?.summary ? (typeof data.summary === 'string' ? data.summary : JSON.stringify(data.summary)) : (isCurrentlyGenerating ? "" : "No summary available."));
                return (
                    <InteractiveSummary
                        rawText={String(sourceText).substring(0, 1000) + "..."}
                        refinedText={summaryText}
                        autoReveal={true}
                        isStreaming={isPhaseStreaming && phase.id === "distill"}
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
                return <InteractiveFlashcards cards={cards} title={packTitle + " - Flashcards"} generationId={packId} onFinish={(stats) => handleMasterPhase(stats)} onRetry={() => handleRetryPhase("retain")} />;
            case "test":
                const quizQuestions = Array.isArray(data) ? data : (data.questions || [data]);
                return <InteractiveQuiz questions={quizQuestions} title={packTitle + " - Quiz"} onFinish={(stats) => handleMasterPhase(stats)} />;
            case "predict":
                return <StudyRoadmap data={data} isStreaming={isStreamingPhase && phase.id === "predict"} generationId={packId} title={packTitle + " - Roadmap"} />;
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

    // if (isGenerativeMode) {
    //     return (
    //         <WorkspaceLayout 
    //             title={packTitle} 
    //             sourceText={sourceText} 
    //             phasesData={phasesData} 
    //             onExit={() => setIsGenerativeMode(false)} 
    //         />
    //     );
    // }

    return (
        <div className="min-h-screen bg-transparent pb-16 pt-12 transition-all duration-700">
            <StandardContainer className="print-hidden">
                <AnimatePresence mode="wait">
                    {viewingPhaseIndex === null && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col"
                        >
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
                <motion.div 
                    layoutId={`pack-card-${packId}`}
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 bg-[var(--background-secondary)]/40 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-[var(--border)] shadow-lg"
                >
                    <div className="max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <div className="px-3 py-1 rounded-full bg-[var(--blue)] text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md shadow-[var(--blue-glow)]">
                                <Zap size={10} className="fill-current" /> Study Pack
                            </div>
                            <div className="text-[9px] font-black text-[var(--foreground-muted)] uppercase tracking-widest flex items-center gap-1.5">
                                <Clock size={10} /> {completedPhases.length} / {phases.length} Steps Completed
                            </div>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-none italic mb-2">
                            Your <span className="text-[var(--blue)]">Study Guide</span> Is Ready.
                        </h1>
                        <p className="text-xs sm:text-sm text-[var(--foreground-muted)] font-medium leading-relaxed opacity-90">
                            A simple 4-step path. Finish each one to get your final <span className="text-[var(--foreground)] font-black">Study Report</span>.
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

                        <div className="relative flex-1 sm:flex-none">
                            <button
                                onClick={() => setShowFullExportMenu(prev => !prev)}
                                disabled={isExportingFullPDF}
                                className="w-full px-4 py-2.5 rounded-xl bg-[var(--amber)]/10 border border-[var(--amber)]/30 text-[9px] font-black uppercase tracking-widest text-[var(--amber)] hover:bg-[var(--amber)]/20 transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                            >
                                {isExportingFullPDF ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                <span>Export Full Pack</span>
                            </button>
                            <AnimatePresence>
                                {showFullExportMenu && (
                                    <>
                                        <div className="fixed inset-0 z-[100]" onClick={() => setShowFullExportMenu(false)} />
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 mt-2 min-w-[180px] bg-zinc-950 border border-white/10 rounded-xl p-2 shadow-2xl flex flex-col gap-1 z-[110]"
                                        >
                                            <button
                                                onClick={async () => {
                                                    setShowFullExportMenu(false);
                                                    await handleExportFullPackPDF();
                                                }}
                                                className="w-full px-4 py-2.5 rounded-lg text-left text-[10px] font-black uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                                            >
                                                <FileText size={12} className="text-[var(--amber)]" />
                                                <span>Export Full PDF</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowFullExportMenu(false);
                                                    handleExportFullPackMarkdown();
                                                }}
                                                className="w-full px-4 py-2.5 rounded-lg text-left text-[10px] font-black uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                                            >
                                                <Terminal size={12} className="text-[var(--amber)]" />
                                                <span>Export Markdown (.md)</span>
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            onClick={handleShare}
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[9px] font-black uppercase tracking-widest text-[var(--foreground)] hover:bg-[var(--border)] transition-all flex items-center justify-center gap-1.5 shadow-md"
                        >
                            <Share2 size={12} /> Share Guide
                        </button>
                    </div>
                </motion.div>

                {!packLoading && user.planStatus === 'free' && (
                    <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-[var(--blue-dim)]/40 to-transparent border border-[var(--blue-border)]/50 shadow-lg relative overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-300">
                        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[var(--blue)]/5 rounded-full blur-[80px] pointer-events-none" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--blue)]/10 border border-[var(--blue)]/20 text-[var(--blue)] text-[8px] font-black uppercase tracking-wider mb-2">
                                    <Sparkles size={8} /> SPRINT UNLOCK
                                </span>
                                <h2 className="text-sm font-black uppercase tracking-tight text-white mb-1">
                                    Unlock Weekly Sprint Pass (₦399)
                                </h2>
                                <p className="text-xs text-[var(--foreground-muted)] font-medium leading-relaxed max-w-xl">
                                    Get the Feynman vocabulary highlights, active memory deck expansions, and clean PDF exports for offline revision. Cancel in one click anytime.
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/settings/billing')}
                                className="px-5 py-2.5 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-md shrink-0 self-start sm:self-center"
                            >
                                Unlock Now
                            </button>
                        </div>
                    </div>
                )}

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
                                        <h2 className="text-base sm:text-lg font-black tracking-tight text-[var(--foreground)] uppercase italic leading-none truncate mb-1">
                                            {phase.title}
                                        </h2>
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
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--blue)]/10 text-[var(--blue-text)] text-[10px] font-black uppercase tracking-widest mb-4 border border-[var(--blue)]/20 shadow-sm">
                                <CheckCircle2 size={12} /> All Phases Complete
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight text-[var(--foreground)] mb-2">
                                Bedtime Verdict
                            </h2>
                            <p className="text-xs text-[var(--foreground-muted)] mb-6 max-w-md">
                                You've completed all study phases. Let's see what the Professor has to say about your progress tonight.
                            </p>
                            <button
                                onClick={() => setShowWrapModal(true)}
                                className="px-10 py-4 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover-scale-lg active:scale-95 transition-all flex items-center gap-3 group cursor-pointer"
                            >
                                Get the Verdict <ArrowRight size={16} className="group-hover-translate-x-sm transition-transform" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </StandardContainer>

            {/* IMMERSIVE PHASE OVERLAY */}
            <AnimatePresence>
                {currentPhase && (
                    <motion.div
                        ref={phaseContainerRef}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mt-8 w-full flex flex-col print-overlay bg-[var(--background-secondary)]/30 border border-[var(--border)] rounded-3xl overflow-hidden shadow-2xl"
                    >
                        {/* Immersive Header */}
                        <div className="px-4 sm:px-6 h-14 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]/80 backdrop-blur-sm shrink-0">
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

                            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                                {currentPhase.id === 'distill' && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowDownloadMenu(prev => !prev)}
                                            disabled={isExportingPDF}
                                            className="relative flex-shrink-0 flex px-2.5 py-1.5 sm:px-4 rounded-xl bg-[var(--blue)] border border-[var(--blue-light)]/30 text-[9px] font-black uppercase tracking-widest text-white hover:bg-[var(--blue)]/80 transition-all items-center justify-center gap-1.5 shadow-md disabled:opacity-50 min-w-[34px] sm:min-w-[140px]"
                                            title="Download Summary Options"
                                        >
                                            {isExportingPDF && (
                                                <div 
                                                    className="absolute inset-0 bg-emerald-500 transition-all duration-200 z-0 opacity-80"
                                                    style={{ width: `${pdfDownloadProgress}%` }}
                                                />
                                            )}
                                            <div className="relative z-10 flex items-center justify-center gap-1.5">
                                                {isExportingPDF ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                                <span className="hidden sm:inline">
                                                    {isExportingPDF 
                                                        ? (pdfDownloadSpeed ? `${pdfDownloadProgress}% (${pdfDownloadSpeed})` : "Downloading...") 
                                                        : "Download"}
                                                </span>
                                            </div>
                                        </button>
                                        
                                        <AnimatePresence>
                                            {showDownloadMenu && (
                                                <>
                                                    <div className="fixed inset-0 z-[100]" onClick={() => setShowDownloadMenu(false)} />
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="absolute right-0 mt-2 min-w-[160px] bg-zinc-950 border border-white/10 rounded-xl p-2 shadow-2xl flex flex-col gap-1 z-[110]"
                                                    >
                                                        <button
                                                            onClick={async () => {
                                                                setShowDownloadMenu(false);
                                                                await handleExportPDF();
                                                            }}
                                                            className="w-full px-4 py-2.5 rounded-lg text-left text-[10px] font-black uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                                                        >
                                                            <FileText size={12} />
                                                            <span>Download Zip (HTML)</span>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setShowDownloadMenu(false);
                                                                handleExportHTML();
                                                            }}
                                                            className="w-full px-4 py-2.5 rounded-lg text-left text-[10px] font-black uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                                                        >
                                                            <Download size={12} />
                                                            <span>Download HTML</span>
                                                        </button>
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {currentPhase.id === 'retain' && phasesData.retain && (
                                    <button
                                        onClick={() => {
                                            const rawCards = phasesData.retain ? (Array.isArray(phasesData.retain) ? phasesData.retain : (phasesData.retain.flashcards || phasesData.retain.cards || [])) : [];
                                            const cards = rawCards.map((c: any) => ({
                                                front: c?.front || c?.question || (typeof c === 'string' ? c : "Term"),
                                                back: c?.back || c?.answer || (typeof c === 'string' ? c : "Definition"),
                                                topic: c?.topic || "Active Recall"
                                            }));
                                            downloadFlashcardsOffline(packTitle + " - Flashcards", cards);
                                        }}
                                        className="relative flex-shrink-0 flex px-2.5 py-1.5 sm:px-4 rounded-xl bg-[var(--blue)] border border-[var(--blue-light)]/30 text-[9px] font-black uppercase tracking-widest text-white hover:bg-[var(--blue)]/80 transition-all items-center justify-center gap-1.5 shadow-md overflow-hidden min-w-[34px] sm:min-w-[140px]"
                                        title="Download Offline HTML Flashcards"
                                    >
                                        <div className="relative z-10 flex items-center justify-center gap-1.5">
                                            <Download size={12} />
                                            <span className="hidden sm:inline">Download HTML</span>
                                        </div>
                                    </button>
                                )}

                                {currentPhase.id === 'test' && phasesData.test && (
                                    <button
                                        onClick={() => {
                                            const quizQuestions = Array.isArray(phasesData.test) ? phasesData.test : (phasesData.test.questions || [phasesData.test]);
                                            downloadQuizOffline(packTitle + " - Quiz", quizQuestions);
                                        }}
                                        className="relative flex-shrink-0 flex px-2.5 py-1.5 sm:px-4 rounded-xl bg-[var(--blue)] border border-[var(--blue-light)]/30 text-[9px] font-black uppercase tracking-widest text-white hover:bg-[var(--blue)]/80 transition-all items-center justify-center gap-1.5 shadow-md overflow-hidden min-w-[34px] sm:min-w-[140px]"
                                        title="Download Offline HTML Quiz"
                                    >
                                        <div className="relative z-10 flex items-center justify-center gap-1.5">
                                            <Download size={12} />
                                            <span className="hidden sm:inline">Download HTML</span>
                                        </div>
                                    </button>
                                )}
                                <FocusTimer widget={true} />
                            </div>
                        </div>

                        {/* Immersive Content Area */}
                        <div className="w-full relative flex flex-col items-center pb-12">
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
                                        className="w-full flex-grow overflow-visible flex flex-col items-center px-2 sm:px-4 py-4 sm:py-6 max-w-5xl mx-auto"
                                    >
                                        <div className="text-center mb-4 shrink-0">
                                            {currentPhase.id !== 'predict' && (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--background-secondary)] border border-[var(--border)] text-[8px] font-black uppercase tracking-widest text-[var(--foreground-muted)] mb-2 shadow-sm">
                                                    <div className="w-1 h-1 rounded-full bg-[var(--emerald)] animate-pulse" />
                                                    Active Session
                                                </div>
                                            )}
                                            {currentPhase.id !== 'predict' && (
                                                <h2 className="text-base sm:text-lg font-black text-[var(--foreground)] italic tracking-tight uppercase">Checking Understanding</h2>
                                            )}
                                        </div>

                                        <div className="w-full relative transition-all duration-500 bg-transparent border-none p-0 h-auto overflow-visible mb-6">
                                            {renderPhaseInteractive(currentPhase)}
                                        </div>

                                        {/* Final Phase Action */}
                                        {!isSharedView && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="w-full max-w-md mx-auto shrink-0 pb-6 mt-4"
                                            >
                                                <button
                                                    onClick={() => handleMasterPhase()}
                                                    className={cn(
                                                        "w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                                        ['distill', 'breakdown', 'retain', 'test'].includes(currentPhase.id)
                                                            ? "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--blue)]/30 hover:bg-[var(--blue)]/5 opacity-60 hover:opacity-100 shadow-sm"
                                                            : "bg-[var(--blue)] text-white shadow-xl hover-scale-sm active:scale-[0.98]"
                                                    )}
                                                >
                                                    {['distill', 'breakdown', 'retain', 'test'].includes(currentPhase.id) ? (
                                                        <>Fast Forward Phase <ArrowRight size={14} /></>
                                                    ) : (
                                                        <><CheckCircle2 size={16} /> Finish & Continue</>
                                                    )}
                                                </button>
                                                {['distill', 'breakdown', 'retain', 'test'].includes(currentPhase.id) ? (
                                                    <p className="text-center text-[8px] text-[var(--foreground-muted)] font-black mt-3 uppercase tracking-widest opacity-40">
                                                        Skip this activity
                                                    </p>
                                                ) : (
                                                    <p className="text-center text-[9px] text-[var(--foreground-muted)] font-bold mt-3 uppercase tracking-widest opacity-60">
                                                        Saving progress to study library
                                                    </p>
                                                )}
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* THE PROFESSOR'S BEDTIME VERDICT MODAL */}
            <AnimatePresence>
                {showWrapModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[500] flex flex-col justify-between p-6 sm:p-10 bg-[#060608] text-white selection:bg-[var(--blue-dim)] overflow-y-auto custom-scrollbar"
                    >
                        {/* Story Progress Indicators */}
                        <div className="w-full max-w-xl mx-auto z-20 pt-4 flex flex-col gap-4">
                            <div className="flex gap-1.5 w-full">
                                {Array.from({ length: 5 }).map((_, idx) => (
                                    <button 
                                        key={idx} 
                                        onClick={() => setWrapSlide(idx)}
                                        className={cn(
                                            "h-1 flex-1 rounded-full transition-all duration-300",
                                            wrapSlide >= idx ? "bg-[var(--blue)] shadow-[0_0_8px_var(--blue-glow)]" : "bg-white/10"
                                        )}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/40">
                                    Sprint Wrap • Slide {wrapSlide + 1} of 5
                                </span>
                                <button
                                    onClick={() => { setShowWrapModal(false); setWrapSlide(0); }}
                                    className="p-1 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Story Card Canvas */}
                        <div className="flex-1 w-full max-w-xl mx-auto flex items-center justify-center my-8 z-10 relative">
                            <AnimatePresence mode="wait">
                                {wrapSlide === 0 && (
                                    <motion.div
                                        key="slide0"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.05 }}
                                        className="text-center space-y-6 flex flex-col items-center justify-center"
                                    >
                                        <div className="w-20 h-20 rounded-3xl bg-[var(--blue-dim)] border border-[var(--blue-border)] flex items-center justify-center text-[var(--blue)] animate-bounce mb-4 shadow-[0_0_40px_var(--blue-glow)]">
                                            <Sparkles size={40} />
                                        </div>
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-[var(--blue-text)] text-[9px] font-black uppercase tracking-widest border border-white/10">
                                            <Star size={10} className="fill-current" /> SPRINT COMPLETE
                                        </div>
                                        <h2 className="text-3xl sm:text-5xl font-black tracking-tight uppercase leading-none italic">
                                            Your <span className="text-[var(--blue)]">Daily Wrapped</span> is Ready
                                        </h2>
                                        <p className="text-sm text-white/60 font-bold max-w-sm mx-auto">
                                            You just finished studying {packTitle}. Let's look at how your brain performed today.
                                        </p>
                                    </motion.div>
                                )}

                                {wrapSlide === 1 && (
                                    <motion.div
                                        key="slide1"
                                        initial={{ opacity: 0, x: 100 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        className="w-full text-center space-y-8 flex flex-col items-center justify-center"
                                    >
                                        <h3 className="text-2xl font-black tracking-tight uppercase italic text-[var(--blue-text)]">
                                            Academic Output
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4 w-full">
                                            <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 text-[var(--blue)]"><Zap size={60} /></div>
                                                <span className="text-[9px] font-black uppercase tracking-wider text-white/40 mb-1">QUIZ SCORE</span>
                                                <span className="text-5xl font-black text-[var(--blue)] tracking-tighter">{effectiveQuizScore}%</span>
                                            </div>
                                            <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 text-[var(--emerald)]"><CheckCircle2 size={60} /></div>
                                                <span className="text-[9px] font-black uppercase tracking-wider text-white/40 mb-1">CARDS DRILL</span>
                                                <span className="text-5xl font-black text-[var(--emerald)] tracking-tighter">{effectiveFlashcardsCount}</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-white/50 max-w-sm font-medium">
                                            {userFirstName} increased their exam preparedness score significantly with a card run like this.
                                        </p>
                                    </motion.div>
                                )}

                                {wrapSlide === 2 && (
                                    <motion.div
                                        key="slide2"
                                        initial={{ opacity: 0, scale: 1.1 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="text-center space-y-6 flex flex-col items-center justify-center"
                                    >
                                        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--amber)]">STUDY VELOCITY</span>
                                        <div className="text-7xl font-black text-[var(--amber)] tracking-tighter italic">
                                            {(() => {
                                                const durationMs = sessionStats.finishTime ? (sessionStats.finishTime - sessionStats.startTime) : 0;
                                                const minutes = Math.floor(durationMs / 60000);
                                                const seconds = Math.floor((durationMs % 60000) / 1000);
                                                return durationMs > 0 ? `${minutes}m ${seconds}s` : "3m 15s";
                                            })()}
                                        </div>
                                        <h3 className="text-lg font-black uppercase max-w-sm leading-tight">
                                            Fast and focused study pace.
                                        </h3>
                                        <p className="text-xs text-white/60 max-w-sm mx-auto font-medium">
                                            {userFirstName} keeps their memory loops sharp by completing sprints in record time.
                                        </p>
                                    </motion.div>
                                )}

                                {wrapSlide === 3 && (
                                    <motion.div
                                        key="slide3"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.05 }}
                                        className="text-center space-y-6 flex flex-col items-center justify-center"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-[var(--blue-dim)] border border-[var(--blue-border)] flex items-center justify-center text-[var(--blue)] mb-2 shadow-[0_0_20px_var(--blue-glow)]">
                                            <BrainCircuit size={28} />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--blue-text)]">YOUR STUDY ARCHETYPE</span>
                                        <h3 className="text-3xl font-black uppercase tracking-tight italic">
                                            {studyArchetype.title}
                                        </h3>
                                        <p className="text-sm text-white/70 max-w-sm mx-auto leading-relaxed">
                                            {studyArchetype.description}
                                        </p>
                                    </motion.div>
                                )}

                                {wrapSlide === 4 && (
                                    <motion.div
                                        key="slide4"
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -50 }}
                                        className="w-full text-center space-y-6"
                                    >
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-[var(--blue-text)] text-[9px] font-black uppercase tracking-widest border border-white/10">
                                            <Zap size={10} className="text-[var(--blue)]" /> THE PROFESSOR'S VERDICT
                                        </div>
                                        <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 min-h-[140px] flex items-center justify-center text-center shadow-inner">
                                            {isGuest ? (
                                                <div className="relative py-2">
                                                    <p className="blur-[4px] select-none text-sm text-white font-black leading-relaxed italic uppercase max-w-2xl mx-auto tracking-tight">
                                                        {userFirstName}, the Professor knows exactly how ready you are, but you need to sign up to unlock this final verdict and save your streak.
                                                    </p>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--blue)] mb-2">Locked Assessment</span>
                                                        <button
                                                            onClick={() => {
                                                                setShowWrapModal(false);
                                                                setShowGuestModal(true);
                                                            }}
                                                            className="px-4 py-2 rounded-xl bg-white text-black text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all cursor-pointer shadow-md"
                                                        >
                                                            Sign Up to Unlock
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm sm:text-base text-white font-black leading-relaxed italic uppercase max-w-2xl mx-auto tracking-tight">
                                                    {(() => {
                                                        if (effectiveQuizScore >= 95) return `Absolute genius. ${userFirstName}, your brain is full and the slides have been parsed. Flawless. You've fully absorbed this material. Close the tab and go live your life.`;
                                                        if (effectiveQuizScore >= 80) return `Solid run. You've locked in the high-yield parts. ${userFirstName}, grab some water and catch up on sleep. The hard work is done.`;
                                                        if (effectiveQuizScore >= 60) return `You passed, but it was close. ${userFirstName}, go get some rest now, but review these card decks one more time tomorrow morning.`;
                                                        return "Concept explorer. Some gaps remain, but cramming tired won't help. Rest your brain, sleep on it, and let the concepts settle.";
                                                    })()}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2.5 max-w-md mx-auto pt-4">
                                            <button 
                                                onClick={() => {
                                                    if (isGuest) {
                                                        setShowWrapModal(false);
                                                        setShowGuestModal(true);
                                                    } else {
                                                        const text = `I just wrapped up my study session on "${packTitle}" with The Professor! 🎓\n\n🎯 Quiz Score: ${effectiveQuizScore}%\n⚡ Cards Reviewed: ${effectiveFlashcardsCount}\n\nYour notes. Just the good parts. Get your time back:\n${window.location.origin}`;
                                                        navigator.clipboard.writeText(text);
                                                        addToast("Summary copied to clipboard!", "success");
                                                    }
                                                }}
                                                className="w-full py-3.5 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-widest shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <Share2 size={14} /> 
                                                {isGuest ? "SIGN UP TO SAVE PROGRESS" : "COPY SPRINT SUMMARY"}
                                            </button>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button 
                                                    onClick={() => { setShowWrapModal(false); setWrapSlide(0); router.push('/create'); }}
                                                    className="py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer"
                                                >
                                                    NEW SPRINT
                                                </button>
                                                <button 
                                                    onClick={() => { setShowWrapModal(false); setWrapSlide(0); router.push('/dashboard'); }}
                                                    className="py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer"
                                                >
                                                    CLOSE LAB
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer Controls */}
                        <div className="w-full max-w-xl mx-auto flex items-center justify-between z-20 pb-4">
                            <button
                                onClick={() => setWrapSlide(prev => Math.max(0, prev - 1))}
                                disabled={wrapSlide === 0}
                                className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 disabled:opacity-0 transition-opacity"
                            >
                                BACK
                            </button>
                            {wrapSlide < 4 ? (
                                <button
                                    onClick={() => setWrapSlide(prev => Math.min(4, prev + 1))}
                                    className="px-6 py-2.5 rounded-xl bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                                >
                                    NEXT
                                </button>
                            ) : (
                                <div className="w-12" />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {phasesData.distill && (
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
                            <h1 className="text-5xl font-black tracking-tight leading-tight">{packTitle}</h1>
                        </div>
                        <div className="prose prose-invert prose-amber max-w-none">
                            <Markdown>
                                {(() => {
                                    const summaryData = phasesData.distill;
                                    const summaryText = typeof summaryData === 'string' ? summaryData : (summaryData?.summary ? (typeof summaryData.summary === 'string' ? summaryData.summary : JSON.stringify(summaryData.summary)) : "");
                                    return convertKnowledgeChecksToMarkdown(summaryText);
                                })()}
                            </Markdown>
                        </div>
                    </div>
                </div>
            )}

            <GuestSignupModal
                isOpen={showGuestModal}
                onClose={() => setShowGuestModal(false)}
                packTitle={packTitle}
            />
        </div>
    );
}
