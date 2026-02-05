"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

// Mock data service
const getSharedContent = (id: string) => {
    // Deterministic mock based on ID
    return {
        title: "Cell Division & Mitosis",
        type: "Flashcards",
        author: "Alex",
        avatar: "A",
        count: 24,
        preview: [
            { q: "What is Mitosis?", a: "A type of cell division that results in two daughter cells..." },
            { q: "What is Interphase?", a: "The resting phase between successive mitotic divisions..." },
            { q: "What happens in Prophase?", a: "Chromatin condenses into chromosomes..." },
        ]
    };
};

export default function SharePage() {
    const params = useParams();
    const [content, setContent] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // Simulate fetch
        if (params?.id) {
            setContent(getSharedContent(params.id as string));
        }
    }, [params]);

    const handleCopy = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!content) return (
        <div className="flex h-screen items-center justify-center bg-[#09090B] text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-teal-500 animate-spin" />
                <p className="text-zinc-500 text-sm">Loading shared content...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#09090B] text-white overflow-hidden relative">
            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-[30%] w-[600px] h-[600px] bg-teal-500/[0.04] rounded-full blur-[150px]" />
            </div>

            {/* Header */}
            <header className="absolute top-0 w-full h-16 flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-base">school</span>
                    </div>
                    <span className="font-semibold tracking-tight">The Professor</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">Log in</Link>
                    <Link
                        href="/signup"
                        className="px-4 py-2 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
                    >
                        Sign up
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative pt-32 pb-20 px-4 max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/50 border border-white/[0.06] text-xs text-zinc-400 mb-6">
                        <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-white">
                            {content.avatar}
                        </div>
                        Shared by {content.author}
                    </div>
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
                        {content.title}
                    </h1>
                    <div className="flex items-center justify-center gap-4 text-sm text-zinc-500">
                        <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-teal-400 text-lg">style</span>
                            {content.type}
                        </span>
                        <span>•</span>
                        <span>{content.count} items</span>
                        <span>•</span>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">
                                {copied ? "check" : "link"}
                            </span>
                            {copied ? "Copied" : "Copy link"}
                        </button>
                    </div>
                </div>

                {/* Content Preview */}
                <div className="space-y-4 mb-8">
                    {content.preview.map((card: any, i: number) => (
                        <div key={i} className="p-6 rounded-2xl bg-zinc-900/50 border border-white/[0.06]">
                            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">Term</p>
                            <h3 className="text-lg font-medium text-white mb-6">{card.q}</h3>
                            <div className="h-px w-full bg-white/[0.04] mb-6" />
                            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">Definition</p>
                            <p className="text-zinc-300 leading-relaxed">{card.a}</p>
                        </div>
                    ))}

                    {/* Blurred Cards Overlay */}
                    <div className="relative">
                        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/[0.06] blur-sm opacity-50 select-none">
                            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">Term</p>
                            <h3 className="text-lg font-medium text-white mb-6">What is Cytokinesis?</h3>
                            <div className="h-px w-full bg-white/[0.04] mb-6" />
                            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">Definition</p>
                            <p className="text-zinc-300 leading-relaxed">The physical process of cell division...</p>
                        </div>

                        {/* CTA Overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-[400px] bg-gradient-to-t from-[#09090B] via-[#09090B]/90 to-transparent flex flex-col items-center justify-end pb-10">
                            <div className="text-center max-w-sm mx-auto">
                                <h3 className="text-2xl font-semibold mb-3">Unlock all {content.count} cards</h3>
                                <p className="text-zinc-400 mb-8">
                                    Join thousands of students using The Professor to master their exams with AI.
                                </p>
                                <Link
                                    href="/signup"
                                    className="block w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold text-lg shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-transform"
                                >
                                    Studying this deck
                                </Link>
                                <p className="mt-4 text-xs text-zinc-500">
                                    Already have an account? <Link href="/login" className="text-white hover:underline">Log in</Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 text-center text-xs text-zinc-600 border-t border-white/[0.04] z-50 relative">
                <p>&copy; 2026 The Professor AI. All rights reserved.</p>
            </footer>
        </div>
    );
}
