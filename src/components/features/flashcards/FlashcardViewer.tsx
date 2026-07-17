"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import ShareCard from "@/components/ShareCard";
import { useToasts } from "@/components/ui/GlobalToasts";
import SessionComplete from "@/components/features/SessionComplete";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { 
    Share2, 
    ChevronLeft, 
    Baby, 
    Check, 
    X, 
    HelpCircle, 
    Download, 
    Volume2, 
    Lightbulb, 
    RefreshCw, 
    Shuffle, 
    Type, 
    Eye,
    MessageSquare,
    Sparkles
} from "lucide-react";
import { downloadFlashcardsOffline } from "@/lib/offline-download";
import { createClient } from "@/lib/supabase/client";
import { sm2, type SM2Card, formatInterval } from "@/lib/spaced-repetition";
import ProgressNodeTrack from "@/components/ui/ProgressNodeTrack";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import SpriteAnimator from "@/components/ui/SpriteAnimator";

interface Flashcard {
    id?: string;
    front: string;
    back: string;
    topic?: string;
}

interface FlashcardViewerProps {
    flashcards: Flashcard[];
    title: string;
    generationId?: string | null;
}

type CardState = 'IDLE' | 'FLIPPED' | 'EVALUATED';

const cardVariants = {
    enter: {
        y: 40,
        scale: 0.95,
        opacity: 0,
    },
    center: {
        y: 0,
        scale: 1,
        opacity: 1,
    },
    exit: (direction: 'left' | 'right' | null) => ({
        x: direction === 'left' ? -350 : direction === 'right' ? 350 : 0,
        y: direction === null ? -40 : 0,
        rotate: direction === 'left' ? -12 : direction === 'right' ? 12 : 0,
        opacity: 0,
        scale: 0.9,
    }),
};

const playVictoryChime = () => {
    try {
        const AudioContextClass = typeof window !== "undefined" && (window.AudioContext || (window as any).webkitAudioContext);
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;
        
        // Ascending chime: C5 (523.25 Hz) -> E5 (659.25 Hz) -> G5 (783.99 Hz)
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);
            
            gain.gain.setValueAtTime(0.12, now + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.4);
        });
    } catch (e) {
        console.warn("Audio Context synthesis blocked or failed", e);
    }
};

export default function FlashcardViewer({ flashcards, title, generationId }: FlashcardViewerProps) {
    const router = useRouter();
    const { user, refreshUser } = useUser();
    const { addToast } = useToasts();

    const dragX = useMotionValue(0);
    const rotate = useTransform(dragX, [-200, 200], [-15, 15]);
    
    // Core states
    const [cardQueue, setCardQueue] = useState<number[]>([]);
    const [queuePointer, setQueuePointer] = useState(0);
    const [cardState, setCardState] = useState<CardState>('IDLE');
    const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
    const [masteredSet, setMasteredSet] = useState<Set<number>>(new Set());

    // Learning custom features
    const [srsMap, setSrsMap] = useState<Record<string, any>>({});
    const [userGuess, setUserGuess] = useState("");
    const [isVerifyTextMode, setIsVerifyTextMode] = useState(false);
    const [isReverseMode, setIsReverseMode] = useState(false);
    const [isDyslexiaMode, setIsDyslexiaMode] = useState(false);
    const [isPlayingTTS, setIsPlayingTTS] = useState(false);
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [hasRecordedActivity, setHasRecordedActivity] = useState(false);
    const [eli5Text, setEli5Text] = useState<Record<string, string>>({});
    const [isGeneratingEli5, setIsGeneratingEli5] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [sessionStats, setSessionStats] = useState({ xp: 0, streak: 0, incremented: false });
    const [xpPopup, setXpPopup] = useState<{ id: number; text: string } | null>(null);

    const [isHoveredEli5, setIsHoveredEli5] = useState(false);
    const [sparks, setSparks] = useState<{ id: number; x: number; y: number; color: string; size: number; vx: number; vy: number }[]>([]);

    useEffect(() => {
        if (sparks.length === 0) return;
        const frame = requestAnimationFrame(() => {
            setSparks(prev => prev
                .map(s => ({
                    ...s,
                    x: s.x + s.vx,
                    y: s.y + s.vy,
                    vy: s.vy + 0.15,
                    size: Math.max(0, s.size - 0.15),
                }))
                .filter(s => s.size > 0)
            );
        });
        return () => cancelAnimationFrame(frame);
    }, [sparks]);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Map unique identifiers and original indices to cards
    const originalCards = flashcards.map((card, index) => ({
        ...card,
        originalIndex: index,
        stableId: card.id || `${generationId || 'temp'}_${index}`
    }));

    // Initialize card queue
    useEffect(() => {
        if (flashcards.length > 0) {
            setCardQueue(Array.from({ length: flashcards.length }, (_, i) => i));
        }
    }, [flashcards]);

    // Track active card review elapsed time
    useEffect(() => {
        if (cardState !== 'EVALUATED' && !sessionComplete && cardQueue.length > 0) {
            setSecondsElapsed(0);
            const interval = setInterval(() => {
                setSecondsElapsed(prev => prev + 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [queuePointer, cardState, sessionComplete, cardQueue]);

    // Fetch and synchronize SRS queue on mount
    useEffect(() => {
        const loadSRS = async () => {
            if (!generationId) return;
            if (user) {
                try {
                    const supabase = createClient();
                    const { data, error } = await supabase
                        .from('srs_queue')
                        .select('*')
                        .eq('pack_id', generationId)
                        .eq('item_type', 'card');
                    if (data) {
                        const map: Record<string, any> = {};
                        data.forEach((item: any) => {
                            map[item.item_id] = item;
                        });
                        setSrsMap(map);
                    }
                } catch (e) {
                    console.warn("Failed to load SRS items from database", e);
                }
            } else {
                try {
                    const localData = localStorage.getItem(`srs_local_${generationId}`);
                    if (localData) {
                        setSrsMap(JSON.parse(localData));
                    }
                } catch (e) {
                    console.warn("Failed to load SRS items from local storage", e);
                }
            }
        };
        loadSRS();
    }, [generationId, user]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isGeneratingEli5 || sessionComplete || cardQueue.length === 0) return;
            
            // Bypass input fields unless focused in card text verify mode
            const activeTag = document.activeElement?.tagName.toLowerCase();
            if (activeTag === 'input' || activeTag === 'textarea') {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (cardState === 'IDLE') {
                        setCardState('FLIPPED');
                    }
                }
                return;
            }

            switch (e.key.toLowerCase()) {
                case ' ':
                case 'enter':
                    e.preventDefault();
                    if (cardState === 'IDLE') {
                        setCardState('FLIPPED');
                        setIsTheaterMode(true);
                    } else if (cardState === 'FLIPPED') {
                        setCardState('IDLE');
                    }
                    break;
                case '1':
                case 'j':
                    e.preventDefault();
                    if (cardState === 'FLIPPED') {
                        handleRate(1); // Again
                    }
                    break;
                case '2':
                case 'k':
                    e.preventDefault();
                    if (cardState === 'FLIPPED') {
                        handleRate(4); // Hard (maps to quality 4 internally)
                    }
                    break;
                case 'escape':
                    e.preventDefault();
                    setIsTheaterMode(false);
                    router.push('/library');
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cardState, queuePointer, cardQueue, isGeneratingEli5, sessionComplete, userGuess]);

    const handleFlip = () => {
        if (cardState === 'IDLE') setCardState('FLIPPED');
        else if (cardState === 'FLIPPED') setCardState('IDLE');
    };

    const submitSRSReview = async (stableId: string, quality: number) => {
        const current = srsMap[stableId] || {
            item_id: stableId,
            ease_factor: 2.5,
            interval_days: 0,
            repetitions: 0,
            status: 'new'
        };

        const cardStateObj: SM2Card = {
            id: current.item_id,
            easeFactor: Number(current.ease_factor || current.easeFactor || 2.5),
            interval: Number(current.interval_days || current.interval || 0),
            repetitions: Number(current.repetitions || 0),
            nextReview: current.next_review_at || current.nextReview || new Date().toISOString(),
            lastReview: current.last_review_at || current.lastReview || new Date().toISOString(),
            status: (current.status || 'new') as SM2Card['status']
        };

        const result = sm2(cardStateObj, quality);

        const updatedItem = {
            item_id: stableId,
            item_type: 'card',
            pack_id: generationId || null,
            ease_factor: result.easeFactor,
            interval_days: result.interval,
            repetitions: result.repetitions,
            next_review_at: result.nextReview,
            last_review_at: new Date().toISOString(),
            status: result.status
        };

        // Update local state map
        setSrsMap(prev => ({
            ...prev,
            [stableId]: updatedItem
        }));

        if (user && generationId) {
            try {
                const supabase = createClient();
                await supabase
                    .from('srs_queue')
                    .upsert({
                        user_id: user.id,
                        ...updatedItem
                    }, { onConflict: 'user_id,item_id,item_type' });
            } catch (e) {
                console.warn("Failed to save SRS item to database", e);
            }
        } else if (generationId) {
            try {
                const localData = localStorage.getItem(`srs_local_${generationId}`);
                const localMap = localData ? JSON.parse(localData) : {};
                localMap[stableId] = updatedItem;
                localStorage.setItem(`srs_local_${generationId}`, JSON.stringify(localMap));
            } catch (e) {
                console.warn("Failed to save SRS item to local storage", e);
            }
        }
    };

    const getCardIntervalPreviews = (stableId: string) => {
        const current = srsMap[stableId] || {
            item_id: stableId,
            ease_factor: 2.5,
            interval_days: 0,
            repetitions: 0,
            status: 'new'
        };

        const cardStateObj: SM2Card = {
            id: current.item_id,
            easeFactor: Number(current.ease_factor || current.easeFactor || 2.5),
            interval: Number(current.interval_days || current.interval || 0),
            repetitions: Number(current.repetitions || 0),
            nextReview: current.next_review_at || current.nextReview || new Date().toISOString(),
            lastReview: current.last_review_at || current.lastReview || new Date().toISOString(),
            status: (current.status || 'new') as SM2Card['status']
        };

        return {
            again: formatInterval(sm2(cardStateObj, 1).interval),
            hard: formatInterval(sm2(cardStateObj, 2).interval),
            good: formatInterval(sm2(cardStateObj, 4).interval),
            easy: formatInterval(sm2(cardStateObj, 5).interval)
        };
    };

    const handleRate = async (quality: number) => {
        if (cardState === 'EVALUATED') return;
        const currentCardIndex = cardQueue[queuePointer];
        const activeCard = originalCards[currentCardIndex];
        
        const isCorrect = quality >= 3;
        setExitDirection(isCorrect ? 'right' : 'left');
        setCardState('EVALUATED');

        // Trigger particle explosion sparks
        const burstColor = isCorrect ? 'rgba(52, 211, 153, 0.9)' : 'rgba(248, 113, 113, 0.9)'; // emerald / crimson
        const startX = typeof window !== 'undefined' ? window.innerWidth / 2 : 500;
        const startY = typeof window !== 'undefined' ? window.innerHeight / 2 : 400;
        const newSparks = Array.from({ length: 24 }).map((_, i) => {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 8;
            return {
                id: Date.now() + i + Math.random(),
                x: startX,
                y: startY,
                color: burstColor,
                size: 4 + Math.random() * 6,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2, // offset upwards
            };
        });
        setSparks(newSparks);

        // Stop any active TTS audio
        if (isPlayingTTS) {
            if (audioRef.current) audioRef.current.pause();
            window.speechSynthesis.cancel();
            setIsPlayingTTS(false);
        }

        // Save review progress
        await submitSRSReview(activeCard.stableId, quality);

        if (isCorrect) {
            setMasteredSet(prev => {
                const next = new Set(prev);
                next.add(currentCardIndex);
                return next;
            });
            setXpPopup({ id: Date.now(), text: "+10 XP" });
            setTimeout(() => setXpPopup(null), 1500);
            playVictoryChime();
            const previews = getCardIntervalPreviews(activeCard.stableId);
            const label = quality === 5 ? previews.easy : previews.good;
            addToast(`Got it! Next review in ${label} 🎯`, "success", undefined, undefined, true);
        } else {
            setCardQueue(prev => [...prev, currentCardIndex]);
            addToast("Re-queued for active recall review. 🔄", "info", undefined, undefined, true);
        }

        // Reset user guess inputs
        setUserGuess("");

        // Transition delay
        setTimeout(async () => {
            if (queuePointer >= cardQueue.length - 1) {
                if (!hasRecordedActivity) {
                    setHasRecordedActivity(true);
                    try {
                        const actRes = await fetch("/api/user/activity", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ type: "flashcards" })
                        });
                        if (actRes.ok) {
                            const { stats } = await actRes.json();
                            setSessionStats({
                                xp: stats?.xpGained || 5,
                                streak: stats?.newStreak || user?.streak || 0,
                                incremented: stats?.streakIncremented || false,
                            });
                            refreshUser();
                        }
                    } catch (err) {
                        console.error(err);
                    }
                }
                setSessionComplete(true);
            } else {
                setQueuePointer(prev => prev + 1);
                setCardState('IDLE');
                setExitDirection(null);
            }
        }, 220);
    };

    const handlePlayTTS = async (text: string) => {
        if (isPlayingTTS) {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            window.speechSynthesis.cancel();
            setIsPlayingTTS(false);
            return;
        }

        setIsPlayingTTS(true);
        try {
            const res = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text })
            });

            if (!res.ok) throw new Error("AWS TTS proxy failed");

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            
            if (audioRef.current) {
                audioRef.current.src = url;
            } else {
                audioRef.current = new Audio(url);
            }
            
            audioRef.current.onended = () => {
                setIsPlayingTTS(false);
            };
            audioRef.current.play();
        } catch (err) {
            console.warn("TTS API failed, falling back to window.speechSynthesis", err);
            try {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.onend = () => setIsPlayingTTS(false);
                utterance.onerror = () => setIsPlayingTTS(false);
                window.speechSynthesis.speak(utterance);
            } catch (speechErr) {
                setIsPlayingTTS(false);
                addToast("Audio speech is not supported in this browser.", "error");
            }
        }
    };

    const handleEli5 = async (e: React.MouseEvent, text: string, idx: number) => {
        e.stopPropagation();
        if (!user) {
            addToast("Please sign up or log in to generate 'Ask the Professor' AI explanations! 💡", "info");
            return;
        }
        if (isGeneratingEli5 || eli5Text[idx]) return;
        setIsGeneratingEli5(true);
        try {
            const res = await fetch("/api/generate/eli5", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text })
            });
            const reader = res.body?.getReader();
            if (!reader) return;
            const decoder = new TextDecoder();
            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                setEli5Text(prev => ({ ...prev, [idx]: buffer }));
            }
        } catch (err) {
            addToast("Failed to simplify this card.", "error");
        } finally {
            setIsGeneratingEli5(false);
        }
    };

    const shuffleDeck = () => {
        setCardQueue(prev => {
            const list = [...prev];
            // Fisher-Yates shuffle remaining cards from queuePointer onwards
            for (let i = list.length - 1; i > queuePointer; i--) {
                const j = queuePointer + Math.floor(Math.random() * (i - queuePointer + 1));
                [list[i], list[j]] = [list[j], list[i]];
            }
            addToast("Deck shuffled! 🔀", "info");
            return list;
        });
    };

    // Framer Motion values for performance and interruptible spring animation
    const parallaxX = useMotionValue(0);
    const parallaxY = useMotionValue(0);
    const cardRotateY = useMotionValue(0);

    useEffect(() => {
        // Animate the 3D flip via hardware-accelerated spring
        animate(cardRotateY, cardState === 'IDLE' ? 0 : 180, {
            type: "spring",
            stiffness: 180,
            damping: 24
        });
    }, [cardState, cardRotateY]);

    // Combine Y base rotation and interactive Y parallax
    const finalRotateY = useTransform([cardRotateY, parallaxY], ([baseY, pY]) => {
        // When card is flipped, invert parallax Y to match visual direction
        const multiplier = cardState === 'IDLE' ? 1 : -1;
        return (baseY as number) + multiplier * (pY as number);
    });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;
        
        parallaxY.set((mouseX / (rect.width / 2)) * 12);
        parallaxX.set(-(mouseY / (rect.height / 2)) * 12);
    };

    const handleMouseLeave = () => {
        animate(parallaxX, 0, { duration: 0.15 });
        animate(parallaxY, 0, { duration: 0.15 });
    };

    if (flashcards.length === 0 || cardQueue.length === 0) return null;

    const currentCardIndex = cardQueue[queuePointer];
    const currentCard = originalCards[currentCardIndex];
    const progressPercent = Math.round((masteredSet.size / flashcards.length) * 100);
    
    // Dynamic text toggles for front/back swap (Reverse Study Mode)
    const cardFrontText = isReverseMode ? currentCard.back : currentCard.front;
    const cardBackText = isReverseMode ? currentCard.front : currentCard.back;

    // Load active card details
    const activeSRS = srsMap[currentCard.stableId];
    const srsStatus = activeSRS?.status || "new";

    // Interval previews for buttons
    const reviewIntervals = getCardIntervalPreviews(currentCard.stableId);

    // 3D Card styles
    const cardInnerStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        transformStyle: "preserve-3d",
    };

    const cardFaceStyle: React.CSSProperties = {
        position: "absolute",
        width: "100%",
        height: "100%",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        borderRadius: "28px",
        border: "1.5px solid var(--border-2)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: cardState === 'EVALUATED' ? "none" : "0 25px 60px -15px rgba(0, 0, 0, 0.1)",
    };

    const cardFrontStyle: React.CSSProperties = {
        ...cardFaceStyle,
        background: "linear-gradient(180deg, var(--bg-2) 0%, var(--bg-3) 100%)",
        backdropFilter: "blur(20px)",
    };

    const cardBackStyle: React.CSSProperties = {
        ...cardFaceStyle,
        background: "linear-gradient(180deg, var(--bg-2) 0%, var(--bg-3) 100%)",
        backdropFilter: "blur(25px)",
        transform: "rotateY(180deg)",
    };

    return (
        <div className={`min-h-screen w-full transition-colors duration-700 ${isTheaterMode ? 'bg-[#030305]' : 'bg-transparent'} flex flex-col items-center select-none pb-12`}>
            {/* Header Toolbar */}
            <header className={`w-full max-w-5xl p-6 flex items-center justify-between z-20 transition-opacity duration-500 ${isTheaterMode ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/library')} className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--amber)] mb-0.5">Spaced Repetition Lab</p>
                        <h1 className="text-sm font-bold text-[var(--foreground)] truncate max-w-[200px] md:max-w-xs">{title}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => downloadFlashcardsOffline(title, flashcards)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 cursor-pointer" title="Download for Offline Use">
                        <Download size={16} />
                        <span className="text-[11px] font-bold hidden sm:inline">Offline</span>
                    </button>
                    <button onClick={() => setIsShareOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 cursor-pointer">
                        <Share2 size={16} />
                        <span className="text-[11px] font-bold hidden sm:inline">Share</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 w-full max-w-2xl px-6 flex flex-col items-center justify-center relative z-10 gap-6 mt-2">
                
                {/* Visual Progress Node Track */}
                <div className="w-full space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider px-1">
                        <span>Deck Progression</span>
                        <span>{masteredSet.size} / {flashcards.length} correct</span>
                    </div>

                    <ProgressNodeTrack
                        total={flashcards.length}
                        current={currentCard.originalIndex}
                        completed={Array.from(masteredSet).map(idx => originalCards[idx]?.originalIndex || 0)}
                        className="w-full"
                    />

                    <div className="flex items-center justify-between text-[10px] text-[var(--foreground-muted)]/50 font-mono px-1">
                        <span>Card {queuePointer + 1} of {cardQueue.length} in round</span>
                        <span className="flex items-center gap-2">
                            {secondsElapsed}s elapsed
                            {srsStatus !== 'new' && (
                                <span className="px-1.5 py-0.5 rounded bg-[var(--violet)]/10 text-[var(--violet)] text-[8px] font-bold uppercase tracking-wider border border-[var(--violet)]/20">
                                    {srsStatus}
                                </span>
                            )}
                        </span>
                    </div>
                </div>

                {/* Sub-toolbar widgets */}
                <div className="w-full flex items-center justify-end gap-2.5">
                    <button 
                        onClick={shuffleDeck}
                        className="p-2 rounded-xl bg-white/5 border border-white/5 text-[var(--foreground-muted)] hover:text-white transition-all" 
                        title="Shuffle Deck"
                    >
                        <Shuffle size={15} />
                    </button>
                    <button 
                        onClick={() => setIsReverseMode(!isReverseMode)}
                        className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                            isReverseMode 
                                ? 'bg-[var(--amber)]/10 border-[var(--amber)]/30 text-[var(--amber)]' 
                                : 'bg-white/5 border-white/5 text-[var(--foreground-muted)] hover:text-white'
                        }`}
                        title="Swap Term & Definition"
                    >
                        <RefreshCw size={15} />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider hidden sm:inline">Reverse Mode</span>
                    </button>
                    <button 
                        onClick={() => setIsVerifyTextMode(!isVerifyTextMode)}
                        className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                            isVerifyTextMode 
                                ? 'bg-[var(--violet)]/10 border-[var(--violet)]/30 text-[var(--violet)]' 
                                : 'bg-white/5 border-white/5 text-[var(--foreground-muted)] hover:text-white'
                        }`}
                        title="Type Guess Mode"
                    >
                        <MessageSquare size={15} />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider hidden sm:inline">Type Input</span>
                    </button>
                    <button 
                        onClick={() => setIsDyslexiaMode(!isDyslexiaMode)}
                        className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                            isDyslexiaMode 
                                ? 'bg-[var(--emerald)]/10 border-[var(--emerald)]/30 text-[var(--emerald)]' 
                                : 'bg-white/5 border-white/5 text-[var(--foreground-muted)] hover:text-white'
                        }`}
                        title="Dyslexia Friendly Font"
                    >
                        <Type size={15} />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider hidden sm:inline">Dyslexia font</span>
                    </button>
                </div>

                {/* Card Stack Depth Frame */}
                <div className="relative w-full aspect-[16/11] max-h-[360px] md:max-h-[420px]" style={{ perspective: "1000px" }}>
                    {/* Floating +10 XP Animation */}
                    <AnimatePresence>
                        {xpPopup && (
                            <motion.div
                                key={xpPopup.id}
                                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                animate={{ opacity: 1, y: -45, scale: 1.1 }}
                                exit={{ opacity: 0, y: -70, scale: 0.8 }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                className="absolute z-50 pointer-events-none left-1/2 -translate-x-1/2 top-6 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--amber)] text-[var(--background)] font-black font-mono text-xs shadow-[0_0_25px_rgba(245,158,11,0.6)] border border-[var(--amber)]"
                            >
                                <Sparkles size={14} className="fill-current animate-spin" />
                                <span>{xpPopup.text}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    {/* Background Stack Card 2 */}
                    {cardQueue.length - queuePointer > 2 && (
                        <div 
                            className="absolute inset-0 rounded-[28px] border border-[var(--border)] bg-[var(--card)]/40 pointer-events-none transition-all duration-300"
                            style={{
                                transform: "translateY(20px) scale(0.93)",
                                zIndex: -2,
                                opacity: 0.2,
                            }}
                        />
                    )}

                    {/* Background Stack Card 1 */}
                    {cardQueue.length - queuePointer > 1 && (
                        <div 
                            className="absolute inset-0 rounded-[28px] border border-[var(--border)] bg-[var(--card)]/60 pointer-events-none transition-all duration-300"
                            style={{
                                transform: "translateY(10px) scale(0.97)",
                                zIndex: -1,
                                opacity: 0.45,
                            }}
                        />
                    )}

                    <AnimatePresence mode="wait" custom={exitDirection} initial={false}>
                        <motion.div
                            key={queuePointer}
                            custom={exitDirection}
                            variants={cardVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 350, damping: 26 },
                                y: { type: "spring", stiffness: 350, damping: 26 },
                                opacity: { duration: 0.18 },
                            }}
                            className="w-full h-full relative cursor-pointer"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.8}
                            style={{ x: dragX, rotate }}
                            onDragEnd={(event, info) => {
                                const threshold = 120;
                                const velocityThreshold = 500; // pixels per second
                                if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
                                    handleRate(4); // Good
                                } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
                                    handleRate(1); // Again
                                }
                            }}
                            onTap={handleFlip}
                        >
                            <motion.div style={{ ...cardInnerStyle, rotateX: parallaxX, rotateY: finalRotateY }}>
                                
                                {/* Front Panel */}
                                <div style={cardFrontStyle}>
                                    {/* Shimmer reflection streak */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[28px]" />
                                    
                                    {/* Structured Flexbox Header Bar */}
                                    <div className="w-full flex items-center justify-between px-6 pt-6 pb-2 relative z-10 shrink-0">
                                        <div className="flex items-center gap-2.5">
                                            <div className="relative flex items-center justify-center">
                                                <svg className="w-8 h-8 transform -rotate-90">
                                                    <circle cx="16" cy="16" r="13" stroke="var(--border)" strokeWidth="2" fill="transparent" />
                                                    <circle 
                                                        cx="16" 
                                                        cy="16" 
                                                        r="13" 
                                                        stroke="var(--amber)" 
                                                        strokeWidth="2" 
                                                        fill="transparent" 
                                                        strokeDasharray={2 * Math.PI * 13}
                                                        strokeDashoffset={(2 * Math.PI * 13) * (1 - Math.min(secondsElapsed, 30) / 30)}
                                                        className="transition-all duration-1000"
                                                    />
                                                </svg>
                                                <span className="absolute text-[9px] font-mono font-bold text-[var(--foreground-muted)]">{secondsElapsed}</span>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Active Recall</span>
                                        </div>

                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlayTTS(cardFrontText);
                                            }}
                                            className={`p-2 rounded-xl transition-all border ${
                                                isPlayingTTS 
                                                    ? 'bg-[var(--amber)]/10 border-[var(--amber)]/30 text-[var(--amber)]' 
                                                    : 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                            }`}
                                            title="Read Aloud"
                                        >
                                            <Volume2 size={14} />
                                        </button>
                                    </div>

                                    <p className={`text-xl md:text-2xl font-bold text-center leading-tight tracking-tight text-[var(--text)] px-4 mt-6 ${
                                        isDyslexiaMode ? 'font-sans tracking-wide leading-loose text-2xl' : 'font-serif'
                                    }`}>
                                        {cardFrontText}
                                    </p>

                                    {/* Text guess verification input */}
                                    {isVerifyTextMode && (
                                        <div className="w-full max-w-xs mt-6 px-2 relative z-20" onClick={e => e.stopPropagation()}>
                                            <input 
                                                type="text"
                                                value={userGuess}
                                                onChange={e => setUserGuess(e.target.value)}
                                                placeholder="Type your recall guess..."
                                                className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border-2)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--amber)]/40 transition-colors"
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleFlip();
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div className="absolute bottom-6 flex flex-col items-center gap-1">
                                        <span className="text-[8px] font-bold uppercase tracking-[0.25em] opacity-40 flex items-center gap-1">
                                            Tap card or press Space to reveal answer
                                        </span>
                                    </div>
                                </div>

                                {/* Back Panel */}
                                <div style={cardBackStyle}>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[28px]" />

                                    <div className="flex flex-col items-center justify-between w-full h-full py-4 relative z-10">
                                        
                                        {/* Header Row */}
                                        <div className="w-full flex items-center justify-between px-2 shrink-0">
                                            <span className="text-[9px] font-black uppercase tracking-wider text-[var(--foreground-muted)]/70">
                                                Concept Definition
                                            </span>
                                            
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePlayTTS(eli5Text[currentCardIndex] || cardBackText);
                                                }}
                                                className={`p-2 rounded-xl transition-all border ${
                                                    isPlayingTTS 
                                                        ? 'bg-[var(--amber)]/10 border-[var(--amber)]/30 text-[var(--amber)]' 
                                                        : 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                                }`}
                                            >
                                                <Volume2 size={14} />
                                            </button>
                                        </div>

                                        {/* Back Text / Eli5 text */}
                                        <div className="flex-1 flex flex-col items-center justify-center px-4 overflow-y-auto my-4 w-full scrollbar-none">
                                            
                                            {/* Show side-by-side guess text */}
                                            {isVerifyTextMode && userGuess && (
                                                <div className="w-full p-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border-2)] text-left mb-3 shrink-0">
                                                    <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]/50 block mb-0.5">Your Guess</span>
                                                    <span className="text-xs font-mono text-[var(--foreground-secondary)] line-clamp-2">{userGuess}</span>
                                                </div>
                                            )}

                                            <p className={`text-base md:text-lg font-medium text-center text-[var(--foreground)] leading-relaxed ${
                                                isDyslexiaMode ? 'font-sans tracking-wide leading-loose text-lg' : 'font-serif'
                                            }`}>
                                                {eli5Text[currentCardIndex] || cardBackText}
                                            </p>
                                        </div>

                                        {/* Metaphor Simplify action */}
                                        <div className="flex flex-col items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                                            {!eli5Text[currentCardIndex] && (
                                                <button 
                                                    onClick={(e) => handleEli5(e, cardBackText, currentCardIndex)} 
                                                    onMouseEnter={() => setIsHoveredEli5(true)}
                                                    onMouseLeave={() => setIsHoveredEli5(false)}
                                                    disabled={isGeneratingEli5}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--amber)]/10 text-[var(--amber)] border border-[var(--amber)]/20 text-[9px] font-black uppercase tracking-wider hover:bg-[var(--amber)]/25 transition-all cursor-pointer disabled:opacity-50"
                                                >
                                                    <SpriteAnimator
                                                        sheetUrl="/lightbulb_spritesheet.jpg"
                                                        frameWidth={275}
                                                        frameHeight={768}
                                                        totalFrames={5}
                                                        durationMs={600}
                                                        loop={isGeneratingEli5}
                                                        isPlaying={isGeneratingEli5 || isHoveredEli5}
                                                        renderWidth={12}
                                                        renderHeight={14}
                                                        mixBlendMode="screen"
                                                    />
                                                    <span>{isGeneratingEli5 ? "Simplifying..." : "ELI5 Metaphor"}</span>
                                                </button>
                                            )}
                                            
                                            <span className="text-[8px] font-black uppercase tracking-[0.25em] opacity-35">
                                                Press [Space] to view front
                                            </span>
                                        </div>
                                    </div>
                                </div>

                             </motion.div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Spaced Repetition Grading controls */}
                <div className="w-full max-w-md flex flex-col gap-6 mt-4">
                    {cardState === 'FLIPPED' ? (
                        <div className="grid grid-cols-2 gap-3 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            
                            {/* Again Button */}
                            <button 
                                onClick={() => handleRate(1)}
                                className="flex flex-col h-16 rounded-xl border-2 border-[var(--crimson)]/40 bg-[var(--crimson)]/10 text-[var(--crimson)] hover:bg-[var(--crimson)]/20 hover:border-[var(--crimson)] hover:shadow-[0_0_20px_rgba(239,68,68,0.35)] transition-all items-center justify-center p-1 cursor-pointer active:scale-95 shadow-inner"
                            >
                                <X size={14} className="mb-0.5" />
                                <span className="text-[9px] font-black uppercase tracking-wider">Again (1)</span>
                                <span className="text-[8px] font-medium opacity-65 font-mono">{reviewIntervals.again}</span>
                            </button>

                            {/* Hard Button */}
                            <button 
                                onClick={() => handleRate(4)}
                                className="flex flex-col h-16 rounded-xl border-2 border-[var(--amber)]/40 bg-[var(--amber)]/10 text-[var(--amber)] hover:bg-[var(--amber)]/20 hover:border-[var(--amber)] hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all items-center justify-center p-1 cursor-pointer active:scale-95 shadow-inner"
                            >
                                <HelpCircle size={14} className="mb-0.5" />
                                <span className="text-[9px] font-black uppercase tracking-wider">Hard (2)</span>
                                <span className="text-[8px] font-medium opacity-65 font-mono">{reviewIntervals.good}</span>
                            </button>

                        </div>
                    ) : (
                        <button 
                            onClick={handleFlip} 
                            className="w-full h-14 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer"
                        >
                            <Eye size={16} />
                            <span>Reveal Answer</span>
                        </button>
                    )}

                    {/* Keyboard shortcuts row */}
                    <div className="flex items-center justify-center gap-6 text-[9px] text-[var(--foreground-muted)]/50 font-mono">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 py-0.5 rounded border border-white/10 bg-white/5">Space</kbd> Flip
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 py-0.5 rounded border border-white/10 bg-white/5">1-2</kbd> Grade
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 py-0.5 rounded border border-white/10 bg-white/5">Esc</kbd> Exit
                        </span>
                    </div>
                </div>

                {/* Sparks particles overlay */}
                {sparks.map(s => (
                    <div
                        key={s.id}
                        style={{
                            position: 'fixed',
                            left: s.x,
                            top: s.y,
                            width: s.size,
                            height: s.size,
                            backgroundColor: s.color,
                            borderRadius: '50%',
                            pointerEvents: 'none',
                            zIndex: 9999,
                            boxShadow: `0 0 10px ${s.color}`,
                        }}
                    />
                ))}
            </main>

            <SessionComplete
                isVisible={sessionComplete}
                onDismiss={() => router.push("/library")}
                xpEarned={sessionStats.xp}
                streak={sessionStats.streak}
                streakIncremented={sessionStats.incremented}
                type="flashcards"
                title={title}
                extraStat={{ label: "Cards Studied", value: String(masteredSet.size), icon: "style" }}
                continueHref="/library"
            />

            <ShareCard 
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                data={{ title, count: flashcards.length, type: "Flashcards", user: user?.name || "Scholar", items: flashcards }}
            />
        </div>
    );
}
