import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import QuizViewer from "@/components/features/quiz/QuizViewer";

interface QuizPageProps {
    params: Promise<{ id: string }>;
}

export default async function QuizIdPage({ params }: QuizPageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: quiz, error } = await supabase
        .from("generations")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !quiz) {
        notFound();
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
