"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CommandBar() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isLoading) return;

        setIsLoading(true);
        router.push(`/professor?initial=${encodeURIComponent(query)}`);
    };

    return (
        <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto group">
            {/* Subtle glow on hover */}
            <div
                className={`absolute inset-0 rounded-2xl blur-xl transition-opacity duration-500 ${isLoading ? 'opacity-30' : 'opacity-0 group-hover:opacity-20'
                    }`}
                style={{ background: "linear-gradient(135deg, rgba(196,163,90,0.3) 0%, rgba(42,67,101,0.2) 100%)" }}
            />

            <div className="relative flex items-center bg-[#0c0c10] border border-[#1f1f24] rounded-2xl px-5 py-4 transition-all duration-300 group-hover:border-[#2a2a30] group-focus-within:border-[#C4A35A]/30 group-focus-within:ring-1 group-focus-within:ring-[#C4A35A]/10">
                <Sparkles className={`w-5 h-5 text-[#C4A35A] mr-4 flex-shrink-0 ${isLoading ? 'animate-spin' : ''}`} />

                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={isLoading ? "Consulting the archives..." : "What shall we explore today?"}
                    disabled={isLoading}
                    className="flex-1 bg-transparent border-none outline-none text-base text-[#F5F0E8] placeholder:text-[#5a5650] font-light disabled:opacity-50"
                />

                <button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className="p-2.5 rounded-xl bg-[#1a1a1f] hover:bg-[#C4A35A]/10 text-[#8a8680] hover:text-[#C4A35A] border border-transparent hover:border-[#C4A35A]/20 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </form>
    );
}
