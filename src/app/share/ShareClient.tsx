"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import { useToasts } from "@/components/ui/GlobalToasts";
import ThemeToggle from "@/components/ui/ThemeToggle";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import { Loader2, BookOpen, Link2, Check } from "lucide-react";
import { cn, cleanDocumentTitle } from "@/lib/utils";

function ShareContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    const { user } = useUser();
    const { addToast } = useToasts();

    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCloning, setIsCloning] = useState(false);
    const [copied, setCopied] = useState(false);
    const [previewTab, setPreviewTab] = useState<'summary' | 'cards'>('summary');

    useEffect(() => {
        const fetchContent = async () => {
            if (!id) {
                setError("No share ID provided in the link.");
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const supabase = createClient();
                
                // 1. Try to fetch from study_packs table first
                const { data: pack, error: packErr } = await supabase
                    .from("study_packs")
                    .select("*")
                    .eq("id", id)
                    .maybeSingle();

                if (pack) {
                    // Fetch author profile
                    let authorName = "A Scholar";
                    let avatarLetter = "S";
                    if (pack.user_id) {
                        const { data: profile } = await supabase
                            .from("profiles")
                            .select("first_name, username")
                            .eq("id", pack.user_id)
                            .maybeSingle();
                        if (profile) {
                            authorName = profile.first_name || profile.username || "A Scholar";
                            avatarLetter = authorName.charAt(0).toUpperCase();
                        }
                    }

                    // Parse flashcards
                    let cards: any[] = [];
                    const retainData = pack.phases_data?.retain;
                    if (retainData) {
                        const rawCards = Array.isArray(retainData) 
                            ? retainData 
                            : (retainData.flashcards || retainData.cards || []);
                        cards = rawCards.map((c: any) => ({
                            q: c?.front || c?.question || "Term",
                            a: c?.back || c?.answer || "Definition"
                        }));
                    }

                    // Parse quiz questions
                    let quizQuestions: any[] = [];
                    const testData = pack.phases_data?.test;
                    if (testData) {
                        const rawQuestions = Array.isArray(testData) 
                            ? testData 
                            : (testData.questions || []);
                        quizQuestions = rawQuestions.map((q: any) => ({
                            question: q?.question || "Question",
                            options: q?.options || []
                        }));
                    }

                    // Parse summary
                    let summaryText = "";
                    const distillData = pack.phases_data?.distill;
                    if (distillData) {
                        summaryText = typeof distillData === 'string' 
                            ? distillData 
                            : (distillData.summary || "");
                    }

                    const hasCards = cards.length > 0;
                    setPreviewTab(summaryText ? 'summary' : (hasCards ? 'cards' : 'summary'));

                    setContent({
                        isStudyPack: true,
                        id: pack.id,
                        title: pack.title || "Untitled Study Set",
                        description: pack.description,
                        source_text: pack.source_text,
                        phases_data: pack.phases_data,
                        type: "Study Set",
                        author: authorName,
                        avatar: avatarLetter,
                        cards,
                        quizQuestions,
                        summaryText,
                        count: cards.length || quizQuestions.length || (summaryText ? 1 : 0),
                        rawPack: pack
                    });
                } else {
                    // 2. Try generations table
                    const { data: gen, error: genErr } = await supabase
                        .from("generations")
                        .select("*")
                        .eq("id", id)
                        .maybeSingle();

                    if (gen) {
                        // Fetch author profile
                        let authorName = "A Scholar";
                        let avatarLetter = "S";
                        if (gen.user_id) {
                            const { data: profile } = await supabase
                                .from("profiles")
                                .select("first_name, username")
                                .eq("id", gen.user_id)
                                .maybeSingle();
                            if (profile) {
                                authorName = profile.first_name || profile.username || "A Scholar";
                                avatarLetter = authorName.charAt(0).toUpperCase();
                            }
                        }

                        let cards: any[] = [];
                        let quizQuestions: any[] = [];
                        let summaryText = "";
                        let count = 0;

                        if (gen.type === "flashcards") {
                            const rawCards = Array.isArray(gen.content) 
                                ? gen.content 
                                : (gen.content?.flashcards || gen.content?.cards || []);
                            cards = rawCards.map((c: any) => ({
                                q: c?.front || c?.question || "Term",
                                a: c?.back || c?.answer || "Definition"
                            }));
                            count = cards.length;
                            setPreviewTab('cards');
                        } else if (gen.type === "quiz") {
                            const rawQuestions = Array.isArray(gen.content) 
                                ? gen.content 
                                : (gen.content?.questions || []);
                            quizQuestions = rawQuestions.map((q: any) => ({
                                question: q?.question || "Question",
                                options: q?.options || []
                            }));
                            count = quizQuestions.length;
                            setPreviewTab('cards'); // reuse cards rendering wrapper for quiz
                        } else if (gen.type === "summary") {
                            summaryText = typeof gen.content === 'string' 
                                ? gen.content 
                                : (gen.content?.summary || "");
                            count = 1;
                            setPreviewTab('summary');
                        }

                        setContent({
                            isStudyPack: false,
                            id: gen.id,
                            title: gen.title || `Shared ${gen.type}`,
                            type: gen.type.charAt(0).toUpperCase() + gen.type.slice(1),
                            author: authorName,
                            avatar: avatarLetter,
                            cards,
                            quizQuestions,
                            summaryText,
                            count,
                            rawGen: gen
                        });
                    } else {
                        setError("Shared study material could not be found.");
                    }
                }
            } catch (err: any) {
                console.error("Fetch shared content error:", err);
                setError("An error occurred while loading this shared link.");
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [id]);

    const handleCopy = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            addToast("Share link copied to clipboard!", "success");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const clonePack = async () => {
        if (!user.isAuthenticated) {
            router.push(`/signup?next=${encodeURIComponent(window.location.href)}`);
            return;
        }
        setIsCloning(true);
        try {
            const supabase = createClient();
            if (content.isStudyPack) {
                const newId = crypto.randomUUID();
                const { error } = await supabase
                    .from("study_packs")
                    .insert({
                        id: newId,
                        user_id: user.id,
                        title: content.title.endsWith("(Shared)") ? content.title : `${content.title} (Shared)`,
                        description: content.description || null,
                        source_text: content.source_text || null,
                        phases_data: content.phases_data || {}
                    });
                if (error) throw error;
                addToast("Study pack successfully imported to your library!", "success");
                router.push(`/library/pack/${newId}`);
            } else {
                const { data, error } = await supabase
                    .from("generations")
                    .insert({
                        user_id: user.id,
                        type: content.rawGen.type,
                        title: content.title.endsWith("(Shared)") ? content.title : `${content.title} (Shared)`,
                        content: content.rawGen.content
                    })
                    .select()
                    .single();
                if (error) throw error;
                addToast("Shared material successfully imported to your library!", "success");
                router.push(`/library`);
            }
        } catch (err: any) {
            console.error("Import error:", err);
            addToast(`Failed to import: ${err.message}`, "error");
        } finally {
            setIsCloning(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-[var(--amber)] animate-spin" />
                <p className="text-[var(--foreground-muted)] text-sm font-black uppercase tracking-widest animate-pulse">Consulting the Professor...</p>
            </div>
        </div>
    );

    if (error || !content) return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-[var(--crimson-dim)] border border-[var(--crimson-border)] flex items-center justify-center text-[var(--crimson)] mb-6 shadow-lg shadow-[var(--crimson-glow)]">
                <span className="material-symbols-outlined text-3xl">error</span>
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight italic mb-2">Access Denied</h2>
            <p className="text-sm text-[var(--foreground-muted)] max-w-sm mb-8 leading-relaxed font-medium">
                {error || "This shared link might have been removed, or the ID is incorrect."}
            </p>
            <Link
                href="/dashboard"
                className="btn-skeuo px-6 py-3.5 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-xs font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-md"
            >
                Back to Dashboard
            </Link>
        </div>
    );

    const hasMultipleViews = content.summaryText && (content.cards.length > 0 || content.quizQuestions.length > 0);

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden relative transition-colors duration-500 pb-16">
            {/* Ambient glows */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-[var(--amber)]/[0.03] rounded-full blur-[130px]" />
                <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-indigo-500/[0.02] rounded-full blur-[150px]" />
            </div>

            {/* Main Content */}
            <main className="relative pt-24 px-4 max-w-3xl mx-auto z-10">
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <span className="w-5 h-5 rounded-full bg-[var(--amber)]/10 border border-[var(--amber)]/20 text-[var(--amber)] text-[10px] font-black flex items-center justify-center">
                            {content.avatar}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[var(--foreground-muted)]">
                            Prepared by {content.author}
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--foreground)] mb-3 leading-tight max-w-2xl mx-auto">
                        {cleanDocumentTitle(content.title)}
                    </h1>
                    <div className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">
                        <span className="flex items-center gap-1.5">
                            <BookOpen size={11} className="text-[var(--amber)]" />
                            <span>{content.type}</span>
                        </span>
                        <span>•</span>
                        <span>{content.count} items</span>
                        <span>•</span>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 hover:text-[var(--foreground)] transition-colors"
                        >
                            {copied ? (
                                <Check size={11} className="text-[var(--emerald)]" />
                            ) : (
                                <Link2 size={11} />
                            )}
                            <span>{copied ? "Copied" : "Copy link"}</span>
                        </button>
                    </div>
                </div>

                {/* Preview Navigation Tabs (if both summary and cards/questions exist) */}
                {hasMultipleViews && (
                    <div className="flex justify-center gap-2.5 mb-6 border-b border-[var(--border)] pb-4">
                        {content.summaryText && (
                            <button
                                onClick={() => setPreviewTab('summary')}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                    previewTab === 'summary'
                                        ? "bg-[var(--amber)]/10 border border-[var(--amber)]/35 text-[var(--amber)] shadow-sm"
                                        : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)]"
                                )}
                            >
                                Summary Preview
                            </button>
                        )}
                        {(content.cards.length > 0 || content.quizQuestions.length > 0) && (
                            <button
                                onClick={() => setPreviewTab('cards')}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                    previewTab === 'cards'
                                        ? "bg-[var(--amber)]/10 border border-[var(--amber)]/35 text-[var(--amber)] shadow-sm"
                                        : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)]"
                                )}
                            >
                                Cards Preview
                            </button>
                        )}
                    </div>
                )}

                {/* Content Previews */}
                <div className="space-y-4 mb-8">
                    {previewTab === 'summary' && content.summaryText && (
                        <div className="p-6 rounded-2xl bg-[var(--background-secondary)]/50 border border-[var(--border)] shadow-inner relative max-h-[350px] overflow-hidden">
                            <p className="text-[var(--foreground-muted)] text-[8px] font-black uppercase tracking-[0.2em] mb-4">Deep Summary Preview</p>
                            <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-[var(--foreground-secondary)] font-medium">
                                <MarkdownRenderer content={content.summaryText.length > 600 ? content.summaryText.substring(0, 600) + "..." : content.summaryText} />
                            </div>
                            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none" />
                        </div>
                    )}

                    {previewTab === 'cards' && content.cards.length > 0 && (
                        content.cards.slice(0, 3).map((card: any, i: number) => (
                            <div key={i} className="p-6 rounded-2xl bg-[var(--background-secondary)]/30 border border-[var(--border)] shadow-sm animate-in fade-in duration-300">
                                <p className="text-[var(--foreground-muted)] text-[8px] font-black uppercase tracking-[0.25em] mb-2">Term</p>
                                <h3 className="text-sm sm:text-base font-black text-[var(--foreground)] mb-6">{card.q}</h3>
                                <div className="h-px w-full bg-[var(--border)] mb-6" />
                                <p className="text-[var(--foreground-muted)] text-[8px] font-black uppercase tracking-[0.25em] mb-2">Definition</p>
                                <p className="text-xs sm:text-sm text-[var(--foreground-secondary)] leading-relaxed font-medium">{card.a}</p>
                            </div>
                        ))
                    )}

                    {previewTab === 'cards' && content.quizQuestions.length > 0 && (
                        content.quizQuestions.slice(0, 2).map((q: any, i: number) => (
                            <div key={i} className="p-6 rounded-2xl bg-[var(--background-secondary)]/30 border border-[var(--border)] shadow-sm animate-in fade-in duration-300">
                                <p className="text-[var(--foreground-muted)] text-[8px] font-black uppercase tracking-[0.25em] mb-2">Question {i + 1}</p>
                                <h3 className="text-sm sm:text-base font-black text-[var(--foreground)] mb-6">{q.question}</h3>
                                <div className="h-px w-full bg-[var(--border)] mb-4" />
                                <div className="grid grid-cols-1 gap-2.5">
                                    {q.options.map((opt: string, oi: number) => (
                                        <div key={oi} className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] text-[10px] sm:text-[11px] font-bold text-[var(--foreground-muted)]">
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}

                    {/* Blurred Card Overlay */}
                    <div className="p-6 rounded-2xl bg-zinc-950/20 border border-white/[0.04] blur-[3px] opacity-25 select-none pointer-events-none mb-6">
                        <p className="text-zinc-600 text-[8px] font-black uppercase tracking-wider mb-2">Term</p>
                        <h3 className="text-sm font-black text-white mb-6">What is the Feynman Technique?</h3>
                        <div className="h-px w-full bg-white/[0.02] mb-6" />
                        <p className="text-zinc-600 text-[8px] font-black uppercase tracking-wider mb-2">Definition</p>
                        <p className="text-zinc-400 text-xs leading-relaxed">A method of learning that focuses on explaining a concept in simple terms to identify gaps in understanding...</p>
                    </div>

                    {/* Centered CTA Section (Non-absolute) */}
                    <div className="py-8 border border-[var(--border)] bg-[var(--background-secondary)]/30 rounded-2xl p-6 text-center max-w-md mx-auto shadow-sm">
                        <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight italic mb-2 bg-gradient-to-r from-[var(--amber)] to-indigo-400 bg-clip-text text-transparent">
                            Unlock all {content.count} items
                        </h3>
                        <p className="text-[9px] text-[var(--foreground-muted)] font-bold uppercase tracking-wider mb-6 leading-normal max-w-xs mx-auto">
                            Import this study set to your own library to review cards, practice quizzes, and access the deep summary.
                        </p>
                        
                        {user.isAuthenticated ? (
                            <button
                                onClick={clonePack}
                                disabled={isCloning}
                                className="btn-skeuo-primary w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {isCloning ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        <span>Importing...</span>
                                    </>
                                ) : (
                                    <span>Import to Library</span>
                                )}
                            </button>
                        ) : (
                            <Link
                                href={`/signup?next=${encodeURIComponent(`/share?id=${content.id}`)}`}
                                className="btn-skeuo-primary block w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all text-center"
                            >
                                Save to my Profile
                            </Link>
                        )}
                        
                        {!user.isAuthenticated && (
                            <p className="mt-4 text-[10px] text-[var(--foreground-muted)] font-black uppercase tracking-wider">
                                Already a Scholar? <Link href={`/login?next=${encodeURIComponent(`/share?id=${content.id}`)}`} className="text-[var(--foreground)] hover:underline">Log in</Link>
                            </p>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 text-center text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] opacity-40 border-t border-[var(--border)] z-50 relative mt-12">
                <p>&copy; 2026 The Professor AI. Your notes. Just the good parts.</p>
            </footer>
        </div>
    );
}

export default function ShareClient() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-[var(--amber)] animate-spin" />
                    <p className="text-[var(--foreground-muted)] text-sm font-black uppercase tracking-widest">Consulting the Professor...</p>
                </div>
            </div>
        }>
            <ShareContent />
        </Suspense>
    );
}
