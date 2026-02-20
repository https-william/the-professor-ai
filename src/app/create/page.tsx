"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";

const MAX_CHARS = 50000;

// ─── Creator Types ─────────────────────────────────────────────
const creatorTypes = [
    {
        id: "flashcards",
        label: "Flashcards",
        desc: "Turn notes into study cards you can flip through",
        longDesc: "AI reads your material and creates question-answer pairs perfect for memorization and active recall.",
        icon: "style",
        color: "#F4845F",
        gradient: "from-[#F4845F] to-[#FF6B9D]",
        apiEndpoint: "/api/generate/flashcards",
    },
    {
        id: "quiz",
        label: "Practice Exam",
        desc: "Predict what might appear on your test",
        longDesc: "Generate realistic exam questions with multiple choice options, just like the real thing.",
        icon: "quiz",
        color: "#69B7A4",
        gradient: "from-[#69B7A4] to-[#4ECDC4]",
        popular: true,
        apiEndpoint: "/api/generate/quiz",
    },
    {
        id: "summary",
        label: "Smart Summary",
        desc: "Condense pages into key takeaways",
        longDesc: "Get the essence of long readings in bullet points, detailed notes, or a structured study guide.",
        icon: "summarize",
        color: "#A78BFA",
        gradient: "from-[#A78BFA] to-[#8B5CF6]",
        apiEndpoint: "/api/generate/summary",
    },
    {
        id: "podcast",
        label: "Study Cast",
        desc: "Listen to a deep dive discussion",
        longDesc: "Two AI hosts discuss your material in a podcast format. Perfect for learning on the go.",
        icon: "podcasts",
        color: "#EF4444",
        gradient: "from-[#EF4444] to-[#B91C1C]",
        apiEndpoint: "/api/generate/podcast",
    },
    {
        id: "mindmap",
        label: "Mind Map",
        desc: "Visualize how concepts connect",
        longDesc: "See the relationships between ideas laid out visually for better understanding.",
        icon: "hub",
        color: "#FB923C",
        gradient: "from-[#FB923C] to-[#F97316]",
        apiEndpoint: "/api/generate/mindmap",
    },
];

interface GenerationResult {
    type: string;
    title: string;
    data: any;
}

// ─── Configuration Options ─────────────────────────────────────
const countOptions = [5, 10, 20, 30, 45, 60, 70];
const difficultyOptions = [
    { id: "easy", label: "Easy", desc: "Basic recall & definitions", emoji: "🟢" },
    { id: "medium", label: "Medium", desc: "Conceptual understanding", emoji: "🟡" },
    { id: "difficult", label: "Hard", desc: "Application & analysis", emoji: "🟠" },
    { id: "nightmare", label: "Nightmare", desc: "Expert-level traps", emoji: "🔴" },
];
const summaryStyles = [
    { id: "concise", label: "Bullet Points", icon: "format_list_bulleted", desc: "Quick key takeaways" },
    { id: "detailed", label: "Detailed Notes", icon: "article", desc: "Comprehensive breakdown" },
    { id: "study", label: "Study Guide", icon: "school", desc: "Exam-ready format" },
];
const podcastStyles = [
    { id: "educational", label: "Educational", desc: "Clear explanations", icon: "school" },
    { id: "casual", label: "Casual Chat", desc: "Friendly banter", icon: "chat" },
    { id: "debate", label: "Debate", desc: "Two perspectives", icon: "forum" },
];

export default function CreatePage() {
    const router = useRouter();
    const { user } = useUser();
    const { resolvedTheme, toggleTheme } = useTheme();

    // Core state
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [inputText, setInputText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [generatingStatus, setGeneratingStatus] = useState("");
    const [streamingItems, setStreamingItems] = useState<any[]>([]);

    // Configuration
    const [itemCount, setItemCount] = useState(10);
    const [difficulty, setDifficulty] = useState<"easy" | "medium" | "difficult" | "nightmare">("medium");
    const [summaryStyle, setSummaryStyle] = useState<"concise" | "detailed" | "study">("concise");
    const [podcastStyle, setPodcastStyle] = useState<"educational" | "casual" | "debate">("educational");

    // ─── Computed ───────────────────────────────────────────────
    const selectedCreator = creatorTypes.find(c => c.id === selectedType);
    const charPercentage = (inputText.length / MAX_CHARS) * 100;
    const canGenerate = inputText.trim().length > 50 && selectedType;

    // ─── Handlers ───────────────────────────────────────────────
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (e.target.value.length <= MAX_CHARS) setInputText(e.target.value);
    };

    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            const text = await file.text();
            setInputText(prev => prev + (prev ? '\n\n' : '') + text.substring(0, MAX_CHARS));
        } else {
            const formData = new FormData();
            formData.append('file', file);
            try {
                const res = await fetch('/api/parse', { method: 'POST', body: formData });
                if (res.ok) {
                    const data = await res.json();
                    setInputText(prev => prev + (prev ? '\n\n' : '') + (data.text || '').substring(0, MAX_CHARS));
                } else {
                    setError('Failed to parse file. Try pasting content instead.');
                }
            } catch {
                setError('Failed to parse file. Try pasting content instead.');
            }
        }
        e.target.value = '';
    }, []);

    const handleGenerate = async () => {
        if (!inputText.trim() || !selectedType) return;
        const creator = creatorTypes.find(c => c.id === selectedType);
        if (!creator?.apiEndpoint) return;

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
                    difficulty,
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
                    for (const line of chunk.split('\n')) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data.status === 'generating') setGeneratingStatus(data.message);
                                else if (data.type === 'flashcard') { items.push(data.card); setStreamingItems([...items]); }
                                else if (data.type === 'question') { items.push(data.question); setStreamingItems([...items]); }
                                else if (data.type === 'section') { items.push(data.section); setStreamingItems([...items]); }
                                else if (data.type === 'title') resultTitle = data.title;
                                else if (data.status === 'complete') {
                                    resultTitle = data.title || resultTitle;
                                    setResult({ type: selectedType, title: resultTitle, data: items.length > 0 ? items : data });
                                }
                                else if (data.status === 'error') throw new Error(data.message);
                            } catch { /* ignore parse errors for partial chunks */ }
                        }
                    }
                }
            }

            // For non-streaming (podcast) — handle JSON response
            if (!result && items.length === 0) {
                try {
                    const text = await response.clone().text();
                    const json = JSON.parse(text);
                    setResult({ type: selectedType, title: json.title || "Generated", data: json.podcast || json });
                } catch { /* streaming already handled it */ }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
        } finally {
            setIsGenerating(false);
            setGeneratingStatus("");
        }
    };

    const handleStartStudy = () => {
        if (!result) return;
        sessionStorage.setItem("generatedContent", JSON.stringify(result));
        if (result.type === "flashcards") router.push("/flashcards");
        else if (result.type === "quiz") router.push("/quiz");
        else if (result.type === "podcast") router.push("/podcast");
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === "dragenter" || e.type === "dragover");
    };

    const resetAll = () => {
        setResult(null);
        setSelectedType(null);
        setInputText("");
        setError(null);
        setStreamingItems([]);
    };

    // ─── RENDER ─────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute w-[600px] h-[600px] top-[-10%] right-[-10%] rounded-full bg-[var(--accent)]/5 blur-3xl" />
                <div className="absolute w-[400px] h-[400px] bottom-[10%] left-[-5%] rounded-full bg-[var(--secondary)]/5 blur-3xl" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-5 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                    {(selectedType || result) && (
                        <button
                            onClick={result ? resetAll : () => setSelectedType(null)}
                            className="p-1.5 -ml-1 rounded-lg hover:bg-[var(--background-tertiary)] transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                        </button>
                    )}
                    <div>
                        <h1 className="text-sm font-semibold text-[var(--foreground)]">Create</h1>
                        <p className="text-[10px] text-[var(--foreground-muted)]">
                            {result ? 'Your result is ready' : selectedType ? `${selectedCreator?.label}` : 'Choose a study tool'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={toggleTheme} className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all">
                        <span className="material-symbols-outlined text-lg">{resolvedTheme === "light" ? "dark_mode" : "light_mode"}</span>
                    </button>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                        <span className="text-xs">💎</span>
                        <span className="text-[var(--accent)] text-xs font-bold">{user.credits}</span>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-5 py-6 relative z-10">

                {/* ═══════════════════════════════════════════════════
                    VIEW 1: TOOL SELECTION (No type selected yet)
                   ═══════════════════════════════════════════════════ */}
                {!selectedType && !result && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Welcome */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 mb-4">
                                <span className="material-symbols-outlined text-[var(--accent)] text-sm">auto_awesome</span>
                                <span className="text-xs font-medium text-[var(--accent)]">AI-Powered Study Tools</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-2">
                                What do you want to create?
                            </h2>
                            <p className="text-sm text-[var(--foreground-secondary)] max-w-md mx-auto">
                                Paste your notes, select a tool, and let AI transform them into study materials in seconds.
                            </p>
                        </div>

                        {/* Tool Cards */}
                        <div className="space-y-3">
                            {creatorTypes.map((creator) => (
                                <button
                                    key={creator.id}
                                    onClick={() => setSelectedType(creator.id)}
                                    className="w-full group flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)]/30 hover:shadow-lg hover:shadow-[var(--accent)]/5 hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    {/* Icon */}
                                    <div
                                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${creator.gradient} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-200`}
                                        style={{ boxShadow: `0 4px 14px ${creator.color}33` }}
                                    >
                                        <span className="material-symbols-outlined text-white text-2xl">{creator.icon}</span>
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-[var(--foreground)]">{creator.label}</h3>
                                            {creator.popular && (
                                                <span className="px-1.5 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-[9px] font-bold uppercase">Popular</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[var(--foreground-muted)] mt-0.5 line-clamp-1">{creator.longDesc}</p>
                                    </div>

                                    {/* Arrow */}
                                    <span className="material-symbols-outlined text-[var(--foreground-muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all text-lg shrink-0">
                                        arrow_forward
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Tip */}
                        <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/10">
                            <span className="material-symbols-outlined text-[var(--accent)] text-lg mt-0.5">tips_and_updates</span>
                            <div>
                                <p className="text-xs font-medium text-[var(--foreground)] mb-0.5">New here?</p>
                                <p className="text-[11px] text-[var(--foreground-secondary)] leading-relaxed">
                                    Start with <strong>Practice Exam</strong> — paste your lecture notes and get realistic test questions instantly. Each generation costs 1 credit.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════
                    VIEW 2: INPUT + CONFIG (Type selected, no result)
                   ═══════════════════════════════════════════════════ */}
                {selectedType && !result && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-400 space-y-5">

                        {/* Selected Tool Banner */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                            <div
                                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedCreator?.gradient} flex items-center justify-center shrink-0`}
                                style={{ boxShadow: `0 3px 10px ${selectedCreator?.color}33` }}
                            >
                                <span className="material-symbols-outlined text-white text-xl">{selectedCreator?.icon}</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-[var(--foreground)]">{selectedCreator?.label}</h3>
                                <p className="text-[11px] text-[var(--foreground-muted)]">{selectedCreator?.desc}</p>
                            </div>
                            <button
                                onClick={() => setSelectedType(null)}
                                className="text-xs text-[var(--accent)] hover:underline font-medium"
                            >
                                Change
                            </button>
                        </div>

                        {/* Content Input */}
                        <div
                            className={`rounded-2xl border-2 transition-all duration-200 ${dragActive ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] bg-[var(--card)]'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                        >
                            <div className="px-4 pt-3 flex items-center justify-between">
                                <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Your Content</label>
                                <span className={`text-[10px] ${charPercentage > 80 ? 'text-[var(--warning)]' : 'text-[var(--foreground-muted)]'}`}>
                                    {inputText.length > 0 ? `${inputText.length.toLocaleString()} chars` : ''}
                                </span>
                            </div>
                            <textarea
                                value={inputText}
                                onChange={handleInputChange}
                                placeholder="Paste your lecture notes, textbook chapter, or any study material here..."
                                className="w-full h-48 px-4 py-3 resize-none bg-transparent text-[var(--foreground)] placeholder-[var(--foreground-muted)]/40 text-sm leading-relaxed focus:outline-none"
                                autoFocus
                            />
                            <div className="px-4 pb-3 flex items-center justify-between border-t border-[var(--border)]">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors py-1.5"
                                >
                                    <span className="material-symbols-outlined text-base">upload_file</span>
                                    Upload PDF or TXT
                                    <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileUpload} />
                                </button>
                                {inputText.length > 0 && inputText.length < 50 && (
                                    <span className="text-[10px] text-[var(--warning)]">Need at least 50 characters</span>
                                )}
                            </div>
                        </div>

                        {/* Configuration (contextual per type) */}
                        {(selectedType === "flashcards" || selectedType === "quiz") && (
                            <div className="space-y-4">
                                {/* Count selector */}
                                <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                                    <label className="text-xs font-semibold text-[var(--foreground)] mb-2.5 block">How many?</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {countOptions.map((count) => (
                                            <button
                                                key={count}
                                                onClick={() => setItemCount(count)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${itemCount === count
                                                    ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/30'
                                                    : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:bg-[var(--border)]'
                                                    }`}
                                            >
                                                {count}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Difficulty */}
                                <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                                    <label className="text-xs font-semibold text-[var(--foreground)] mb-2.5 block">Difficulty</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {difficultyOptions.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setDifficulty(opt.id as any)}
                                                className={`p-2.5 rounded-lg text-left transition-all border ${difficulty === opt.id
                                                    ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                                                    : 'border-transparent bg-[var(--background-tertiary)] hover:bg-[var(--border)]'
                                                    }`}
                                            >
                                                <span className="text-xs font-medium flex items-center gap-1.5">
                                                    <span>{opt.emoji}</span>
                                                    <span className={difficulty === opt.id ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'}>{opt.label}</span>
                                                </span>
                                                <p className="text-[10px] text-[var(--foreground-muted)] mt-0.5 pl-5">{opt.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedType === "summary" && (
                            <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                                <label className="text-xs font-semibold text-[var(--foreground)] mb-2.5 block">Summary format</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {summaryStyles.map((style) => (
                                        <button
                                            key={style.id}
                                            onClick={() => setSummaryStyle(style.id as any)}
                                            className={`p-3 rounded-lg text-center transition-all border ${summaryStyle === style.id
                                                ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                                                : 'border-transparent bg-[var(--background-tertiary)] hover:bg-[var(--border)]'
                                                }`}
                                        >
                                            <span className={`material-symbols-outlined text-lg mb-1 block ${summaryStyle === style.id ? 'text-[var(--accent)]' : 'text-[var(--foreground-muted)]'}`}>{style.icon}</span>
                                            <span className={`text-xs font-medium ${summaryStyle === style.id ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'}`}>{style.label}</span>
                                            <p className="text-[9px] text-[var(--foreground-muted)] mt-0.5">{style.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedType === "podcast" && (
                            <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                                <label className="text-xs font-semibold text-[var(--foreground)] mb-2.5 block">Episode style</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {podcastStyles.map((style) => (
                                        <button
                                            key={style.id}
                                            onClick={() => setPodcastStyle(style.id as any)}
                                            className={`p-3 rounded-lg text-center transition-all border ${podcastStyle === style.id
                                                ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                                                : 'border-transparent bg-[var(--background-tertiary)] hover:bg-[var(--border)]'
                                                }`}
                                        >
                                            <span className={`material-symbols-outlined text-lg mb-1 block ${podcastStyle === style.id ? 'text-[var(--accent)]' : 'text-[var(--foreground-muted)]'}`}>{style.icon}</span>
                                            <span className={`text-xs font-medium ${podcastStyle === style.id ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'}`}>{style.label}</span>
                                            <p className="text-[9px] text-[var(--foreground-muted)] mt-0.5">{style.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !canGenerate}
                            className={`w-full py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2.5 ${isGenerating
                                ? 'bg-[var(--accent)]/50 cursor-wait'
                                : canGenerate
                                    ? 'bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] hover:shadow-xl hover:shadow-[var(--accent)]/20 hover:scale-[1.01] active:scale-[0.99]'
                                    : 'bg-[var(--foreground-muted)]/30 cursor-not-allowed'
                                }`}
                        >
                            {isGenerating ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                    <span className="text-sm">{generatingStatus || 'Generating...'}</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                    <span className="text-sm">Generate {selectedCreator?.label}</span>
                                </>
                            )}
                        </button>

                        {/* Cost hint */}
                        {!isGenerating && canGenerate && (
                            <p className="text-center text-[10px] text-[var(--foreground-muted)]">
                                Costs 1 credit · You have {user.credits} remaining
                            </p>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <div className="flex items-center gap-2 text-sm text-red-500">
                                    <span className="material-symbols-outlined text-base">error</span>
                                    {error}
                                </div>
                                <button
                                    onClick={() => { setError(null); handleGenerate(); }}
                                    className="px-3 py-1 rounded-lg bg-red-500/10 text-red-500 text-xs font-medium hover:bg-red-500/20 transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        {/* Live Preview */}
                        {isGenerating && streamingItems.length > 0 && (
                            <div className="mt-2 space-y-2 animate-in fade-in">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-medium text-[var(--foreground-muted)]">Live Preview</h4>
                                    <span className="text-[10px] bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded-full font-medium">{streamingItems.length} items</span>
                                </div>
                                {streamingItems.slice(-3).reverse().map((item: any, i: number) => (
                                    <div key={i} className="p-3 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] text-xs text-[var(--foreground-secondary)] animate-in fade-in slide-in-from-bottom-2">
                                        {item.front || item.question || "Processing..."}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════
                    VIEW 3: RESULTS
                   ═══════════════════════════════════════════════════ */}
                {result && (
                    <div className="animate-in fade-in zoom-in-95 duration-500 space-y-5">
                        {/* Success header */}
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-green-500/15 flex items-center justify-center mx-auto mb-3">
                                <span className="material-symbols-outlined text-green-500 text-3xl">check_circle</span>
                            </div>
                            <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">
                                {result.title || "Ready!"}
                            </h2>
                            <p className="text-xs text-[var(--foreground-muted)]">
                                Your {selectedCreator?.label?.toLowerCase()} has been generated
                            </p>
                        </div>

                        {/* Result Content */}
                        <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 space-y-4">
                            {/* Flashcards preview */}
                            {result.type === 'flashcards' && (
                                <>
                                    {result.data.slice(0, 3).map((c: any, i: number) => (
                                        <div key={i} className="p-3.5 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]/50">
                                            <p className="font-medium text-sm text-[var(--foreground)] mb-1">{c.front}</p>
                                            <p className="text-xs text-[var(--foreground-secondary)]">{c.back}</p>
                                        </div>
                                    ))}
                                    {result.data.length > 3 && (
                                        <p className="text-xs text-center text-[var(--foreground-muted)]">+ {result.data.length - 3} more cards</p>
                                    )}
                                    <button onClick={handleStartStudy} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F4845F] to-[#FF6B9D] text-white font-bold hover:opacity-90 transition-all shadow-lg shadow-[#F4845F]/20 flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-lg">style</span>
                                        Study {result.data.length} Cards
                                    </button>
                                </>
                            )}

                            {/* Quiz preview */}
                            {result.type === 'quiz' && (
                                <>
                                    <div className="text-center py-4">
                                        <p className="text-3xl font-bold text-[var(--foreground)]">{result.data.length}</p>
                                        <p className="text-xs text-[var(--foreground-muted)]">questions ready</p>
                                    </div>
                                    <button onClick={handleStartStudy} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#69B7A4] to-[#4ECDC4] text-white font-bold hover:opacity-90 transition-all shadow-lg shadow-[#69B7A4]/20 flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-lg">quiz</span>
                                        Start Practice Exam
                                    </button>
                                </>
                            )}

                            {/* Podcast preview */}
                            {result.type === 'podcast' && (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#EF4444] to-[#B91C1C] flex items-center justify-center shadow-lg shadow-red-500/20">
                                            <span className="material-symbols-outlined text-white text-2xl">podcasts</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-sm text-[var(--foreground)]">{result.data?.title || result.title}</p>
                                            <p className="text-xs text-[var(--foreground-muted)]">{result.data?.duration || 'Ready to listen'}</p>
                                        </div>
                                    </div>
                                    {result.data?.summary && <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed">{result.data.summary}</p>}
                                    <button onClick={handleStartStudy} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#EF4444] to-[#B91C1C] text-white font-bold hover:opacity-90 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-lg">play_arrow</span>
                                        Listen Now
                                    </button>
                                </>
                            )}

                            {/* Summary display */}
                            {result.type === 'summary' && (
                                <>
                                    <div className="max-h-[400px] overflow-y-auto space-y-2 scrollbar-thin">
                                        {Array.isArray(result.data) ? result.data.map((section: any, i: number) => (
                                            <div key={i} className="p-3.5 rounded-xl bg-[var(--background-tertiary)]">
                                                {section.heading && <h4 className="font-semibold text-sm mb-1 text-[var(--foreground)]">{section.heading}</h4>}
                                                <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed whitespace-pre-wrap">{section.content || section.text || JSON.stringify(section)}</p>
                                            </div>
                                        )) : (
                                            <div className="p-3.5 rounded-xl bg-[var(--background-tertiary)] whitespace-pre-wrap text-xs leading-relaxed text-[var(--foreground-secondary)]">
                                                {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2))}
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#A78BFA] to-[#8B5CF6] text-white font-bold hover:opacity-90 transition-all shadow-lg shadow-[#A78BFA]/20 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-lg">content_copy</span>
                                        Copy Summary
                                    </button>
                                </>
                            )}

                            {/* Mind Map */}
                            {result.type === 'mindmap' && (
                                <div className="p-3.5 rounded-xl bg-[var(--background-tertiary)] whitespace-pre-wrap text-xs leading-relaxed text-[var(--foreground-secondary)] max-h-[400px] overflow-y-auto">
                                    {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                                </div>
                            )}
                        </div>

                        {/* Create another */}
                        <button
                            onClick={resetAll}
                            className="w-full py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base">add</span>
                            Create another
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
