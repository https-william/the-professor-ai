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
        transition: { duration: 0.5, ease: "circOut" }
    }
};

const mdComponents = {
    h1: ({node, ...props}: any) => <motion.h1 variants={revealVariants} className="text-3xl font-black text-white mb-8 mt-4 tracking-tighter bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent" {...props} />,
    h2: ({node, ...props}: any) => <motion.h2 variants={revealVariants} className="text-xl font-bold text-white mb-6 mt-12 flex items-center gap-3 border-b border-white/5 pb-3" {...props} />,
    h3: ({node, ...props}: any) => <motion.h3 variants={revealVariants} className="text-lg font-bold text-white/90 mb-4 mt-10" {...props} />,
    h4: ({node, ...props}: any) => <motion.h4 variants={revealVariants} className="text-sm font-bold text-white/60 mb-2 mt-8 uppercase tracking-[0.2em]" {...props} />,
    p: ({node, ...props}: any) => <motion.p variants={revealVariants} className="mb-8 leading-relaxed text-[17px] text-white/80 font-medium" {...props} />,
    ul: ({node, ...props}: any) => <motion.ul variants={revealVariants} className="mb-10 space-y-4 list-none" {...props} />,
    ol: ({node, ...props}: any) => <motion.ol variants={revealVariants} className="mb-10 space-y-5 list-decimal pl-6 text-white/70" {...props} />,
    li: ({node, ...props}: any) => (
        <motion.li variants={revealVariants} className="flex gap-4 text-base text-white/70 items-start group" {...props}>
            <span className="w-1.5 h-1.5 rounded-full bg-white/20 mt-2.5 flex-shrink-0 group-hover:bg-white/40 transition-colors" />
            <span className="opacity-90 leading-relaxed">{props.children}</span>
        </motion.li>
    ),
    strong: ({node, ...props}: any) => <strong className="font-black text-white" {...props} />,
    code: ({node, ...props}: any) => (
        <code className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 font-mono text-[13px] text-amber-200" {...props} />
    ),
    blockquote: ({node, ...props}: any) => (
        <motion.blockquote variants={revealVariants} className="border-l-4 border-white/10 pl-6 py-4 my-10 italic text-white/50 bg-white/[0.02] rounded-r-3xl" {...props} />
    ),
    table: ({node, ...props}: any) => (
        <motion.div variants={revealVariants} className="overflow-x-auto my-12 rounded-[2rem] border border-white/5 bg-white/[0.01] backdrop-blur-sm">
            <table className="min-w-full divide-y divide-white/10" {...props} />
        </motion.div>
    ),
    th: ({node, ...props}: any) => <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-white/30" {...props} />,
    td: ({node, ...props}: any) => <td className="px-8 py-5 text-sm text-white/60 border-t border-white/5" {...props} />,
};

export default function Markdown({ children, className }: { children: string, className?: string }) {
    return (
        <div className={cn("selection:bg-white/10 selection:text-white", className)}>
            <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]} 
                rehypePlugins={[rehypeKatex]}
                components={mdComponents}
            >
                {children}
            </ReactMarkdown>
            
            {/* The "Identity Nudge" styling for the footer if it exists */}
            {children.includes("That's the difference sha.") && (
                <motion.div 
                    variants={revealVariants}
                    className="mt-20 pt-10 border-t border-white/5 flex flex-col items-center text-center opacity-30 hover:opacity-100 transition-opacity duration-700"
                >
                    <p className="text-[9px] uppercase tracking-[0.5em] font-black text-white/40 mb-2">
                        Strategic Verification Complete
                    </p>
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                </motion.div>
            )}

            {/* AI Transparency Watermark */}
            {!children.includes("That's the difference sha.") && (
                <motion.div 
                    variants={revealVariants}
                    className="mt-20 pt-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-center gap-3 text-[9px] text-white/20 select-none"
                >
                    <Sparkles size={12} className="text-white/20" />
                    <p className="leading-tight font-black uppercase tracking-[0.3em]">
                        AI-Generated Synthesis • Verify critical facts
                    </p>
                </motion.div>
            )}
        </div>
    );
}
