"use client";

import React, { useEffect, useState, useTransition, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import remarkGfm from "remark-gfm";
import dynamic from "next/dynamic";
import { SummarySkeleton, QuizQuestionSkeleton, Skeleton } from "@/components/ui/Skeleton";

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
    Settings,
    Loader2,
    Youtube,
    ExternalLink,
} from "lucide-react";
import { cn, cleanDocumentTitle } from "@/lib/utils";
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
import { DocumentSummaryReader } from "@/components/features/workspace/DocumentSummaryReader";
import { useCitationHighlight } from "@/hooks/useCitationHighlight";
import { InteractiveSummary } from "@/components/features/InteractiveSummary";
import { InteractiveFlashcards } from "@/components/features/InteractiveFlashcards";
import { InteractiveQuiz } from "@/components/features/InteractiveQuiz";
import { ExternalResourcesViewer, type YoutubeResource } from "@/components/features/ExternalResourcesViewer";
import SessionComplete from "@/components/features/SessionComplete";
import BreakdownViewer from "@/components/features/breakdown/BreakdownViewer";
import { AnnotatedSourceViewer } from "@/components/features/AnnotatedSourceViewer";
import ThemeToggle from "@/components/ui/ThemeToggle";
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
    const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
    const [isPerforming, setIsPerforming] = useState(false);
    const [hasTaskCompleted, setHasTaskCompleted] = useState(false);
    const [sessionStats, setSessionStats] = useState({
        quiz: null as { score: number; correct: number; time: string; total: number } | null,
        flashcards: null as { totalCards: number } | null,
        startTime: Date.now(),
        finishTime: null as number | null
    });

    // Unified page-by-page phase navigation
    const [activePhase, setActivePhase] = useState<'distill' | 'test' | 'retain' | 'resources'>('distill');
    const [highlightedParagraph, setHighlightedParagraph] = useState<number | null>(null);

    const packId = params.id as string;

    const phaseContainerRef = useRef<HTMLDivElement>(null);
    const { highlightSnippet } = useCitationHighlight(phaseContainerRef);

    /** Navigate to summary page when a citation badge is clicked. */
    const handleCitationClick = useCallback((paragraphIndex: number | string) => {
        setActivePhase('distill');
        if (typeof paragraphIndex === 'number') {
            setTimeout(() => setHighlightedParagraph(paragraphIndex), 80);
        } else {
            setTimeout(() => highlightSnippet(paragraphIndex), 80);
        }
    }, [highlightSnippet]);



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
            id: "resources",
            title: "External Resources",
            icon: Youtube,
            color: "#FF0000",
            desc: "Curated YouTube videos to deepen understanding.",
            content: "### External Resources\n\nHand-picked video tutorials matched to your notes."
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
                        const allPhases = ["distill", "test", "retain", "resources"];
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

    const handleBeginTask = async (phaseId: string, force = false) => {
        const phase = phases.find(p => p.id === phaseId);
        if (!phase) return;

        if (isGuest) { setShowGuestModal(true); return; }
        if (isSharedView) { addToast("Only the pack owner can generate phases.", "error"); return; }

        const hasExistingData = phasesData[phase.id] && (
            typeof phasesData[phase.id] === 'string' ? phasesData[phase.id].trim().length > 0 :
            Array.isArray(phasesData[phase.id]) ? phasesData[phase.id].length > 0 :
            Object.keys(phasesData[phase.id]).length > 0
        );

        if (hasExistingData && !force) {
            return;
        }

        if (!sourceText) {
            addToast("Source material is missing. Try creating the pack again.", "error");
            return;
        }

        if (!navigator.onLine) {
            addToast("You are currently offline. Please check your internet connection.", "error");
            return;
        }

        setIsLoadingPhase(true);
        setGeneratingPhases(prev => ({ ...prev, [phase.id]: 'loading' }));
        try {
            // ── Resources phase: dedicated YouTube API route (not Hydra stream) ──
            if (phase.id === 'resources') {
                const res = await fetch("/api/resources/search", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ packId, sourceText }),
                });
                const result = await res.json();
                if (!res.ok || !result.success) {
                    throw new Error(result.error || "Could not find resources.");
                }
                const updated = { ...phasesData, resources: result.resources };
                setPhasesData(updated);
                setIsLoadingPhase(false);
                setGeneratingPhases(prev => ({ ...prev, [phase.id]: null }));
                addToast("Resources generated successfully!", "success");
                handleMasterPhase(phase.id, undefined, updated);
                return;
            }

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

                const finalData = phase.id === "predict"
                    ? { title: "Study Roadmap", roadmap: accumulatedText }
                    : (accumulatedItems.length > 0 ? accumulatedItems : accumulatedText);
                const updated = { ...phasesData, [phase.id]: finalData };
                setPhasesData(updated);

                // Prefetch next uncompleted phase
                const allPhases = ["distill", "test", "retain", "resources"];
                const nextIdx = allPhases.indexOf(phase.id) + 1;
                const nextUncompletedId = allPhases[nextIdx];
                if (nextUncompletedId && !phasesData[nextUncompletedId]) {
                    prefetchPhase(nextUncompletedId, sourceText, packId);
                }
                handleMasterPhase(phase.id, undefined, updated);
                return;
            }

            const result = await res.json();
            if (result.success) {
                const updated = { ...phasesData, [phase.id]: result.data };
                setPhasesData(updated);
                handleMasterPhase(phase.id, undefined, updated);
            } else {
                const errorMsg = typeof result.error === "string" ? result.error : "Generation failed";
                throw new Error(errorMsg);
            }
        } catch (err: any) {
            console.error("Phase Generation Error:", err);
            const errMsg = err?.message || String(err);
            if (!navigator.onLine || errMsg.includes("Failed to fetch") || errMsg.includes("NetworkError") || errMsg.includes("fetch")) {
                addToast("You are currently offline. Please check your internet connection.", "error");
            } else {
                addToast("The Professor is taking a quick break. Please try again in a moment.", "error");
            }
            setIsStreamingPhase(false);
        } finally {
            setIsLoadingPhase(false);
            setIsStreamingPhase(false);
            setGeneratingPhases(prev => ({ ...prev, [phase.id]: null }));
        }
    };

    const handleMasterPhase = async (phaseId: string, stats?: any, updatedPhasesData?: Record<string, any>) => {
        if (isGuest) { setShowGuestModal(true); return; }
        if (isSharedView) return;

        // Record stats if provided
        if (phaseId === 'test' && stats) {
            setSessionStats(prev => ({ ...prev, quiz: stats }));
        }
        if (phaseId === 'retain' && stats) {
            setSessionStats(prev => ({ ...prev, flashcards: stats }));
        }

        const nextCompleted = completedPhases.includes(phaseId)
            ? completedPhases
            : [...completedPhases, phaseId];

        setCompletedPhases(nextCompleted);

        // Persist to DB
        try {
            await fetch("/api/library/update-pack", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    packId,
                    phasesData: {
                        ...(updatedPhasesData || phasesData),
                        _mastered: nextCompleted
                    }
                })
            });
        } catch (err) {
            console.error("Phase Persistence Error:", err);
        }

        const isLastPhase = phaseId === 'resources';

        if (nextCompleted.length === phases.length || isLastPhase) {
            setSessionStats(prev => ({ ...prev, finishTime: Date.now() }));
            setIsAllCompleted(true);
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

            // Auto-advance to next phase
            if (phaseId === 'distill') {
                setActivePhase('test');
            } else if (phaseId === 'test') {
                setActivePhase('retain');
            } else if (phaseId === 'retain') {
                setActivePhase('resources');
            }
            addToast(`Phase Mastered!`, "success");
        }
    };

    const handleShare = () => {
        const shareUrl = typeof window !== 'undefined' 
            ? `${window.location.origin}/share?id=${packId}` 
            : '';
        navigator.clipboard.writeText(shareUrl);
        addToast("Public share link copied! Anyone with the link can view this pack.", "success");
    };

    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    const [showFullExportMenu, setShowFullExportMenu] = useState(false);
    const [isExportingFullPDF, setIsExportingFullPDF] = useState(false);
    const [fullPdfDownloadProgress, setFullPdfDownloadProgress] = useState(0);
    const [fullPdfDownloadSpeed, setFullPdfDownloadSpeed] = useState("");

    const compileFullPackMarkdown = () => {
        let md = `# ${packTitle || "Study Pack"}: Complete Study Blueprint\n`;
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

        // 4. External Resources
        md += `## 4. Curated YouTube Learning Resources\n\n`;
        if (phasesData.resources && Array.isArray(phasesData.resources) && phasesData.resources.length > 0) {
            phasesData.resources.forEach((r: YoutubeResource, idx: number) => {
                md += `### ${idx + 1}. ${r.title}\n`;
                md += `- **Channel:** ${r.channel}\n`;
                md += `- **Duration:** ${r.duration} | **Level:** ${r.difficulty}\n`;
                md += `- **Why watch:** ${r.reasonToWatch}\n`;
                md += `- **Watch/Search:** [${r.searchQuery}](${r.youtubeUrl})\n\n`;
            });
        } else {
            md += `*External resources not generated yet.*\n\n`;
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
                title: "The Quick Reader",
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

    const renderPhaseContent = (phaseId: string, active: boolean) => {
        const data = phasesData[phaseId];
        const isPhaseLoading = isLoadingPhase || generatingPhases[phaseId] === 'loading';
        const isPhaseStreaming = isStreamingPhase || generatingPhases[phaseId] === 'streaming';
        const isCurrentlyGenerating = isPhaseLoading || isPhaseStreaming;
        
        if (!data && !isCurrentlyGenerating) {
            return (
                <div className={cn("p-8 rounded-3xl bg-[var(--background-secondary)]/40 border border-[var(--border)] text-center flex flex-col items-center justify-center min-h-[350px] w-full max-w-xl mx-auto my-auto", !active && "hidden")}>
                    <div className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] shadow-inner mb-4 text-[var(--blue)]">
                        {phaseId === 'distill' && <FileText size={24} />}
                        {phaseId === 'retain' && <Layers size={24} className="text-[var(--amber)]" />}
                        {phaseId === 'test' && <Sword size={24} className="text-[var(--crimson)]" />}
                        {phaseId === 'resources' && <Youtube size={24} className="text-[#FF0000]" />}
                    </div>
                    <h3 className="text-base font-black uppercase tracking-tight text-[var(--foreground)] mb-2">
                        {phaseId === 'distill' && "Deep Summary"}
                        {phaseId === 'retain' && "Memory Cards"}
                        {phaseId === 'test' && "Practice Quiz"}
                        {phaseId === 'resources' && "External Resources"}
                    </h3>
                    <p className="text-xs text-[var(--foreground-muted)] mb-6 max-w-xs leading-relaxed">
                        {phaseId === 'distill' && "Get a clean, simple summary of your notes with the most important parts."}
                        {phaseId === 'retain' && "Study flashcards with easy memory hooks to lock in core terms."}
                        {phaseId === 'test' && "Test your knowledge with practice questions customized to your notes."}
                        {phaseId === 'resources' && "Find the best YouTube tutorials matched to your exact topics."}
                    </p>
                    <button
                        onClick={() => handleBeginTask(phaseId)}
                        className="px-6 py-2.5 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-black text-[9px] uppercase tracking-widest hover-scale-md active:scale-95 transition-all flex items-center gap-2 shadow-lg"
                    >
                        Generate Now <ArrowRight size={10} />
                    </button>
                </div>
            );
        }

        if (isCurrentlyGenerating && (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'string' && data.length === 0))) {
            return (
                <div className={cn("p-12 rounded-[2.5rem] bg-[var(--background-secondary)]/80 backdrop-blur-xl border border-[var(--border)] shadow-2xl flex items-center justify-center min-h-[350px] w-full max-w-xl mx-auto my-auto", !active && "hidden")}>
                    <BubblyThinkingLoader />
                </div>
            );
        }

        switch (phaseId) {
            case "distill": {
                const summaryText = typeof data === 'string' ? data : (data?.summary ? (typeof data.summary === 'string' ? data.summary : JSON.stringify(data.summary)) : (isCurrentlyGenerating ? "" : "No summary available."));
                return (
                    <div className={cn("w-full", !active && "hidden")}>
                        <InteractiveSummary
                            rawText={String(sourceText).substring(0, 1000) + "..."}
                            refinedText={summaryText}
                            autoReveal={true}
                            isStreaming={isPhaseStreaming && phaseId === "distill"}
                            onFinish={() => handleMasterPhase('distill')}
                            onCitationClick={handleCitationClick}
                        />
                    </div>
                );
            }
            case "retain": {
                const rawCards = data ? (Array.isArray(data) ? data : (data.flashcards || data.cards || [])) : [];
                const cards = rawCards.map((c: any) => ({
                    front: c?.front || c?.question || (typeof c === 'string' ? c : "Term"),
                    back: c?.back || c?.answer || (typeof c === 'string' ? c : "Definition"),
                    topic: c?.topic || "Active Recall"
                }));
                return (
                    <div className={cn("w-full", !active && "hidden")}>
                        <InteractiveFlashcards 
                            cards={cards} 
                            title={packTitle + " - Flashcards"} 
                            generationId={packId} 
                            onFinish={(stats) => handleMasterPhase('retain', stats)} 
                            onRetry={() => handleRetryPhase("retain")} 
                        />
                    </div>
                );
            }
            case "test": {
                const quizQuestions = Array.isArray(data) ? data : (data.questions || [data]);
                return (
                    <div className={cn("w-full", !active && "hidden")}>
                        <InteractiveQuiz 
                            questions={quizQuestions} 
                            title={packTitle + " - Quiz"} 
                            onFinish={(stats) => handleMasterPhase('test', stats)} 
                        />
                    </div>
                );
            }
            case "resources": {
                const resources: YoutubeResource[] = Array.isArray(data) ? data : [];
                return (
                    <div className={cn("w-full flex flex-col gap-6", !active && "hidden")}>
                        <ExternalResourcesViewer
                            resources={resources}
                            packTitle={packTitle}
                            onGenerateMore={() => handleBeginTask('resources', true)}
                            isGenerating={isCurrentlyGenerating}
                        />
                        {resources.length > 0 && (
                            <div className="mt-8 flex justify-center border-t border-[var(--border)] pt-6">
                                <button
                                    onClick={() => handleMasterPhase('resources')}
                                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[var(--blue)] to-[var(--violet)] text-white text-[10px] font-black uppercase tracking-widest hover:opacity-95 active:scale-95 transition-all shadow-xl shadow-[var(--blue-glow)]"
                                >
                                    <CheckCircle2 size={14} />
                                    <span>Finish Study Sprint</span>
                                </button>
                            </div>
                        )}
                    </div>
                );
            }
            default:
                return null;
        }
    };

    if (!isMounted || packLoading) {
        return (
            <div className="min-h-screen bg-[var(--background)] relative">
                <div className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40 z-0" />
                <StandardContainer className="pt-16 pb-20 relative z-10 max-w-7xl">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <div className="w-48 h-4 bg-white/5 rounded animate-pulse mb-3" />
                            <div className="w-24 h-2.5 bg-white/5 rounded animate-pulse" />
                        </div>
                        <div className="w-32 h-10 bg-white/5 rounded-xl animate-pulse" />
                    </div>

                    {/* 2-Column Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left column: Summary/Text skeleton */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                                <Skeleton className="h-6 w-1/3" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-4/5" />
                                </div>
                            </div>
                            <SummarySkeleton sections={2} />
                        </div>

                        {/* Right column: Tabs & Active phase skeleton */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="p-1 bg-[var(--background-secondary)] rounded-2xl border border-[var(--border)] flex gap-2">
                                <div className="h-10 flex-1 bg-white/5 rounded-xl animate-pulse" />
                                <div className="h-10 flex-1 bg-white/5 rounded-xl animate-pulse" />
                                <div className="h-10 flex-1 bg-white/5 rounded-xl animate-pulse" />
                            </div>
                            <QuizQuestionSkeleton options={3} />
                        </div>
                    </div>
                </StandardContainer>
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
      return (
        <div className="min-h-screen bg-transparent pb-6 pt-4 transition-all duration-700 overflow-x-hidden">
            <StandardContainer className="print-hidden">
                {/* Guest Banner */}
                {isGuest && (
                    <div className="mb-6 p-4 rounded-2xl bg-[var(--blue)]/10 border border-[var(--blue)]/20 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-300">
                        <p className="text-xs text-[var(--foreground)] font-medium leading-relaxed">
                            <span className="font-black text-[var(--blue)]">Guest view.</span> Sign up to save your progress and build your own study packs.
                        </p>
                        <button
                            onClick={() => setShowGuestModal(true)}
                            className="shrink-0 px-4 py-2 rounded-xl bg-[var(--blue)] text-white text-[9px] font-black uppercase tracking-widest hover:bg-[var(--blue)]/80 transition-all active:scale-95 shadow-lg shadow-[var(--blue-glow)]"
                        >
                            Sign Up Free
                        </button>
                    </div>
                )}

                {/* Workspace Header — responsive 2-zone layout */}
                <div className="flex flex-col gap-2 mb-5 animate-in fade-in slide-in-from-top-3 duration-300">
                    {/* Zone 1: Back + Title + Breadcrumb */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => isGuest ? setShowGuestModal(true) : router.push('/library')}
                            className="p-2 rounded-xl hover:bg-[var(--background-secondary)] transition-colors text-[var(--foreground-muted)] hover:text-[var(--foreground)] shrink-0 border border-[var(--border)]"
                            title={isGuest ? "Exit" : "Back to Library"}
                        >
                            <ChevronLeft size={17} />
                        </button>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="px-2 py-0.5 rounded-full bg-[var(--blue)]/10 text-[var(--blue)] text-[8px] font-black uppercase tracking-wider border border-[var(--blue)]/20 shrink-0">
                                    STUDY LAB
                                </span>
                                <span className="text-[9px] font-bold text-[var(--foreground-muted)] flex items-center gap-1 shrink-0">
                                    <Clock size={9} />{completedPhases.length} / 4
                                </span>
                            </div>
                            <h1 className="text-sm sm:text-base font-black tracking-tight leading-tight italic truncate text-[var(--foreground)] max-w-full">
                                {cleanDocumentTitle(packTitle)}
                            </h1>
                        </div>
                    </div>

                    {/* Zone 2: Action Strip — relative and visible overflow to prevent settings dropdown clipping */}
                    <div className="flex items-center gap-2 pb-0.5 pl-9 relative">
                        <ThemeToggle />

                        {/* Lab Settings Dropdown */}
                        <div className="relative shrink-0">
                            <button
                                onClick={() => setShowOptionsDropdown(prev => !prev)}
                                className="px-3 py-1.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all flex items-center gap-1.5 shadow-sm"
                                title="Lab Settings"
                            >
                                <Settings size={12} />
                                <span>Lab Settings</span>
                            </button>
                            <AnimatePresence>
                                {showOptionsDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-[100]" onClick={() => setShowOptionsDropdown(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                            transition={{ duration: 0.13 }}
                                            className="absolute right-0 mt-2 min-w-[210px] bg-[var(--background-secondary)] border border-[var(--border-2)] rounded-xl p-1.5 shadow-2xl flex flex-col gap-0.5 z-[110]"
                                        >
                                            <button
                                                onClick={() => {
                                                    setShowOptionsDropdown(false);
                                                    handleSaveOffline();
                                                }}
                                                className="w-full px-3 py-2.5 rounded-lg text-left text-[10px] font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-all flex items-center gap-2"
                                            >
                                                <Download size={12} className={cn("shrink-0", isSavedOffline ? "text-[var(--emerald)]" : "")} />
                                                <span>{isSavedOffline ? "Saved Offline" : "Save Offline"}</span>
                                            </button>
                                            <div className="h-[1px] bg-[var(--border)] my-1" />
                                            <button
                                                onClick={async () => {
                                                    setShowOptionsDropdown(false);
                                                    await handleExportFullPackPDF();
                                                }}
                                                className="w-full px-3 py-2.5 rounded-lg text-left text-[10px] font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-all flex items-center gap-2"
                                            >
                                                <FileText size={12} className="text-[var(--amber)] shrink-0" />
                                                <span>Export Full Pack (ZIP)</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowOptionsDropdown(false);
                                                    handleExportFullPackMarkdown();
                                                }}
                                                className="w-full px-3 py-2.5 rounded-lg text-left text-[10px] font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-all flex items-center gap-2"
                                            >
                                                <Terminal size={12} className="text-[var(--amber)] shrink-0" />
                                                <span>Export Markdown (.md)</span>
                                            </button>
                                            <div className="h-[1px] bg-[var(--border)] my-1" />
                                            <button
                                                onClick={() => {
                                                    setShowOptionsDropdown(false);
                                                    handleShare();
                                                }}
                                                className="w-full px-3 py-2.5 rounded-lg text-left text-[10px] font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-all flex items-center gap-2"
                                            >
                                                <Share2 size={12} className="text-[var(--blue)] shrink-0" />
                                                <span>Share Study Lab</span>
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Subscription Banner */}
                {false && !packLoading && user.planStatus === 'free' && (
                    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[var(--blue-dim)]/40 to-transparent border border-[var(--blue-border)]/50 shadow-lg relative overflow-hidden backdrop-blur-md">
                        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[var(--blue)]/5 rounded-full blur-[80px] pointer-events-none" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--blue)]/10 border border-[var(--blue)]/20 text-[var(--blue)] text-[8px] font-black uppercase tracking-wider mb-1.5">
                                    <Sparkles size={8} /> SPRINT UNLOCK
                                </span>
                                <h2 className="text-xs font-black uppercase tracking-tight text-[var(--foreground)] mb-0.5">
                                    Unlock Weekly Sprint Pass (₦399)
                                </h2>
                                <p className="text-[10px] text-[var(--foreground-muted)] font-medium leading-relaxed max-w-xl">
                                    Get the Feynman vocabulary highlights, active memory deck expansions, and clean PDF exports for offline revision. Cancel in one click anytime.
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/settings/billing')}
                                className="px-4 py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-md shrink-0 self-start sm:self-center"
                            >
                                Unlock Now
                            </button>
                        </div>
                    </div>
                )}

                {/* ── In-Sprint Phase Navigation Bar ── */}
                <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="relative flex items-center gap-1 p-1.5 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] shadow-sm">
                        {([
                            { id: 'distill',   label: 'Summary',    icon: FileText, color: 'var(--blue)',    activeClass: 'bg-[var(--blue)]/15 border-[var(--blue)]/30 text-[var(--blue)]' },
                            { id: 'test',      label: 'Quiz',       icon: Sword,    color: 'var(--crimson)', activeClass: 'bg-[var(--crimson)]/15 border-[var(--crimson)]/30 text-[var(--crimson)]' },
                            { id: 'retain',    label: 'Flashcards', icon: Layers,   color: 'var(--amber)',   activeClass: 'bg-[var(--amber)]/15 border-[var(--amber)]/30 text-[var(--amber)]' },
                            { id: 'resources', label: 'Resources',  icon: Youtube,  color: '#FF0000',        activeClass: 'bg-[#FF0000]/10 border-[#FF0000]/25 text-[#FF0000]' },
                        ] as const).map((tab) => {
                            const isActive = activePhase === tab.id;
                            const isDone = completedPhases.includes(tab.id);
                            const Icon = tab.icon;
                            return (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => setActivePhase(tab.id)}
                                    layoutId={`sprint-tab-${tab.id}`}
                                    className={cn(
                                        "relative flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-200 border",
                                        isActive
                                            ? tab.activeClass
                                            : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]/60"
                                    )}
                                >
                                    <Icon size={11} className="shrink-0" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    {isDone && (
                                        <CheckCircle2 size={9} className="shrink-0 opacity-80" />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Single-Column Full-Width Phase Content ── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activePhase}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="w-full"
                        ref={phaseContainerRef}
                    >
                        {activePhase === 'distill' && (
                            phasesData.distill ? (
                                <DocumentSummaryReader
                                    title={packTitle || "Study Pack Summary"}
                                    summaryText={
                                        typeof phasesData.distill === 'string'
                                            ? phasesData.distill
                                            : (phasesData.distill?.summary ? (typeof phasesData.distill.summary === 'string' ? phasesData.distill.summary : JSON.stringify(phasesData.distill.summary)) : (isPerforming ? "Preparing your study summary..." : "No summary available."))
                                    }
                                    rawText={sourceText || ""}
                                    onCitationClick={handleCitationClick}
                                    containerRef={phaseContainerRef}
                                />
                            ) : (
                                renderPhaseContent('distill', true)
                            )
                        )}
                        {activePhase === 'test' && renderPhaseContent('test', true)}
                        {activePhase === 'retain' && renderPhaseContent('retain', true)}
                        {activePhase === 'resources' && renderPhaseContent('resources', true)}
                    </motion.div>
                </AnimatePresence>

            </StandardContainer>






            {phasesData.distill && (
                <div className="fixed left-[-9999px] top-0 pointer-events-none">
                    <div id="summary-export-container" className="w-[800px] bg-[var(--background)] text-[var(--foreground)] p-20 font-sans">
                        <style dangerouslySetInnerHTML={{ __html: `
                            #summary-export-container table {
                                width: 100% !important;
                                border-collapse: collapse !important;
                                margin: 32px 0 !important;
                                border: 1px solid var(--border) !important;
                                background: var(--background-secondary) !important;
                                display: table !important;
                            }
                            #summary-export-container th {
                                background-color: var(--background-secondary) !important;
                                color: var(--foreground) !important;
                                font-weight: 800 !important;
                                text-transform: uppercase !important;
                                letter-spacing: 0.1em !important;
                                font-size: 11px !important;
                                padding: 14px 20px !important;
                                border-bottom: 2px solid var(--border-2) !important;
                                border-right: 1px solid var(--border) !important;
                            }
                            #summary-export-container td {
                                padding: 14px 20px !important;
                                border-bottom: 1px solid var(--border) !important;
                                border-right: 1px solid var(--border) !important;
                                color: var(--foreground-secondary) !important;
                                font-size: 14px !important;
                            }
                            #summary-export-container tr:last-child td {
                                border-bottom: none !important;
                            }
                            #summary-export-container tr td:last-child, #summary-export-container tr th:last-child {
                                border-right: none !important;
                            }
                            #summary-export-container tr:nth-child(even) {
                                background-color: var(--background-secondary) !important;
                            }
                        `}} />
                        <div className="mb-20 pb-10 border-b border-[var(--border-2)]">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--accent)] mb-4">Your Study Pack Summary</p>
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


            <SessionComplete
                isVisible={isAllCompleted}
                onDismiss={() => {
                    setIsAllCompleted(false);
                    router.push('/library');
                }}
                xpEarned={100}
                streak={1}
                streakIncremented={false}
                type="summary"
                title={packTitle}
                continueHref="/library"
            />

            <GuestSignupModal
                isOpen={showGuestModal}
                onClose={() => setShowGuestModal(false)}
                packTitle={packTitle}
            />
        </div>
    );
}
