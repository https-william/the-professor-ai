"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";

const MAX_CHARS = 50000;

// Custom colorful SVG icons for each creator type
const FlashcardsIcon = () => (
    <svg viewBox="0 0 64 64" className="w-12 h-12">
        <defs>
            <linearGradient id="flashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F4845F" />
                <stop offset="100%" stopColor="#FF6B9D" />
            </linearGradient>
        </defs>
        <rect x="8" y="16" width="40" height="32" rx="4" fill="#FEE2E2" stroke="#F4845F" strokeWidth="2" />
        <rect x="16" y="8" width="40" height="32" rx="4" fill="url(#flashGrad)" />
        <path d="M26 20 L46 20 M26 28 L40 28" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="30" cy="32" r="3" fill="white" fillOpacity="0.5" />
    </svg>
);

const ExamIcon = () => (
    <svg viewBox="0 0 64 64" className="w-12 h-12">
        <defs>
            <linearGradient id="examGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#69B7A4" />
                <stop offset="100%" stopColor="#4ECDC4" />
            </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="24" fill="url(#examGrad)" />
        <path d="M22 32 L28 38 L42 24" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="48" cy="16" r="8" fill="#FFD93D" stroke="#FFA500" strokeWidth="2" />
        <text x="48" y="20" textAnchor="middle" fill="#7c5000" fontSize="10" fontWeight="bold">?</text>
    </svg>
);

const SummaryIcon = () => (
    <svg viewBox="0 0 64 64" className="w-12 h-12">
        <defs>
            <linearGradient id="sumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
        </defs>
        <rect x="12" y="8" width="40" height="48" rx="4" fill="url(#sumGrad)" />
        <path d="M20 20 L44 20 M20 28 L40 28 M20 36 L44 36 M20 44 L32 44" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="48" cy="48" r="10" fill="#FDE047" stroke="#F59E0B" strokeWidth="2" />
        <path d="M45 48 L51 48 M48 45 L48 51" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const MindMapIcon = () => (
    <svg viewBox="0 0 64 64" className="w-12 h-12">
        <defs>
            <linearGradient id="mindGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FB923C" />
                <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="12" fill="url(#mindGrad)" />
        <circle cx="16" cy="16" r="8" fill="#38BDF8" />
        <circle cx="48" cy="16" r="8" fill="#A78BFA" />
        <circle cx="48" cy="48" r="8" fill="#4ADE80" />
        <circle cx="16" cy="48" r="8" fill="#FB7185" />
        <path d="M24 24 L32 32 M40 24 L32 32 M24 40 L32 32 M40 40 L32 32" stroke="#94A3B8" strokeWidth="2" />
        <circle cx="32" cy="32" r="4" fill="white" />
    </svg>
);

const PodcastIcon = () => (
    <svg viewBox="0 0 64 64" className="w-12 h-12">
        <defs>
            <linearGradient id="podGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="24" fill="url(#podGrad)" fillOpacity="0.1" />
        <rect x="22" y="16" width="20" height="32" rx="10" fill="url(#podGrad)" />
        <line x1="16" y1="32" x2="10" y2="32" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
        <line x1="48" y1="32" x2="54" y2="32" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
        <path d="M22 28 C22 28 32 28 32 24 C32 20 22 20 22 20" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
        <circle cx="32" cy="36" r="4" fill="white" />
    </svg>
);

const creatorTypes = [
    {
        id: "flashcards",
        Icon: FlashcardsIcon,
        label: "Flashcards",
        desc: "Turn your notes into study cards",
        gradient: "from-[#F4845F]/20 via-[#FF6B9D]/10 to-transparent",
        borderColor: "border-[#F4845F]/30",
        shadowColor: "shadow-[#F4845F]/20",
        apiEndpoint: "/api/generate/flashcards",
    },
    {
        id: "quiz",
        Icon: ExamIcon,
        label: "Exam Questions",
        desc: "Predict what might appear on your test",
        gradient: "from-[#69B7A4]/20 via-[#4ECDC4]/10 to-transparent",
        borderColor: "border-[#69B7A4]/30",
        shadowColor: "shadow-[#69B7A4]/20",
        popular: true,
        apiEndpoint: "/api/generate/quiz",
    },
    {
        id: "summary",
        Icon: SummaryIcon,
        label: "Smart Summary",
        desc: "Condense pages into key points",
        gradient: "from-[#A78BFA]/20 via-[#8B5CF6]/10 to-transparent",
        borderColor: "border-[#A78BFA]/30",
        shadowColor: "shadow-[#A78BFA]/20",
        apiEndpoint: "/api/generate/summary",
    },
    {
        id: "podcast",
        Icon: PodcastIcon,
        label: "Study Cast",
        desc: "Listen to a deep dive discussion",
        gradient: "from-[#ef4444]/20 via-[#b91c1c]/10 to-transparent",
        borderColor: "border-[#ef4444]/30",
        shadowColor: "shadow-[#ef4444]/20",
        apiEndpoint: "/api/generate/podcast",
    },
    {
        id: "mindmap",
        Icon: MindMapIcon,
        label: "Mind Map",
        desc: "Visualize concept connections",
        gradient: "from-[#FB923C]/20 via-[#F97316]/10 to-transparent",
        borderColor: "border-[#FB923C]/30",
        shadowColor: "shadow-[#FB923C]/20",
        apiEndpoint: "/api/generate/mindmap",
        comingSoon: true,
    },
];

interface GenerationResult {
    type: string;
    title: string;
    data: any;
}

export default function CreatePage() {
    const router = useRouter();
    const { user } = useUser();
    const { resolvedTheme, toggleTheme } = useTheme();
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [inputText, setInputText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [generatingStatus, setGeneratingStatus] = useState("");
    const [streamingItems, setStreamingItems] = useState<any[]>([]);

    // Count and Difficulty Options
    const [itemCount, setItemCount] = useState(10);
    const [difficulty, setDifficulty] = useState<"easy" | "medium" | "difficult" | "nightmare">("medium");

    const countOptions = [5, 10, 20, 30, 45, 60, 70];
    const difficultyOptions = [
        { id: "easy", label: "Easy", desc: "Basic recall", color: "bg-green-500" },
        { id: "medium", label: "Medium", desc: "Conceptual", color: "bg-yellow-500" },
        { id: "difficult", label: "Difficult", desc: "Application", color: "bg-orange-500" },
        { id: "nightmare", label: "Nightmare", desc: "Expert traps", color: "bg-red-600" },
    ];

    // Content Transformations
    const [summaryStyle, setSummaryStyle] = useState<"concise" | "detailed" | "study">("concise");

    // Episode Profiles (Podcast Styles)
    const [podcastStyle, setPodcastStyle] = useState<"educational" | "casual" | "debate">("educational");

    const summaryStyles = [
        { id: "concise", label: "Bullet Points", icon: "format_list_bulleted" },
        { id: "detailed", label: "Detailed", icon: "article" },
        { id: "study", label: "Study Guide", icon: "school" },
    ];

    const podcastStyles = [
        { id: "educational", label: "Educational", desc: "Clear explanations" },
        { id: "casual", label: "Casual Chat", desc: "Friendly banter" },
        { id: "debate", label: "Debate", desc: "Two perspectives" },
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= MAX_CHARS) {
            setInputText(value);
        }
    };

    const handleGenerate = async () => {
        if (!inputText.trim() || !selectedType) return;

        const creator = creatorTypes.find(c => c.id === selectedType);
        if (!creator?.apiEndpoint) {
            setError("This feature is coming soon!");
            return;
        }

        setIsGenerating(true);
        setError(null);
        setResult(null);
        setStreamingItems([]);
        setGeneratingStatus("Starting...");

        try {
            const response = await fetch(creator.apiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: inputText,
                    count: itemCount,
                    difficulty: difficulty,
                    style: selectedType === "summary" ? summaryStyle :
                        selectedType === "podcast" ? podcastStyle : undefined,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Generation failed");
            }

            // Handle SSE streaming
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let resultTitle = "";
            const items: any[] = [];

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));

                                if (data.status === 'generating') {
                                    setGeneratingStatus(data.message);
                                } else if (data.type === 'flashcard') {
                                    items.push(data.card);
                                    setStreamingItems([...items]);
                                } else if (data.type === 'question') {
                                    items.push(data.question);
                                    setStreamingItems([...items]);
                                } else if (data.type === 'section') {
                                    items.push(data.section);
                                    setStreamingItems([...items]);
                                } else if (data.type === 'title') {
                                    resultTitle = data.title;
                                } else if (data.status === 'complete') {
                                    resultTitle = data.title || resultTitle;
                                    setResult({
                                        type: selectedType,
                                        title: resultTitle,
                                        data: items,
                                    });
                                } else if (data.status === 'error') {
                                    throw new Error(data.message);
                                }
                            } catch (parseErr) {
                                // Ignore parse errors for incomplete chunks
                            }
                        }
                    }
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsGenerating(false);
            setGeneratingStatus("");
        }
    };

    const handleStartStudy = () => {
        if (!result) return;

        // Store result in sessionStorage for now
        sessionStorage.setItem("generatedContent", JSON.stringify(result));

        if (result.type === "flashcards") {
            router.push("/flashcards");
        } else if (result.type === "quiz") {
            router.push("/quiz");
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const selectedCreator = creatorTypes.find(c => c.id === selectedType);
    const charPercentage = (inputText.length / MAX_CHARS) * 100;

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
            {/* Ambient Blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="blob blob-teal absolute w-[500px] h-[500px] top-[10%] right-[25%] animate-float" />
                <div className="blob blob-coral absolute w-[400px] h-[400px] bottom-[15%] left-[15%]" style={{ animationDelay: "2s" }} />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-6 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[var(--accent)] text-xl">auto_awesome</span>
                    </div>
                    <div>
                        <h1 className="text-base font-medium text-[var(--foreground)]">Create</h1>
                        <p className="text-xs text-[var(--foreground-secondary)]">Generate study materials</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">
                            {resolvedTheme === "light" ? "dark_mode" : "light_mode"}
                        </span>
                    </button>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--secondary)]/10 border border-[var(--secondary)]/20">
                        <span className="text-sm">💎</span>
                        <span className="text-[var(--secondary)] text-xs font-semibold">{user.credits}</span>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12">
                {!result ? (
                    <>
                        {/* Title */}
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-[var(--foreground)] mb-3">
                                What do you want to create?
                            </h2>
                            <p className="text-[var(--foreground-secondary)] text-lg">
                                Transform your notes, lectures, and documents into powerful study materials
                            </p>
                        </div>

                        {/* Creator Type Buttons */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                            {creatorTypes.map((creator) => {
                                const isSelected = selectedType === creator.id;
                                const Icon = creator.Icon;

                                return (
                                    <button
                                        key={creator.id}
                                        onClick={() => !creator.comingSoon && setSelectedType(creator.id)}
                                        disabled={creator.comingSoon}
                                        className={`
                                            relative group p-6 rounded-3xl text-left transition-all duration-300
                                            bg-gradient-to-br ${creator.gradient}
                                            border-2 ${isSelected ? creator.borderColor : 'border-transparent'}
                                            hover:border-opacity-100 hover:shadow-xl ${creator.shadowColor}
                                            backdrop-blur-sm
                                            ${isSelected ? 'scale-[1.02] shadow-lg ' + creator.shadowColor : 'hover:scale-[1.01]'}
                                            ${creator.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}
                                            glass-button
                                        `}
                                    >
                                        {creator.popular && (
                                            <span className="absolute -top-2 right-4 px-2.5 py-0.5 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold uppercase tracking-wide shadow-md">
                                                Popular
                                            </span>
                                        )}
                                        {creator.comingSoon && (
                                            <span className="absolute -top-2 right-4 px-2.5 py-0.5 rounded-full bg-[var(--foreground-muted)] text-white text-[10px] font-bold uppercase tracking-wide shadow-md">
                                                Soon
                                            </span>
                                        )}

                                        {isSelected && (
                                            <span className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-md">
                                                <span className="material-symbols-outlined text-white text-sm">check</span>
                                            </span>
                                        )}

                                        <div className={`
                                            w-16 h-16 rounded-2xl mb-4
                                            flex items-center justify-center
                                            bg-[var(--card)] shadow-inner
                                            transition-transform duration-300
                                            group-hover:scale-110 group-hover:rotate-2
                                            ${isSelected ? 'scale-110' : ''}
                                        `}>
                                            <Icon />
                                        </div>

                                        <h3 className="text-[var(--foreground)] font-semibold mb-1">{creator.label}</h3>
                                        <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">{creator.desc}</p>

                                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content Input */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div
                                className={`card p-6 rounded-2xl transition-all ${dragActive ? 'ring-2 ring-[var(--accent)]' : ''}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[var(--foreground)] font-medium">Your content</h3>
                                    <span className={`text-xs ${charPercentage > 80 ? 'text-[var(--warning)]' : 'text-[var(--foreground-muted)]'}`}>
                                        {inputText.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                                    </span>
                                </div>

                                <textarea
                                    value={inputText}
                                    onChange={handleInputChange}
                                    placeholder="Paste your notes, lecture transcript, textbook excerpt, or any content you want to transform..."
                                    className="w-full h-48 resize-none bg-transparent text-[var(--foreground)] placeholder-[var(--foreground-muted)] text-sm leading-relaxed focus:outline-none"
                                />

                                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.doc,.docx,.txt"
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 text-xs text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-base">attach_file</span>
                                        Drag & drop files here, or <span className="text-[var(--accent)] font-medium">browse</span>
                                    </button>
                                </div>
                            </div>

                            {/* Action Card */}
                            <div className="card p-6 rounded-2xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-[var(--accent)]">auto_awesome</span>
                                    <h3 className="text-[var(--foreground)] font-medium">
                                        {selectedCreator?.label || 'Select a type'} Preview
                                    </h3>
                                </div>

                                {error && (
                                    <div className="p-4 rounded-xl bg-[var(--error)]/10 text-[var(--error)] text-sm mb-4">
                                        {error}
                                    </div>
                                )}

                                {inputText.trim() && selectedType ? (
                                    <div className="space-y-3">
                                        <div className="p-4 rounded-xl bg-[var(--background-tertiary)]">
                                            <p className="text-sm text-[var(--foreground-secondary)]">
                                                Ready to generate {selectedCreator?.label.toLowerCase()} from {inputText.length.toLocaleString()} characters
                                            </p>
                                        </div>

                                        {/* Count & Difficulty for Flashcards/Quiz */}
                                        {(selectedType === "flashcards" || selectedType === "quiz") && (
                                            <div className="p-4 rounded-xl border border-[var(--border)] space-y-4">
                                                {/* Count Selector */}
                                                <div>
                                                    <p className="text-xs text-[var(--foreground-muted)] mb-2">Number of Items</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {countOptions.map((count) => (
                                                            <button
                                                                key={count}
                                                                onClick={() => setItemCount(count)}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${itemCount === count
                                                                        ? 'bg-[var(--accent)] text-white'
                                                                        : 'bg-[var(--background-tertiary)] text-[var(--foreground-secondary)] hover:bg-[var(--border)]'
                                                                    }`}
                                                            >
                                                                {count}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Difficulty Selector */}
                                                <div>
                                                    <p className="text-xs text-[var(--foreground-muted)] mb-2">Difficulty Level</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {difficultyOptions.map((opt) => (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => setDifficulty(opt.id as any)}
                                                                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${difficulty === opt.id
                                                                        ? 'bg-[var(--accent)] text-white ring-2 ring-[var(--accent)]/30'
                                                                        : 'bg-[var(--background-tertiary)] text-[var(--foreground-secondary)] hover:bg-[var(--border)]'
                                                                    }`}
                                                            >
                                                                <span className={`w-2 h-2 rounded-full ${opt.color}`}></span>
                                                                <div className="text-left">
                                                                    <span className="block font-semibold">{opt.label}</span>
                                                                    <span className={`text-[10px] ${difficulty === opt.id ? 'text-white/70' : 'text-[var(--foreground-muted)]'}`}>
                                                                        {opt.desc}
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Summary Style Selector */}
                                        {selectedType === "summary" && (
                                            <div className="p-4 rounded-xl border border-[var(--border)]">
                                                <p className="text-xs text-[var(--foreground-muted)] mb-3">Output Style</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {summaryStyles.map((style) => (
                                                        <button
                                                            key={style.id}
                                                            onClick={() => setSummaryStyle(style.id as any)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${summaryStyle === style.id
                                                                ? 'bg-[var(--accent)] text-white'
                                                                : 'bg-[var(--background-tertiary)] text-[var(--foreground-secondary)] hover:bg-[var(--border)]'
                                                                }`}
                                                        >
                                                            <span className="material-symbols-outlined text-sm">{style.icon}</span>
                                                            {style.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Podcast Style Selector (Episode Profile) */}
                                        {selectedType === "podcast" && (
                                            <div className="p-4 rounded-xl border border-[var(--border)]">
                                                <p className="text-xs text-[var(--foreground-muted)] mb-3">Episode Style</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {podcastStyles.map((style) => (
                                                        <button
                                                            key={style.id}
                                                            onClick={() => setPodcastStyle(style.id as any)}
                                                            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex flex-col items-start ${podcastStyle === style.id
                                                                ? 'bg-[var(--accent)] text-white ring-2 ring-[var(--accent)]/30'
                                                                : 'bg-[var(--background-tertiary)] text-[var(--foreground-secondary)] hover:bg-[var(--border)]'
                                                                }`}
                                                        >
                                                            <span className="font-semibold">{style.label}</span>
                                                            <span className={`text-[10px] ${podcastStyle === style.id ? 'text-white/70' : 'text-[var(--foreground-muted)]'}`}>
                                                                {style.desc}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleGenerate}
                                            disabled={isGenerating}
                                            className={`w-full py-4 rounded-xl font-medium text-white transition-all flex items-center justify-center gap-2 ${isGenerating
                                                ? 'bg-[var(--accent)]/50 cursor-wait'
                                                : 'bg-[var(--accent)] hover:bg-[var(--accent-dark)] shadow-lg shadow-[var(--accent)]/20'
                                                }`}
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                                    {generatingStatus || 'Generating...'}
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined">auto_awesome</span>
                                                    Generate {itemCount} {selectedCreator?.label}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-48 text-center">
                                        <span className="material-symbols-outlined text-4xl text-[var(--foreground-muted)]/30 mb-3">edit_note</span>
                                        <p className="text-sm text-[var(--foreground-muted)]">
                                            {!selectedType ? 'Select a creation type above' : 'Add content to get started'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    /* Result Display */
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-[var(--success)]/20 flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-[var(--success)] text-3xl">check_circle</span>
                            </div>
                            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                                {result.title || `Your ${result.type} is ready!`}
                            </h2>
                            <p className="text-[var(--foreground-secondary)]">
                                {result.type === "flashcards" && `${result.data.length} flashcards generated`}
                                {result.type === "quiz" && `${result.data.length} questions generated`}
                                {result.type === "summary" && "Summary generated"}
                            </p>
                        </div>

                        {/* Preview */}
                        <div className="card p-6 rounded-2xl mb-6">
                            {result.type === "flashcards" && (
                                <div className="space-y-3">
                                    {result.data.slice(0, 3).map((card: any, i: number) => (
                                        <div key={i} className="p-4 rounded-xl bg-[var(--background-tertiary)]">
                                            <p className="font-medium text-[var(--foreground)] mb-2">{card.front}</p>
                                            <p className="text-sm text-[var(--foreground-secondary)]">{card.back}</p>
                                        </div>
                                    ))}
                                    {result.data.length > 3 && (
                                        <p className="text-sm text-[var(--foreground-muted)] text-center">
                                            +{result.data.length - 3} more cards
                                        </p>
                                    )}
                                </div>
                            )}

                            {result.type === "quiz" && (
                                <div className="space-y-3">
                                    {result.data.slice(0, 2).map((q: any, i: number) => (
                                        <div key={i} className="p-4 rounded-xl bg-[var(--background-tertiary)]">
                                            <p className="font-medium text-[var(--foreground)] mb-2">Q{i + 1}: {q.question}</p>
                                            <div className="space-y-1">
                                                {q.options.map((opt: string, j: number) => (
                                                    <p key={j} className={`text-sm ${j === q.correctIndex ? 'text-[var(--success)]' : 'text-[var(--foreground-secondary)]'}`}>
                                                        {String.fromCharCode(65 + j)}. {opt}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {result.type === "summary" && (
                                <div>
                                    <p className="text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">{result.data.summary}</p>
                                    {result.data.keyPoints && (
                                        <ul className="mt-4 space-y-2">
                                            {result.data.keyPoints.map((point: string, i: number) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground-secondary)]">
                                                    <span className="text-[var(--accent)]">•</span>
                                                    {point}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            {result.type === "podcast" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center gap-4 mb-4">
                                        <button
                                            onClick={() => {
                                                // Simple TTS Logic
                                                const synth = window.speechSynthesis;
                                                const voices = synth.getVoices();
                                                const voice1 = voices.find(v => v.name.includes("Google US English")) || voices[0];
                                                const voice2 = voices.find(v => v.name.includes("Google UK English Male")) || voices[1];

                                                if (synth.speaking) {
                                                    synth.cancel();
                                                    return;
                                                }

                                                result.data.podcast.forEach((line: any) => {
                                                    const utterance = new SpeechSynthesisUtterance(line.text);
                                                    utterance.voice = line.speaker === "A" ? voice1 : voice2;
                                                    utterance.rate = 1.1; // Slightly faster natural speed
                                                    synth.speak(utterance);
                                                });
                                            }}
                                            className="w-16 h-16 rounded-full bg-[var(--accent)] text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                                        >
                                            <span className="material-symbols-outlined text-3xl">play_arrow</span>
                                        </button>
                                        <div className="text-sm text-[var(--foreground-secondary)]">
                                            <p className="font-medium">Listen to Note Overview</p>
                                            <p className="text-xs">Generated by {result.data.summary.length > 0 ? "DeepSeek" : "Gemini"}</p>
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto space-y-3 p-2 border border-[var(--border)] rounded-xl">
                                        {result.data.podcast.map((line: any, i: number) => (
                                            <div key={i} className={`flex gap-3 ${line.speaker === "B" ? "flex-row-reverse" : ""}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${line.speaker === "A" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>
                                                    {line.speaker}
                                                </div>
                                                <div className={`p-3 rounded-2xl text-sm max-w-[80%] ${line.speaker === "A" ? "bg-[var(--background-tertiary)] rounded-tl-none" : "bg-[var(--accent)]/10 text-[var(--foreground)] rounded-tr-none"}`}>
                                                    {line.text}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {result.type === "mindmap" && (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] font-mono text-xs overflow-x-auto">
                                        <pre>{result.data.mermaid}</pre>
                                    </div>
                                    <div className="flex justify-center">
                                        <a
                                            href={`https://mermaid.live/edit#pako:${btoa(JSON.stringify({ code: result.data.mermaid }))}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined">open_in_new</span>
                                            View in Mermaid Live
                                        </a>
                                    </div>
                                    <p className="text-xs text-center text-[var(--foreground-muted)]">
                                        Copy the code above or click to view the visual graph.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setResult(null)}
                                className="flex-1 py-3 rounded-xl bg-[var(--background-tertiary)] text-[var(--foreground)] font-medium hover:bg-[var(--border)] transition-all"
                            >
                                Create Another
                            </button>
                            {(result.type === "flashcards" || result.type === "quiz") && (
                                <button
                                    onClick={handleStartStudy}
                                    className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">play_arrow</span>
                                    Start Studying
                                </button>
                            )}
                        </div>
                    </div>
                )
                }
            </main >

            <style jsx>{`
                .glass-button {
                    box-shadow: 
                        0 4px 16px rgba(0, 0, 0, 0.06),
                        0 1px 2px rgba(0, 0, 0, 0.04),
                        inset 0 1px 0 rgba(255, 255, 255, 0.4);
                }
                .glass-button:hover {
                    box-shadow: 
                        0 8px 32px rgba(0, 0, 0, 0.12),
                        0 2px 4px rgba(0, 0, 0, 0.08),
                        inset 0 1px 0 rgba(255, 255, 255, 0.5);
                }
                :global(html.dark) .glass-button {
                    box-shadow: 
                        0 4px 16px rgba(0, 0, 0, 0.3),
                        0 1px 2px rgba(0, 0, 0, 0.2),
                        inset 0 1px 0 rgba(255, 255, 255, 0.05);
                }
                :global(html.dark) .glass-button:hover {
                    box-shadow: 
                        0 8px 32px rgba(0, 0, 0, 0.4),
                        0 2px 4px rgba(0, 0, 0, 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div >
    );
}
