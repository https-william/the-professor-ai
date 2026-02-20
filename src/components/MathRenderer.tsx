"use client";

import { useMemo } from "react";
import katex from "katex";

interface MathRendererProps {
    /** Text containing LaTeX math. Inline: $...$, Block: $$...$$ */
    children: string;
    className?: string;
}

/**
 * Renders text with embedded LaTeX math expressions.
 * Supports inline ($...$) and display ($$...$$) math.
 * Non-math text is rendered as-is.
 */
export function MathRenderer({ children, className = "" }: MathRendererProps) {
    const rendered = useMemo(() => {
        if (!children) return "";

        // Split on $$...$$ (display) and $...$ (inline)
        // Process display math first, then inline
        const parts: { type: "text" | "math-inline" | "math-display"; content: string }[] = [];
        let remaining = children;

        // Extract display math ($$...$$)
        const displayRegex = /\$\$([\s\S]*?)\$\$/g;
        let lastIndex = 0;
        let match;

        while ((match = displayRegex.exec(remaining)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ type: "text", content: remaining.slice(lastIndex, match.index) });
            }
            parts.push({ type: "math-display", content: match[1] });
            lastIndex = match.index + match[0].length;
        }
        if (lastIndex < remaining.length) {
            parts.push({ type: "text", content: remaining.slice(lastIndex) });
        }

        // Now process inline math ($...$) within text parts
        const finalParts: typeof parts = [];
        for (const part of parts) {
            if (part.type !== "text") {
                finalParts.push(part);
                continue;
            }
            const inlineRegex = /\$([^\$\n]+?)\$/g;
            let inlineLastIndex = 0;
            let inlineMatch;
            while ((inlineMatch = inlineRegex.exec(part.content)) !== null) {
                if (inlineMatch.index > inlineLastIndex) {
                    finalParts.push({ type: "text", content: part.content.slice(inlineLastIndex, inlineMatch.index) });
                }
                finalParts.push({ type: "math-inline", content: inlineMatch[1] });
                inlineLastIndex = inlineMatch.index + inlineMatch[0].length;
            }
            if (inlineLastIndex < part.content.length) {
                finalParts.push({ type: "text", content: part.content.slice(inlineLastIndex) });
            }
        }

        return finalParts.map((part, i) => {
            if (part.type === "text") {
                return part.content;
            }
            try {
                const html = katex.renderToString(part.content, {
                    displayMode: part.type === "math-display",
                    throwOnError: false,
                    trust: true,
                });
                return `<span class="katex-wrapper ${part.type === 'math-display' ? 'katex-display-wrapper' : ''}" key="${i}">${html}</span>`;
            } catch {
                return `<code>${part.content}</code>`;
            }
        }).join("");
    }, [children]);

    return (
        <span
            className={className}
            dangerouslySetInnerHTML={{ __html: rendered }}
        />
    );
}
