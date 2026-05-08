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
            {
                id: "cornell",
                label: "Cornell Notes",
                desc: "Elite structured note system",
                icon: BookOpen,
                color: "var(--emerald)",
                apiEndpoint: "/api/generate/summary",
                cost: 2,
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
            {
                id: "review",
                label: "Academic Audit",
                desc: "Find blind spots in your knowledge",
                icon: ShieldAlert,
                color: "var(--crimson)",
                apiEndpoint: "/api/generate/remark",
                cost: 2,
            },
        ]
    },
    {
        id: "predict",
        number: 4,
        title: "Predict",
        tools: [
            {
                id: "roadmap",
                label: "Syllabus Architect",
                desc: "Master your entire semester",
                icon: MapIcon,
                color: "var(--violet)",
                apiEndpoint: "/api/generate/roadmap",
                cost: 2,
            },
        ]
    }
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
    roadmap: [
        { id: "chronological", label: "Phase-based", desc: "Step-by-step" },
        { id: "thematic", label: "Thematic", desc: "Cluster-based" },
    ],
    eli5: [
        { id: "analogy", label: "Vivid Analogy", desc: "Best for intuition" },
        { id: "metaphor", label: "Poetic Metaphor", desc: "Creative links" },
    ],
    cornell: [
        { id: "standard", label: "Standard", desc: "Full Cornell spec" },
        { id: "digital", label: "Digital First", desc: "Optimized for screens" },
    ],
    review: [
        { id: "gap_analysis", label: "Gap Analysis", desc: "Find what's missing" },
        { id: "contradiction", label: "Logical Audit", desc: "Check for errors" },
    ]
};

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
    const canGenerate = inputText.trim().length > 50 && selectedType;

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
            setSelectedType("summary");
            setInputText(text.substring(0, MAX_CHARS));
        } else {
            setInputText(prev => prev + (prev ? '\n\n' : '') + text.substring(0, MAX_CHARS));
        }
    };

    const handleGenerate = () => {
        if (!inputText.trim() || !selectedType) return;
        
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
    };

    return (
        <div className="min-h-screen bg-transparent text-[var(--foreground)] pb-28 pt-20 relative overflow-x-hidden">
            <StandardContainer wide={!selectedType}>
                {!selectedType ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="mb-10 sm:mb-16 text-center sm:text-left">
                            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4 leading-tight">
                                The Study <span className="text-[var(--blue)]">Journey</span>
                            </h1>
                            <p className="text-sm sm:text-base text-[var(--foreground-muted)] font-medium leading-relaxed max-w-lg opacity-80 mx-auto sm:mx-0">
                                Don&apos;t just read. Master. Follow the Professor&apos;s four-phase methodology to convert raw data into exam-day dominance.
                            </p>
                        </div>

                        <div className="mb-12">
                            <ExamSprintCard onClick={handleExamSprint} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-400 space-y-6">
                        <div className="flex items-center gap-4 p-4 rounded-3xl bg-[var(--bg-2)] border border-[var(--border)] shadow-xl">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: `color-mix(in srgb, ${selectedCreator?.color}, transparent 90%)` }}>
                                {selectedCreator && <selectedCreator.icon size={20} strokeWidth={2} style={{ color: selectedCreator?.color }} />}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-black text-[var(--foreground)] tracking-tight">{selectedCreator?.label}</h3>
                                <p className="text-[11px] text-[var(--foreground-muted)] font-medium opacity-80">{selectedCreator?.desc}</p>
                            </div>
                            <button onClick={resetSelection} className="p-2 hover:bg-[var(--foreground)]/5 rounded-full transition-colors text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="relative overflow-hidden rounded-3xl bg-[var(--bg-2)] border border-[var(--border)] shadow-2xl">
                            <div className="px-5 pt-4 flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] opacity-60">Source Material</label>
                                <span className={`text-[10px] font-mono font-black tracking-tighter ${charPercentage > 80 ? 'text-[var(--crimson)]' : 'text-[var(--foreground-muted)]/60'}`}>
                                    {inputText.length > 0 ? `${inputText.length.toLocaleString()} / ${MAX_CHARS.toLocaleString()}` : ''}
                                </span>
                            </div>
                            <div className="relative p-5">
                                {isUploading && (
                                    <div className="absolute inset-0 z-10 bg-transparent/90 backdrop-blur-md flex flex-col items-center justify-center rounded-xl gap-4">
                                        <div className="relative w-12 h-12">
                                            <div className="absolute inset-0 rounded-full border-2 border-[var(--blue)]/10" />
                                            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--blue)] shadow-[0_0_15px_var(--blue-glow)] animate-spin" />
                                        </div>
                                        <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-[0.3em]">{uploadStatus}</p>
                                    </div>
                                )}
                                <textarea
                                    value={inputText}
                                    onChange={handleInputChange}
                                    placeholder="Paste lecture notes, syllabus, or raw data here..."
                                    className="w-full h-56 px-1 py-1 resize-none bg-transparent text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] placeholder:opacity-60 text-[15px] leading-relaxed outline-none font-medium"
                                    style={{ scrollbarWidth: "none" }}
                                    autoFocus
                                    disabled={isUploading}
                                />
                            </div>
                            <div className="px-5 py-4 flex items-center justify-between bg-white/[0.02] border-t border-[var(--border)]">
                                <button
                                    onClick={handleFileUploadRequest}
                                    className="flex items-center gap-2 text-[11px] font-black text-[var(--foreground-muted)] hover:text-[var(--blue)] uppercase tracking-widest transition-all group"
                                >
                                    <Upload size={14} strokeWidth={2} className="group-hover:-translate-y-0.5 transition-transform" />
                                    Teach The Professor
                                </button>
                                {inputText.length > 0 && inputText.length < 50 && (
                                    <span className="text-[10px] font-black text-[var(--amber)] uppercase tracking-tight italic">Min 50 chars required</span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-5 rounded-3xl bg-[var(--bg-2)] border border-[var(--border)] shadow-xl">
                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] opacity-60 mb-4 block">
                                    {selectedType === "summary" || selectedType === "cornell" ? "Detail Level" : "Density / Count"}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {(selectedType === "summary" || selectedType === "cornell" ? [3, 5, 8, 12] : countOptions).map((count) => (
                                        <button
                                            key={count}
                                            onClick={() => setItemCount(count)}
                                            className={cn(
                                                "px-4 py-2 text-[11px] font-black transition-all rounded-xl border",
                                                itemCount === count 
                                                ? 'bg-[var(--blue)] text-white border-[var(--blue)] shadow-[0_4px_12px_var(--blue-glow)]' 
                                                : 'bg-white/5 text-[var(--foreground-muted)] border-white/5 hover:bg-white/10'
                                            )}
                                        >
                                            {selectedType === "summary" || selectedType === "cornell" ? (count < 5 ? "Concise" : count < 10 ? "Standard" : "Extensive") : count}
                                        </button>
                                    ))}
                                </div>
                            </div>
  
                            <div className="p-5 rounded-3xl bg-[var(--bg-2)] border border-[var(--border)] shadow-xl">
                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] opacity-60 mb-4 block">Professor&apos;s Rigor</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {difficultyOptions.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setDifficulty(opt.id as any)}
                                            className={cn(
                                                "p-3 text-left rounded-2xl transition-all border",
                                                difficulty === opt.id 
                                                ? 'bg-[var(--blue)]/10 border-[var(--blue)]/40 shadow-lg' 
                                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                                            )}
                                        >
                                            <div className={cn("text-[11px] font-black flex items-center gap-2 mb-1", difficulty === opt.id ? 'text-[var(--blue)]' : 'text-[var(--foreground)]')}>
                                                <span>{opt.emoji}</span> {opt.label}
                                            </div>
                                            <p className="text-[9px] text-[var(--foreground-muted)] font-medium opacity-60 px-1 truncate leading-tight">{opt.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {formatOptions[selectedType || ""] && (
                                <div className="p-5 rounded-3xl bg-[var(--bg-2)] border border-[var(--border)] shadow-xl">
                                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] opacity-60 mb-4 block">Output Format</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {formatOptions[selectedType || ""].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setSelectedFormat(opt.id)}
                                                className={cn(
                                                    "p-3 text-left rounded-2xl transition-all border",
                                                    selectedFormat === opt.id 
                                                    ? 'bg-[var(--cyan)]/10 border-[var(--cyan)]/40 shadow-lg' 
                                                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                                                )}
                                            >
                                                <div className={cn("text-[11px] font-black mb-1", selectedFormat === opt.id ? 'text-[var(--cyan)]' : 'text-[var(--foreground)]')}>
                                                    {opt.label}
                                                </div>
                                                <p className="text-[9px] text-[var(--foreground-muted)] font-medium opacity-60 truncate leading-tight">{opt.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(selectedType === "quiz" || selectedType === "match") && (
                                <div className="p-5 rounded-3xl bg-[var(--bg-2)] border border-[var(--border)] shadow-xl">
                                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] opacity-60 mb-4 block">Time Pressure</label>
                                    <div className="flex flex-wrap gap-2">
                                        {timerOptions.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setTimerValue(opt.id)}
                                                className={cn(
                                                    "px-3 py-1.5 text-[11px] font-black transition-all rounded-xl border",
                                                    timerValue === opt.id 
                                                    ? 'bg-[var(--crimson)]/10 border-[var(--crimson)] text-[var(--crimson)] shadow-md' 
                                                    : 'bg-white/5 border-white/5 text-[var(--foreground-muted)] hover:bg-white/10'
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
                title={isSprintMode ? "Initialize Exam Sprint" : undefined}
                description={isSprintMode ? "Upload your materials and the Professor will prepare your 10-hour survival kit." : undefined}
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
