"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useIngestStore } from "@/store/useIngestStore";
import KnowledgeIngestModal from "@/components/modals/KnowledgeIngestModal";
import { Loader2 } from "lucide-react";

const MAX_CHARS = 50000;

/* ═══ Claymorphic Helpers ═══ */
const clay = {
    card: {
        background: "rgba(255,255,255,0.02)",
        borderRadius: "24px",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.04), inset 0 -1px 2px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)",
    } as React.CSSProperties,
    input: {
        background: "rgba(255,255,255,0.02)",
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.25), inset 0 -1px 1px rgba(255,255,255,0.03), 0 2px 8px rgba(0,0,0,0.2)",
    } as React.CSSProperties,
    pill: {
        background: "rgba(255,255,255,0.04)",
        borderRadius: "14px",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05), inset 0 -1px 2px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.15)",
    } as React.CSSProperties,
};

// ─── Creator Types ─────────────────────────────────────────────
const creatorTypes = [
    {
        id: "flashcards",
        label: "Flashcards",
        desc: "Turn notes into study cards you can flip through",
        longDesc: "AI reads your material and creates question-answer pairs perfect for memorization and active recall.",
        icon: "style",
        color: "#F59E0B",
        gradient: "from-[#F59E0B] to-[#D97706]",
        apiEndpoint: "/api/generate/flashcards",
        cost: 1,
    },
    {
        id: "quiz",
        label: "Practice Exam",
        desc: "Predict what might appear on your test",
        longDesc: "Generate realistic exam questions with multiple choice options, just like the real thing.",
        icon: "quiz",
        color: "#818CF8",
        gradient: "from-[#818CF8] to-[#6366F1]",
        popular: true,
        apiEndpoint: "/api/generate/quiz",
        cost: 2,
    },
    {
        id: "summary",
        label: "Smart Summary",
        desc: "Condense pages into key takeaways",
        longDesc: "Get the essence of long readings in bullet points, detailed notes, or a structured study guide.",
        icon: "summarize",
        color: "#10B981",
        gradient: "from-[#10B981] to-[#059669]",
        apiEndpoint: "/api/generate/summary",
        cost: 2,
    },
];

interface GenerationResult {
    type: string;
    title: string;
    data: any;
}

// ─── Configuration Options ─────────────────────────────────────
const countOptions = [5, 10, 20, 30, 45, 60];
const difficultyOptions = [
    { id: "easy", label: "Easy", desc: "Basic recall & definitions", emoji: "🟢" },
    { id: "medium", label: "Medium", desc: "Conceptual understanding", emoji: "🟡" },
    { id: "difficult", label: "Hard", desc: "Application & analysis", emoji: "🟠" },
    { id: "nightmare", label: "Nightmare", desc: "Expert-level traps", emoji: "🔴" },
];

export default function CreatePage() {
    const router = useRouter();
    const { user } = useUser();
    const { openModal, isProcessing } = useIngestStore();

    // Core state
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [inputText, setInputText] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState("");
    const [setupError, setSetupError] = useState<string | null>(null);

    // Configuration
    const [itemCount, setItemCount] = useState(10);
    const [difficulty, setDifficulty] = useState<"easy" | "medium" | "difficult" | "nightmare">("medium");

    // ─── Computed ───────────────────────────────────────────────
    const selectedCreator = creatorTypes.find(c => c.id === selectedType);
    const charPercentage = (inputText.length / MAX_CHARS) * 100;
    const canGenerate = inputText.trim().length > 50 && selectedType;

    // ─── Handlers ───────────────────────────────────────────────
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (e.target.value.length <= MAX_CHARS) setInputText(e.target.value);
    };

    const handleFileUploadRequest = () => {
        openModal();
    };

    const handleIngestSuccess = (text: string) => {
        setInputText(prev => prev + (prev ? '\n\n' : '') + text.substring(0, MAX_CHARS));
    };

    const handleGenerate = () => {
        if (!inputText.trim() || !selectedType) return;
        
        sessionStorage.setItem("generateParams", JSON.stringify({
            content: inputText,
            count: itemCount,
            difficulty,
            type: selectedType
        }));
        
        router.push(`/${selectedType}?mode=generate`);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === "dragenter" || e.type === "dragover");
    };

    const resetSelection = () => {
        setSelectedType(null);
        setInputText("");
        setSetupError(null);
    };

    // ─── RENDER ─────────────────────────────────────────────────
    return (
        <div className="min-h-[100dvh] bg-[#06060B] text-white/90 pb-28 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute w-[600px] h-[600px] rounded-full animate-pulse"
                    style={{ top: "-10%", right: "-10%", background: "radial-gradient(circle, rgba(245,158,11,0.05), transparent 60%)", filter: "blur(80px)", animationDuration: "8s" }} />
                <div className="absolute w-[400px] h-[400px] rounded-full animate-pulse"
                    style={{ bottom: "10%", left: "-5%", background: "radial-gradient(circle, rgba(129,140,248,0.04), transparent 60%)", filter: "blur(70px)", animationDuration: "10s" }} />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-5 sm:px-8 bg-[#06060B] border-b border-white/5 shadow-lg">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => selectedType ? resetSelection() : router.push('/dashboard')}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">
                            {selectedType ? 'arrow_back' : 'close'}
                        </span>
                    </button>
                    <div>
                        <h1 className="text-sm font-bold text-white/95">Creator Studio</h1>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-[#F59E0B]">
                            {selectedType ? `${selectedCreator?.label}` : 'Select Module'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ ...clay.pill, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.15)" }}>
                    <span className="material-symbols-outlined text-[14px] text-[#F59E0B]">toll</span>
                    <span className="text-[#F59E0B] text-[12px] font-bold">{user.credits || 0}</span>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-5 py-8 sm:py-12 relative z-10">

                {/* ═══════════════════════════════════════════════════
                    VIEW 1: TOOL SELECTION
                   ═══════════════════════════════════════════════════ */}
                {!selectedType && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Welcome */}
                        <div className="text-center mb-10">
                            <h2 className="font-heading text-3xl sm:text-[40px] font-bold text-white/95 tracking-tight mb-2 leading-tight">
                                Prepare to Build
                            </h2>
                            <p className="text-[13px] text-white/30 max-w-sm mx-auto">
                                Feed the AI your raw notes, and it will synthesize them into active learning materials.
                            </p>
                        </div>

                        {/* Tool Cards - Bento Grid approach */}
                        <div className="grid gap-4">
                            {creatorTypes.map((creator) => (
                                <button
                                    key={creator.id}
                                    onClick={() => setSelectedType(creator.id)}
                                    className="w-full group relative flex items-center gap-5 p-6 text-left transition-all duration-300"
                                    style={clay.card}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-3px)";
                                        e.currentTarget.style.boxShadow = `inset 0 1px 2px rgba(255,255,255,0.06), inset 0 -1px 2px rgba(0,0,0,0.15), 0 12px 40px rgba(0,0,0,0.35), 0 0 20px ${creator.color}15`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "";
                                        e.currentTarget.style.boxShadow = clay.card.boxShadow as string;
                                    }}
                                >
                                    {/* Top edge highlight */}
                                    <div className="absolute top-0 left-0 right-0 h-px"
                                        style={{ background: `linear-gradient(90deg, transparent 10%, ${creator.color}30 50%, transparent 90%)` }} />

                                    {/* Icon */}
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                                        style={{
                                            background: `linear-gradient(145deg, ${creator.color}20, ${creator.color}05)`,
                                            boxShadow: `inset 0 2px 3px rgba(255,255,255,0.06), inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 12px ${creator.color}20`,
                                            border: `1px solid ${creator.color}15`,
                                        }}>
                                        <span className="material-symbols-outlined text-[26px]" style={{ color: creator.color }}>{creator.icon}</span>
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-heading text-lg font-bold text-white/90">{creator.label}</h3>
                                            {creator.popular && (
                                                <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider"
                                                    style={{ background: `${creator.color}15`, color: creator.color }}>
                                                    Popular
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[12px] text-white/30 leading-relaxed">{creator.desc}</p>
                                    </div>

                                    {/* Arrow */}
                                    <span className="material-symbols-outlined text-white/10 group-hover:text-white/40 group-hover:translate-x-1 transition-all text-xl shrink-0">
                                        arrow_forward
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════
                    VIEW 2: INPUT + CONFIG
                   ═══════════════════════════════════════════════════ */}
                {selectedType && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-400 space-y-6">

                        {/* Selected Tool Banner */}
                        <div className="flex items-center gap-4 p-4 rounded-3xl" style={{ ...clay.card, background: "rgba(255,255,255,0.015)" }}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: `${selectedCreator?.color}15`, boxShadow: `inset 0 1px 2px ${selectedCreator?.color}20` }}>
                                <span className="material-symbols-outlined text-xl" style={{ color: selectedCreator?.color }}>{selectedCreator?.icon}</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-white/90">{selectedCreator?.label}</h3>
                                <p className="text-[11px] text-white/30">{selectedCreator?.desc}</p>
                            </div>
                        </div>

                        {/* Content Input */}
                        <div
                            className={`relative overflow-hidden transition-all duration-300 ${dragActive ? 'scale-[1.02]' : ''}`}
                            style={{
                                ...clay.card,
                                borderColor: dragActive ? selectedCreator?.color : "rgba(255,255,255,0.06)",
                                boxShadow: dragActive ? `0 0 0 1px ${selectedCreator?.color}, 0 8px 32px ${selectedCreator?.color}15` : clay.card.boxShadow,
                            }}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                        >
                            <div className="px-5 pt-4 flex items-center justify-between">
                                <label className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/20">Source Material</label>
                                <span className={`text-[10px] font-bold ${charPercentage > 80 ? 'text-[#EF4444]' : 'text-white/15'}`}>
                                    {inputText.length > 0 ? `${inputText.length.toLocaleString()} chars` : ''}
                                </span>
                            </div>
                            <div className="relative p-5">
                                {isUploading && (
                                    <div className="absolute inset-0 z-10 bg-[#06060B]/80 backdrop-blur-md flex flex-col items-center justify-center rounded-xl">
                                        <span className="material-symbols-outlined text-2xl animate-spin text-[#F59E0B] mb-2">sync</span>
                                        <p className="text-[12px] font-bold text-white/60 uppercase tracking-widest">{uploadStatus}</p>
                                    </div>
                                )}
                                <textarea
                                    value={inputText}
                                    onChange={handleInputChange}
                                    placeholder="Paste lecture notes, syllabus, or raw intelligence here..."
                                    className="w-full h-48 px-1 py-1 resize-none bg-transparent text-white/80 placeholder:text-white/15 text-[14px] leading-relaxed outline-none"
                                    style={{ scrollbarWidth: "none" }}
                                    autoFocus
                                    disabled={isUploading}
                                />
                            </div>
                            <div className="px-5 pb-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                                <button
                                    onClick={handleFileUploadRequest}
                                    className="flex items-center gap-2 text-[12px] font-semibold text-white/30 hover:text-white/70 transition-colors pt-3"
                                >
                                    <span className="material-symbols-outlined text-[15px]">upload_file</span>
                                    Teach The Professor
                                </button>
                                {inputText.length > 0 && inputText.length < 50 && (
                                    <span className="text-[10px] font-bold text-[#F59E0B] pt-3">Minimum 50 chars required</span>
                                )}
                            </div>
                        </div>

                        {/* Config Block */}
                        {(selectedType === "flashcards" || selectedType === "quiz") && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-5" style={clay.card}>
                                    <label className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/20 mb-3 block">Density / Count</label>
                                    <div className="flex flex-wrap gap-2">
                                        {countOptions.map((count) => (
                                            <button
                                                key={count}
                                                onClick={() => setItemCount(count)}
                                                className={`px-3 py-1.5 text-[11px] font-bold transition-all rounded-lg`}
                                                style={itemCount === count ? {
                                                    background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.1))",
                                                    color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)",
                                                    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.1), 0 2px 6px rgba(245,158,11,0.2)"
                                                } : {
                                                    background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)",
                                                    border: "1px solid rgba(255,255,255,0.05)"
                                                }}
                                            >
                                                {count}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-5" style={clay.card}>
                                    <label className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/20 mb-3 block">Rigor Level</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {difficultyOptions.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setDifficulty(opt.id as any)}
                                                className="p-2.5 text-left rounded-xl transition-all"
                                                style={difficulty === opt.id ? {
                                                    background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)",
                                                } : {
                                                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)"
                                                }}
                                            >
                                                <div className="text-[11px] font-bold flex items-center gap-1.5 mb-1"
                                                    style={{ color: difficulty === opt.id ? "#F59E0B" : "rgba(255,255,255,0.6)" }}>
                                                    <span>{opt.emoji}</span> {opt.label}
                                                </div>
                                                <p className="text-[9px] text-white/20 px-1 truncate">{opt.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Generate Button */}
                        <div className="pt-2">
                            <button
                                onClick={handleGenerate}
                                disabled={!canGenerate}
                                className={`w-full py-4 rounded-2xl font-bold text-[13px] tracking-wide transition-all flex items-center justify-center gap-2.5 relative overflow-hidden group ${
                                    !canGenerate ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'
                                }`}
                                style={{
                                    background: canGenerate ? "linear-gradient(135deg, #F59E0B, #D97706)" : "rgba(255,255,255,0.04)",
                                    color: canGenerate ? "#08080E" : "rgba(255,255,255,0.2)",
                                    boxShadow: canGenerate ? "0 4px 16px rgba(245,158,11,0.3), inset 0 2px 3px rgba(255,255,255,0.2), inset 0 -2px 3px rgba(0,0,0,0.15)" : "none",
                                }}
                            >
                                <>
                                    {canGenerate && (
                                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                                    <span className="relative z-10">Initialize Generation (-{selectedCreator?.cost} credit)</span>
                                </>
                            </button>
                        </div>

                        {/* Error */}
                        {setupError && (
                            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20">
                                <div className="flex items-center gap-2 text-[12px] font-bold text-red-400">
                                    <span className="material-symbols-outlined text-base">warning</span>
                                    {setupError}
                                </div>
                                <button
                                    onClick={() => { setSetupError(null); }}
                                    className="px-3 py-1.5 bg-red-500/20 text-red-300 text-[10px] uppercase tracking-wider font-bold rounded-lg hover:bg-red-500/30 transition-colors"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
            
            <KnowledgeIngestModal onSuccess={handleIngestSuccess} />
        </div>
    );
}
