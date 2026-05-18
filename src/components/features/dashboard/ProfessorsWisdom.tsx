"use client";

import { useEffect, useState } from "react";
import { Coffee } from "lucide-react";

import { PROFESSOR_WISDOM, getDailyWisdom } from "@/lib/wisdom";

export default function ProfessorsWisdom() {
    const [quote, setQuote] = useState(PROFESSOR_WISDOM[0]);
 
    useEffect(() => {
        setQuote(getDailyWisdom());
    }, []);
 
    return (
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-2)]/50 backdrop-blur-xl relative overflow-hidden group hover:border-[var(--blue)]/30 transition-all flex-1">
            <div className="flex items-center gap-2 mb-4 relative z-10">
                <Coffee size={13} className="text-[var(--text-3)]" />
                <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-[var(--text-3)]">Professor's Wisdom</span>
            </div>
 
            <div className="relative z-10">
                <p className="text-base md:text-lg font-serif leading-relaxed text-[var(--text)] italic">
                    &ldquo;{quote.text}&rdquo;
                </p>
                <div className="w-8 h-px bg-[var(--blue)]/40 mt-4 mb-2" />
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[var(--text-3)]">
                    {quote.author}
                </p>
            </div>
        </div>
    );
}
