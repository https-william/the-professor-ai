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
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)]/50 backdrop-blur-sm relative overflow-hidden group hover:border-[var(--accent)]/30 transition-all flex-1">
            <div className="flex items-center gap-2 mb-4 relative z-10">
                <BookOpen size={13} className="text-[var(--foreground-muted)]" />
                <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-[var(--foreground-muted)]">Daily Wisdom</span>
            </div>

            <div className="relative z-10">
                <p className="text-base md:text-lg font-serif leading-relaxed text-[var(--foreground)] italic">
                    &ldquo;{quote.text}&rdquo;
                </p>
                <div className="w-8 h-px bg-[var(--accent)]/40 mt-4 mb-2" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--foreground-muted)]">
                    {quote.author}
                </p>
            </div>
        </div>
    );
}
