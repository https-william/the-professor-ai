"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

const quotes = [
    { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
    { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius" },
    { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
    { text: "He who fears death will never do anything worthy of a man who is alive.", author: "Seneca" },
    { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" }
];

export default function QuoteOfTheStoic() {
    const [quote, setQuote] = useState(quotes[0]);
 
    useEffect(() => {
        // Pick daily based on Date hash
        const day = new Date().getDay();
        setQuote(quotes[day % quotes.length]);
    }, []);
 
    return (
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-2)]/50 backdrop-blur-xl relative overflow-hidden group hover:border-[var(--blue)]/30 transition-all flex-1">
            <div className="flex items-center gap-2 mb-4 relative z-10">
                <BookOpen size={13} className="text-[var(--text-3)]" />
                <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-[var(--text-3)]">Daily Wisdom</span>
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
