"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";

interface AnnotatedSourceViewerProps {
    /** The raw source text from the uploaded document */
    sourceText: string;
    /** 0-indexed paragraph to highlight and scroll to. null = no highlight. */
    highlightedParagraph: number | null;
    /** Called when the auto-clear timer expires */
    onHighlightClear: () => void;
    className?: string;
}

/**
 * AnnotatedSourceViewer
 *
 * Replaces the plain whitespace-pre-wrap div in the Raw Notes tab.
 * - Splits sourceText into paragraphs on double-newlines.
 * - Each paragraph gets a stable id: "source-para-{N}" (0-indexed).
 * - When highlightedParagraph changes, smoothly scrolls to the target
 *   paragraph and applies a warm amber glow highlight.
 * - The highlight auto-clears after 2.5 seconds via onHighlightClear.
 */
export function AnnotatedSourceViewer({
    sourceText,
    highlightedParagraph,
    onHighlightClear,
    className,
}: AnnotatedSourceViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Split the source text into non-empty paragraphs
    const paragraphs = useMemo(() => {
        if (!sourceText) return [];
        return sourceText
            .split(/\n{2,}/)
            .map((p) => p.trim())
            .filter(Boolean);
    }, [sourceText]);

    useEffect(() => {
        if (highlightedParagraph === null) return;

        // Scroll the highlighted paragraph into view
        const target = document.getElementById(`source-para-${highlightedParagraph}`);
        if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        // Auto-clear the highlight after 2.5 seconds
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
        clearTimerRef.current = setTimeout(() => {
            onHighlightClear();
        }, 2500);

        return () => {
            if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
        };
    }, [highlightedParagraph, onHighlightClear]);

    if (!sourceText) {
        return (
            <div className={cn("p-6 rounded-2xl bg-[var(--background-secondary)]/50 border border-[var(--border)] text-xs text-[var(--foreground-muted)] italic", className)}>
                No notes available.
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn("flex flex-col gap-2", className)}
        >
            {paragraphs.map((para, idx) => {
                const isHighlighted = highlightedParagraph === idx;
                return (
                    <p
                        key={idx}
                        id={`source-para-${idx}`}
                        className={cn(
                            "rounded-xl px-4 py-3 text-xs sm:text-sm leading-relaxed font-medium transition-all duration-500 select-text",
                            isHighlighted
                                ? "bg-[var(--amber)]/10 border border-[var(--amber)]/30 text-[var(--foreground)] shadow-[0_0_20px_rgba(229,169,60,0.12)]"
                                : "text-[var(--foreground-muted)] border border-transparent"
                        )}
                    >
                        {isHighlighted && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[var(--amber)] mr-2 opacity-80">
                                ¶{idx + 1}
                            </span>
                        )}
                        {para}
                    </p>
                );
            })}
        </div>
    );
}
