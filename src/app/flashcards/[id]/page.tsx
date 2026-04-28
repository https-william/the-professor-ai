import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import FlashcardViewer from "@/components/features/flashcards/FlashcardViewer";

interface FlashcardPageProps {
    params: Promise<{ id: string }>;
}

export default async function FlashcardIdPage({ params }: FlashcardPageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: deck, error } = await supabase
        .from("generations")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !deck) {
        notFound();
    }

    const flashcards = deck.content?.flashcards || [];

    return (
        <div className="min-h-screen bg-[var(--background)]">
             <FlashcardViewer 
                flashcards={flashcards} 
                title={deck.title || "Academic Deck"} 
                generationId={deck.id}
            />
        </div>
    );
}
