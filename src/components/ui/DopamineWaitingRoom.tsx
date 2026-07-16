"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Brain, Lightbulb, Flame, Target, BookOpen, Clock } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";

interface DopamineWaitingRoomProps {
    mode?: "summary" | "flashcards" | "quiz" | "roadmap" | "eli5" | "breakdown" | "match" | "ingest" | "general";
    title?: string;
    progress?: number;
    className?: string;
}

const EXTRACTION_PILLS: Record<string, string[]> = {
    summary: [
        "⚡ Scanning core definitions & formulas...",
        "🧠 Pruning textbook fluff & filler...",
        "✨ Structuring high-yield concepts...",
        "💎 Formatting Bionic reading highlights..."
    ],
    flashcards: [
        "⚡ Extracting active recall Q&A pairs...",
        "🧠 Structuring SM-2 spaced repetition cues...",
        "✨ Crafting ELI5 memory hooks...",
        "🔥 Preparing rapid-fire study deck..."
    ],
    quiz: [
        "⚡ Generating diagnostic exam scenarios...",
        "🧠 Designing plausible distractor options...",
        "✨ Writing metacognitive explanations...",
        "🎯 Calibrating difficulty curve..."
    ],
    roadmap: [
        "⚡ Charting personalized study milestones...",
        "🧠 Estimating optimal review intervals...",
        "✨ Prioritizing high-yield topics first...",
        "🚀 Building your fast-track exam sprint..."
    ],
    eli5: [
        "⚡ Breaking down complex jargon...",
        "🧠 Finding relatable real-world analogies...",
        "✨ Translating into simple, clean concepts...",
        "💡 Crafting the aha-moment explanation..."
    ],
    breakdown: [
        "⚡ Deconstructing topic architecture...",
        "🧠 Mapping component dependencies...",
        "✨ Extracting foundational principles...",
        "📊 Building concept hierarchy..."
    ],
    match: [
        "⚡ Selecting high-contrast term pairs...",
        "🧠 Calibrating speed-recall challenges...",
        "✨ Pairing definitions with key concepts...",
        "🎮 Setting up concept match arena..."
    ],
    ingest: [
        "⚡ Reading raw documents & notes...",
        "🧠 Organizing knowledge vault structure...",
        "✨ Extracting just the good parts...",
        "📚 Readying your study lounge..."
    ],
    general: [
        "⚡ Analyzing your study materials...",
        "🧠 Extracting high-yield exam concepts...",
        "✨ Pruning away unnecessary bloat...",
        "🔥 Preparing your study session..."
    ]
};

const STUDY_FACTS = [
    {
        icon: Lightbulb,
        color: "var(--amber)",
        title: "Active Recall Power",
        text: "Testing yourself with quick flashcards or quizzes beats passive re-reading by over 300%. Your brain builds stronger pathways when it works to retrieve facts."
    },
    {
        icon: Clock,
        color: "var(--blue)",
        title: "Your Bed Misses You",
        text: "We're pruning away the textbook bloat and fluff so you can get your sleep back. Studying smart beats studying long every single time."
    },
    {
        icon: Brain,
        color: "var(--violet)",
        title: "Spaced Repetition Magic",
        text: "Reviewing right before you're about to forget tricks your memory into keeping facts in permanent storage—without all-nighter panic."
    },
    {
        icon: Flame,
        color: "var(--rose)",
        title: "The Feynman Technique",
        text: "If you can't explain a concept simply to a beginner, you don't understand it well enough yet. That's why our ELI5 metaphors are built into every deck."
    },
    {
        icon: Target,
        color: "var(--emerald)",
        title: "Short Study Sprints",
        text: "Focused 25-minute sprints with zero distractions create significantly higher retention than 4 hours of exhausted textbook staring."
    }
];

import { Check, Loader2 } from "lucide-react";
import SpriteAnimator from "@/components/ui/SpriteAnimator";

export default function DopamineWaitingRoom({
    mode = "general",
    title,
    progress,
    className = ""
}: DopamineWaitingRoomProps) {
    const [factIdx, setFactIdx] = useState(0);

    useEffect(() => {
        const factTimer = setInterval(() => {
            setFactIdx(prev => (prev + 1) % STUDY_FACTS.length);
        }, 6000);

        return () => {
            clearInterval(factTimer);
        };
    }, []);

    const activeFact = STUDY_FACTS[factIdx];
    const FactIcon = activeFact.icon;

    // Premium Generation Steps
    const currentProgress = typeof progress === "number" ? progress : 40;
    const steps = [
        { label: "Opening study archives", threshold: 20 },
        { label: "Scanning core definitions & formulas", threshold: 40 },
        { label: "Extracting high-yield concepts", threshold: 60 },
        { label: "Deconstructing textbook fluff & filler", threshold: 80 },
        { label: "Packaging interactive study lab", threshold: 100 }
    ];

    return (
        <div className={`flex flex-col items-center justify-center p-6 w-full max-w-lg mx-auto text-center ${className}`}>
            
            {/* Title */}
            <h3 className="text-base font-black text-[var(--foreground)] mb-6">
                {title || "The Professor is building your study pack..."}
            </h3>

            {/* Checklist Progression */}
            <div className="w-full max-w-sm mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-6 text-left space-y-3 shadow-inner">
                {steps.map((step, idx) => {
                    const prevThreshold = idx === 0 ? 0 : steps[idx - 1].threshold;
                    const isCompleted = currentProgress >= step.threshold;
                    const isActive = currentProgress >= prevThreshold && currentProgress < step.threshold;

                    return (
                        <div key={idx} className="flex items-center justify-between text-xs transition-opacity duration-200">
                            <span className={`font-medium ${isCompleted ? "text-[var(--foreground-muted)] line-through" : isActive ? "text-[var(--blue)] font-bold animate-pulse" : "text-[var(--foreground-muted)] opacity-40"}`}>
                                {step.label}
                            </span>
                            <div className="shrink-0 flex items-center justify-center w-5 h-5 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                                {isCompleted ? (
                                    <Check size={12} className="text-[var(--emerald)]" strokeWidth={3} />
                                ) : isActive ? (
                                    <SpriteAnimator 
                                        sheetUrl="/quill_scribble_spritesheet.jpg" 
                                        frameWidth={10} 
                                        frameHeight={32} 
                                        renderWidth={10}
                                        renderHeight={14}
                                        totalFrames={6} 
                                        durationMs={600} 
                                        mixBlendMode="screen"
                                        className="shrink-0"
                                    />
                                ) : (
                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--border)]" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Progress Bar */}
            {typeof progress === "number" && (
                <div className="w-full max-w-xs bg-[var(--surface)] h-1.5 rounded-full mb-2 overflow-hidden border border-[var(--border)] mx-auto relative">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-[var(--blue)] shadow-[0_0_12px_rgba(74,124,245,0.6)]"
                    />
                </div>
            )}
            {typeof progress === "number" && (
                <p className="text-[10px] font-mono font-black text-[var(--foreground-muted)] mb-6">
                    {progress}% Complete
                </p>
            )}

            {/* Study Fact Preview Box */}
            <div className="w-full mt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={factIdx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.35 }}
                        className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border-2)] text-left shadow-lg relative overflow-hidden"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div 
                                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `color-mix(in srgb, ${activeFact.color} 15%, transparent)`, color: activeFact.color }}
                            >
                                <FactIcon size={14} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--foreground)]">
                                {activeFact.title}
                            </span>
                        </div>
                        <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed">
                            {activeFact.text}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Brand footer text */}
            <p className="text-[9px] font-mono font-black text-[var(--foreground-muted)] opacity-40 uppercase tracking-[0.3em] mt-8">
                Your notes • Just the good parts
            </p>
        </div>
    );
}
