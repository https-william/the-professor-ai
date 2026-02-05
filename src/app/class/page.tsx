"use client";

import { useState, useRef, Suspense } from "react";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";

interface Section {
    id: string;
    title: string;
    content: string;
    analogy?: string;
    keyTakeaway?: string;
    completed: boolean;
}

interface Note {
    id: string;
    content: string;
    timestamp: Date;
}

function ClassContent() {
    const { user } = useUser();
    const { resolvedTheme, toggleTheme } = useTheme();

    const [topic, setTopic] = useState("");
    const [isTeaching, setIsTeaching] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [lessonTitle, setLessonTitle] = useState("");
    const [sections, setSections] = useState<Section[]>([]);
    const [currentSection, setCurrentSection] = useState(0);
    const [notes, setNotes] = useState<Note[]>([]);
    const [currentNote, setCurrentNote] = useState("");
    const [showNotes, setShowNotes] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [documentContent, setDocumentContent] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleStartClass = async () => {
        if (!topic.trim() && !documentContent.trim()) return;
        setIsTeaching(true);
        setError(null);

        try {
            const response = await fetch("/api/class/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic: documentContent ? undefined : topic,
                    documentContent: documentContent || undefined
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to start class");
            }

            const generatedSections: Section[] = data.sections.map((s: any) => ({
                ...s,
                completed: false,
            }));

            setLessonTitle(data.title);
            setSections(generatedSections);
            setHasStarted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsTeaching(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setTopic(`Document: ${file.name}`);

        // Read file content
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (text) {
                setDocumentContent(text);
            }
        };
        reader.onerror = () => {
            setError("Failed to read file");
        };
        reader.readAsText(file);
    };

    const handleAddNote = () => {
        if (!currentNote.trim()) return;
        const newNote: Note = {
            id: Date.now().toString(),
            content: currentNote,
            timestamp: new Date(),
        };
        setNotes(prev => [...prev, newNote]);
        setCurrentNote("");
    };

    const handleSaveToLibrary = () => {
        // TODO: Implement save to library
        alert("Notes saved to library!");
    };

    const handleExportPDF = () => {
        // TODO: Implement PDF export
        alert("Exporting notes to PDF...");
    };

    const handleShare = () => {
        // TODO: Implement sharing
        alert("Share link copied to clipboard!");
    };

    // Inline Tips (Feynman/ELI5)
    const [currentTip, setCurrentTip] = useState<string | null>(null);
    const [isFetchingTip, setIsFetchingTip] = useState(false);

    const fetchTip = async () => {
        if (!sections[currentSection]) return;

        setIsFetchingTip(true);
        setCurrentTip(null);

        try {
            const response = await fetch("/api/class/tip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    concept: sections[currentSection].title,
                    context: sections[currentSection].content.substring(0, 500),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentTip(data.tip);
            }
        } catch (err) {
            console.error("Failed to fetch tip:", err);
        } finally {
            setIsFetchingTip(false);
        }
    };

    const handleNextSection = () => {
        if (currentSection < sections.length - 1) {
            setSections(prev => prev.map((s, i) =>
                i === currentSection ? { ...s, completed: true } : s
            ));
            setCurrentSection(prev => prev + 1);
            setCurrentTip(null); // Clear tip when moving to next section
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[var(--background)] text-[var(--foreground)] pb-20 md:pb-24">
            {/* Header */}
            <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl shrink-0 z-40">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-white text-lg">school</span>
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold text-[var(--foreground)]">The Class Room</h1>
                        <p className="text-[10px] text-[var(--foreground-secondary)]">Learn with The Professor</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {hasStarted && (
                        <button
                            onClick={() => setShowNotes(!showNotes)}
                            className={`p-2 rounded-lg transition-all ${showNotes ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]'}`}
                            title="Toggle Notes"
                        >
                            <span className="material-symbols-outlined text-xl">edit_note</span>
                        </button>
                    )}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">
                            {resolvedTheme === "light" ? "dark_mode" : "light_mode"}
                        </span>
                    </button>
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent-bg)] border border-[var(--accent)]/20">
                        <span className="text-sm">🔥</span>
                        <span className="text-[var(--accent)] text-xs font-semibold">{user.streak}</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Main Area */}
                <main className={`flex-1 flex flex-col items-center justify-center overflow-y-auto px-4 md:px-8 py-8 ${hasStarted && showNotes ? 'md:mr-80' : ''}`}>
                    {!hasStarted ? (
                        /* Welcome State */
                        <div className="w-full max-w-xl text-center">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--secondary)]/20 flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-[var(--accent)] text-4xl">psychology</span>
                            </div>
                            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                                What would you like to learn today?
                            </h2>
                            <p className="text-[var(--foreground-secondary)] mb-8">
                                Enter a topic or upload a document, and I'll break it down for you.
                            </p>

                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleStartClass()}
                                        placeholder="e.g., Quantum Mechanics, French Revolution, Machine Learning..."
                                        className="w-full px-5 py-4 rounded-2xl bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 text-center"
                                    />
                                </div>

                                <div className="flex items-center gap-3 justify-center">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.doc,.docx,.txt"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2.5 rounded-xl bg-[var(--background-tertiary)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--border)] transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-lg">upload_file</span>
                                        Upload Document
                                    </button>
                                    <button
                                        onClick={handleStartClass}
                                        disabled={(!topic.trim() && !documentContent.trim()) || isTeaching}
                                        className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${(topic.trim() || documentContent.trim()) && !isTeaching
                                            ? 'bg-[var(--accent)] text-white shadow-lg hover:opacity-90'
                                            : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)]'
                                            }`}
                                    >
                                        {isTeaching ? (
                                            <>
                                                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                                                Preparing...
                                            </>
                                        ) : (
                                            <>
                                                Start Class
                                                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Error Display */}
                                {error && (
                                    <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
                                        <span className="material-symbols-outlined text-lg shrink-0">error</span>
                                        <div>
                                            <p className="font-medium">Failed to start class</p>
                                            <p className="text-red-300/80 mt-1">{error}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Document loaded indicator */}
                                {documentContent && (
                                    <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">check_circle</span>
                                        Document loaded ({documentContent.length.toLocaleString()} characters)
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Teaching State */
                        <div className="w-full max-w-2xl">
                            {/* Progress */}
                            <div className="flex items-center gap-2 mb-6">
                                {sections.map((section, i) => (
                                    <div key={section.id} className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${section.completed ? 'bg-[var(--success)] text-white' :
                                            i === currentSection ? 'bg-[var(--accent)] text-white' :
                                                'bg-[var(--background-tertiary)] text-[var(--foreground-muted)]'
                                            }`}>
                                            {section.completed ? '✓' : i + 1}
                                        </div>
                                        {i < sections.length - 1 && (
                                            <div className={`w-8 h-0.5 ${section.completed ? 'bg-[var(--success)]' : 'bg-[var(--border)]'}`} />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Current Section */}
                            <div className="p-6 rounded-2xl card mb-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[var(--accent)]">lightbulb</span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-[var(--foreground)]">
                                            {sections[currentSection]?.title}
                                        </h3>
                                    </div>
                                    {/* Get Tip Button */}
                                    <button
                                        onClick={fetchTip}
                                        disabled={isFetchingTip}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${currentTip
                                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                                : 'bg-[var(--background-tertiary)] text-[var(--foreground-secondary)] hover:bg-[var(--border)]'
                                            }`}
                                        title="Get a simple explanation"
                                    >
                                        {isFetchingTip ? (
                                            <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-sm">psychology_alt</span>
                                        )}
                                        {currentTip ? 'Got tip!' : 'Explain simply'}
                                    </button>
                                </div>

                                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                                    {sections[currentSection]?.content}
                                </p>

                                {/* Tip Display */}
                                {currentTip && (
                                    <div className="mt-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                        <div className="flex items-start gap-2">
                                            <span className="text-lg">💡</span>
                                            <p className="text-sm text-purple-300 leading-relaxed">{currentTip}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Navigation */}
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => setCurrentSection(prev => Math.max(0, prev - 1))}
                                    disabled={currentSection === 0}
                                    className="px-4 py-2 rounded-xl text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-50"
                                >
                                    ← Previous
                                </button>
                                <button
                                    onClick={handleNextSection}
                                    disabled={currentSection === sections.length - 1}
                                    className="px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-all"
                                >
                                    {currentSection === sections.length - 1 ? 'Complete' : 'Continue →'}
                                </button>
                            </div>
                        </div>
                    )}
                </main>

                {/* Notes Panel */}
                {hasStarted && showNotes && (
                    <aside className="fixed right-0 top-14 bottom-20 md:bottom-24 w-80 flex flex-col border-l border-[var(--border)] bg-[var(--background-secondary)]">
                        <div className="p-4 border-b border-[var(--border)]">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">edit_note</span>
                                    Notes
                                </h3>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={handleShare}
                                        className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all"
                                        title="Share Notes"
                                    >
                                        <span className="material-symbols-outlined text-lg">share</span>
                                    </button>
                                    <button
                                        onClick={handleExportPDF}
                                        className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all"
                                        title="Export PDF"
                                    >
                                        <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                                    </button>
                                    <button
                                        onClick={handleSaveToLibrary}
                                        className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all"
                                        title="Save to Library"
                                    >
                                        <span className="material-symbols-outlined text-lg">bookmark</span>
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-[var(--foreground-muted)]">Capture your thoughts</p>
                        </div>

                        {/* Notes List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {notes.length === 0 ? (
                                <div className="text-center py-8">
                                    <span className="material-symbols-outlined text-4xl text-[var(--foreground-muted)]/30 mb-2 block">note_add</span>
                                    <p className="text-sm text-[var(--foreground-muted)]">Start taking notes below</p>
                                </div>
                            ) : (
                                notes.map((note) => (
                                    <div key={note.id} className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                                        <p className="text-sm text-[var(--foreground)]">{note.content}</p>
                                        <span className="text-[10px] text-[var(--foreground-muted)] mt-2 block">
                                            {note.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Note Input */}
                        <div className="p-4 border-t border-[var(--border)]">
                            <textarea
                                value={currentNote}
                                onChange={(e) => setCurrentNote(e.target.value)}
                                placeholder="Jot down a note..."
                                className="w-full h-20 p-3 rounded-xl bg-[var(--background)] text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] resize-none focus:outline-none"
                            />
                            <button
                                onClick={handleAddNote}
                                disabled={!currentNote.trim()}
                                className={`w-full mt-2 py-2.5 rounded-xl font-medium text-sm transition-all ${currentNote.trim()
                                    ? "bg-[var(--secondary)] text-white hover:opacity-90"
                                    : "bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
                                    }`}
                            >
                                Add Note
                            </button>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}

export default function ClassPage() {
    return (
        <Suspense fallback={<div className="flex h-screen bg-[var(--background)] items-center justify-center text-[var(--foreground-muted)]">Loading...</div>}>
            <ClassContent />
        </Suspense>
    );
}
