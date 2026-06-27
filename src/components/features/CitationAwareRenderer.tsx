"use client";

import React, { useMemo } from "react";

interface CitationAwareRendererProps {
    text: string;
    onCitationClick?: (paragraphIndex: number) => void;
    className?: string;
}

/**
 * CitationAwareRenderer
 *
 * Splits text on [§N] markers and renders each N as a small amber superscript
 * badge. Clicking fires onCitationClick(N-1) so the parent can scroll the Raw
 * Notes pane to the matching paragraph.
 *
 * Backwards compatible: if no [§N] markers exist, raw text is returned as-is.
 */
export function CitationAwareRenderer({
    text,
    onCitationClick,
    className,
}: CitationAwareRendererProps) {
    const segments = useMemo(() => {
        const result: Array<{ type: "text"; content: string } | { type: "citation"; index: number }> = [];
        const regex = /\[§(\d+)\]/g;
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                result.push({ type: "text", content: text.slice(lastIndex, match.index) });
            }
            result.push({ type: "citation", index: parseInt(match[1], 10) - 1 });
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            result.push({ type: "text", content: text.slice(lastIndex) });
        }

        return result;
    }, [text]);

    const hasCitations = segments.some((s) => s.type === "citation");
    if (!hasCitations) {
        return <span className={className}>{text}</span>;
    }

    return (
        <span className={className}>
            {segments.map((seg, i) => {
                if (seg.type === "text") {
                    return <React.Fragment key={i}>{seg.content}</React.Fragment>;
                }
                const paragraphIndex = seg.index;
                const displayNumber = paragraphIndex + 1;
                return (
                    <sup
                        key={i}
                        className="citation-badge"
                        title={`View source paragraph ${displayNumber}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onCitationClick?.(paragraphIndex);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onCitationClick?.(paragraphIndex);
                            }
                        }}
                        aria-label={`Jump to source paragraph ${displayNumber}`}
                    >
                        §{displayNumber}
                    </sup>
                );
            })}
        </span>
    );
}
