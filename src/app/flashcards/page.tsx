"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import ShareCard from "@/components/ShareCard";

interface Flashcard {
    id?: string;
    front: string;
    back: string;
}

const emptyFlashcards: Flashcard[] = [
    { id: "0", front: "No flashcards found", back: "Go to the Create page to generate some study materials!" }
];

function FlashcardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [flashcards, setFlashcards] = useState<Flashcard[]>(emptyFlashcards);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [title, setTitle] = useState("Academic Deck");
    const [isShareOpen, setIsShareOpen] = useState(false);
    const { user } = useUser();

    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [generationId, setGenerationId] = useState<string | null>(null);
    const hasStartedGeneration = useRef(false);

    // Load content or Initiate Stream
    useEffect(() => {
        const init = async () => {
            const id = searchParams.get("id");
            const mode = searchParams.get("mode");

            if (id) {
                try {
                    setIsGenerating(false);
                    const supabase = createClient();
                    const { data, error } = await supabase
                        .from("generations")
                        .select("*")
                        .eq("id", id)
                        .single();
                    if (error || !data) throw new Error("Deck not found");

                    const cards = data.content?.flashcards || [];
                    setFlashcards(cards);
                    setTitle(data.title || "Academic Deck");
                    setGenerationId(data.id);
                    sessionStorage.setItem("generatedContent", JSON.stringify({
                        type: "flashcards",
                        data: cards,
                        title: data.title,
                        id: data.id
                    }));
                    return;
                } catch (e) {
                    console.error("ID load error:", e);
                    router.push("/create"); return;
                }
            }

            if (mode === "generate") {
                if (hasStartedGeneration.current) return;
                const paramsStr = sessionStorage.getItem("generateParams");
                if (!paramsStr) {
                    router.push("/create"); return;
                }
                hasStartedGeneration.current = true;
                const params = JSON.parse(paramsStr);
                sessionStorage.removeItem("generateParams");
                
                setIsGenerating(true);
                setFlashcards([]);
                setGenerationError(null);
                
                try {
                    const response = await fetch("/api/generate/flashcards", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(params),
                    });

                    if (!response.ok) throw new Error("Generation failed");

                    const reader = response.body?.getReader();
                    if (!reader) throw new Error("No stream content");

                    const decoder = new TextDecoder();
                    let buffer = "";
                    let finalCards: Flashcard[] = [];

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || "";

                        for (const line of lines) {
                            if (!line.startsWith("data: ")) continue;
                            const json = JSON.parse(line.slice(6));
                            
                            if (json.type === "flashcard") {
                                finalCards = [...finalCards, json.card];
                                setFlashcards(finalCards);
                            } else if (json.status === "complete") {
                                setGenerationId(json.id);
                                setTitle(json.title);
                                sessionStorage.setItem("generatedContent", JSON.stringify({
                                    type: "flashcards",
                                    data: json.flashcards || finalCards,
                                    title: json.title,
                                    id: json.id
                                }));
                            } else if (json.status === "error") {
                                throw new Error(json.message);
                            }
                        }
                    }
                } catch (err: any) {
                    setGenerationError(err.message);
                } finally {
                    setIsGenerating(false);
                }
            } else {
                try {
                    const stored = sessionStorage.getItem("generatedContent");
                    if (stored) {
                        const content = JSON.parse(stored);
                        if ((content.type === "flashcards" || content.flashcards) && (content.data || content.flashcards)) {
                            setFlashcards(content.data || content.flashcards);
                            setTitle(content.title || "Academic Deck");
                        }
                    }
                } catch (e) {}
            }
        };
        init();
    }, [searchParams, router]);

    const handleFlip = () => setIsFlipped(!isFlipped);
    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex((prev) => (prev + 1) % flashcards.length), 300);
    };
    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length), 300);
    };

    if (isGenerating && flashcards.length === 0) {
        return (
            <div className="min-h-screen bg-[#06060B] text-white flex flex-col items-center justify-center p-6 overflow-hidden">
                <div className="w-20 h-20 relative mb-8">
                    <div className="absolute inset-0 border-[3px] border-[var(--accent)]/10 rounded-full" />
                    <div className="absolute inset-0 border-t-[3px] border-[var(--accent)] rounded-full animate-spin shadow-[0_0_15px_var(--accent)]" />
                    <span className="material-symbols-outlined text-2xl text-[var(--accent)] absolute inset-0 flex items-center justify-center animate-pulse">style</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white mb-2">Engraving Flashcards...</h2>
                <p className="text-white/30 text-[10px] uppercase tracking-[0.4em] font-black italic">Academic Standard Excellence</p>
            </div>
        );
    }

    const currentCard = flashcards[currentIndex];
    if (!currentCard) return null;

    return (
        <div className="min-h-screen bg-[#06060B] text-white pb-24 relative overflow-hidden flex flex-col items-center">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full h-16 border-b border-white/5 bg-[#06060B]/80 backdrop-blur-xl px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/create')} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-sm text-white/50">arrow_back</span>
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-[13px] font-bold text-white/90 truncate max-w-[150px] sm:max-w-xs">{title}</h1>
                        <p className="text-[9px] text-[#F59E0B]/60 font-black uppercase tracking-[0.2em]">Master Your Material</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsShareOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[18px]">share</span>
                        <span className="text-[12px] font-bold hidden sm:inline">Share</span>
                    </button>
                </div>
            </header>

            <main className="max-w-2xl w-full px-6 py-12 flex flex-col items-center relative z-10 transition-all">
                {generationError && (
                    <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center w-full">
                        {generationError}
                    </div>
                )}

                <div className="flex flex-col items-center mb-12">
                   <div className="text-[10px] font-black tracking-[0.5em] text-white/20 uppercase mb-3">Office of Academic Excellence</div>
                   <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-white/50">
                        Concept {currentIndex + 1} of {flashcards.length}
                   </div>
                </div>

                <div className="relative w-full aspect-[4/3] perspective-1000 cursor-pointer group" onClick={handleFlip}>
                    <div className={`relative w-full h-full transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                        <div className="absolute inset-0 rounded-[40px] bg-[#0A0A0F]/80 border border-white/10 p-10 flex items-center justify-center backface-hidden shadow-2xl backdrop-blur-xl group-hover:border-[#F59E0B]/30 transition-all">
                            <p className="text-3xl font-bold text-center text-white leading-tight tracking-tight">{currentCard.front}</p>
                            <span className="absolute bottom-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#F59E0B]/40">
                                <span className="material-symbols-outlined text-sm">contact_support</span>
                                Assessment Item
                            </span>
                        </div>
                        <div className="absolute inset-0 rounded-[40px] bg-[#0A0A0F]/90 border border-[#F59E0B]/30 p-10 flex items-center justify-center backface-hidden rotate-y-180 shadow-2xl backdrop-blur-xl">
                            <p className="text-2xl font-serif text-center text-white/90 leading-relaxed italic">{currentCard.back}</p>
                            <span className="absolute bottom-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#F59E0B]">
                                <span className="material-symbols-outlined text-sm">verified</span>
                                Verified Solution
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 mt-16 w-full max-w-sm">
                    <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="flex-1 py-5 rounded-2xl bg-[#F59E0B] text-[#06060B] font-black tracking-widest text-[11px] uppercase shadow-[0_10px_30px_rgba(245,158,11,0.2)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.3)] transition-all active:scale-95">Next Concept</button>
                </div>
            </main>

            {/* Bottom Proof */}
            <div className="mt-auto py-12 flex flex-col items-center opacity-30">
                <div className="w-8 h-[1px] bg-white/20 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em]">The Professor — Mastery Certified</p>
            </div>

            <ShareCard 
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                data={{
                    title: title,
                    count: flashcards.length,
                    type: "Flashcards",
                    user: user?.name || "Scholar",
                    items: flashcards
                }}
            />
        </div>
    );
}

export default function FlashcardsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#06060B] flex items-center justify-center text-[10px] font-black tracking-[0.4em] text-white/20 uppercase">Initializing Deck...</div>}>
            <FlashcardContent />
        </Suspense>
    );
}
