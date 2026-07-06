"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Clock, CheckCircle2, Zap, ShieldCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubjectPreview {
    id: string;
    label: string;
    icon: string;
    topic: string;
    readingTime: string;
    condensedTime: string;
    flashcards: number;
    quote: string;
    author: string;
}

const SUBJECTS: SubjectPreview[] = [
    {
        id: "bio",
        label: "Biology & Medical",
        icon: "🧬",
        topic: "Cellular Mitosis & Genetics",
        readingTime: "4.5 hours of textbook chapter reading",
        condensedTime: "12 minutes of active recall practice",
        flashcards: 24,
        quote: "I actually slept 8 hours before my Anatomy paper. This app is a lifesaver.",
        author: "Tunde O., UNILAG"
    },
    {
        id: "law",
        label: "Law & Jurisprudence",
        icon: "⚖️",
        topic: "Law of Contract & Torts",
        readingTime: "6 hours of case law & statutory analysis",
        condensedTime: "18 minutes of spaced repetition",
        flashcards: 36,
        quote: "No more drowning in 50-page judgments. Just the ratios and principles.",
        author: "Amaka N., UI"
    },
    {
        id: "calc",
        label: "Engineering & Math",
        icon: "📐",
        topic: "Differential Equations & Linear Algebra",
        readingTime: "5 hours of formula derivations",
        condensedTime: "15 minutes of step-by-step breakdowns",
        flashcards: 20,
        quote: "Passed Engineering Maths without pulling a single all-nighter.",
        author: "Ifeanyi K., OAU"
    },
    {
        id: "econ",
        label: "Economics & Finance",
        icon: "📈",
        topic: "Macroeconomic Policy & Econometrics",
        readingTime: "4 hours of lecture slides & charts",
        condensedTime: "10 minutes of ELI5 concept synthesis",
        flashcards: 18,
        quote: "The Feynman technique breakdown made GDP deflators click instantly.",
        author: "Bolu W., UNIBEN"
    }
];

export default function ClosingCTABanner() {
    const [selectedSubject, setSelectedSubject] = useState<SubjectPreview>(SUBJECTS[0]);

    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[var(--bg)]">
            <div className="max-w-5xl mx-auto relative z-10">
                {/* The All-Nighter Bailout Terminal Dock */}
                <div className="scholar-card rounded-[2.5rem] p-8 sm:p-12 md:p-16 border border-[var(--border-2)] bg-gradient-to-b from-[var(--bg-2)]/90 via-[var(--bg-2)]/70 to-[var(--bg)] shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl relative overflow-hidden">
                    
                    {/* Top Glowing Accent Line */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-[var(--amber)] to-transparent opacity-80" />

                    <div className="text-center max-w-3xl mx-auto mb-12">
                        {/* Heading without em dashes */}
                        <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-[var(--foreground)] tracking-tight leading-none mb-6 font-heading">
                            Your bed misses you. <br className="hidden sm:inline" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--amber)] via-amber-300 to-[var(--amber)]">
                                Let’s get your time back.
                            </span>
                        </h2>

                        {/* Subheadline with strict line length cap */}
                        <p className="text-sm sm:text-base md:text-lg text-[var(--foreground-secondary)] leading-relaxed max-w-[65ch] mx-auto">
                            Join 14,000+ students who stopped cramming and started sleeping. No credit card required; no boring 2-hour lectures. Just the good parts of your notes synthesized in seconds.
                        </p>
                    </div>

                    {/* Interactive Subject Hook (80% Conversion Trigger) */}
                    <div className="max-w-3xl mx-auto mb-12">
                        <div className="text-center mb-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
                                What is your hardest exam right now?
                            </span>
                        </div>

                        {/* Subject Selection Pills */}
                        <div className="flex flex-wrap justify-center gap-2.5 mb-8" role="radiogroup" aria-label="Select exam subject">
                            {SUBJECTS.map((sub) => {
                                const isSelected = selectedSubject.id === sub.id;
                                return (
                                    <button
                                        key={sub.id}
                                        type="button"
                                        role="radio"
                                        aria-checked={isSelected}
                                        onClick={() => setSelectedSubject(sub)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 border cursor-pointer select-none",
                                            isSelected
                                                ? "bg-[var(--amber)] text-[var(--background)] border-[var(--amber)] shadow-[0_0_20px_rgba(229,169,60,0.4)] scale-105"
                                                : "bg-[var(--bg)]/80 text-[var(--foreground-secondary)] border-[var(--border)] hover:border-[var(--border-2)] hover:text-[var(--foreground)]"
                                        )}
                                    >
                                        <span>{sub.icon}</span>
                                        <span>{sub.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Dynamic Time-Saved Preview Card */}
                        <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg)]/90 border border-[var(--border-2)] shadow-inner transition-all duration-300 relative group">
                            <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-[var(--blue)]/15 border border-[var(--blue)]/30 text-[var(--blue)] text-[10px] font-extrabold uppercase tracking-widest">
                                Live Synthesis Preview
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
                                <div className="space-y-3 text-left">
                                    <div className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                                        <span className="text-lg">{selectedSubject.icon}</span>
                                        <span>{selectedSubject.topic}</span>
                                    </div>

                                    <div className="space-y-2 text-xs sm:text-sm">
                                        <div className="flex items-center gap-2 text-rose-400/90 line-through decoration-rose-500/50">
                                            <Clock size={14} className="shrink-0 text-rose-400" />
                                            <span>Old way: {selectedSubject.readingTime}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-emerald-400 font-bold">
                                            <Zap size={14} className="shrink-0 text-emerald-400 fill-emerald-400/20" />
                                            <span>Professor way: {selectedSubject.condensedTime} ({selectedSubject.flashcards} FSRS cards)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Student Testimonial Quote */}
                                <div className="p-4 rounded-2xl bg-[var(--bg-2)] border border-[var(--border)] text-left flex flex-col justify-between">
                                    <p className="text-xs sm:text-sm italic text-[var(--foreground-secondary)] mb-3 leading-relaxed">
                                        &ldquo;{selectedSubject.quote}&rdquo;
                                    </p>
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--amber)]">
                                        <div className="w-5 h-5 rounded-full bg-[var(--amber)]/20 flex items-center justify-center text-[10px] font-black">
                                            ✓
                                        </div>
                                        <span>{selectedSubject.author}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Massive Skeuomorphic 3D Jelly CTA Button */}
                    <div className="flex flex-col items-center justify-center gap-4">
                        <Link
                            href={`/signup?starter=${selectedSubject.id}`}
                            className="btn-skeuo-primary group relative inline-flex items-center justify-center gap-3 px-8 sm:px-12 py-5 sm:py-6 rounded-2xl text-base sm:text-lg font-black text-black tracking-tight shadow-[0_6px_0_0_#b88220,0_15px_30px_rgba(229,169,60,0.35)] active:translate-y-1.5 active:shadow-[0_0px_0_0_#b88220] transition-all duration-150 overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2.5">
                                <Zap size={20} className="fill-black text-black shrink-0 animate-bounce" />
                                <span>Claim Your Free Study Vault</span>
                                <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform duration-200" />
                            </span>
                        </Link>

                        {/* Reassurance Footnote */}
                        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[var(--foreground-muted)] pt-2">
                            <span className="flex items-center gap-1.5">
                                <ShieldCheck size={14} className="text-emerald-400" />
                                <span>Free forever for casual study</span>
                            </span>
                            <span className="hidden sm:inline text-[var(--border-3)]">•</span>
                            <span>Takes 30 seconds to setup</span>
                            <span className="hidden sm:inline text-[var(--border-3)]">•</span>
                            <span>Instant sync across desktop & mobile</span>
                        </div>
                    </div>

                    {/* Bottom Nigerian Student Social Proof Ticker */}
                    <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-medium text-[var(--foreground-secondary)]">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 border-2 border-[var(--bg-2)] flex items-center justify-center text-xs font-bold text-blue-400">TO</div>
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 border-2 border-[var(--bg-2)] flex items-center justify-center text-xs font-bold text-purple-400">AN</div>
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 border-2 border-[var(--bg-2)] flex items-center justify-center text-xs font-bold text-amber-400">IK</div>
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-[var(--bg-2)] flex items-center justify-center text-xs font-bold text-emerald-400">BW</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex text-[var(--amber)]">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={13} className="fill-current" />
                                ))}
                            </div>
                            <span>Rated <strong>4.9/5</strong> by students across UNILAG, UI, and OAU.</span>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
