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

export default function DopamineWaitingRoom({
    mode = "general",
    title,
    progress,
    className = ""
}: DopamineWaitingRoomProps) {
    const [pillIdx, setPillIdx] = useState(0);
    const [factIdx, setFactIdx] = useState(0);

    const pills = EXTRACTION_PILLS[mode] || EXTRACTION_PILLS.general;

    useEffect(() => {
        const pillTimer = setInterval(() => {
            setPillIdx(prev => (prev + 1) % pills.length);
        }, 3000);

        const factTimer = setInterval(() => {
            setFactIdx(prev => (prev + 1) % STUDY_FACTS.length);
        }, 6000);

        return () => {
            clearInterval(pillTimer);
            clearInterval(factTimer);
        };
    }, [pills.length]);

    const activeFact = STUDY_FACTS[factIdx];
    const FactIcon = activeFact.icon;

    return (
        <div className={`flex flex-col items-center justify-center p-6 w-full max-w-lg mx-auto text-center ${className}`}>
            
            {/* Live Extraction Pill */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={pillIdx}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--blue)]/10 border border-[var(--blue)]/30 text-[var(--blue)] text-xs font-bold shadow-md mb-8"
                >
                    <span className="w-2 h-2 rounded-full bg-[var(--blue)] animate-ping" />
                    <span>{pills[pillIdx]}</span>
                </motion.div>
            </AnimatePresence>

            {/* Visualizer: Radar Dial & Pulsing Logo */}
            <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                <div className="absolute inset-0 rounded-full border border-[var(--border)] bg-[var(--surface)] shadow-inner" />
                
                <motion.div 
                    className="absolute inset-2 rounded-full border border-dashed border-[var(--border)]"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                />

                <motion.div 
                    className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-[var(--blue)]/15 to-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                />

                <div className="w-16 h-16 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center shadow-2xl relative z-10 overflow-hidden">
                    <BrandLogo size="sm" />
                    <motion.div 
                        className="absolute inset-x-0 bottom-0 h-1 bg-[var(--blue)]"
                        animate={{ y: ["100%", "-200%"] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>
            </div>

            {/* Title & Progress */}
            <h3 className="text-base font-black text-[var(--foreground)] mb-1">
                {title || "The Professor is building your study pack..."}
            </h3>
            {typeof progress === "number" && (
                <div className="w-full max-w-xs bg-[var(--surface)] h-1.5 rounded-full mt-4 mb-2 overflow-hidden border border-[var(--border)] mx-auto">
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
