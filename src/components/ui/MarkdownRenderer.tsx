import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkBreaks from "remark-breaks";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";
import { BubblyThinkingLoader } from "./Markdown";
import { motion, AnimatePresence } from "framer-motion";

interface MarkdownRendererProps {
    content: string;
    className?: string;
    isStreaming?: boolean;
}

const TermPopover = ({ children }: { children?: React.ReactNode }) => {
    const termText = children ? String(children) : "";
    
    // Dictionary of high-yield study concepts with friendly definitions
    const definitions: Record<string, string> = {
        "reward circuitry": "The brain's pathway of neurons that triggers dopamine release during positive reinforcement loops.",
        "ventral tegmental area": "VTA: A group of neurons at the base of the brain that plays a critical role in the reward system.",
        "nucleus accumbens": "NAc: A key region in the brain's cognitive loop that handles pleasure, motivation, and habit formation.",
        "active recall": "A study method where you actively test your memory instead of passively re-reading slides.",
        "dopamine": "A neurotransmitter associated with learning, reinforcement, and reward-seeking behaviors.",
        "spaced repetition": "Systematic review of study concepts at increasing intervals to combat the forgetting curve.",
        "feynman technique": "A learning method where you explain a concept in simple, conversational terms to spot gaps in your understanding.",
        "cognitive retention": "The brain's ability to store, consolidate, and retrieve processed academic information over time.",
        "data structures": "Methods of organizing and storing data in computer memory to perform operations efficiently.",
        "algorithms": "Step-by-step procedures or formulas for solving problems and performing computations.",
        "recursion": "A programming technique where a function calls itself directly or indirectly to solve a problem."
    };

    const lowercaseTerm = termText.toLowerCase().trim();
    const definition = definitions[lowercaseTerm] || `Key study concept: ${termText}. Hover or tap this definition to explore the high-yield parts and lock it in.`;

    const [isVisible, setIsVisible] = useState(false);

    return (
        <span 
            className="relative inline-block cursor-help group/popover"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onClick={() => setIsVisible(!isVisible)}
        >
            <strong className="font-black text-[var(--accent)] underline decoration-dotted decoration-[var(--accent)]/50 underline-offset-4 hover:text-[var(--accent-light)] transition-colors">
                {children}
            </strong>
            <AnimatePresence>
                {isVisible && (
                    <motion.span
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-4 rounded-2xl bg-zinc-950/90 backdrop-blur-xl border border-zinc-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-xs text-zinc-200 z-50 text-center leading-relaxed"
                    >
                        <span className="block font-black text-white uppercase tracking-wider mb-1 text-[10px] text-[var(--blue-text)]">
                            Definition
                        </span>
                        {definition}
                        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-950/90" />
                    </motion.span>
                )}
            </AnimatePresence>
        </span>
    );
};

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
                    // TermPopover definition lookup
                    strong: ({ node, ...props }) => <TermPopover {...props} />,

                    code: ({ node, inline, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');
                        return !inline ? (
                            <div className="my-6 rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-sm overflow-hidden font-mono text-sm shadow-xl">
                                <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                        {match ? match[1] : 'code'}
                                    </span>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(codeString)}
                                        className="text-[10px] font-black uppercase tracking-wider text-[var(--blue-light)] hover:underline cursor-pointer"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <pre className="p-5 overflow-x-auto text-white/90 bg-transparent leading-relaxed custom-scrollbar m-0">
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                </pre>
                            </div>
                        ) : (
                            <code className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 font-mono text-[13px] text-amber-400 font-bold" {...props}>
                                {children}
                            </code>
                        );
                    },

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

