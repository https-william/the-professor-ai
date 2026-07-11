"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QuizViewer from "@/components/features/quiz/QuizViewer";

import { QuizQuestionSkeleton } from "@/components/ui/Skeleton";
import StandardContainer from "@/components/ui/StandardContainer";

export default function QuizClient() {
    const params = useParams();
    const router = useRouter();
    const [quiz, setQuiz] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const id = params.id as string;

    useEffect(() => {
        if (!id || id === "placeholder") {
            setLoading(false);
            return;
        }

        const fetchQuiz = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("generations")
                .select("*")
                .eq("id", id)
                .single();

            if (error || !data) {
                setError(error?.message || "Quiz not found");
            } else {
                setQuiz(data);
            }
            setLoading(false);
        };

        fetchQuiz();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] relative">
                <div className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40 z-0" />
                <StandardContainer className="pt-20 pb-20 relative z-10 max-w-3xl">
                    <div className="mb-8">
                        <div className="w-48 h-4 bg-white/5 rounded animate-pulse mb-3" />
                        <div className="w-24 h-2.5 bg-white/5 rounded animate-pulse" />
                    </div>
                    <QuizQuestionSkeleton />
                </StandardContainer>
            </div>
        );
    }

    if (error || !quiz) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="text-center p-8 rounded-3xl bg-[var(--background-secondary)] border border-[var(--border)] max-w-md">
                    <h3 className="text-lg font-black text-[var(--foreground)] mb-2 uppercase">Not Found</h3>
                    <p className="text-xs text-[var(--foreground-muted)] mb-6">This quiz could not be found or loaded.</p>
                    <button onClick={() => router.push('/dashboard')} className="px-6 py-2.5 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all">Go to Dashboard</button>
                </div>
            </div>
        );
    }

    const questions = quiz.content?.questions || [];
    const timer = quiz.metadata?.timerValue || 600; // Default to 10 mins if not found

    return (
        <div className="min-h-screen bg-[var(--background)]">
             <QuizViewer 
                questions={questions} 
                title={quiz.title || "Academic Quiz"} 
                generationId={quiz.id}
                initialTimer={timer}
            />
        </div>
    );
}
