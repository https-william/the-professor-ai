"use client";

import { Suspense, useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useIngestStore } from "@/store/useIngestStore";
import { useToasts } from "@/components/ui/GlobalToasts";
import KnowledgeIngestModal from "@/components/modals/KnowledgeIngestModal";
import DataDustLoader from "@/components/ui/DataDustLoader";
import StandardContainer from "@/components/ui/StandardContainer";
import JourneyPhase from "@/components/features/create/JourneyPhase";
import ExamSprintCard from "@/components/features/create/ExamSprintCard";
import { cn } from "@/lib/utils";

import { 
    X, 
    Layers, 
    Zap, 
    FileText, 
    Map as MapIcon, 
    ShieldAlert,
    BrainCircuit,
    Sword,
    BookOpen,
    Upload,
    AlertTriangle
} from "lucide-react";

const MAX_CHARS = 50000;

// ─── Phase-Based Creator Types ────────────────────────────────────────────────
const phases = [
    {
        id: "understand",
        number: 1,
        title: "Understand",
        tools: [
            {
                id: "summary",
                label: "Distill",
                desc: "Condense complex notes into core concepts",
                icon: FileText,
                color: "var(--emerald)",
                apiEndpoint: "/api/generate/summary",
                cost: 2,
                popular: true,
            },
            {
                id: "eli5",
                label: "The Analogy",
                desc: "Explain it like I'm 5 years old",
                icon: BrainCircuit,
                color: "var(--blue)",
                apiEndpoint: "/api/generate/eli5",
                cost: 1,
            },
        ]
    },
    {
        id: "retain",
        number: 2,
        title: "Retain",
        tools: [
            {
                id: "flashcards",
                label: "Memory Cards",
                desc: "Active recall for long-term storage",
                icon: Layers,
                color: "var(--blue)",
                apiEndpoint: "/api/generate/flashcards",
                cost: 1,
            },
            {
                id: "match",
                label: "Match Studio",
                desc: "Gamified high-velocity concept links",
                icon: Zap,
                color: "var(--cyan)",
                apiEndpoint: "/api/generate/match",
                cost: 1,
            },
        ]
    },
    {
        id: "test",
        number: 3,
        title: "Test",
        tools: [
            {
                id: "quiz",
                label: "Exam Mode",
                desc: "Predict exactly what's on the test",
                icon: Sword,
                color: "var(--crimson)",
                apiEndpoint: "/api/generate/quiz",
                cost: 2,
                popular: true,
            },
        ]
    },
];

const allTools = phases.flatMap(p => p.tools);

const countOptions = [5, 10, 20, 30, 45, 60];
const difficultyOptions = [
    { id: "easy", label: "Novice", desc: "Basic recall & definitions", emoji: "🌱" },
    { id: "medium", label: "Scholar", desc: "Conceptual understanding", emoji: "📜" },
    { id: "difficult", label: "Master", desc: "Application & analysis", emoji: "🏛️" },
    { id: "nightmare", label: "Professor", desc: "Expert-level rigor", emoji: "🎓" },
];

const timerOptions = [
    { id: 0, label: "No Timer", desc: "Infinite time" },
    { id: 300, label: "5 Min", desc: "Blitz session" },
    { id: 600, label: "10 Min", desc: "Standard rigor" },
    { id: 1200, label: "20 Min", desc: "Deep focus" },
    { id: 1800, label: "30 Min", desc: "Mock exam" },
];

const formatOptions: Record<string, { id: string, label: string, desc: string }[]> = {
    flashcards: [
        { id: "front_back", label: "Front/Back", desc: "Classic active recall" },
        { id: "cloze", label: "Cloze", desc: "Fill in the blanks" },
    ],
    quiz: [
        { id: "mcq", label: "MCQ", desc: "Multiple choice" },
        { id: "mixed", label: "Mixed", desc: "MCQ + True/False" },
    ],
    summary: [
        { id: "bullets", label: "High-Yield", desc: "Focus on facts" },
        { id: "narrative", label: "Narrative", desc: "Prose explanation" },
    ],
    eli5: [
        { id: "analogy", label: "Vivid Analogy", desc: "Best for intuition" },
        { id: "metaphor", label: "Poetic Metaphor", desc: "Creative links" },
    ],
};

import StudyPackCommandCenter from "@/components/features/create/StudyPackCommandCenter";

function CreatorStudio() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useUser();
    const { openModal } = useIngestStore();

    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [inputText, setInputText] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState("");
    const [setupError, setSetupError] = useState<string | null>(null);
    const [isSprintMode, setIsSprintMode] = useState(false);
    const [isGeneratingPack, setIsGeneratingPack] = useState(false);

    const [itemCount, setItemCount] = useState(10);
    const [difficulty, setDifficulty] = useState<"easy" | "medium" | "difficult" | "nightmare">("medium");
    const [timerValue, setTimerValue] = useState(600);
    const [selectedFormat, setSelectedFormat] = useState("");

    useEffect(() => {
        const tool = searchParams.get('tool');
        const validTools = allTools.map(t => t.id);
        if (tool && validTools.includes(tool)) {
            setSelectedType(tool);
        }
    }, [searchParams]);

    useEffect(() => {
        if (selectedType && formatOptions[selectedType]) {
            setSelectedFormat(formatOptions[selectedType][0].id);
        }
    }, [selectedType]);

    const selectedCreator = allTools.find(c => c.id === selectedType);
    const charPercentage = (inputText.length / MAX_CHARS) * 100;
    const canGenerate = inputText.trim().length > 50 && (selectedType || isSprintMode);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (e.target.value.length <= MAX_CHARS) setInputText(e.target.value);
    };

    const handleFileUploadRequest = () => {
        setIsSprintMode(false);
        openModal();
    };

    const handleExamSprint = () => {
        sessionStorage.setItem("isExamSprint", "true");
        setIsSprintMode(true);
        openModal();
    };

    const handleIngestSuccess = (text: string) => {
        const isSprint = sessionStorage.getItem("isExamSprint") === "true";
        if (isSprint) {
            setIsSprintMode(true);
            setInputText(text.substring(0, MAX_CHARS));
        } else {
            setInputText(prev => prev + (prev ? '\n\n' : '') + text.substring(0, MAX_CHARS));
        }
    };

    const handleGenerate = () => {
        if (!inputText.trim()) return;

        if (isSprintMode) {
            setIsGeneratingPack(true);
            return;
        }

        if (!selectedType) return;
        
        sessionStorage.setItem("generateParams", JSON.stringify({
            content: inputText,
            count: itemCount,
            difficulty,
            timer: timerValue,
            format: selectedFormat,
            type: selectedType
        }));
        
        router.push(`/${selectedType}/generate`);
    };

    const resetSelection = () => {
        setSelectedType(null);
        setInputText("");
        setSetupError(null);
        sessionStorage.removeItem("isExamSprint");
        setIsSprintMode(false);
        setIsGeneratingPack(false);
    };

    if (isGeneratingPack) {
        return (
            <div className="min-h-screen bg-transparent pt-20">
                <StandardContainer wide>
                    <div className="mb-8">
                        <button 
                            onClick={() => setIsGeneratingPack(false)}
                            className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-2"
                        >
                            <X size={14} /> Cancel Generation
                        </button>
                    </div>
                    <StudyPackCommandCenter 
                        sourceText={inputText} 
                        onComplete={(id) => router.push(`/library/pack/${id}`)} 
                    />
                </StandardContainer>
            </div>
        );
    }

    return (
        <div className="bg-[#fcfbf9] text-[var(--foreground)] pb-28 pt-24 relative">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--blue-glow)] opacity-[0.03] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[var(--blue-glow)] opacity-[0.02] rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <StandardContainer wide>
                {!selectedType ? (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="mb-12 sm:mb-20 text-center sm:text-left">
                            <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-6 leading-[0.9] text-[#1a1a1a]">
                                The Study <span className="text-[var(--blue)]">Journey</span>
                            </h1>
                            <p className="text-base sm:text-lg text-[var(--foreground-muted)] font-bold leading-relaxed max-w-xl opacity-70 mx-auto sm:mx-0">
                                Don&apos;t just read. Master. Follow the Professor&apos;s four-phase methodology to convert raw data into exam-day dominance.
                            </p>
                        </div>

                        <div className="mb-12">
                            <ExamSprintCard onClick={handleExamSprint} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {phases.map((phase) => (
                                <JourneyPhase
                                    key={phase.id}
                                    number={phase.number}
                                    title={phase.title}
                                    tools={phase.tools}
                                    onSelectTool={setSelectedType}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-400 space-y-6">
                        <div className="flex items-center gap-4 p-5 rounded-[32px] bg-white border border-[var(--border)] shadow-xl">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                                style={{ background: `color-mix(in srgb, ${selectedCreator?.color}, transparent 92%)`, border: `1px solid color-mix(in srgb, ${selectedCreator?.color}, transparent 80%)` }}>
                                {selectedCreator && <selectedCreator.icon size={24} strokeWidth={2.2} style={{ color: selectedCreator?.color }} />}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-[15px] font-black text-[#1a1a1a] tracking-tight">{selectedCreator?.label}</h3>
                                <p className="text-[12px] text-[var(--foreground-muted)] font-bold opacity-70">{selectedCreator?.desc}</p>
                            </div>
                            <button onClick={resetSelection} className="p-3 hover:bg-[#1a1a1a]/5 rounded-full transition-colors text-[var(--foreground-muted)] hover:text-[#1a1a1a]">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="relative overflow-hidden rounded-[40px] bg-white border border-[var(--border)] shadow-2xl">
                            <div className="px-6 pt-5 flex items-center justify-between">
                                <label className="text-[11px] font-black uppercase tracking-[0.3em] text-[#1a1a1a] opacity-30">Source Material</label>
                                <span className={`text-[11px] font-mono font-black tracking-tighter ${charPercentage > 80 ? 'text-[var(--crimson)]' : 'text-[var(--foreground-muted)]/40'}`}>
                                    {inputText.length > 0 ? `${inputText.length.toLocaleString()} / ${MAX_CHARS.toLocaleString()}` : ''}
                                </span>
                            </div>
                            <div className="relative p-6">
                                {isUploading && (
                                    <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center rounded-[32px] gap-4">
                                        <div className="relative w-14 h-14">
                                            <div className="absolute inset-0 rounded-full border-2 border-[var(--blue)]/10" />
                                            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--blue)] shadow-[0_0_20px_var(--blue-glow)] animate-spin" />
                                        </div>
                                        <p className="text-[11px] font-black text-[#1a1a1a] uppercase tracking-[0.4em]">{uploadStatus}</p>
                                    </div>
                                )}
                                <textarea
                                    value={inputText}
                                    onChange={handleInputChange}
                                    placeholder="Paste lecture notes, syllabus, or raw data here..."
                                    className="w-full h-64 px-1 py-1 resize-none bg-transparent text-[#1a1a1a] placeholder:text-[var(--foreground-muted)] placeholder:opacity-40 text-[16px] leading-relaxed outline-none font-bold"
                                    style={{ scrollbarWidth: "none" }}
                                    autoFocus
                                    disabled={isUploading}
                                />
                            </div>
                            <div className="px-6 py-5 flex items-center justify-between bg-[#fcfbf9] border-t border-[var(--border)]">
                                <button
                                    onClick={handleFileUploadRequest}
                                    className="flex items-center gap-3 text-[12px] font-black text-[var(--blue)] hover:text-[var(--blue-dark)] uppercase tracking-[0.2em] transition-all group"
                                >
                                    <Upload size={16} strokeWidth={2.5} className="group-hover:-translate-y-1 transition-transform" />
                                    Teach The Professor
                                </button>
                                {inputText.length > 0 && inputText.length < 50 && (
                                    <span className="text-[11px] font-black text-[var(--amber)] uppercase tracking-tight italic">Min 50 chars required</span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="p-6 rounded-[32px] bg-white border border-[var(--border)] shadow-xl">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1a1a1a] opacity-30 mb-5 block">
                                    Density / Count
                                </label>
                                <div className="flex flex-wrap gap-2.5">
                                    {countOptions.map((count) => (
                                        <button
                                            key={count}
                                            onClick={() => setItemCount(count)}
                                            className={cn(
                                                "px-5 py-2.5 text-[12px] font-black transition-all rounded-2xl border",
                                                itemCount === count 
                                                ? 'bg-[var(--blue)] text-white border-[var(--blue)] shadow-[0_8px_16px_-4px_rgba(59,130,246,0.5)]' 
                                                : 'bg-[#fcfbf9] text-[var(--foreground-muted)] border-[var(--border)] hover:bg-[var(--border)]'
                                            )}
                                        >
                                            {count}
                                        </button>
                                    ))}
                                </div>
                            </div>
  
                            <div className="p-6 rounded-[32px] bg-white border border-[var(--border)] shadow-xl">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1a1a1a] opacity-30 mb-5 block">Professor&apos;s Rigor</label>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {difficultyOptions.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setDifficulty(opt.id as any)}
                                            className={cn(
                                                "p-4 text-left rounded-[20px] transition-all border",
                                                difficulty === opt.id 
                                                ? 'bg-[var(--blue)]/5 border-[var(--blue)]/30 shadow-md scale-[1.02]' 
                                                : 'bg-[#fcfbf9] border-[var(--border)] hover:bg-[var(--border)]'
                                            )}
                                        >
                                            <div className={cn("text-[12px] font-black flex items-center gap-2 mb-1.5", difficulty === opt.id ? 'text-[var(--blue)]' : 'text-[#1a1a1a]')}>
                                                <span>{opt.emoji}</span> {opt.label}
                                            </div>
                                            <p className="text-[10px] text-[var(--foreground-muted)] font-bold opacity-60 leading-tight">{opt.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {formatOptions[selectedType || ""] && (
                                <div className="p-6 rounded-[32px] bg-white border border-[var(--border)] shadow-xl">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1a1a1a] opacity-30 mb-5 block">Output Format</label>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {formatOptions[selectedType || ""].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setSelectedFormat(opt.id)}
                                                className={cn(
                                                    "p-4 text-left rounded-[20px] transition-all border",
                                                    selectedFormat === opt.id 
                                                    ? 'bg-[var(--cyan)]/5 border-[var(--cyan)]/30 shadow-md scale-[1.02]' 
                                                    : 'bg-[#fcfbf9] border-[var(--border)] hover:bg-[var(--border)]'
                                                )}
                                            >
                                                <div className={cn("text-[12px] font-black mb-1.5", selectedFormat === opt.id ? 'text-[var(--cyan)]' : 'text-[#1a1a1a]')}>
                                                    {opt.label}
                                                </div>
                                                <p className="text-[10px] text-[var(--foreground-muted)] font-bold opacity-60 leading-tight">{opt.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(selectedType === "quiz" || selectedType === "match") && (
                                <div className="p-6 rounded-[32px] bg-white border border-[var(--border)] shadow-xl">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1a1a1a] opacity-30 mb-5 block">Time Pressure</label>
                                    <div className="flex flex-wrap gap-2.5">
                                        {timerOptions.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setTimerValue(opt.id)}
                                                className={cn(
                                                    "px-4 py-2 text-[12px] font-black transition-all rounded-2xl border",
                                                    timerValue === opt.id 
                                                    ? 'bg-[var(--crimson)] text-white border-[var(--crimson)] shadow-[0_8px_16px_-4px_rgba(220,38,38,0.3)]' 
                                                    : 'bg-[#fcfbf9] border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--border)]'
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleGenerate}
                                disabled={!canGenerate}
                                className={cn(
                                    "w-full py-5 rounded-[24px] font-black text-[14px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 relative overflow-hidden group shadow-2xl",
                                    !canGenerate 
                                    ? 'opacity-70 cursor-not-allowed bg-[var(--bg-2)] border border-[var(--border)] text-[var(--foreground-muted)]' 
                                    : 'bg-[var(--blue)] text-white hover:scale-[1.01] active:scale-[0.98]'
                                )}
                            >
                                {canGenerate && (
                                    <>
                                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                    </>
                                )}
                                <Zap size={20} strokeWidth={2.5} className={canGenerate ? "animate-pulse" : ""} />
                                <span className="relative z-10">Initialize Generation</span>
                                <span className="text-[10px] opacity-60 font-mono ml-1">(-{selectedCreator?.cost} CR)</span>
                            </button>
                        </div>

                        {setupError && (
                            <div className="flex items-center justify-between p-4 rounded-[24px] bg-[var(--crimson)]/10 border border-[var(--crimson)]/20 animate-in shake duration-500">
                                <div className="flex items-center gap-3 text-[12px] font-black text-[var(--crimson)] uppercase tracking-wider">
                                    <AlertTriangle size={18} strokeWidth={2.5} />
                                    {setupError}
                                </div>
                                <button
                                    onClick={() => { setSetupError(null); }}
                                    className="px-4 py-2 bg-[var(--crimson)]/20 text-[var(--crimson)] text-[10px] uppercase tracking-[0.2em] font-black rounded-xl hover:bg-[var(--crimson)]/30 transition-colors"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </StandardContainer>

            <KnowledgeIngestModal 
                onSuccess={handleIngestSuccess} 
                onStartSprint={handleGenerate}
                title={isSprintMode ? "Initialize Exam Sprint" : undefined}
                description={isSprintMode ? "Upload your materials and the Professor will prepare your 10-hour survival kit." : undefined}
                isSprint={isSprintMode}
            />
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
