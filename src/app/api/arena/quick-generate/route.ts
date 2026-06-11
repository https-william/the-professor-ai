export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hydraGenerateContent } from "@/lib/ai/hydra";
import { canUserGenerate, deductCredits } from "@/lib/saas/guard";
import { recordActivity } from "@/lib/xp";

function buildTopicQuizPrompt(topic: string, count: number = 5, difficulty: string = "medium"): string {
    const difficultyInstruction: Record<string, string> = {
        easy: "Basic recall. Test key definitions and core facts about this topic. A student who has read a basic summary should get most right.",
        medium: "Conceptual understanding. Correct answers require connecting ideas. Distractors should look partly true to trap someone who skims.",
        difficult: "Application and analysis. Test scenarios and fine distinctions. Options must look plausible, testing common real-world misconceptions.",
        nightmare: "Expert level. Surface-level understanding fails. Trip up even seasoned scholars. No 'all of the above'."
    };

    return `You are The Professor — witty, warm, approachably brilliant. Like a mentor you'd have a lively chat with. We use "We" and "Our".

Your task: Generate a high-quality multiple-choice quiz about the topic: "${topic}".
Generate EXACTLY ${count} questions.

DIFFICULTY: ${difficulty.toUpperCase()}
${difficultyInstruction[difficulty] || difficultyInstruction.medium}

QUESTION DESIGN RULES:
1. Exactly 4 options. One correct. Three DISTRACTOR options — based on COMMON MISTAKES for this specific topic.
2. NEVER use "All of the above", "None of the above", or "Both A and C".
3. Mix wording styles: scenario-based ("A student observes..."), definition ("Which best describes..."), comparison ("What distinguishes X from Y?").
4. correctIndex: 0-based index of the correct option in the options array.
5. Shuffle correct answer position — do not always put correct at index 0 or 1.
6. analogy: A 1-2 sentence memory hook in our warm Professor voice with Nigerian campus energy. Helps after a mistake.
7. explanation: 1-2 sentence plain-English explanation of WHY the correct answer is right.
8. cover the full breadth of the topic "${topic}".

Return exactly a JSON array containing the questions, like this:
[
  {
    "question": "Full question text ending with a question mark?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 2,
    "analogy": "Think of it like an expo. We know the answer, but the context is what makes it 'expo' or 'exam'. We focus on context.",
    "explanation": "Option C is correct because...",
    "topic": "${topic}"
  }
]

CRITICAL: Return ONLY valid JSON. No markdown fences, no prose, no commentary before or after. The first character of your response must be "[" and the last must be "]".`;
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { topic, difficulty = "medium" } = body;

        if (!topic || typeof topic !== "string" || topic.trim().length < 2) {
            return NextResponse.json({ error: "Please provide a valid topic (at least 2 characters)" }, { status: 400 });
        }

        // Enforce plan and credits check
        const { allowed, reason: guardError } = await canUserGenerate(supabase, user.id, 'quiz');
        if (!allowed) {
            return NextResponse.json({ 
                error: guardError || "You have reached your limit. Please upgrade or purchase credits.",
                code: "INSUFFICIENT_CREDITS"
            }, { status: 402 });
        }

        const prompt = buildTopicQuizPrompt(topic.trim(), 5, difficulty);

        // Generate quiz questions
        let aiResult = "";
        try {
            aiResult = await hydraGenerateContent(prompt, {
                feature: "quiz",
                jsonMode: true,
                timeoutMs: 30_000
            });
        } catch (aiError: any) {
            console.error("Quick Generate AI Error:", aiError);
            return NextResponse.json({ 
                error: "The Professor is temporarily busy drafting. Please try again in a few seconds." 
            }, { status: 503 });
        }

        // Parse questions
        let questions: any[] = [];
        try {
            questions = JSON.parse(aiResult);
            if (!Array.isArray(questions) || questions.length === 0) {
                throw new Error("Invalid format returned by AI");
            }
        } catch (parseError) {
            console.error("Failed to parse quick-generate AI response:", aiResult, parseError);
            return NextResponse.json({ 
                error: "Failed to compile quiz questions. Please try again." 
            }, { status: 500 });
        }

        // Save to generations table so it can be played in the arena
        const stats = await recordActivity('quiz', supabase, user.id);
        const title = `Topic Arena Quiz: ${topic.trim()}`;
        
        const { data: gen, error: dbError } = await supabase
            .from("generations")
            .insert({
                user_id: user.id,
                type: "quiz",
                title,
                content: { questions },
                xp_earned: stats?.xpGained || 0
            })
            .select("id")
            .single();

        if (dbError || !gen) {
            console.error("Failed to save quick-generate quiz to DB:", dbError);
            return NextResponse.json({ error: "Failed to initialize quiz. Please try again." }, { status: 500 });
        }

        // Deduct credits ONLY after successful completion
        await deductCredits(supabase, user.id, 'quiz');

        return NextResponse.json({
            success: true,
            generation_id: gen.id,
            title,
            questionCount: questions.length
        });
    } catch (error) {
        console.error("Quick generate API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
