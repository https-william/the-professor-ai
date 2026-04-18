import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";
export const dynamic = "force-static";

/**
 * Auto-Quiz: Convert flashcards into multiple-choice questions.
 * Uses the back of each card as the correct answer and generates
 * plausible distractors from other cards in the same deck.
 * 
 * No AI call needed, no credits consumed — pure algorithmic conversion.
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { cards, title: deckTitle } = await req.json();

        if (!cards || !Array.isArray(cards) || cards.length < 4) {
            return NextResponse.json({
                error: "Need at least 4 flashcards to generate a quiz",
            }, { status: 400 });
        }

        // Build quiz questions from flashcards
        const questions = cards.map((card: { front: string; back: string }, index: number) => {
            // Get 3 random wrong answers from other cards' backs
            const otherBacks = cards
                .filter((_: any, i: number) => i !== index)
                .map((c: { back: string }) => c.back);

            // Shuffle and take 3
            const shuffled = otherBacks.sort(() => Math.random() - 0.5);
            const distractors = shuffled.slice(0, 3);

            // Create options array with correct answer at a random position
            const options = [...distractors];
            const correctIndex = Math.floor(Math.random() * 4);
            options.splice(correctIndex, 0, card.back);

            return {
                question: card.front,
                options: options.slice(0, 4), // Ensure exactly 4 options
                correctIndex,
                explanation: `The correct answer is: ${card.back}`,
            };
        });

        // Limit to 15 questions max
        const finalQuestions = questions.slice(0, 15);

        return NextResponse.json({
            title: `Quiz: ${deckTitle || "Flashcard Review"}`,
            questions: finalQuestions,
            count: finalQuestions.length,
            source: "auto-quiz",
        });
    } catch (error: any) {
        console.error("Auto-quiz error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate quiz" }, { status: 500 });
    }
}
