"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useToasts } from "@/components/ui/GlobalToasts";
import { useIngestStore } from "@/store/useIngestStore";
import { useQuery } from "@tanstack/react-query";
import SEOHead, { getWebApplicationSchema, getBreadcrumbSchema } from "@/components/SEOHead";
import { useAppPlatform } from "@/hooks/useAppPlatform";
import PlatformShell from "@/components/platforms/PlatformShell";
import { createClient } from "@/lib/supabase/client";
import { performOCR } from "@/lib/ocr-bridge";
import GuestSignupModal from "@/components/ui/GuestSignupModal";
import { computeFileHash, computeStringHash } from "@/lib/hash";

import dynamic from "next/dynamic";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";

// Platform-Specific Dashboard Components (Dynamically imported with custom skeleton fallback for client-side navigation)
const DashboardWeb = dynamic(() => import("@/components/platforms/web/DashboardWeb").catch((err) => {
    if (typeof window !== "undefined" && (err.name === "ChunkLoadError" || err.message?.includes("Failed to load chunk"))) {
        window.location.reload();
    }
    throw err;
}), { loading: () => <DashboardSkeleton /> });

const DashboardDesktop = dynamic(() => import("@/components/platforms/desktop/DashboardDesktop").catch((err) => {
    if (typeof window !== "undefined" && (err.name === "ChunkLoadError" || err.message?.includes("Failed to load chunk"))) {
        window.location.reload();
    }
    throw err;
}), { loading: () => <DashboardSkeleton /> });

const DashboardMobile = dynamic(() => import("@/components/platforms/mobile/DashboardMobile").catch((err) => {
    if (typeof window !== "undefined" && (err.name === "ChunkLoadError" || err.message?.includes("Failed to load chunk"))) {
        window.location.reload();
    }
    throw err;
}), { loading: () => <DashboardSkeleton /> });
import ShareCard from "@/components/ShareCard";
import StreakMilestone from "@/components/features/StreakMilestone";
import { LateNightGuard } from "@/components/features/LateNightGuard";

const MAX_CHARS = 2000000;

const loadingPhrases = [
    "Skimming the abstract...",
    "Reviewing notes & parsing tables...",
    "Translating academic jargon into plain English...",
    "Connecting the dots across chapters...",
    "Pulling out the most important concepts...",
    "Almost there. Polishing the wisdom..."
];

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */
function getGreeting(userId?: string): string {
    const hour = new Date().getHours();
    
    // Professor-style greetings (Coffee-Shop Casual, Culturally Authentic Nigerian Lifestyle, Max 6 Words)
    const morning = [
        "Sun's barely up. You're ahead",
        "Up early. Ahead of schedule",
        "Early bird. Smart move",
        "Let's make today easy",
        "Quiet morning. Perfect study weather",
        "Filter the noise. Learn fast",
        "Gen is off. Focus restored",
        "Start smart. Free afternoon later",
        "Quick review. Wake the brain up",
        "First light. Just the facts",
        "No long talk. Let's study",
        "Dew outside. Wisdom inside",
        "Beat the morning rush",
        "Clear the queue before breakfast",
        "Skip the stress. Learn now",
        "Early reps. Permanent memory",
        "Morning clarity is unmatched",
        "New day. Same smart you",
        "Heavy lifting done early",
        "No notifications. Pure focus",
        "Wake up. Lock in",
        "Quick session. Big impact",
        "Early morning dedication. Respect",
        "Rise. Shine. Remember"
    ];
    const afternoon = [
        "Midday check-in. Standards are higher",
        "Tackle that one tough concept",
        "Lunch done. Just the good parts",
        "Smart break or smart study?",
        "Beat the midday heat",
        "No fluff. Just core concepts",
        "Focus now. More sleep later",
        "Stay sharp. Halfway there",
        "Smart reps now. Free evening",
        "Secure the win before sundown",
        "Afternoon quiet. Let's make progress",
        "Keep it brief. Keep it smart",
        "Don't let the slump win",
        "Straight to the point",
        "Clear the pending slides today",
        "Quick session. Big results",
        "Day's young. Focus is high",
        "One concept. That's all",
        "Bypass the academic jargon",
        "Afternoon push. Organize the chaos",
        "Effort now saves exam panic",
        "Understand first. Memorize later",
        "Keep the momentum alive",
        "No wasted time today"
    ];
    const evening = [
        "Evening session. Make it count",
        "Sunset scholars. Time to refine",
        "Distill knowledge. Keep it simple",
        "Smart review. Get time back",
        "Clear the noise. Lock in",
        "Prime time for active recall",
        "Secure grades before dinner",
        "Cool breeze. Clear thoughts",
        "Smart review. Sleep easy tonight",
        "One last check. Ace tomorrow",
        "Day ending. Memory peaking",
        "Clear the queue. Claim evening",
        "Evening calm. Study made simple",
        "Evening calm. Connect the dots",
        "Don't leave it for midnight",
        "Lock in concepts while fresh",
        "Wrap up notes. Enjoy tonight",
        "Quick sprint. Keep streak active",
        "Verify knowledge. Sleep in peace",
        "Less reading. More active recall",
        "Finishing touches on today's plan",
        "Put in hours. Elegant review",
        "No midnight panic needed",
        "Simplify final topics today"
    ];
    const night = [
        "Midnight oil? Do it for you",
        "Late wisdom. Quiet world",
        "Still awake? Make it count",
        "2 AM energy? Built different",
        "Inverter holding up. Quiet progress",
        "Midnight silence. Best for formulas",
        "No notifications. Just core concepts",
        "Make late night hours count",
        "Quick sprint. Clear the deck",
        "Quiet hours. Smart review",
        "Burning late hours. High marks",
        "Late night clarity. Lock in",
        "Stars out. Study guide out",
        "No background noise. Pure focus",
        "Beat the sun. Lock in",
        "Late night dedication. Respect",
        "Get sorted. Ace tomorrow",
        "Late study weather. Simple bullets",
        "Skipping fluff. Just exact answers",
        "Midnight focus active. Absorb material",
        "Working while others sleep. Succeed",
        "Productive night. Easy tomorrow",
        "Quiet hours. Deep comprehension",
        "One last concept. Ace tomorrow"
    ];
    
    let hash = 0;
    if (userId) {
        for (let i = 0; i < userId.length; i++) {
            hash = ((hash << 5) - hash) + userId.charCodeAt(i);
        }
    }
    const dayOfMonth = new Date().getDate();
    const idx = Math.abs(hash + dayOfMonth) % 24;

    if (hour < 5) return night[idx];
    if (hour < 12) return morning[idx];
    if (hour < 17) return afternoon[idx];
    if (hour < 22) return evening[idx];
    return night[idx];
}

function DashboardContent() {
    const router = useRouter();
    const { user, refreshUser, recoverStreak, spendCredits } = useUser();
    const { addToast } = useToasts();
    const { isLoaded, isDesktop } = useAppPlatform();
    const [milestoneToCelebrate, setMilestoneToCelebrate] = useState<number | null>(null);
    const [isProcessingAction, setIsProcessingAction] = useState(false);
    const [shareData, setShareData] = useState<any>(null);

    // ──────────────────────────────────────────────────
    // CREATE/INGEST STATE (merged from create/page.tsx)
    // ──────────────────────────────────────────────────
    const { queue, addFiles, addLocalPaths, updateFileStatus, clearQueue, isProcessing } = useIngestStore();
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

    const processedIds = useRef<Set<string>>(new Set());
    const [trickleProgress, setTrickleProgress] = useState<Record<string, number>>({});
    const [filePhraseIndex, setFilePhraseIndex] = useState<Record<string, number>>({});
    const [customStatusMsg, setCustomStatusMsg] = useState<Record<string, string>>({});

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

    const searchParams = useSearchParams();

    // Check for Day 1 starter kit parameter from Library / Empty states
    useEffect(() => {
        const starter = searchParams?.get("starter");
        if (starter === "bio") {
            loadDemo("mitosis");
        } else if (starter === "contract") {
            loadDemo("contract");
        }
    }, [searchParams]);

    // Trickle progress animation for file queue
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

    // Document parsing
    useEffect(() => {
        const processNext = async () => {
            // Sequential execution guard:
            // Check if any item in the queue is currently actively parsing (reading or learning)
            const isAnyParsing = queue.some(item => 
                (item.status === 'reading' || item.status === 'learning') && 
                processedIds.current.has(item.id)
            );
            if (isAnyParsing) return;

            const nextItem = queue.find(item => item.status === 'reading' && !processedIds.current.has(item.id));
            if (!nextItem || (!nextItem.file && !nextItem.path)) return;

            processedIds.current.add(nextItem.id);

            if (nextItem.path) {
                try {
                    updateFileStatus(nextItem.id, 'reading', 20);
                    const { invoke } = await import("@tauri-apps/api/core");
                    updateFileStatus(nextItem.id, 'reading', 50);
                    const extractedText = await invoke<string>("extract_document_text", { filePath: nextItem.path });
                    updateFileStatus(nextItem.id, 'success', 100);
                    if (extractedText) {
                        setInputText(prev => {
                            const fileHeader = `\n\n--- DOCUMENT: ${nextItem.name} ---\n`;
                            const nextVal = prev ? `${prev}${fileHeader}${extractedText}` : `${fileHeader}${extractedText}`;
                            return nextVal.substring(0, MAX_CHARS);
                        });
                    }
                } catch (err: any) {
                    console.error("Tauri Local Ingestion Error:", err);
                    updateFileStatus(nextItem.id, 'error', 0, err.message || "Failed to extract text locally");
                }
                return;
            }

            try {
                updateFileStatus(nextItem.id, 'reading', 20);
                const formData = new FormData();
                formData.append("file", nextItem.file!);
                const res = await fetch("/api/parse", { method: "POST", body: formData });
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
                        const pct = Math.round(50 + (curr / total) * 45);
                        setTrickleProgress(prev => ({ ...prev, [nextItem.id]: pct }));
                        setCustomStatusMsg(prev => ({ 
                            ...prev, 
                            [nextItem.id]: isLimited 
                                ? `OCR Limit (first ${limitCount} pgs): parsing page ${curr} of ${total}...` 
                                : `Performing OCR: parsing page ${curr} of ${total}...` 
                        }));
                    });

                    if (isLimited) {
                        setCustomStatusMsg(prev => ({ ...prev, [nextItem.id]: `OCR complete: parsed first ${limitCount} pages.` }));
                    } else {
                        setCustomStatusMsg(prev => ({ ...prev, [nextItem.id]: `OCR complete: parsed all ${totalPages} pages.` }));
                    }

                    finalWeightText = `${result.baseText || ""}\n\n${ocrText}`;
                }

                updateFileStatus(nextItem.id, 'success', 100);
                if (finalWeightText) {
                    setInputText(prev => {
                        const fileHeader = `\n\n--- DOCUMENT: ${nextItem.name} ---\n`;
                        const nextVal = prev ? `${prev}${fileHeader}${finalWeightText}` : `${fileHeader}${finalWeightText}`;
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

    // Load initial title from session
    useEffect(() => {
        const saved = sessionStorage.getItem("lastSprintName") || "";
        if (saved) {
            setMissionTitle(saved);
            setUserEditedTitle(true);
        }
    }, []);

    // Clear queue on mount/unmount
    useEffect(() => {
        clearQueue();
        return () => clearQueue();
    }, [clearQueue]);

    // Auto-suggest title
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

    // Guest modal
    useEffect(() => {
        if (typeof window !== "undefined" && !user.isAuthenticated && !user.isLoading) {
            const isGuest = sessionStorage.getItem("shared_view") === "true";
            if (isGuest) setShowGuestModal(true);
        }
    }, [user.isAuthenticated, user.isLoading]);

    const hasSuccess = queue.some(item => item.status === 'success') || inputText.trim().length > 50;
    const isQueueProcessing = queue.some(item => item.status === 'reading' || item.status === 'learning');
    const showConfigAndActions = inputText.trim().length > 0 || queue.length > 0;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const explicitIds = await Promise.all(files.map(f => computeFileHash(f)));
            addFiles(files, explicitIds);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            const localPaths = files.filter(f => (f as any).path).map(f => ({ name: f.name, path: (f as any).path }));
            if (isDesktop && localPaths.length > 0) {
                const explicitIds = await Promise.all(localPaths.map(p => computeStringHash(p.path + p.name)));
                addLocalPaths(localPaths, explicitIds);
            } else {
                const explicitIds = await Promise.all(files.map(f => computeFileHash(f)));
                addFiles(files, explicitIds);
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
                    const explicitIds = await Promise.all(localFiles.map(f => computeStringHash(f.path + f.name)));
                    addLocalPaths(localFiles, explicitIds);
                }
            } catch (err) {
                console.error("Tauri dialog open error:", err);
            }
        } else {
            fileInputRef.current?.click();
        }
    };

    const handleGenerate = async (cardCount: number = 10, quizCount: number = 15) => {
        if (!inputText.trim()) return;
        const customTitle = missionTitle || "";

        if (user.isAuthenticated) {
            const success = await spendCredits(10);
            if (!success) {
                setSetupError("Insufficient credits for Exam Sprint. Please acquire more credits.");
                return;
            }
        }

        sessionStorage.setItem("examSprintContent", inputText);
        setIsGeneratingPack(true);

        const packId = crypto.randomUUID();
        const cleanTitle = customTitle || (inputText.trim() ? inputText.trim().replace(/^[^a-zA-Z0-9]+/, '').split(/\s+/).slice(0, 6).join(" ").toUpperCase() : `STUDY PACK: ${new Date().toLocaleDateString()}`);
        
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                const offlinePacks = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
                offlinePacks[packId] = {
                    id: packId, title: cleanTitle, source_text: inputText,
                    phases_data: {
                        _config: { cardCount, quizCount }
                    }, user_id: "guest", savedAt: Date.now()
                };
                localStorage.setItem("offline_study_packs", JSON.stringify(offlinePacks));
                router.push(`/library/pack/${packId}?sprint=true`);
                return;
            }

            const { error: dbError } = await supabase.from("study_packs").insert({
                id: packId, user_id: authUser.id, title: cleanTitle,
                description: "Comprehensive study sprint generated from your notes.",
                source_text: inputText, phases_data: {
                    _config: { cardCount, quizCount }
                },
            });

            if (dbError) throw dbError;
            router.push(`/library/pack/${packId}?sprint=true`);
        } catch (err) {
            console.error("Failed to create pack in DB, falling back to offline storage:", err);
            const offlinePacks = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
            offlinePacks[packId] = {
                id: packId, title: cleanTitle, source_text: inputText,
                phases_data: {
                    _config: { cardCount, quizCount }
                }, user_id: "guest", savedAt: Date.now()
            };
            localStorage.setItem("offline_study_packs", JSON.stringify(offlinePacks));
            router.push(`/library/pack/${packId}?sprint=true`);
        }
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

    // ──────────────────────────────────────────────────
    // ORIGINAL DASHBOARD STATE
    // ──────────────────────────────────────────────────

    // Fetch activity data
    const { data: activityData, isLoading: activityLoading } = useQuery({
        queryKey: ['activity-history', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch("/api/user/activity-history", {
                headers: session?.access_token ? {
                    Authorization: `Bearer ${session.access_token}`
                } : undefined
            });
            if (!res.ok) throw new Error("Network response was not ok");
            return res.json();
        },
    });

    // Milestone & Celebration Logic (Side Effect)
    useEffect(() => {
        if (typeof window === 'undefined' || !activityData) return;

        const milestones = [7, 14, 30, 60, 100];
        const currentStreak = activityData.streak || 0;
        
        if (milestones.includes(currentStreak)) {
            const key = `milestone_celebrated_${currentStreak}`;
            const alreadyCelebrated = localStorage.getItem(key);
            
            if (!alreadyCelebrated) {
                setMilestoneToCelebrate(currentStreak);
                localStorage.setItem(key, "true");
                
                // Award Credits/XP through the dedicated activity API
                const awardMilestone = async () => {
                    const supabase = createClient();
                    const { data: { session } } = await supabase.auth.getSession();
                    return fetch("/api/user/activity", {
                        method: "POST",
                        headers: { 
                            "Content-Type": "application/json",
                            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
                        },
                        body: JSON.stringify({
                            type: "daily_challenge",
                            customXp: currentStreak === 7 ? 25 : currentStreak === 14 ? 50 : currentStreak === 30 ? 100 : currentStreak === 60 ? 200 : 500
                        })
                    });
                };

                awardMilestone().then(() => {
                    refreshUser();
                    addToast(`Check your rewards! +${currentStreak} day Milestone reached.`, "success", undefined, undefined, true);
                }).catch(err => console.error("Failed to award milestone XP:", err));
            }
        }
    }, [activityData?.streak, refreshUser, addToast]);

    // Fetch due cards
    const { data: dueData } = useQuery({
        queryKey: ['due-cards', user?.id],
        queryFn: async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch("/api/user/due-cards", {
                headers: session?.access_token ? {
                    Authorization: `Bearer ${session.access_token}`
                } : undefined
            });
            if (!res.ok) throw new Error("Network response was not ok");
            return res.json();
        },
        enabled: !!user?.id,
    });
    const dueCount = dueData?.totalDue || 0;

    // Fetch study plan
    const { data: studyPlanData, isLoading: planLoading } = useQuery({
        queryKey: ['study-plan', user?.id],
        queryFn: async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch("/api/ai/study-plan", { 
                method: "POST",
                headers: session?.access_token ? {
                    Authorization: `Bearer ${session.access_token}`
                } : undefined
            });
            if (!res.ok) throw new Error("Network response was not ok");
            const data = await res.json();
            return (data.plan || "") as string;
        },
        enabled: !!user?.id,
    });
    
    const studyPlan = studyPlanData || null;

    const canRecover = !!(user?.streak === 0 && user?.lastStreak > 0 && user?.streakResetAt && (Date.now() - new Date(user.streakResetAt).getTime()) < 24 * 60 * 60 * 1000);

    const handleRecover = async () => {
        setIsProcessingAction(true);
        const success = await recoverStreak();
        if (success) {
            addToast("Streak restored! Welcome back.", "success", "restore");
        } else {
            addToast("Recovery failed or window expired.", "error");
        }
        setIsProcessingAction(false);
    };

    const handleShareMilestone = () => {
        setShareData({
            title: `${user.streak} Day Milestone`,
            count: user.streak,
            type: "Milestone",
            user: user.name || "Scholar",
            date: new Date().toLocaleDateString()
        });
    };

    const greeting = getGreeting(user.id || undefined);
    
    if (user.isLoading) {
        return <DashboardSkeleton />;
    }

    const firstName = user.firstName || (user.name !== "Scholar" ? user.name?.split(" ")[0] : null) || user.username || user.email?.split("@")[0] || "Scholar";

    // Common props passed to each platform orchestrator
    const dashboardProps = {
        user,
        activityData,
        dueCount,
        dueData,
        studyPlan,
        planLoading,
        greeting,
        firstName,
        handleRecover,
        canRecover,
        isProcessingAction,
        handleShare: handleShareMilestone,
        // Create-related props
        inputText,
        setInputText,
        activeTab,
        setActiveTab,
        missionTitle,
        setMissionTitle,
        userEditedTitle,
        setUserEditedTitle,
        queue,
        isQueueProcessing,
        hasSuccess,
        showConfigAndActions,
        setupError,
        setSetupError,
        handleGenerate,
        handleFileSelect,
        handleDrop,
        handleUploadClick,
        resetSelection,
        loadDemo,
        isGeneratingPack,
        setIsGeneratingPack,
        trickleProgress,
        filePhraseIndex,
        customStatusMsg,
        fileInputRef,
    };

    return (
        <div className="relative w-full text-[var(--text)] pt-[96px] md:pt-[104px]">
            {/* Hidden file input for web, fully controlled by fileInputRef */}
            <input 
                ref={fileInputRef}
                type="file" 
                multiple 
                className="hidden" 
                onChange={handleFileSelect} 
                accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.pptx,.jpg,.jpeg,.png,.webp" 
            />

            <div className="relative z-10">
                <SEOHead type="WebApplication" data={getWebApplicationSchema()} />
                <SEOHead type="BreadcrumbList" data={getBreadcrumbSchema([{ name: "Home", url: "/" }, { name: "Dashboard", url: "/dashboard" }])} />

                {/* Robust Platform Selection through PlatformShell */}
                <PlatformShell
                    web={<DashboardWeb {...dashboardProps} />}
                    desktop={<DashboardDesktop {...dashboardProps} />}
                    mobile={<DashboardMobile {...dashboardProps} />}
                    loading={<DashboardSkeleton />}
                />
            </div>

            <StreakMilestone 
                count={milestoneToCelebrate || 0}
                isVisible={!!milestoneToCelebrate}
                onClose={() => setMilestoneToCelebrate(null)}
            />

            {shareData && (
                <ShareCard 
                    isOpen={!!shareData}
                    onClose={() => setShareData(null)}
                    data={shareData}
                />
            )}

            <GuestSignupModal
                isOpen={showGuestModal}
                onClose={() => setShowGuestModal(false)}
            />

            <LateNightGuard />
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
        </Suspense>
    );
}
