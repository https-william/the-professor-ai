"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
    Volume2, 
    Lightbulb, 
    Share2, 
    CheckCircle2, 
    Download, 
    Baby, 
    Check, 
    X, 
    HelpCircle, 
    Sparkles, 
    RefreshCw, 
    Shuffle, 
    Type, 
    MessageSquare,
    Eye
} from "lucide-react";
import { useToasts } from "@/components/ui/GlobalToasts";
import { downloadFlashcardsOffline } from "@/lib/offline-download";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import { useTelegram } from "@/hooks";
import { sm2, type SM2Card, formatInterval } from "@/lib/spaced-repetition";
import ProgressNodeTrack from "@/components/ui/ProgressNodeTrack";

interface Flashcard {
    front: string;
    back: string;
    topic?: string;
    id?: string;
}

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

export const InteractiveFlashcards = ({
  cards = [
    {
      front: "Action Potential",
      back: "A rapid electrical pulse that travels along a neuron. 💡 Tip: Think of it like a falling line of dominos—once the first one goes (threshold), the signal is unstoppable.",
      topic: "Topic"
    }
  ],
  title = "Flashcards",
  generationId,
  onFinish,
  onRetry
}: {
  cards?: Flashcard[];
  title?: string;
  generationId?: string;
  onFinish?: (stats: { totalCards: number }) => void;
  onRetry?: () => void;
}) => {
  const { user } = useUser();
  const { addToast } = useToasts();
  const { triggerHaptic } = useTelegram();

  const dragX = useMotionValue(0);
  const rotate = useTransform(dragX, [-200, 200], [-15, 15]);

  // Core queue states
  const [cardQueue, setCardQueue] = useState<number[]>([]);
  const [queuePointer, setQueuePointer] = useState(0);
  const [cardState, setCardState] = useState<'IDLE' | 'FLIPPED' | 'EVALUATED'>('IDLE');
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [masteredSet, setMasteredSet] = useState<Set<number>>(new Set());

  // Learning features
  const [srsMap, setSrsMap] = useState<Record<string, any>>({});
  const [userGuess, setUserGuess] = useState("");
  const [isVerifyTextMode, setIsVerifyTextMode] = useState(false);
  const [isReverseMode, setIsReverseMode] = useState(false);
  const [isDyslexiaMode, setIsDyslexiaMode] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [eli5Text, setEli5Text] = useState<Record<string, string>>({});
  const [isGeneratingEli5, setIsGeneratingEli5] = useState(false);
  const [xpPopup, setXpPopup] = useState<{ id: number; text: string } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Map stable identifiers and original index
  const originalCards = cards.map((card, index) => ({
      ...card,
      originalIndex: index,
      stableId: card.id || `${generationId || 'temp'}_${index}`
  }));

  // Initialize active queue
  useEffect(() => {
    if (cards.length > 0) {
      setCardQueue(Array.from({ length: cards.length }, (_, i) => i));
      setQueuePointer(0);
      setCardState('IDLE');
      setMasteredSet(new Set());
    }
  }, [cards]);

  // Time ticker
  useEffect(() => {
    if (cardState !== 'EVALUATED' && cardQueue.length > 0) {
      setSecondsElapsed(0);
      const interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [queuePointer, cardState, cardQueue]);

  // Load SRS states
  useEffect(() => {
    const loadSRS = async () => {
      if (!generationId) return;
      if (user) {
        try {
          const supabase = createClient();
          const { data } = await supabase
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
          console.warn("Failed to load SRS in study pack", e);
        }
      } else {
        try {
          const localData = localStorage.getItem(`srs_local_${generationId}`);
          if (localData) {
            setSrsMap(JSON.parse(localData));
          }
        } catch (e) {
          console.warn("Failed to load local SRS in study pack", e);
        }
      }
    };
    loadSRS();
  }, [generationId, user]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGeneratingEli5 || cardQueue.length === 0) return;
      
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (cardState === 'IDLE') setCardState('FLIPPED');
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'enter':
          e.preventDefault();
          handleFlip();
          break;
        case '1':
        case 'j':
          e.preventDefault();
          if (cardState === 'FLIPPED') handleRate(1);
          break;
        case '2':
          e.preventDefault();
          if (cardState === 'FLIPPED') handleRate(2);
          break;
        case '3':
        case 'k':
          e.preventDefault();
          if (cardState === 'FLIPPED') handleRate(4);
          break;
        case '4':
          e.preventDefault();
          if (cardState === 'FLIPPED') handleRate(5);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cardState, queuePointer, cardQueue, isGeneratingEli5, userGuess]);

  const handleFlip = () => {
    triggerHaptic('light');
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
        console.warn("Failed to update db srs queue", e);
      }
    } else if (generationId) {
      try {
        const localData = localStorage.getItem(`srs_local_${generationId}`);
        const localMap = localData ? JSON.parse(localData) : {};
        localMap[stableId] = updatedItem;
        localStorage.setItem(`srs_local_${generationId}`, JSON.stringify(localMap));
      } catch (e) {
        console.warn("Failed to update local srs queue", e);
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
      easeFactor: Number(current.ease_factor || 2.5),
      interval: Number(current.interval_days || 0),
      repetitions: Number(current.repetitions || 0),
      nextReview: current.next_review_at || new Date().toISOString(),
      lastReview: current.last_review_at || new Date().toISOString(),
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

    if (isPlayingTTS) {
      if (audioRef.current) audioRef.current.pause();
      window.speechSynthesis.cancel();
      setIsPlayingTTS(false);
    }

    await submitSRSReview(activeCard.stableId, quality);

    if (isCorrect) {
      setXpPopup({ id: Date.now(), text: "+10 XP" });
      setTimeout(() => setXpPopup(null), 1500);
      setMasteredSet(prev => {
        const next = new Set(prev);
        next.add(currentCardIndex);
        return next;
      });
      const previews = getCardIntervalPreviews(activeCard.stableId);
      const label = quality === 5 ? previews.easy : previews.good;
      addToast(`Got it! Scheduled review in ${label} 🎯`, "success", undefined, undefined, true);
    } else {
      setCardQueue(prev => [...prev, currentCardIndex]);
      addToast("Re-queued for active recall. 🔄", "info", undefined, undefined, true);
    }

    setUserGuess("");

    setTimeout(() => {
      if (queuePointer >= cardQueue.length - 1) {
        if (onFinish) onFinish({ totalCards: cards.length });
        addToast("Study pack session complete! 🎉", "success");
      } else {
        setQueuePointer(prev => prev + 1);
        setCardState('IDLE');
        setExitDirection(null);
      }
    }, 220);
  };

  const handlePlayTTS = async (text: string) => {
    if (isPlayingTTS) {
      if (audioRef.current) audioRef.current.pause();
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
      for (let i = list.length - 1; i > queuePointer; i--) {
        const j = queuePointer + Math.floor(Math.random() * (i - queuePointer + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      addToast("Deck shuffled! 🔀", "info");
      return list;
    });
  };

  // 3D Tilt mouse state
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    
    const calcY = (mouseX / (width / 2)) * 10;
    const calcX = -(mouseY / (height / 2)) * 10;

    setRotateX(calcX);
    setRotateY(calcY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  if (cards.length === 0 || cardQueue.length === 0) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-6 text-center cursor-default gap-6">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[var(--foreground)] mb-2">No flashcards available</p>
          <p className="text-[10px] text-[var(--foreground-muted)] font-bold">Please try generating this phase again.</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 rounded-2xl bg-[var(--blue)] text-white font-black text-[11px] uppercase tracking-widest shadow-lg hover:scale-lg active:scale-95 transition-all flex items-center gap-2"
          >
            Regenerate Flashcards
          </button>
        )}
      </div>
    );
  }

  const currentCardIndex = cardQueue[queuePointer];
  const currentCard = originalCards[currentCardIndex];

  // Reverse Study values
  const cardFrontText = isReverseMode ? currentCard.back : currentCard.front;
  const cardBackText = isReverseMode ? currentCard.front : currentCard.back;

  const activeSRS = srsMap[currentCard.stableId];
  const srsStatus = activeSRS?.status || "new";
  const reviewIntervals = getCardIntervalPreviews(currentCard.stableId);

  const cardInnerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    transition: cardState === 'EVALUATED' ? "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)" : "transform 0.08s ease-out",
    transformStyle: "preserve-3d",
    transform: `${cardState === 'IDLE' ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg)` : `rotateX(${rotateX}deg) rotateY(${180 + rotateY}deg)`}`,
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
  };

  const cardFrontStyle: React.CSSProperties = {
    ...cardFaceStyle,
    background: "var(--card)",
    backdropFilter: "blur(20px)",
  };

  const cardBackStyle: React.CSSProperties = {
    ...cardFaceStyle,
    background: "var(--card)",
    backdropFilter: "blur(25px)",
    transform: "rotateY(180deg)",
  };

    return (
    <div className="relative w-full min-h-[500px] flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4 cursor-default overflow-visible gap-6">
      
      {/* Visual top track */}
      <div className="w-full max-w-[400px] md:max-w-[620px] space-y-3">
        <ProgressNodeTrack
          total={cards.length}
          current={currentCard.originalIndex}
          completed={Array.from(masteredSet).map(idx => originalCards[idx]?.originalIndex || 0)}
          className="w-full"
        />

        <div className="flex items-center justify-between text-[9px] text-[var(--foreground-muted)]/50 font-mono px-1">
          <span>Card {queuePointer + 1} of {cardQueue.length} in pack round</span>
          <span className="flex items-center gap-1.5">
            {secondsElapsed}s elapsed
            {srsStatus !== 'new' && (
              <span className="px-1 py-0.5 rounded bg-[var(--violet)]/10 text-[var(--violet)] text-[7px] font-bold uppercase tracking-wider border border-[var(--violet)]/20">
                {srsStatus}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Interactive Toolbelt */}
      <div className="w-full max-w-[400px] md:max-w-[620px] flex items-center justify-end gap-2 shrink-0">
        <button 
          onClick={shuffleDeck}
          className="p-1.5 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all" 
          title="Shuffle Deck"
        >
          <Shuffle size={14} />
        </button>
        <button 
          onClick={() => setIsReverseMode(!isReverseMode)}
          className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[10px] font-bold ${
            isReverseMode 
              ? 'bg-[var(--amber)]/10 border-[var(--amber)]/30 text-[var(--amber)]' 
              : 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
          }`}
          title="Swap Term & Definition"
        >
          <RefreshCw size={14} />
          <span className="hidden sm:inline uppercase tracking-wider text-[9px]">Reverse</span>
        </button>
        <button 
          onClick={() => setIsVerifyTextMode(!isVerifyTextMode)}
          className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[10px] font-bold ${
            isVerifyTextMode 
              ? 'bg-[var(--violet)]/10 border-[var(--violet)]/30 text-[var(--violet)]' 
              : 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
          }`}
          title="Type Guess Mode"
        >
          <MessageSquare size={14} />
          <span className="hidden sm:inline uppercase tracking-wider text-[9px]">Verify Input</span>
        </button>
        <button 
          onClick={() => setIsDyslexiaMode(!isDyslexiaMode)}
          className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[10px] font-bold ${
            isDyslexiaMode 
              ? 'bg-[var(--emerald)]/10 border-[var(--emerald)]/30 text-[var(--emerald)]' 
              : 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
          }`}
          title="Dyslexia Font"
        >
          <Type size={14} />
          <span className="hidden sm:inline uppercase tracking-wider text-[9px]">Dyslexia font</span>
        </button>
      </div>

      {/* 3D Stack Card Area */}
      <div className="relative w-full max-w-[400px] md:max-w-[620px] h-[340px] md:h-[400px] [perspective:1000px]">
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
        
        {/* Background stack card 2 */}
        {cardQueue.length - queuePointer > 2 && (
          <div 
            className="absolute inset-0 rounded-[28px] border border-[var(--border)] bg-[var(--card)]/40 pointer-events-none transition-all duration-300"
            style={{
              transform: "translateY(16px) scale(0.94)",
              zIndex: -2,
              opacity: 0.2,
            }}
          />
        )}

        {/* Background stack card 1 */}
        {cardQueue.length - queuePointer > 1 && (
          <div 
            className="absolute inset-0 rounded-[28px] border border-[var(--border)] bg-[var(--card)]/60 pointer-events-none transition-all duration-300"
            style={{
              transform: "translateY(8px) scale(0.97)",
              zIndex: -1,
              opacity: 0.45,
            }}
          />
        )}
        <AnimatePresence mode="popLayout" custom={exitDirection} initial={false}>
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
            className="w-full h-full relative cursor-pointer flex-shrink-0"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.8}
            style={{ transformStyle: "preserve-3d", x: dragX, rotate }}
            onDragEnd={(event, info) => {
              const threshold = 120;
              if (info.offset.x > threshold) {
                handleRate(4);
              } else if (info.offset.x < -threshold) {
                handleRate(1);
              }
            }}
            onTap={handleFlip}
          >
            <div style={cardInnerStyle}>
              {/* Front Side */}
              <div style={cardFrontStyle}>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[28px]" />

                {/* Structured Flexbox Header Bar */}
                <div className="w-full flex items-center justify-between px-5 pt-5 pb-1 relative z-10 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="relative flex items-center justify-center">
                      <svg className="w-7 h-7 transform -rotate-90">
                        <circle cx="14" cy="14" r="11" stroke="var(--border)" strokeWidth="2" fill="transparent" />
                        <circle 
                          cx="14" 
                          cy="14" 
                          r="11" 
                          stroke="var(--amber)" 
                          strokeWidth="2" 
                          fill="transparent" 
                          strokeDasharray={2 * Math.PI * 11}
                          strokeDashoffset={(2 * Math.PI * 11) * (1 - Math.min(secondsElapsed, 30) / 30)}
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <span className="absolute text-[8px] font-mono font-bold text-[var(--foreground-muted)]">{secondsElapsed}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Active Recall</span>
                  </div>

                  <button 
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayTTS(cardFrontText);
                    }}
                    className={`p-1.5 rounded-lg border transition-all ${
                      isPlayingTTS 
                        ? 'bg-[var(--amber)]/10 border-[var(--amber)]/30 text-[var(--amber)]' 
                        : 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                    title="Read Aloud"
                  >
                    <Volume2 size={13} />
                  </button>
                </div>

                <p className={`text-lg md:text-xl font-bold text-center leading-tight tracking-tight text-[var(--text)] px-4 mt-4 ${
                  isDyslexiaMode ? 'font-sans tracking-wide leading-loose text-xl' : 'font-serif'
                }`}>
                  {cardFrontText}
                </p>

                {/* Text guess verification input */}
                {isVerifyTextMode && (
                  <div className="w-full max-w-xs mt-4 px-2 relative z-20" onClick={e => e.stopPropagation()}>
                    <input 
                      type="text"
                      value={userGuess}
                      onChange={e => setUserGuess(e.target.value)}
                      placeholder="Type your guess..."
                      className="w-full px-3 py-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border-2)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--amber)]/45 transition-colors"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleFlip();
                        }
                      }}
                    />
                  </div>
                )}

                <div className="absolute bottom-5 flex flex-col items-center gap-1">
                  <span className="text-[8px] font-bold uppercase tracking-[0.25em] opacity-40">
                    Tap to flip card
                  </span>
                </div>
              </div>

              {/* Back Side */}
              <div style={cardBackStyle}>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[28px]" />

                <div className="flex flex-col items-center justify-between w-full h-full py-3 relative z-10">
                  {/* Header row */}
                  <div className="w-full flex items-center justify-between px-1 shrink-0">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]/75">
                      Concept Definition
                    </span>
                    <button 
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayTTS(eli5Text[currentCardIndex] || cardBackText);
                      }}
                      className={`p-1.5 rounded-lg border transition-all ${
                        isPlayingTTS 
                          ? 'bg-[var(--amber)]/10 border-[var(--amber)]/30 text-[var(--amber)]' 
                          : 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      <Volume2 size={13} />
                    </button>
                  </div>

                  {/* Definition Body */}
                  <div className="flex-1 flex flex-col items-center justify-center px-2 my-2 w-full overflow-y-auto scrollbar-none">
                    
                    {isVerifyTextMode && userGuess && (
                      <div className="w-full p-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-left mb-2 shrink-0">
                        <span className="text-[7px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]/50 block mb-0.5">Your Guess</span>
                        <span className="text-[11px] font-mono text-[var(--foreground-secondary)] line-clamp-2">{userGuess}</span>
                      </div>
                    )}

                    <p className={`text-sm md:text-base font-medium text-center text-[var(--foreground)] leading-relaxed ${
                      isDyslexiaMode ? 'font-sans tracking-wide leading-loose text-base' : 'font-serif'
                    }`}>
                      {eli5Text[currentCardIndex] || cardBackText}
                    </p>
                  </div>

                  {/* Metaphor trigger */}
                  <div className="flex flex-col items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {!eli5Text[currentCardIndex] && (
                      <button 
                        onClick={(e) => handleEli5(e, cardBackText, currentCardIndex)} 
                        className="flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--amber)]/10 text-[var(--amber)] border border-[var(--amber)]/20 text-[8px] font-black uppercase tracking-wider hover:bg-[var(--amber)]/25 transition-all cursor-pointer"
                      >
                        <Baby size={11} />
                        {isGeneratingEli5 ? "Simplifying..." : "ELI5 Metaphor"}
                      </button>
                    )}
                    <span className="text-[7px] font-black uppercase tracking-[0.25em] opacity-35">
                      Press [Space] to flip back
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 4-tier grading buttons */}
      <div className="w-full max-w-[400px] md:max-w-[620px] flex flex-col gap-4">
        {cardState === 'FLIPPED' ? (
          <div className="grid grid-cols-4 gap-2" onClick={e => e.stopPropagation()}>
            
            {/* Again */}
            <button 
              onClick={() => handleRate(1)}
              className="flex flex-col h-14 rounded-xl border-2 border-[var(--crimson)]/40 bg-[var(--crimson)]/10 text-[var(--crimson)] hover:bg-[var(--crimson)]/20 hover:border-[var(--crimson)] hover:shadow-[0_0_20px_rgba(239,68,68,0.35)] transition-all items-center justify-center p-1 cursor-pointer active:scale-95 shadow-inner"
            >
              <X size={12} className="mb-0.5" />
              <span className="text-[8px] font-black uppercase tracking-wider">Again</span>
              <span className="text-[7px] font-mono opacity-60">{reviewIntervals.again}</span>
            </button>

            {/* Hard */}
            <button 
              onClick={() => handleRate(2)}
              className="flex flex-col h-14 rounded-xl border-2 border-[var(--amber)]/40 bg-[var(--amber)]/10 text-[var(--amber)] hover:bg-[var(--amber)]/20 hover:border-[var(--amber)] hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all items-center justify-center p-1 cursor-pointer active:scale-95 shadow-inner"
            >
              <HelpCircle size={12} className="mb-0.5" />
              <span className="text-[8px] font-black uppercase tracking-wider">Hard</span>
              <span className="text-[7px] font-mono opacity-60">{reviewIntervals.hard}</span>
            </button>

            {/* Good */}
            <button 
              onClick={() => handleRate(4)}
              className="flex flex-col h-14 rounded-xl border-2 border-[var(--blue)]/40 bg-[var(--blue)]/10 text-[var(--blue)] hover:bg-[var(--blue)]/20 hover:border-[var(--blue)] hover:shadow-[0_0_20px_rgba(74,124,245,0.35)] transition-all items-center justify-center p-1 cursor-pointer active:scale-95 shadow-inner"
            >
              <Check size={12} className="mb-0.5" />
              <span className="text-[8px] font-black uppercase tracking-wider">Good</span>
              <span className="text-[7px] font-mono opacity-60">{reviewIntervals.good}</span>
            </button>

            {/* Easy */}
            <button 
              onClick={() => handleRate(5)}
              className="flex flex-col h-14 rounded-xl border-2 border-[var(--emerald)]/40 bg-[var(--emerald)]/10 text-[var(--emerald)] hover:bg-[var(--emerald)]/20 hover:border-[var(--emerald)] hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all items-center justify-center p-1 cursor-pointer active:scale-95 shadow-inner"
            >
              <Sparkles size={12} className="mb-0.5" />
              <span className="text-[8px] font-black uppercase tracking-wider">Easy</span>
              <span className="text-[7px] font-mono opacity-60">{reviewIntervals.easy}</span>
            </button>

          </div>
        ) : (
          <button 
            onClick={handleFlip} 
            className="w-full h-12 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-1.5 hover:opacity-90 transition-all cursor-pointer shadow-lg"
          >
            <Eye size={14} />
            <span>Reveal Answer</span>
          </button>
        )}

        {/* Global Footer Actions */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadFlashcardsOffline(title, cards);
              }}
              className="p-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all"
              title="Download offline HTML"
            >
              <Download size={14} />
            </button>
          </div>

          <span className="text-[8px] text-[var(--foreground-muted)]/40 font-mono">
            Space: flip | 1-4: grade
          </span>
        </div>
      </div>

    </div>
  );
};
