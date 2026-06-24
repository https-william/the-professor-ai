export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { question, answer, explanation } = body;

        if (!question || !answer) {
            return NextResponse.json({ error: "Missing flashcard details" }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized. Please log in to save flashcards." }, { status: 401 });
        }

        // Search for existing "Quiz Missed Questions" deck
        const { data: existingDeck, error: fetchError } = await supabase
            .from("generations")
            .select("*")
            .eq("user_id", user.id)
            .eq("type", "flashcards")
            .eq("title", "Quiz Missed Questions")
            .maybeSingle();

        const newFlashcard = {
            front: question,
            back: `${answer}\n\nExplanation: ${explanation || "No explanation provided."}`
        };

        if (existingDeck) {
            // Append to existing deck
            const existingCards = existingDeck.content?.flashcards || [];
            
            // Check if question already exists in this deck to avoid duplicates
            const isDuplicate = existingCards.some((c: any) => c.front.trim().toLowerCase() === question.trim().toLowerCase());
            
            if (isDuplicate) {
                return NextResponse.json({ message: "Already in your flashcard deck!", deckId: existingDeck.id });
            }

            const updatedCards = [...existingCards, newFlashcard];
            const { error: updateError } = await supabase
                .from("generations")
                .update({ content: { flashcards: updatedCards } })
                .eq("id", existingDeck.id);

            if (updateError) throw updateError;

            return NextResponse.json({ message: "Added to Quiz Missed Questions!", deckId: existingDeck.id });
        } else {
            // Create new "Quiz Missed Questions" deck
            const { data: newDeck, error: insertError } = await supabase
                .from("generations")
                .insert({
                    user_id: user.id,
                    type: "flashcards",
                    title: "Quiz Missed Questions",
                    content: { flashcards: [newFlashcard] }
                })
                .select()
                .single();

            if (insertError) throw insertError;

            return NextResponse.json({ message: "Flashcard deck created!", deckId: newDeck.id });
        }

    } catch (error) {
        console.error("Save flashcard endpoint error:", error);
        return NextResponse.json({ error: "Failed to save flashcard" }, { status: 500 });
    }
}
