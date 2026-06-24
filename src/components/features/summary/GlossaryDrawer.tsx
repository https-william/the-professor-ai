"use client";

import React, { useState, useMemo } from "react";
import { BookOpen, Search, Sparkles, X } from "lucide-react";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";

export interface GlossaryDrawerProps {
  content: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface GlossaryItem {
  term: string;
  definition: string;
  analogy?: string;
}

export default function GlossaryDrawer({
  content,
  isOpen,
  onClose,
  className = "",
}: GlossaryDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeAnalogy, setActiveAnalogy] = useState<number | null>(null);

  // Extract terms from double-asterisk bold markers in markdown: **Term**
  const glossaryItems = useMemo(() => {
    if (!content) return [];

    const items: GlossaryItem[] = [];
    const lines = content.split("\n");

    lines.forEach((line) => {
      // Look for format: **Term**: Definition or **Term** - Definition
      const boldMatch = line.match(/\*\*(.*?)\*\*[:\-]\s*(.*)/);
      if (boldMatch) {
        const term = boldMatch[1].trim();
        const definition = boldMatch[2].trim();
        if (term.length > 2 && term.length < 40 && definition.length > 5) {
          items.push({
            term,
            definition: definition.replace(/\*\*|`/g, ""), // clean Markdown artifacts
            analogy: generateAnalogy(term, definition),
          });
        }
      }
    });

    // If no bold definitions found, extract plain bold words and make simple contexts
    if (items.length === 0) {
      const boldRegex = /\*\*(.*?)\*\*/g;
      let match;
      const termsFound = new Set<string>();
      while ((match = boldRegex.exec(content)) !== null) {
        const term = match[1].trim();
        if (term.length > 2 && term.length < 30 && !termsFound.has(term)) {
          termsFound.add(term);
          items.push({
            term,
            definition: `Key concept highlighted in this chapter.`,
            analogy: generateAnalogy(term, "key concept"),
          });
        }
      }
    }

    return items;
  }, [content]);

  // Generate witty local Nigerian analogies for learning concepts dynamically
  function generateAnalogy(term: string, definition: string): string {
    const t = term.toLowerCase();
    if (t.includes("api") || t.includes("interface")) {
      return "Like a waiter in a local bukata. You tell them you want Jollof, they tell the kitchen, and bring you the food. You don't need to know how the stove works.";
    }
    if (t.includes("cache") || t.includes("caching") || t.includes("buffer")) {
      return "Like putting cold pure water bags in a cooler right in front of your shop, instead of walking to the big freezer inside the house every time a customer calls.";
    }
    if (t.includes("database") || t.includes("db") || t.includes("storage")) {
      return "Like a ledger book kept by a market supervisor recording every single trader's shop location. Nobody forgets who owns shop 42.";
    }
    if (t.includes("redundancy") || t.includes("replication") || t.includes("backup")) {
      return "Like keeping two generators (one Tiger gen, one big Mikano) in case NEPA does their usual thing mid-sprint.";
    }
    if (t.includes("asynchronous") || t.includes("async")) {
      return "Like ordering suya and leaving your number with the Aboki. You go buy drinks, chat with friends, and collect your suya when it's ready, instead of standing there staring at the fire.";
    }
    if (t.includes("synchronous") || t.includes("sync")) {
      return "Like standing in a fuel queue at a filling station. You cannot do anything else; you must wait until the car in front of you moves.";
    }
    return `Think of this like delegation. You don't need to do everything yourself; you pass the load so you can focus on geting your sleep back!`;
  }

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return glossaryItems;
    return glossaryItems.filter(
      (item) =>
        item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [glossaryItems, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-y-0 right-0 z-[120] w-[320px] sm:w-[380px] bg-zinc-950/95 border-l border-white/5 shadow-2xl flex flex-col p-4 animate-in slide-in-from-right duration-300 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-[#E5A93C]" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white">
            Glossary & Metaphors
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="my-3 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search terms..."
          className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/5 focus:border-[#E5A93C]/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 outline-none transition-all"
        />
      </div>

      {/* Term List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {filteredItems.length === 0 ? (
          <div className="text-center p-6 text-white/30 text-xs">
            No terms extracted for this segment.
          </div>
        ) : (
          filteredItems.map((item, idx) => (
            <div
              key={idx}
              className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex flex-col gap-2 transition-all hover:bg-white/[0.04]"
            >
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-black text-[#F7D293] italic tracking-wide uppercase">
                  {item.term}
                </span>
                <button
                  onClick={() => setActiveAnalogy(activeAnalogy === idx ? null : idx)}
                  className={`text-[9px] font-bold py-0.5 px-2 rounded-full border flex items-center gap-1 transition-all ${
                    activeAnalogy === idx
                      ? 'bg-[#E5A93C]/20 border-[#E5A93C]/30 text-[#E5A93C]'
                      : 'bg-white/5 border-white/5 text-white/50 hover:text-white/80 hover:bg-white/10'
                  }`}
                  title="Show metaphor"
                >
                  <Sparkles size={8} /> Metaphor
                </button>
              </div>

              <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                {item.definition}
              </p>

              {activeAnalogy === idx && (
                <div className="bg-[#E5A93C]/5 border border-[#E5A93C]/10 rounded-lg p-2.5 mt-1 animate-in zoom-in-95 duration-200">
                  <span className="text-[8px] font-black tracking-widest text-[#E5A93C] uppercase block mb-1">
                    Coffee-Shop Analogy:
                  </span>
                  <p className="text-[10.5px] text-[#F7D293]/80 leading-relaxed font-medium italic">
                    {item.analogy}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
