"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface SharedGenerationClientProps {
    generation?: {
        title: string;
        type: string;
        content: any;
        created_at: string;
    };
}

export default function SharedGenerationClient({ generation: initialGeneration }: SharedGenerationClientProps) {
    const searchParams = useSearchParams();
    const [generation, setGeneration] = useState<any>(initialGeneration);
    const [loading, setLoading] = useState(!initialGeneration);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!generation) {
            const fetchGeneration = async () => {
                const id = searchParams.get("id");
                if (!id) {
                    setError("Missing Generation ID");
                    setLoading(false);
                    return;
                }

                try {
                    const supabase = createClient();
                    const { data, error } = await supabase
                        .from("generations")
                        .select("*")
                        .eq("id", id)
                        .single();

                    if (error || !data) {
                        setError("Generation not found");
                    } else {
                        setGeneration(data);
                    }
                } catch (err) {
                    setError("Failed to load archived material");
                } finally {
                    setLoading(false);
                }
            };

            fetchGeneration();
        }
    }, [generation, searchParams]);

    const renderContent = () => {
        if (!generation) return null;

        if (generation.type === "summary") {
            const { summary } = generation.content;
            const textSections = typeof summary.data === "string" ? summary.data : typeof summary === "string" ? summary : null;
            const sectionsArray = Array.isArray(summary.data) ? summary.data : Array.isArray(summary) ? summary : [];

            if (textSections) {
                return (
                    <div className="p-8 md:p-12 rounded-[40px] bg-[var(--card)] border border-[var(--border)] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] select-none pointer-events-none">
                            <span className="material-symbols-outlined text-[100px] text-[var(--foreground)]">verified</span>
                        </div>
                        <article className="max-w-none text-[var(--foreground-secondary)] leading-relaxed font-serif prose prose-invert">
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({node, ...props}) => <h1 className="text-2xl font-black text-[var(--foreground)] mb-6 mt-8 tracking-tight font-sans" {...props} />,
                                    h2: ({node, ...props}) => <h2 className="text-xl font-bold text-[var(--foreground)] mb-6 mt-10 flex items-center gap-3 border-b border-[var(--border)] pb-3 font-sans" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 mt-8 font-sans" {...props} />,
                                    p: ({node, ...props}) => <p className="mb-5 text-[15px]" {...props} />,
                                    ul: ({node, ...props}) => <ul className="mb-6 space-y-3 list-none pl-2" {...props} />,
                                    li: ({node, ...props}) => (
                                        <li className="flex gap-4 items-start" {...props}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2.5 flex-shrink-0 shadow-[0_0_8px_var(--accent)]" />
                                            <span className="flex-1">{props.children}</span>
                                        </li>
                                    ),
                                    strong: ({node, ...props}) => <strong className="font-bold text-[var(--foreground)]" {...props} />,
                                    blockquote: ({node, ...props}) => (
                                        <blockquote className="border-l-[3px] border-[var(--accent)]/40 pl-6 py-2 my-8 italic text-[var(--foreground-muted)] bg-[var(--background-secondary)] rounded-r-2xl" {...props} />
                                    ),
                                }}
                            >
                                {typeof textSections === 'string' ? textSections.replace(/[ \t]+:[ \t]*/g, ': ').replace(/:[ \t]+/g, ': ') : textSections}
                            </ReactMarkdown>
                        </article>
                    </div>
                );
            }

            return (
                <div className="space-y-6">
                    {sectionsArray.map((section: any, idx: number) => (
                        <div key={idx} className="group p-8 md:p-10 rounded-[32px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)]/20 transition-all duration-500 relative overflow-hidden shadow-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--foreground)]/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            {section.heading && (
                                <h3 className="text-xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-4 font-sans tracking-tight">
                                    <div className="w-1 h-8 rounded-full bg-gradient-to-b from-[var(--accent)] to-[var(--secondary)]" />
                                    {section.heading}
                                </h3>
                            )}
                            <div className="max-w-none text-[var(--foreground-secondary)] leading-relaxed font-serif text-[15px]">
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        p: ({node, ...props}) => <p className="mb-4" {...props} />,
                                        ul: ({node, ...props}) => <ul className="space-y-3 list-none pl-2" {...props} />,
                                        li: ({node, ...props}) => (
                                            <li className="flex gap-4 items-start" {...props}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2.5 flex-shrink-0" />
                                                <span className="flex-1">{props.children}</span>
                                            </li>
                                        ),
                                        strong: ({node, ...props}) => <strong className="font-bold text-[var(--foreground)]" {...props} />,
                                    }}
                                >
                                    {typeof (section.content || section.text || JSON.stringify(section)) === 'string' ? String(section.content || section.text || JSON.stringify(section)).replace(/[ \t]+:[ \t]*/g, ': ').replace(/:[ \t]+/g, ': ') : (section.content || section.text || JSON.stringify(section))}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (generation.type === "flashcards") {
            const cards = generation.content.flashcards || [];
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cards.map((card: any, idx: number) => (
                        <div key={idx} className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all group relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent)]/20 group-hover:bg-[var(--accent)] transition-all" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[12px]">style</span>
                                Concept {idx + 1}
                            </h4>
                            <p className="text-lg font-bold text-[var(--foreground)] mb-6 leading-tight">{card.front}</p>
                            <div className="pt-4 border-t border-[var(--border)]">
                                <p className="text-sm font-serif italic text-[var(--foreground-muted)] leading-relaxed group-hover:text-[var(--foreground-secondary)] transition-colors">
                                    {card.back}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (generation.type === "quiz") {
            const questions = generation.content.questions || [];
            return (
                <div className="space-y-8">
                    {questions.map((q: any, idx: number) => (
                        <div key={idx} className="p-8 rounded-[32px] bg-[var(--card)] border border-[var(--border)] relative overflow-hidden shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] text-xs font-black">
                                    {idx + 1}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Question</span>
                            </div>
                            <p className="text-xl font-medium text-[var(--foreground)] mb-8 leading-relaxed">
                                {q.question}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                                {q.options.map((opt: string, oIdx: number) => (
                                    <div key={oIdx} className={`p-4 rounded-2xl border text-sm transition-all ${
                                        oIdx === q.correctIndex 
                                        ? 'bg-[var(--accent)]/5 border-[var(--accent)]/30 text-[var(--accent)] font-bold' 
                                        : 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-muted)]'
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <span>{opt}</span>
                                            {oIdx === q.correctIndex && (
                                                <span className="material-symbols-outlined text-[16px]">verified</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-5 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)]">
                                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                                    The Professor's Insight
                                </h5>
                                <p className="text-sm text-[var(--foreground-muted)] leading-relaxed italic">
                                    {q.explanation}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        return null;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-5">
                <div className="w-16 h-16 rounded-full border-4 border-[var(--accent)]/20 border-t-[var(--accent)] animate-spin mb-6" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] animate-pulse">
                    Accessing Archived Materials...
                </p>
            </div>
        );
    }

    if (error || !generation) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-5 text-center">
                <div className="w-20 h-20 rounded-3xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center mb-8 shadow-xl">
                    <span className="material-symbols-outlined text-4xl text-[var(--foreground-muted)]">history_edu</span>
                </div>
                <h2 className="text-2xl font-black mb-4">Archive Link Expired</h2>
                <p className="text-sm text-[var(--foreground-muted)] mb-8 max-w-xs">{error || "The requested material could not be found or has been purged from our records."}</p>
                <Link href="/" className="px-8 py-3 rounded-2xl bg-[var(--accent)] text-white font-black tracking-widest text-[11px] uppercase transition-all hover:scale-105 active:scale-95 shadow-lg">
                    Back to The Professor
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--accent)]/20 pb-24 font-sans transition-colors duration-500">
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute w-[800px] h-[800px] top-[-20%] right-[-10%] rounded-full bg-[var(--accent)]/5 blur-[120px]" />
                <div className="absolute w-[600px] h-[600px] bottom-[-20%] left-[-10%] rounded-full bg-[var(--secondary)]/5 blur-[100px]" />
            </div>

            <div className="fixed top-6 left-4 z-[10001] flex items-center gap-3">
                <Link href="/" className="group w-10 h-10 rounded-2xl flex items-center justify-center bg-[var(--card)] backdrop-blur-md border border-[var(--border)] transition-all duration-300 active:scale-95 shadow-lg">
                    <div className="group-hover:scale-110 transition-transform duration-500">
                        <span className="material-symbols-outlined text-xl font-black text-[var(--accent)]">school</span>
                    </div>
                </Link>
                <ThemeToggle />
            </div>

            <div className="fixed top-6 right-4 z-[10001] hidden sm:block">
                <Link href="/" className="px-5 py-2 rounded-xl bg-[var(--foreground)] text-[var(--background)] border border-[var(--border)] text-[11px] font-black uppercase tracking-widest transition-all hover:opacity-90">
                    Join The Class
                </Link>
            </div>

            <main className="max-w-3xl mx-auto px-5 py-12">
                <div className="mb-12 flex flex-col items-center text-center">
                    <div className="px-3 py-1 mb-8 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-black tracking-[0.4em] uppercase">
                        Verified {generation.type}
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[var(--foreground)] to-[var(--foreground-muted)] tracking-tight font-heading leading-tight mb-4">
                        {generation.title}
                    </h2>
                    <p className="text-[11px] text-[var(--foreground-muted)] uppercase tracking-[0.2em] font-bold">
                        Archived on {new Date(generation.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {renderContent()}

                <div className="mt-20 pt-10 border-t border-[var(--border)] flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-3xl bg-[var(--background-secondary)] border border-[var(--border)] flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-3xl text-[var(--accent)]">auto_awesome</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3">Want your own study materials?</h3>
                    <p className="text-sm text-[var(--foreground-muted)] mb-8 max-w-xs">
                        The Professor can turn any notes, PDFs, or lectures into premium study aids in seconds.
                    </p>
                    <Link href="/" className="px-8 py-4 rounded-2xl bg-[var(--accent)] text-white font-black tracking-widest text-[11px] uppercase transition-all hover:scale-105 active:scale-95 shadow-[0_10px_40px_rgba(245,158,11,0.2)]">
                        Initialize The Professor
                    </Link>
                </div>
            </main>
        </div>
    );
}
