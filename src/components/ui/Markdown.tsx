"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkBreaks from "remark-breaks";
import "katex/dist/katex.min.css";
import { Sparkles } from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const revealVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.5, ease: "circOut" as const }
    }
};

const mdComponents = {
    h1: ({node, ...props}: any) => <motion.h1 variants={revealVariants} className="text-3xl font-black text-[var(--foreground)] mb-6 mt-4 tracking-tighter" {...props} />,
    h2: ({node, ...props}: any) => <motion.h2 variants={revealVariants} className="text-2xl font-black text-[var(--foreground)] mb-5 mt-10 pb-2 border-b border-white/5 flex items-center gap-3" {...props} />,
    h3: ({node, ...props}: any) => <motion.h3 variants={revealVariants} className="text-lg font-bold text-[var(--foreground-secondary)] mb-4 mt-8" {...props} />,
    h4: ({node, ...props}: any) => <motion.h4 variants={revealVariants} className="text-xs font-bold text-[var(--foreground-muted)] mb-2 mt-6 uppercase tracking-[0.2em]" {...props} />,
    p: ({node, ...props}: any) => <motion.p variants={revealVariants} className="mb-6 leading-[1.8] text-[16px] md:text-[17px] text-[var(--foreground-secondary)] font-medium" {...props} />,
    ul: ({node, ...props}: any) => <motion.ul variants={revealVariants} className="mb-8 space-y-3 list-none pl-1" {...props} />,
    ol: ({node, ...props}: any) => <motion.ol variants={revealVariants} className="mb-8 space-y-4 list-decimal pl-6 text-[var(--foreground-secondary)] leading-[1.8]" {...props} />,
    li: ({node, ...props}: any) => (
        <motion.li variants={revealVariants} className="flex gap-3 text-[15px] md:text-[16px] text-[var(--foreground-secondary)] items-start group leading-[1.8]" {...props}>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/45 mt-[11px] flex-shrink-0 group-hover:bg-[var(--accent)] transition-colors" />
            <span className="opacity-95">{props.children}</span>
        </motion.li>
    ),
    strong: ({node, ...props}: any) => <strong className="font-black text-[var(--foreground)]" {...props} />,
    code: ({node, inline, className, children, ...props}: any) => {
        const match = /language-(\w+)/.exec(className || '');
        const codeString = String(children).replace(/\n$/, '');
        return !inline ? (
            <div className="my-6 rounded-2xl border border-[var(--border)] bg-[var(--foreground)]/[0.01] backdrop-blur-sm overflow-hidden font-mono text-sm shadow-xl">
                <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--foreground)]/[0.02]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">
                        {match ? match[1] : 'code'}
                    </span>
                    <button 
                        onClick={() => navigator.clipboard.writeText(codeString)}
                        className="text-[10px] font-black uppercase tracking-wider text-[var(--blue)] hover:underline cursor-pointer"
                    >
                        Copy
                    </button>
                </div>
                <pre className="p-5 overflow-x-auto text-[var(--foreground)]/90 bg-transparent leading-relaxed custom-scrollbar m-0">
                    <code className={className} {...props}>
                        {children}
                    </code>
                </pre>
            </div>
        ) : (
            <code className="px-2 py-0.5 rounded-lg bg-[var(--foreground)]/5 border border-[var(--border)] font-mono text-[13px] text-[var(--blue)] font-bold" {...props}>
                {children}
            </code>
        );
    },
    blockquote: ({node, ...props}: any) => (
        <motion.blockquote variants={revealVariants} className="border-l-4 border-[var(--border)] pl-6 py-4 my-10 italic text-[var(--foreground-muted)] bg-[var(--foreground)]/[0.02] rounded-r-3xl" {...props} />
    ),
    table: ({node, ...props}: any) => (
        <motion.div variants={revealVariants} className="overflow-x-auto my-12 rounded-[2rem] border border-[var(--border)] bg-[var(--foreground)]/[0.01] backdrop-blur-sm">
            <table className="min-w-full divide-y divide-[var(--border)]" {...props} />
        </motion.div>
    ),
    th: ({node, ...props}: any) => <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)]" {...props} />,
    td: ({node, ...props}: any) => <td className="px-8 py-5 text-sm text-[var(--foreground)]/60 border-t border-[var(--border)]" {...props} />,
};

import { useState, useEffect } from "react";

const THINKING_PHRASES = [
    "Consulting the archives...",
    "Finding the good parts...",
    "Scanning the lecture slides...",
    "Making it simple...",
    "Filtering the noise...",
    "Closing the gap...",
];

export function BubblyThinkingLoader() {
    const [phrase, setPhrase] = useState("");

    useEffect(() => {
        setPhrase(THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)]);
        const interval = setInterval(() => {
            setPhrase(prev => {
                const remaining = THINKING_PHRASES.filter(p => p !== prev);
                return remaining[Math.floor(Math.random() * remaining.length)];
            });
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col gap-3 py-4 pl-1">
            <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white/40 thinking-dot" />
                <span className="w-2 h-2 rounded-full bg-white/40 thinking-dot" />
                <span className="w-2 h-2 rounded-full bg-white/40 thinking-dot" />
            </div>
            <p className="text-[10px] font-mono font-bold tracking-widest text-[var(--foreground-muted)] uppercase animate-pulse">
                {phrase}
            </p>
        </div>
    );
}

export default function Markdown({ 
    children, 
    className,
    isStreaming = false 
}: { 
    children: string; 
    className?: string; 
    isStreaming?: boolean; 
}) {
    const isEmpty = !children || children.trim() === "";

    if (isEmpty && isStreaming) {
        return (
            <div className={cn("selection:bg-[var(--foreground)]/10 selection:text-[var(--foreground)]", className)}>
                <BubblyThinkingLoader />
            </div>
        );
    }

    const cleanChildren = (children || "")
        .replace(/[ \t]+:[ \t]*/g, ': ')
        .replace(/:[ \t]+/g, ': ');

    return (
        <div className={cn(
            "selection:bg-[var(--foreground)]/10 selection:text-[var(--foreground)] font-serif", 
            isStreaming && "typing-cursor",
            className
        )}>
            <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]} 
                rehypePlugins={[rehypeKatex]}
                components={mdComponents}
            >
                {cleanChildren}
            </ReactMarkdown>
            
            {/* The "Identity Nudge" styling for the footer if it exists */}
            {children && children.includes("That's the difference sha.") && (
                <motion.div 
                    variants={revealVariants}
                    className="mt-20 pt-10 border-t border-[var(--border)] flex flex-col items-center text-center opacity-30 hover:opacity-100 transition-opacity duration-700"
                >
                    <p className="text-[9px] uppercase tracking-[0.5em] font-black text-[var(--foreground-muted)] mb-2">
                        Verification Complete
                    </p>
                    <div className="w-1 h-1 rounded-full bg-[var(--foreground)]/20" />
                </motion.div>
            )}

            {/* AI Transparency Watermark */}
            {children && !children.includes("That's the difference sha.") && (
                <motion.div 
                    variants={revealVariants}
                    className="mt-20 pt-10 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-center gap-3 text-[9px] text-[var(--foreground-muted)] select-none"
                >
                    <Sparkles size={12} className="text-[var(--foreground-muted)]" />
                    <p className="leading-tight font-black uppercase tracking-[0.3em]">
                        AI-Generated Synthesis • Verify critical facts
                    </p>
                </motion.div>
            )}
        </div>
    );
}

