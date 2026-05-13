"use client";

import { useEffect, useState } from "react";
import { Coffee } from "lucide-react";

const quotes = [
    { text: "Don't worry about being perfect. Worry about being finished. Your bed misses you.", author: "The Professor" },
    { text: "A 20-minute nap is better than a 2-hour panic. Trust me on this one.", author: "The Professor" },
    { text: "Study less, but study better. Life is too short for re-reading the same paragraph 40 times.", author: "The Professor" },
    { text: "You've got this. And if you don't, I've got your notes. We'll figure it out together.", author: "The Professor" },
    { text: "The secret to passing? Knowing when to close the laptop and go for a walk.", author: "The Professor" },
    { text: "Your notes aren't supposed to be a novel. Let's just get to the good parts.", author: "The Professor" },
    { text: "Grades matter, but so does your sanity. Take a break, grab a coffee.", author: "The Professor" },
    { text: "Recall is king. Your highlighter is just a glorified crayon. Use it wisely.", author: "The Professor" },
    { text: "If you can't explain it simply, you're just hiding behind big words. I see you.", author: "The Professor" }
];

export default function ProfessorsWisdom() {
    const [quote, setQuote] = useState(quotes[0]);
 
    useEffect(() => {
        // Pick daily based on Date hash
        const day = new Date().getDay();
        setQuote(quotes[day % quotes.length]);
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
