"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkBreaks from "remark-breaks";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

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
                    h1: ({ node, ...props }) => <h1 className="text-2xl md:text-4xl font-black mt-12 mb-6 bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent tracking-tight border-b border-white/5 pb-3" {...props} />,
                    h2: ({ node, children, ...props }) => {
                        const isKeyFacts = typeof children === 'string' && children.toLowerCase().includes('key facts');
                        if (isKeyFacts) {
                            return (
                                <h2 className="text-xl md:text-2xl font-black text-[var(--accent)] flex items-center gap-2 border-b border-[var(--accent)]/20 pb-3 mb-6 mt-12 tracking-tight" {...props}>
                                    <Zap size={18} className="text-[var(--accent)] animate-pulse shrink-0" />
                                    {children}
                                </h2>
                            );
                        }
                        return (
                            <h2 className="text-xl md:text-2xl font-black mt-12 mb-5 text-white border-l-4 border-[var(--blue)] pl-4 flex items-center gap-2 tracking-tight" {...props}>
                                {children}
                            </h2>
                        );
                    },
                    h3: ({ node, children, ...props }) => (
                        <h3 className="text-lg md:text-xl font-black mt-8 mb-4 text-white/95 border-l-2 border-white/20 pl-3 tracking-tight" {...props}>
                            {children}
                        </h3>
                    ),
                    
                    // Style horizontal rules
                    hr: ({ node, ...props }) => <hr className="my-12 border-white/5" {...props} />,
                    
                    // Special treatment for blockquotes (Professor's Insights)
                    blockquote: ({ node, ...props }) => (
                        <blockquote 
                            className="border-l-4 border-[var(--blue)]/40 pl-6 my-8 italic text-white/80 bg-white/[0.01] py-5 pr-4 rounded-r-2xl border-dashed"
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

                    // Stylized list rendering to prevent monotone look
                    ul: ({ node, ...props }) => <ul className="my-6 space-y-3.5 pl-0" {...props} />,
                    ol: ({ node, ...props }) => <ol className="my-6 space-y-3.5 pl-6 list-decimal text-white/80" {...props} />,
                    li: ({ node, ...props }) => (
                        <li className="list-none flex items-start gap-3 mb-2 text-white/85 leading-relaxed text-sm md:text-base font-medium" {...props}>
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] mt-2.5 shrink-0 animate-pulse shadow-[0_0_8px_var(--blue-glow)]" />
                            <span className="flex-1">{props.children}</span>
                        </li>
                    ),
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

