"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Youtube,
    ExternalLink,
    Play,
    Clock,
    BookOpen,
    Zap,
    ChevronDown,
    Copy,
    CheckCheck,
    Search,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface YoutubeResource {
    title: string;
    channel: string;
    duration: string;
    difficulty: "Concept Intro" | "Deep Dive" | "Exam Prep" | string;
    reasonToWatch: string;
    searchQuery: string;
    youtubeUrl: string;
    videoId?: string | null;
}

interface ExternalResourcesViewerProps {
    resources: YoutubeResource[];
    packTitle?: string;
    onGenerateMore?: () => void;
    isGenerating?: boolean;
}

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    "Concept Intro": {
        label: "Concept Intro",
        color: "text-[var(--blue)]",
        bg: "bg-[var(--blue)]/10 border-[var(--blue)]/25",
    },
    "Deep Dive": {
        label: "Deep Dive",
        color: "text-[var(--violet)]",
        bg: "bg-[var(--violet)]/10 border-[var(--violet)]/25",
    },
    "Exam Prep": {
        label: "Exam Prep",
        color: "text-[var(--crimson)]",
        bg: "bg-[var(--crimson)]/10 border-[var(--crimson)]/25",
    },
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
    const cfg = DIFFICULTY_CONFIG[difficulty] ?? {
        label: difficulty,
        color: "text-[var(--foreground-muted)]",
        bg: "bg-[var(--background-secondary)] border-[var(--border)]",
    };
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                cfg.color,
                cfg.bg
            )}
        >
            {cfg.label}
        </span>
    );
}

function ResourceCard({ resource, index }: { resource: YoutubeResource; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const hasEmbed = Boolean(resource.videoId && resource.videoId.length === 11);

    const handleCopy = () => {
        navigator.clipboard.writeText(resource.searchQuery);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, duration: 0.35, ease: "easeOut" }}
            className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm hover:shadow-md hover:border-[var(--border-2)] transition-all duration-200"
        >
            {/* Embedded YouTube iframe or thumbnail placeholder */}
            {hasEmbed ? (
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                    <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube-nocookie.com/embed/${resource.videoId}?rel=0&modestbranding=1`}
                        title={resource.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                    />
                </div>
            ) : (
                /* Fallback: clickable thumbnail-style banner that opens YouTube search */
                <a
                    href={resource.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex items-center justify-center w-full bg-[#0f0f0f] group overflow-hidden"
                    style={{ minHeight: "160px" }}
                    aria-label={`Search YouTube for: ${resource.title}`}
                >
                    {/* YouTube-red gradient glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF0000]/20 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
                    <div className="flex flex-col items-center gap-3 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-[#FF0000] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-200">
                            <Play size={24} className="text-white ml-1" fill="white" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/70 group-hover:text-white/90 transition-colors">
                            Search on YouTube
                        </span>
                    </div>
                </a>
            )}

            {/* Card body */}
            <div className="p-4 flex flex-col gap-3">
                {/* Title & badges */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-[var(--foreground)] leading-snug line-clamp-2">
                            {resource.title}
                        </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="flex items-center gap-1 text-[9px] font-semibold text-[var(--foreground-muted)]">
                            <Youtube size={10} className="text-[#FF0000]" />
                            {resource.channel}
                        </span>
                        <span className="w-px h-3 bg-[var(--border)]" />
                        <span className="flex items-center gap-1 text-[9px] text-[var(--foreground-muted)]">
                            <Clock size={9} />
                            {resource.duration}
                        </span>
                        <DifficultyBadge difficulty={resource.difficulty} />
                    </div>
                </div>

                {/* Why watch — collapsible */}
                <div>
                    <button
                        onClick={() => setExpanded((p) => !p)}
                        className="w-full flex items-center justify-between text-left text-[10px] font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors py-1 gap-2"
                    >
                        <span className="flex items-center gap-1.5">
                            <BookOpen size={10} />
                            Why watch this?
                        </span>
                        <ChevronDown
                            size={12}
                            className={cn("shrink-0 transition-transform duration-200", expanded && "rotate-180")}
                        />
                    </button>
                    <AnimatePresence>
                        {expanded && (
                            <motion.p
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-xs text-[var(--foreground-muted)] leading-relaxed overflow-hidden"
                            >
                                {resource.reasonToWatch}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]">
                    {/* Open on YouTube */}
                    <a
                        href={resource.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                    >
                        <Youtube size={11} />
                        <span>Watch on YouTube</span>
                    </a>

                    {/* Copy search query */}
                    <button
                        onClick={handleCopy}
                        title="Copy search query"
                        className="p-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-all active:scale-95"
                    >
                        {copied ? (
                            <CheckCheck size={12} className="text-[var(--emerald)]" />
                        ) : (
                            <Copy size={12} />
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export function ExternalResourcesViewer({
    resources,
    packTitle,
    onGenerateMore,
    isGenerating,
}: ExternalResourcesViewerProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filtered = searchQuery.trim()
        ? resources.filter(
              (r) =>
                  r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  r.channel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  r.difficulty.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : resources;

    if (!resources || resources.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] flex items-center justify-center text-[#FF0000]">
                    <Youtube size={28} />
                </div>
                <div>
                    <h3 className="text-base font-black text-[var(--foreground)] mb-1.5">
                        Find the right videos
                    </h3>
                    <p className="text-xs text-[var(--foreground-muted)] max-w-xs leading-relaxed">
                        We'll find the best YouTube tutorials to fill in the gaps in{" "}
                        {packTitle ? `"${packTitle}"` : "your notes"} — curated for your exact topics.
                    </p>
                </div>
                {onGenerateMore && (
                    <button
                        onClick={onGenerateMore}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-[9px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={12} className="animate-spin" />
                                Finding Videos...
                            </>
                        ) : (
                            <>
                                <Zap size={12} />
                                Find Resources
                            </>
                        )}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 w-full">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-sm font-black text-[var(--foreground)] flex items-center gap-2">
                        <Youtube size={16} className="text-[#FF0000]" />
                        External Resources
                    </h2>
                    <p className="text-[10px] text-[var(--foreground-muted)] mt-0.5">
                        {resources.length} hand-picked tutorials matched to your notes
                    </p>
                </div>

                {/* Inline search filter */}
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter resources…"
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[11px] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--blue)]/50 transition-colors"
                    />
                </div>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map((resource, i) => (
                    <ResourceCard key={i} resource={resource} index={i} />
                ))}
                {filtered.length === 0 && (
                    <div className="col-span-2 py-12 text-center text-[var(--foreground-muted)] text-xs">
                        No resources match "{searchQuery}".
                    </div>
                )}
            </div>

            {/* Refresh / generate more */}
            {onGenerateMore && (
                <div className="flex justify-center pt-2">
                    <button
                        onClick={onGenerateMore}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={11} className="animate-spin" />
                                Refreshing...
                            </>
                        ) : (
                            <>
                                <Zap size={11} />
                                Refresh Suggestions
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
