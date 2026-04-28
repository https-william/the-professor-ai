"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useIngestStore } from "@/store/useIngestStore";
import KnowledgeIngestModal from "@/components/modals/KnowledgeIngestModal";
import DataDustLoader from "@/components/ui/DataDustLoader";

import { 
    Loader2, 
    Layers, 
    HelpCircle, 
    FileText, 
    Map as MapIcon, 
    MessageSquare, 
    ChevronLeft, 
    X, 
    ChevronRight, 
    RotateCw, 
    Upload, 
    Zap, 
    AlertTriangle 
} from "lucide-react";

const MAX_CHARS = 50000;

/* â•â•â• Claymorphic Helpers â•â•â• */
const clay = {
    card: {
        background: "var(--card-bg, rgba(255,255,255,0.02))",
        borderRadius: "24px",
        border: "1px solid var(--border, rgba(255,255,255,0.06))",
        boxShadow: "inset 0 1px 1px var(--glow, rgba(255,255,255,0.04)), 0 4px 16px rgba(0,0,0,0.1)",
    } as React.CSSProperties,
    input: {
        background: "var(--card-bg, rgba(255,255,255,0.02))",
        borderRadius: "20px",
        border: "1px solid var(--border, rgba(255,255,255,0.06))",
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)",
    } as React.CSSProperties,
    pill: {
        background: "var(--card-bg, rgba(255,255,255,0.04))",
        borderRadius: "14px",
        boxShadow: "inset 0 1px 1px var(--glow, rgba(255,255,255,0.05)), 0 2px 6px rgba(0,0,0,0.1)",
    } as React.CSSProperties,
};

// â”€â”€â”€ Creator Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const creatorTypes = [
    {
        id: "flashcards",
        label: "Flashcards",
        desc: "Turn notes into study cards you can flip through",
        longDesc: "AI reads your material and creates question-answer pairs perfect for memorization and active recall.",
        icon: Layers,
        color: "#F59E0B",
        gradient: "from-[#F59E0B] to-[#D97706]",
        apiEndpoint: "/api/generate/flashcards",
        cost: 1,
    },
    {
        id: "match",
        label: "Match Studio",
        desc: "Interactive drag-and-drop connections",
        longDesc: "AI synthesizes concepts into interactive pairs for high-velocity gamified recall training.",
        icon: Zap,
        color: "#EF4444",
        gradient: "from-[#EF4444] to-[#B91C1C]",
        apiEndpoint: "/api/generate/match",
        cost: 1,
    },
    {
        id: "quiz",
        label: "Practice Exam",
        desc: "Predict what might appear on your test",
        longDesc: "Generate realistic exam questions with multiple choice options, just like the real thing.",
        icon: HelpCircle,
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
        icon: FileText,
        color: "#10B981",
        gradient: "from-[#10B981] to-[#059669]",
        apiEndpoint: "/api/generate/summary",
        cost: 2,
    },
    {
        id: "roadmap",
        label: "Syllabus Architect",
        desc: "Convert chaos into a structured learning path",
        longDesc: "AI analyzes your curriculum and breaks it down into a logical, phased implementation strategy for your degree.",
        icon: MapIcon,
        color: "#C084FC",
        gradient: "from-[#C084FC] to-[#A855F7]",
        apiEndpoint: "/api/generate/roadmap",
        cost: 2,
    },
];

interface GenerationResult {
    type: string;
    title: string;
    data: any;
}

// â”€â”€â”€ Configuration Options â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const countOptions = [5, 10, 20, 30, 45, 60];
const difficultyOptions = [
    { id: "easy", label: "Easy", desc: "Basic recall & definitions", emoji: "ðŸŸ¢" },
    { id: "medium", label: "Medium", desc: "Conceptual understanding", emoji: "ðŸŸ¡" },
    { id: "difficult", label: "Hard", desc: "Application & analysis", emoji: "ðŸŸ " },
    { id: "nightmare", label: "Nightmare", desc: "Expert-level traps", emoji: "ðŸ”´" },
];

function CreatorStudio() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useUser();
    const { openModal, isProcessing } = useIngestStore();

    // Core state
    const [selectedType, setSelectedType] = useState<string | null>(null);

    // Deep Link Interception
    useEffect(() => {
        const tool = searchParams.get('tool');
        if (tool && ['flashcards', 'match', 'quiz', 'summary', 'roadmap'].includes(tool)) {
            setSelectedType(tool);
        }
    }, [searchParams]);

    const [inputText, setInputText] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState("");
    const [setupError, setSetupError] = useState<string | null>(null);

    // Configuration
    const [itemCount, setItemCount] = useState(10);
    const [difficulty, setDifficulty] = useState<"easy" | "medium" | "difficult" | "nightmare">("medium");

    // â”€â”€â”€ Computed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const selectedCreator = creatorTypes.find(c => c.id === selectedType);
    const charPercentage = (inputText.length / MAX_CHARS) * 100;
    const canGenerate = inputText.trim().length > 50 && selectedType;

    // â”€â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    // â”€â”€â”€ RENDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    return (
        <div className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)] pb-28 relative overflow-hidden">
            {/* Ambient Background — warm amber only, no purple */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute w-[600px] h-[600px] rounded-full"
                    style={{ top: "-10%", right: "-10%", background: "radial-gradient(circle, rgba(245,158,11,0.06), transparent 60%)", filter: "blur(80px)", animation: "professor-pulse 8s ease-in-out infinite" }} />
                <div className="absolute w-[400px] h-[400px] rounded-full"
                    style={{ bottom: "10%", left: "-5%", background: "radial-gradient(circle, rgba(16,185,129,0.03), transparent 60%)", filter: "blur(70px)", animation: "professor-pulse 10s ease-in-out infinite reverse" }} />
            </div>

            <div className="mx-auto flex justify-center py-4">
                {/* Header Slot Placeholder or direct back button if needed */}
            </div>

            <main className="max-w-2xl mx-auto px-5 pt-24 pb-8 sm:pt-20 sm:pb-12 relative z-10">

                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                    VIEW 1: TOOL SELECTION
                   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                {!selectedType && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Welcome */}
                        <div className="text-center mb-10">
                            <h2 className="font-heading text-3xl sm:text-[40px] font-bold text-[var(--foreground)] tracking-tight mb-2 leading-tight">
                                Prepare to Build
                            </h2>
                            <p className="text-[13px] text-[var(--foreground-muted)] max-w-sm mx-auto">
                                Feed the AI your raw notes, and it will synthesize them into active learning materials.
                            </p>
                        </div>

                        {/* Tool Cards - Bento Grid approach */}
                        <div className="grid gap-4">
                            {creatorTypes.map((creator) => (
                                <button
                                    key={creator.id}
                                    onClick={() => {
                                        if ((creator as any).directRoute) {
                                            router.push((creator as any).directRoute);
                                        } else {
                                            setSelectedType(creator.id);
                                        }
                                    }}
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
                                        <creator.icon size={26} strokeWidth={1.5} style={{ color: creator.color }} />
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-heading text-lg font-bold text-[var(--foreground)]">{creator.label}</h3>
                                            {creator.popular && (
                                                <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider"
                                                    style={{ background: `${creator.color}15`, color: creator.color }}>
                                                    Popular
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[12px] text-[var(--foreground-muted)] leading-relaxed">{creator.desc}</p>
                                    </div>

                                    {/* Arrow */}
                                    <ChevronRight size={20} strokeWidth={1.5} className="text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] group-hover:translate-x-1 transition-all shrink-0" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                    VIEW 2: INPUT + CONFIG
                   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                {selectedType && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-400 space-y-6">

                        {/* Selected Tool Banner */}
                        <div className="flex items-center gap-4 p-4 rounded-3xl" style={{ ...clay.card, background: "rgba(255,255,255,0.015)" }}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: `${selectedCreator?.color}15`, boxShadow: `inset 0 1px 2px ${selectedCreator?.color}20` }}>
                                {selectedCreator && <selectedCreator.icon size={20} strokeWidth={1.5} style={{ color: selectedCreator?.color }} />}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-[var(--foreground)]">{selectedCreator?.label}</h3>
                                <p className="text-[11px] text-[var(--foreground-muted)]">{selectedCreator?.desc}</p>
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
                                <label className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--foreground-muted)] opacity-70">Source Material</label>
                                <span className={`text-[10px] font-bold ${charPercentage > 80 ? 'text-[#EF4444]' : 'text-[var(--foreground-muted)] opacity-60'}`}>
                                    {inputText.length > 0 ? `${inputText.length.toLocaleString()} chars` : ''}
                                </span>
                            </div>
                            <div className="relative p-5">
                                {isUploading && (
                                    <div className="absolute inset-0 z-10 bg-[var(--background)]/85 backdrop-blur-md flex flex-col items-center justify-center rounded-xl gap-3">
                                        {/* Inline amber orbital spinner */}
                                        <div className="relative w-10 h-10">
                                            <div className="absolute inset-0 rounded-full border border-[var(--accent)]/15" />
                                            <div className="absolute inset-0 rounded-full border border-transparent border-t-[var(--accent)]" style={{ animation: "professor-spin 1.2s linear infinite" }} />
                                            <div className="absolute inset-[6px] rounded-full border border-transparent border-t-[#10B981]" style={{ animation: "professor-spin 0.8s linear infinite reverse" }} />
                                        </div>
                                        <p className="text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-[0.2em]">{uploadStatus}</p>
                                    </div>
                                )}
                                <textarea
                                    value={inputText}
                                    onChange={handleInputChange}
                                    placeholder="Paste lecture notes, syllabus, or raw intelligence here..."
                                    className="w-full h-48 px-1 py-1 resize-none bg-transparent text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] placeholder:opacity-50 text-[14px] leading-relaxed outline-none"
                                    style={{ scrollbarWidth: "none" }}
                                    autoFocus
                                    disabled={isUploading}
                                />
                            </div>
                            <div className="px-5 pb-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                                <button
                                    onClick={handleFileUploadRequest}
                                    className="flex items-center gap-2 text-[12px] font-semibold text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors pt-3"
                                >
                                    <Upload size={15} strokeWidth={1.5} />
                                    Teach The Professor
                                </button>
                                {inputText.length > 0 && inputText.length < 50 && (
                                    <span className="text-[10px] font-bold text-[#F59E0B] pt-3">Minimum 50 chars required</span>
                                )}
                            </div>
                        </div>

                        {/* Config Block */}
                        {(selectedType === "flashcards" || selectedType === "match" || selectedType === "quiz") && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-5" style={clay.card}>
                                    <label className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--foreground-muted)] opacity-80 mb-3 block">Density / Count</label>
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
                                                    background: "var(--foreground-opacity-5, rgba(255,255,255,0.02))", color: "var(--foreground-muted)",
                                                    border: "1px solid var(--border)"
                                                }}
                                            >
                                                {count}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-5" style={clay.card}>
                                    <label className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--foreground-muted)] opacity-80 mb-3 block">Rigor Level</label>
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
                                                    style={{ color: difficulty === opt.id ? "#F59E0B" : "var(--foreground-muted)" }}>
                                                    <span>{opt.emoji}</span> {opt.label}
                                                </div>
                                                <p className="text-[9px] text-[var(--foreground-muted)] opacity-70 px-1 truncate">{opt.desc}</p>
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
                                    background: canGenerate ? "linear-gradient(135deg, #F59E0B, #D97706)" : "var(--card)",
                                    color: canGenerate ? "#08080E" : "var(--foreground-muted)",
                                    boxShadow: canGenerate ? "0 4px 16px rgba(245,158,11,0.3), inset 0 2px 3px rgba(255,255,255,0.2), inset 0 -2px 3px rgba(0,0,0,0.15)" : "none",
                                    border: canGenerate ? "none" : "1px solid var(--border)"
                                }}
                            >
                                <>
                                    {canGenerate && (
                                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                    <Zap size={18} strokeWidth={1.5} />
                                    <span className="relative z-10">Initialize Generation (-{selectedCreator?.cost} credit)</span>
                                </>
                            </button>
                        </div>

                        {/* Error */}
                        {setupError && (
                            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20">
                                <div className="flex items-center gap-2 text-[12px] font-bold text-red-400">
                                    <AlertTriangle size={16} strokeWidth={1.5} />
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

export default function CreatePage() {
    return (
        <Suspense fallback={<DataDustLoader />}>
            <CreatorStudio />
        </Suspense>
    );
}

