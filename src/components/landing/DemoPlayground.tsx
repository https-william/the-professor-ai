"use client";

import { useState } from "react";
import demoData from "@/data/demo-data.json";
import { PillNav } from "@/components/ui/PillNav";
import { 
    Layers, 
    HelpCircle, 
    GraduationCap, 
    ChevronLeft, 
    ChevronRight 
} from "lucide-react";

type DemoTab = "flashcards" | "quiz" | "class";

export function DemoPlayground() {
    const [activeTab, setActiveTab] = useState<DemoTab>("flashcards");
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
    const [showResults, setShowResults] = useState(false);

    const tabs = [
        { id: "flashcards", label: "Flashcards", icon: Layers },
        { id: "quiz", label: "Quiz", icon: HelpCircle },
        { id: "class", label: "Class", icon: GraduationCap },
    ];

    // Flashcard handlers
    const currentCard = demoData.flashcards.cards[currentCardIndex];
    const nextCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentCardIndex((i) => (i + 1) % demoData.flashcards.cards.length);
        }, 150);
    };
    const prevCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentCardIndex((i) => (i - 1 + demoData.flashcards.cards.length) % demoData.flashcards.cards.length);
        }, 150);
    };

    // Quiz handlers
    const handleAnswer = (qIndex: number, aIndex: number) => {
        setSelectedAnswers(prev => ({ ...prev, [qIndex]: aIndex }));
    };

    const getScore = () => {
        let correct = 0;
        demoData.quiz.questions.forEach((q, i) => {
            if (selectedAnswers[i] === q.correctIndex) correct++;
        });
        return correct;
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Tab Selector */}
            <div className="flex justify-center mb-8">
                <PillNav
                    items={tabs}
                    activeId={activeTab}
                    onSelect={(id) => {
                        setActiveTab(id as DemoTab);
                        setIsFlipped(false);
                        setCurrentCardIndex(0);
                        setShowResults(false);
                    }}
                />
            </div>

            {/* Demo Content */}
            <div className="min-h-[400px]">
                {/* FLASHCARDS */}
                {activeTab === "flashcards" && (
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                            {demoData.flashcards.title}
                        </h3>
                        <p className="text-sm text-[var(--foreground-muted)] mb-6">
                            Card {currentCardIndex + 1} of {demoData.flashcards.cards.length}
                        </p>

                        {/* Flip Card */}
                        <div
                            onClick={() => setIsFlipped(!isFlipped)}
                            className="relative w-full max-w-md mx-auto h-56 cursor-pointer"
                            style={{ perspective: "1000px" }}
                        >
                            <div
                                className="relative w-full h-full transition-transform duration-500"
                                style={{
                                    transformStyle: "preserve-3d",
                                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                                }}
                            >
                                {/* Front */}
                                <div
                                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--secondary)]/10 border border-[var(--border)] p-6 flex items-center justify-center shadow-lg"
                                    style={{ backfaceVisibility: "hidden" }}
                                >
                                    <p className="text-lg font-medium text-[var(--foreground)]">{currentCard?.front}</p>
                                </div>

                                {/* Back */}
                                <div
                                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--success)]/10 to-[var(--accent)]/10 border border-[var(--border)] p-6 flex items-center justify-center shadow-lg"
                                    style={{
                                        backfaceVisibility: "hidden",
                                        transform: "rotateY(180deg)"
                                    }}
                                >
                                    <p className="text-base text-[var(--foreground)]">{currentCard?.back}</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-[var(--foreground-muted)] mt-4 mb-4">Click to flip</p>

                        {/* Navigation */}
                        <div className="flex justify-center gap-4">
                            <button onClick={prevCard} className="p-3 rounded-full bg-[var(--card)] hover:bg-[var(--background-tertiary)] transition-colors flex items-center justify-center">
                                <ChevronLeft size={20} strokeWidth={1.5} />
                            </button>
                            <button onClick={nextCard} className="p-3 rounded-full bg-[var(--card)] hover:bg-[var(--background-tertiary)] transition-colors flex items-center justify-center">
                                <ChevronRight size={20} strokeWidth={1.5} />
                            </button>
                        </div>
                    </div>
                )}

                {/* QUIZ */}
                {activeTab === "quiz" && (
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--foreground)] text-center mb-6">
                            {demoData.quiz.title}
                        </h3>

                        {!showResults ? (
                            <div className="space-y-6">
                                {demoData.quiz.questions.map((q, qIndex) => (
                                    <div key={qIndex} className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
                                        <p className="font-medium text-[var(--foreground)] mb-4">
                                            {qIndex + 1}. {q.question}
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {q.options.map((opt, aIndex) => (
                                                <button
                                                    key={aIndex}
                                                    onClick={() => handleAnswer(qIndex, aIndex)}
                                                    className={`p-3 rounded-xl text-left text-sm transition-all ${selectedAnswers[qIndex] === aIndex
                                                        ? "bg-[var(--accent)] text-white"
                                                        : "bg-[var(--background-tertiary)] text-[var(--foreground-secondary)] hover:bg-[var(--border)]"
                                                        }`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setShowResults(true)}
                                    className="w-full py-3 rounded-xl bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity"
                                >
                                    Check Answers
                                </button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-full bg-[var(--success)]/20 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl font-bold text-[var(--success)]">{getScore()}/{demoData.quiz.questions.length}</span>
                                </div>
                                <p className="text-[var(--foreground-secondary)] mb-6">
                                    {getScore() === demoData.quiz.questions.length
                                        ? "Perfect! You nailed it! 🎉"
                                        : getScore() >= 3
                                            ? "Great job! Almost there! 💪"
                                            : "Keep practicing, you got this! 📚"}
                                </p>
                                <button
                                    onClick={() => {
                                        setSelectedAnswers({});
                                        setShowResults(false);
                                    }}
                                    className="px-6 py-2 rounded-xl bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* CLASS */}
                {activeTab === "class" && (
                    <div>
                        <h3 className="text-xl font-bold text-[var(--foreground)] text-center mb-2">
                            {demoData.lesson.title}
                        </h3>
                        <p className="text-sm text-[var(--foreground-muted)] text-center mb-8">
                            A bite-sized lesson from The Professor
                        </p>

                        <div className="space-y-6">
                            {demoData.lesson.sections.map((section, i) => (
                                <div key={section.id} className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="w-8 h-8 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-sm font-bold text-[var(--accent)]">
                                            {i + 1}
                                        </span>
                                        <h4 className="font-semibold text-[var(--foreground)]">{section.title}</h4>
                                    </div>
                                    <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed mb-3">
                                        {section.content}
                                    </p>
                                    <div className="px-3 py-2 rounded-lg bg-[var(--accent)]/10 border-l-3 border-[var(--accent)]">
                                        <p className="text-xs font-medium text-[var(--accent)]">
                                            💡 {section.keyTakeaway}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 p-4 rounded-xl bg-[var(--background-tertiary)] text-center">
                            <p className="text-sm text-[var(--foreground-secondary)]">
                                <strong>TL;DR:</strong> {demoData.lesson.summary}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DemoPlayground;
