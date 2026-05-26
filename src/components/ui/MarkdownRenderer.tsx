"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkBreaks from "remark-breaks";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
    content: string;
    className?: string;
    isStreaming?: boolean;
}

/**
 * Premium Markdown Renderer for The Professor.
 * Supports:
 * - KaTeX (Math formulas like $\sqrt{a^2 + b^2}$)
 * - GFM (Tables, task lists)
 * - Automatic line breaks
 * - Professor-style "Identity Nudges" styling
 */
import { useState, useEffect } from "react";
import { BubblyThinkingLoader } from "./Markdown";

export default function MarkdownRenderer({ 
    content, 
    className,
    isStreaming = false 
}: MarkdownRendererProps) {
    const isEmpty = !content || content.trim() === "";

    if (isEmpty && isStreaming) {
        return (
            <div className={cn("prose prose-invert max-w-none transition-all duration-300", className)}>
                <BubblyThinkingLoader />
            </div>
        );
    }

    const cleanContent = (content || "")
        .replace(/[ \t]+:[ \t]*/g, ': ')
        .replace(/:[ \t]+/g, ': ');

    return (
        <div className={cn(
            "prose prose-invert max-w-none transition-all duration-300",
            "prose-headings:font-black prose-headings:tracking-tight",
            "prose-p:leading-relaxed prose-p:text-white/80",
            "prose-strong:text-white prose-strong:font-bold",
            "prose-code:text-amber-400 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none",
            "prose-li:text-white/70",
            isStreaming && "typing-cursor",
            className
        )}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    // Custom rendering for headings to add "weight"
                    h1: ({ node, ...props }) => <h1 className="text-3xl mt-8 mb-4 bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-2xl mt-8 mb-4 text-white" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-xl mt-6 mb-3 text-white/90" {...props} />,
                    
                    // Style horizontal rules
                    hr: ({ node, ...props }) => <hr className="my-12 border-white/5" {...props} />,
                    
                    // Special treatment for blockquotes (Professor's Insights)
                    blockquote: ({ node, ...props }) => (
                        <blockquote 
                            className="border-l-4 border-white/20 pl-6 my-8 italic text-white/60 bg-white/[0.02] py-4 rounded-r-2xl"
                            {...props} 
                        />
                    ),

                    // Custom table styling
                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-8 rounded-2xl border border-white/5 bg-white/[0.02]">
                            <table className="min-w-full divide-y divide-white/10" {...props} />
                        </div>
                    ),
                    thead: ({ node, ...props }) => <thead className="bg-white/5" {...props} />,
                    th: ({ node, ...props }) => <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-white/40" {...props} />,
                    td: ({ node, ...props }) => <td className="px-6 py-4 text-sm text-white/70 border-t border-white/5" {...props} />,
                }}
            >
                {cleanContent}
            </ReactMarkdown>
            
            {/* The "Identity Nudge" styling for the footer if it exists */}
            {content && content.includes("That's the difference sha.") && (
                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center text-center opacity-40 hover:opacity-100 transition-opacity">
                    <p className="text-[10px] uppercase tracking-[0.4em] font-black text-white/30 mb-2">
                        Professor's Verdict
                    </p>
                </div>
            )}
        </div>
    );
}

