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
import ProfessorCeremony from "@/components/ui/ProfessorCeremony";
import GuestSignupModal from "@/components/ui/GuestSignupModal";
import { createClient } from "@/lib/supabase/client";

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
        title: "Break it Down",
        tools: [
            {
                id: "summary",
                label: "The Core",
                desc: "Turn 50 pages into 5. Just the bits that actually matter.",
                icon: FileText,
                color: "var(--emerald)",
                apiEndpoint: "/api/generate/summary",
                cost: 2,
                popular: true,
            },
            {
                id: "eli5",
                label: "Vivid Analogy",
                desc: "Explain it like we're having a conversation. Simple and clear.",
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
        title: "Lock it In",
        tools: [
            {
                id: "flashcards",
                label: "Memory Cards",
                desc: "Active recall without the headache. Lock facts in fast.",
                icon: Layers,
                color: "var(--blue)",
                apiEndpoint: "/api/generate/flashcards",
                cost: 1,
            },
            {
                id: "match",
                label: "Match Studio",
                desc: "A quick game to prove you actually know your stuff.",
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
        title: "Final Check",
        tools: [
            {
                id: "quiz",
                label: "Mock Exam",
                desc: "Predict exactly what's coming. No surprises, just an ace.",
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
    { id: "easy", label: "Chilled", desc: "Basic recall & definitions", emoji: "🌱" },
    { id: "medium", label: "Scholar", desc: "Conceptual understanding", emoji: "📜" },
    { id: "difficult", label: "Advanced", desc: "Application & analysis", emoji: "🏛️" },
    { id: "nightmare", label: "Professor", desc: "Strict rigor. Deep focus required.", emoji: "🎓" },
];

const timerOptions = [
    { id: 0, label: "No Rush", desc: "Take your time" },
    { id: 300, label: "5 Min", desc: "Blitz session" },
    { id: 600, label: "10 Min", desc: "Standard flow" },
    { id: 1200, label: "20 Min", desc: "Deep focus" },
    { id: 1800, label: "30 Min", desc: "Full mock exam" },
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
    const { user, spendCredits } = useUser();
    const { openModal } = useIngestStore();
    const supabase = createClient();

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
    const [showGuestModal, setShowGuestModal] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && !user.isAuthenticated && !user.isLoading) {
            const isGuest = sessionStorage.getItem("shared_view") === "true";
            if (isGuest) {
                setShowGuestModal(true);
            }
        }
    }, [user.isAuthenticated, user.isLoading]);

    useEffect(() => {
        const tool = searchParams.get('tool');
        const validTools = allTools.map(t => t.id);
        if (tool && validTools.includes(tool)) {
            setSelectedType(tool);
            sessionStorage.removeItem("isExamSprint");
            setIsSprintMode(false);
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

    const handleGenerate = async () => {
        if (!inputText.trim()) return;

        const customTitle = sessionStorage.getItem("customGenerationTitle") || "";

        if (isSprintMode) {
            // Deduct credits for Exam Sprint (10 credits)
            if (user.isAuthenticated) {
                const success = await spendCredits(10);
                if (!success) {
                    setSetupError("Insufficient credits for Exam Sprint. Please acquire more credits.");
                    return;
                }
            }

            sessionStorage.setItem("examSprintContent", inputText);
            setIsGeneratingPack(true);

            const createPack = async () => {
                const packId = crypto.randomUUID();
                const cleanTitle = customTitle || (inputText.trim() ? inputText.trim().replace(/^[^a-zA-Z0-9]+/, '').split(/\s+/).slice(0, 6).join(" ").toUpperCase() : `STUDY PACK: ${new Date().toLocaleDateString()}`);
                
                try {
                    const { data: { user: authUser } } = await supabase.auth.getUser();
                    if (!authUser) {
                        const offlinePacks = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
                        offlinePacks[packId] = {
                            id: packId,
                            title: cleanTitle,
                            source_text: inputText,
                            phases_data: {},
                            user_id: "guest",
                            savedAt: Date.now()
                        };
                        localStorage.setItem("offline_study_packs", JSON.stringify(offlinePacks));
                        router.push(`/library/pack/${packId}?sprint=true`);
                        return;
                    }

                    const { error: dbError } = await supabase.from("study_packs").insert({
                        id: packId,
                        user_id: authUser.id,
                        title: cleanTitle,
                        description: "Comprehensive exam survival kit generated from your notes.",
                        source_text: inputText,
                        phases_data: {},
                    });

                    if (dbError) throw dbError;

                    router.push(`/library/pack/${packId}?sprint=true`);
                } catch (err) {
                    console.error("Failed to create pack in DB, falling back to offline storage:", err);
                    const offlinePacks = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
                    offlinePacks[packId] = {
                        id: packId,
                        title: cleanTitle,
                        source_text: inputText,
                        phases_data: {},
                        user_id: "guest",
                        savedAt: Date.now()
                    };
                    localStorage.setItem("offline_study_packs", JSON.stringify(offlinePacks));
                    router.push(`/library/pack/${packId}?sprint=true`);
                }
            };

            createPack();
            return;
        }

        if (!selectedType) return;
        
        sessionStorage.setItem("generateParams", JSON.stringify({
            content: inputText,
            count: itemCount,
            difficulty,
            timer: timerValue,
            format: selectedFormat,
            type: selectedType,
            title: customTitle
        }));
        
        router.push(`/${selectedType}/generate`);
    };

    const resetSelection = () => {
        setSelectedType(null);
        setInputText("");
        setSetupError(null);
        sessionStorage.removeItem("isExamSprint");
        sessionStorage.removeItem("examSprintContent");
        sessionStorage.removeItem("customGenerationTitle");
        setIsSprintMode(false);
        setIsGeneratingPack(false);
    };

    if (isGeneratingPack) {
        return (
            <div className="min-h-screen bg-transparent pt-20 flex flex-col items-center justify-center">
                <StandardContainer>
                    <div className="mb-8 text-center">
                        <button 
                            onClick={() => setIsGeneratingPack(false)}
                            className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-2"
                        >
                            <X size={14} /> Cancel Generation
                        </button>
                    </div>
                    <ProfessorCeremony className="w-full py-12" />
                </StandardContainer>
            </div>
        );
    }

    return (
        <div className="bg-[var(--bg)] text-[var(--foreground)] pb-24 pt-16 relative min-h-screen flex flex-col flex-1">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--blue-glow)] opacity-[0.03] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[var(--blue-glow)] opacity-[0.02] rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <StandardContainer wide>
                {!selectedType ? (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="mb-12 sm:mb-20 text-center sm:text-left">
                            <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-6 leading-[0.9] text-[var(--foreground)]">
                                The Study <span className="text-[var(--blue)]">Lab</span>
                            </h1>
                            <p className="text-base sm:text-lg text-[var(--foreground-muted)] font-bold leading-relaxed max-w-xl opacity-70 mx-auto sm:mx-0">
                                Your notes. Just the good parts. Let&apos;s break them down, lock them in, and get you back to your life. Your bed misses you.
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
                                    onSelectTool={(type) => { 
                                        setSelectedType(type); 
                                        sessionStorage.removeItem("isExamSprint"); 
                                        setIsSprintMode(false); 
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Two-column layout grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            
                            {/* Left Side: Workspace (8 cols on desktop) */}
                            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                                
                                {/* Refined Tool Header with subtle gradient matching tool theme */}
                                <div 
                                    className="flex items-center gap-4 p-5 rounded-[32px] bg-[var(--card)]/90 border transition-all duration-300 shadow-md"
                                    style={{ 
                                        borderColor: `color-mix(in srgb, ${selectedCreator?.color || 'var(--border)'}, transparent 80%)`,
                                        boxShadow: `0 10px 30px -10px color-mix(in srgb, ${selectedCreator?.color || 'transparent'}, transparent 95%)`
                                    }}
                                >
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                        style={{ 
                                            background: `color-mix(in srgb, ${selectedCreator?.color || 'var(--blue)'}, transparent 92%)`, 
                                            border: `1px solid color-mix(in srgb, ${selectedCreator?.color || 'var(--blue)'}, transparent 80%)` 
                                        }}
                                    >
                                        {selectedCreator && <selectedCreator.icon size={20} strokeWidth={2.2} style={{ color: selectedCreator?.color }} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-black text-[var(--foreground)] tracking-tight">{selectedCreator?.label}</h3>
                                        <p className="text-[11px] text-[var(--foreground-muted)] font-bold opacity-70 leading-normal">{selectedCreator?.desc}</p>
                                    </div>
                                    <button 
                                        onClick={resetSelection} 
                                        className="p-2 hover:bg-[var(--border)] rounded-full transition-colors text-[var(--foreground-muted)] hover:text-[var(--foreground)] shrink-0"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Source Material Textarea Workspace */}
                                <div className="relative overflow-hidden rounded-[32px] bg-[var(--card)] border border-[var(--border)] shadow-xl transition-all focus-within:border-[var(--blue)]/40 focus-within:shadow-[0_12px_40px_rgba(37,99,235,0.06)]">
                                    <div className="px-6 pt-5 flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground)] opacity-35">Source Material</label>
                                        <span className={`text-[10px] font-mono font-black tracking-tighter ${charPercentage > 80 ? 'text-[var(--crimson)]' : 'text-[var(--foreground-muted)]/40'}`}>
                                            {inputText.length > 0 ? `${inputText.length.toLocaleString()} / ${MAX_CHARS.toLocaleString()}` : ''}
                                        </span>
                                    </div>
                                    <div className="relative p-6">
                                        {isUploading && (
                                            <div className="absolute inset-0 z-10 bg-[var(--bg)]/80 backdrop-blur-md flex flex-col items-center justify-center rounded-[24px] gap-4">
                                                <div className="relative w-12 h-12">
                                                    <div className="absolute inset-0 rounded-full border-2 border-[var(--blue)]/10" />
                                                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--blue)] shadow-[0_0_20px_var(--blue-glow)] animate-spin" />
                                                </div>
                                                <p className="text-[10px] font-black text-[var(--foreground)] uppercase tracking-[0.4em]">{uploadStatus}</p>
                                            </div>
                                        )}
                                        <textarea
                                            value={inputText}
                                            onChange={handleInputChange}
                                            placeholder="Paste lecture notes, syllabus, or raw data here..."
                                            className="w-full h-80 px-1 py-1 resize-none bg-transparent text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/40 text-[15px] leading-relaxed outline-none font-bold"
                                            style={{ scrollbarWidth: "none" }}
                                            autoFocus
                                            disabled={isUploading}
                                        />
                                    </div>
                                    <div className="px-6 py-4 flex items-center justify-between bg-[var(--bg-3)]/60 border-t border-[var(--border)]">
                                        <button
                                            onClick={handleFileUploadRequest}
                                            className="flex items-center gap-2.5 text-[11px] font-black text-[var(--blue-text)] hover:text-[var(--blue)] uppercase tracking-[0.2em] transition-all group"
                                        >
                                            <Upload size={14} strokeWidth={2.5} className="group-hover:-translate-y-0.5 transition-transform" />
                                            Feed the Professor
                                        </button>
                                        {inputText.length > 0 && inputText.length < 50 && (
                                            <span className="text-[10px] font-black text-[var(--amber)] uppercase tracking-tight italic">Min 50 chars required</span>
                                        )}
                                    </div>
                                </div>

                                {/* Mission Name Card */}
                                <div className="p-6 rounded-[32px] bg-[var(--card)] border border-[var(--border)] shadow-md transition-all focus-within:border-[var(--blue)]/30">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground)] opacity-35 mb-3 block">The Mission</label>
                                    <input 
                                        type="text"
                                        defaultValue={sessionStorage.getItem("lastSprintName") || ""}
                                        placeholder="e.g., 'Bio-Chem Final Push' or 'Law 101 Ace'"
                                        className="w-full bg-[var(--bg-3)]/60 border border-[var(--border)] rounded-xl px-5 py-3.5 text-sm font-bold text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/30 focus:border-[var(--accent)]/30 focus:bg-[var(--bg-4)] outline-none transition-all sprint-title-input"
                                    />
                                    <p className="mt-3 text-[9px] text-[var(--foreground-muted)]/40 font-bold uppercase tracking-widest leading-relaxed">
                                        Give your session a name. It helps you focus when things get tough.
                                    </p>
                                </div>
                            </div>

                            {/* Right Side: Configuration Sidebar (4 cols on desktop) */}
                            <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-24">
                                
                                {/* Unified Configuration Panel Card */}
                                <div className="p-6 rounded-[32px] bg-[var(--card)] border border-[var(--border)] shadow-xl space-y-6">
                                    <div className="flex items-center gap-2 pb-4 border-b border-[var(--border)]">
                                        <div className="w-1.5 h-3 rounded-full bg-[var(--blue)]" />
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--foreground)] opacity-50">
                                            Study Settings
                                        </h3>
                                    </div>

                                    {/* Setting 1: Density / Count */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--foreground)] opacity-35 block">
                                            Density / Count
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {countOptions.map((count) => (
                                                <button
                                                    key={count}
                                                    onClick={() => setItemCount(count)}
                                                    className={cn(
                                                        "px-4 py-2 text-[11px] font-black transition-all rounded-xl border cursor-pointer",
                                                        itemCount === count 
                                                        ? 'bg-[var(--blue)] text-white border-[var(--blue)] shadow-md' 
                                                        : 'bg-[var(--bg-3)]/60 text-[var(--foreground-muted)] border-[var(--border)] hover:bg-[var(--border)]'
                                                    )}
                                                >
                                                    {count}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Setting 2: Rigor */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--foreground)] opacity-35 block">
                                            Professor&apos;s Rigor
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {difficultyOptions.map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setDifficulty(opt.id as any)}
                                                    className={cn(
                                                        "p-3 text-left rounded-xl transition-all border cursor-pointer flex flex-col justify-between h-20",
                                                        difficulty === opt.id 
                                                        ? 'bg-[var(--blue)]/5 border-[var(--blue)]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] scale-[1.01]' 
                                                        : 'bg-[var(--bg-3)]/60 border-[var(--border)] hover:bg-[var(--border)]'
                                                    )}
                                                >
                                                    <div className={cn("text-[11px] font-black flex items-center gap-1.5", difficulty === opt.id ? 'text-[var(--blue-text)]' : 'text-[var(--foreground)]')}>
                                                        <span>{opt.emoji}</span> {opt.label}
                                                    </div>
                                                    <p className="text-[9px] text-[var(--foreground-muted)] font-bold opacity-60 leading-snug">{opt.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Setting 3: Output Format (if applicable) */}
                                    {formatOptions[selectedType || ""] && (
                                        <div className="space-y-3 pt-2 border-t border-[var(--border)]/40">
                                            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--foreground)] opacity-35 block">Output Format</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {formatOptions[selectedType || ""].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => setSelectedFormat(opt.id)}
                                                        className={cn(
                                                            "p-3 text-left rounded-xl transition-all border cursor-pointer flex flex-col justify-between h-20",
                                                            selectedFormat === opt.id 
                                                            ? 'bg-[var(--cyan)]/5 border-[var(--cyan)]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] scale-[1.01]' 
                                                            : 'bg-[var(--bg-3)]/60 border-[var(--border)] hover:bg-[var(--border)]'
                                                        )}
                                                    >
                                                        <div className={cn("text-[11px] font-black", selectedFormat === opt.id ? 'text-[var(--cyan-text)]' : 'text-[var(--foreground)]')}>
                                                            {opt.label}
                                                        </div>
                                                        <p className="text-[9px] text-[var(--foreground-muted)] font-bold opacity-60 leading-snug">{opt.desc}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Setting 4: Time Pressure (if applicable) */}
                                    {(selectedType === "quiz" || selectedType === "match") && (
                                        <div className="space-y-3 pt-2 border-t border-[var(--border)]/40">
                                            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--foreground)] opacity-35 block">Time Pressure</label>
                                            <div className="flex flex-wrap gap-2">
                                                {timerOptions.map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => setTimerValue(opt.id)}
                                                        className={cn(
                                                            "px-3 py-2 text-[11px] font-black transition-all rounded-xl border cursor-pointer",
                                                            timerValue === opt.id 
                                                            ? 'bg-[var(--crimson)] text-white border-[var(--crimson)] shadow-md' 
                                                            : 'bg-[var(--bg-3)]/60 border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--border)]'
                                                        )}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions Group */}
                                <div className="space-y-4">
                                    <button
                                        id="ready-sprint-btn"
                                        onClick={() => {
                                            const input = document.querySelector('.sprint-title-input') as HTMLInputElement;
                                            const customTitle = input?.value || "";
                                            if (customTitle) sessionStorage.setItem("customGenerationTitle", customTitle);
                                            handleGenerate();
                                        }}
                                        disabled={!canGenerate}
                                        className={cn(
                                            "w-full py-4.5 rounded-[20px] font-black text-xs sm:text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 relative overflow-hidden group shadow-lg cursor-pointer",
                                            !canGenerate 
                                            ? 'opacity-70 cursor-not-allowed bg-[var(--bg-3)]/80 border border-[var(--border)] text-[var(--foreground-muted)]/40' 
                                            : 'bg-[var(--foreground)] text-[var(--background)] hover-scale-sm active:scale-[0.98]'
                                        )}
                                    >
                                        {canGenerate && (
                                            <>
                                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                            </>
                                        )}
                                        <Zap size={16} strokeWidth={2.5} className={canGenerate ? "animate-pulse" : ""} />
                                        <span className="relative z-10">I&apos;m Ready</span>
                                        <span className="text-[9px] opacity-60 font-mono ml-0.5">(-{selectedCreator?.cost} CR)</span>
                                    </button>

                                    {setupError && (
                                        <div className="flex items-center justify-between p-4 rounded-[20px] bg-[var(--crimson)]/10 border border-[var(--crimson)]/20 animate-in shake duration-500">
                                            <div className="flex items-center gap-2.5 text-[11px] font-black text-[var(--crimson)] uppercase tracking-wider">
                                                <AlertTriangle size={16} strokeWidth={2.5} className="shrink-0" />
                                                <span className="leading-snug">{setupError}</span>
                                            </div>
                                            <button
                                                onClick={() => { setSetupError(null); }}
                                                className="px-3 py-1.5 bg-[var(--crimson)]/20 text-[var(--crimson)] text-[9px] uppercase tracking-[0.2em] font-black rounded-lg hover:bg-[var(--crimson)]/30 transition-colors cursor-pointer shrink-0 ml-2"
                                            >
                                                Dismiss
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </StandardContainer>

            <KnowledgeIngestModal 
                onSuccess={handleIngestSuccess} 
                onStartSprint={handleGenerate}
                title={isSprintMode ? "Exam Sprint" : undefined}
                description={isSprintMode ? "Upload your materials and the Professor will prepare your 10-hour survival kit." : undefined}
                isSprint={isSprintMode}
            />

            <GuestSignupModal
                isOpen={showGuestModal}
                onClose={() => setShowGuestModal(false)}
            />
        </div>
    );
}

export default function CreatePage() {
    return (
        <Suspense fallback={<ProfessorCeremony className="min-h-screen" />}>
            <CreatorStudio />
        </Suspense>
    );
}
