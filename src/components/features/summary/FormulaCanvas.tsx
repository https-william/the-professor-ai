"use client";

import React, { useMemo } from "react";
import { Sigma, Copy, Check } from "lucide-react";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";

export interface FormulaCanvasProps {
  content: string;
  className?: string;
}

export default function FormulaCanvas({
  content,
  className = "",
}: FormulaCanvasProps) {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  // Extract LaTeX style formulas from the content
  const formulas = useMemo(() => {
    if (!content) return [];
    
    const results: string[] = [];
    // Match $$...$$ block formulas
    const blockRegex = /\$\$(.*?)\$\$/g;
    let match;
    while ((match = blockRegex.exec(content)) !== null) {
      if (match[1].trim()) results.push(match[1].trim());
    }

    // Match \[...\] block formulas
    const bracketRegex = /\\\[(.*?)\\\]/g;
    while ((match = bracketRegex.exec(content)) !== null) {
      if (match[1].trim()) results.push(match[1].trim());
    }

    // Match inline $...$ (filter out plain text matches to prevent noise)
    const inlineRegex = /\$([^$\n]{3,60})\$/g;
    while ((match = inlineRegex.exec(content)) !== null) {
      // Check if it looks like a formula (contains mathematical symbols/operators)
      const hasMathChars = /[=\-+*\/\\_\^\{\}\(\)\d]/.test(match[1]);
      if (hasMathChars && match[1].trim()) {
        results.push(match[1].trim());
      }
    }

    // Remove duplicates
    return Array.from(new Set(results));
  }, [content]);

  const handleCopy = (formula: string, index: number) => {
    navigator.clipboard.writeText(formula);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (formulas.length === 0) {
    return null;
  }

  return (
    <GlassmorphicCard
      intensity="light"
      radius="20px"
      className={`p-4 border border-white/5 flex flex-col gap-3 ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <Sigma size={16} className="text-[#E5A93C]" />
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/80">
          Key Formula Canvas
        </span>
      </div>

      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {formulas.map((formula, idx) => (
          <div
            key={idx}
            className="group relative bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 flex flex-col gap-1 transition-all"
          >
            {/* Copy Button */}
            <button
              onClick={() => handleCopy(formula, idx)}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-950/40 text-white/40 hover:text-white hover:bg-[#E5A93C]/20 transition-all opacity-0 group-hover:opacity-100"
              title="Copy LaTeX"
            >
              {copiedIndex === idx ? (
                <Check size={10} className="text-[#2BB288]" />
              ) : (
                <Copy size={10} />
              )}
            </button>

            {/* Formula Render (Monospace clean text for formula layout) */}
            <code className="text-xs font-mono text-[#F7D293] pr-6 select-all break-all leading-normal whitespace-pre-wrap">
              {formula}
            </code>
          </div>
        ))}
      </div>
    </GlassmorphicCard>
  );
}
