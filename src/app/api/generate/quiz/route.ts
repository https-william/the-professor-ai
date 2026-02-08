import { NextRequest } from "next/server";
import { hydraGenerateContent } from "@/lib/ai/hydra";
import { validateContent, validateCount, validateDifficulty, safeErrorResponse } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'edge';

const COST = 5;

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        // Check Credits
        const { data: profile } = await supabase
            .from("profiles")
            .select("credits")
            .eq("id", user.id)
            .single();

        if (!profile || (profile.credits || 0) < COST) {
             return new Response(JSON.stringify({ error: "Insufficient credits. Please top up." }), { status: 402 });
        }

        // Deduct Credits
        const { error: deductError } = await supabase
            .from("profiles")
            .update({ credits: (profile.credits || 0) - COST })
            .eq("id", user.id);
            
        if (deductError) {
             console.error("Credit deduction failed:", deductError);
             return new Response(JSON.stringify({ error: "Transaction failed" }), { status: 500 });
        }

        const body = await req.json();
        
        // Validate content with injection protection
        const contentResult = validateContent(body.content);
        if (!contentResult.isValid) {
            return safeErrorResponse(contentResult.error || "Invalid content");
        }
        const content = contentResult.sanitized!;
        
        // Validate count and difficulty
        const { value: count } = validateCount(body.count, 10);
        const difficulty = validateDifficulty(body.difficulty);

        const difficultyGuide: Record<string, string> = {
            easy: "Basic recall. Simple, straightforward questions with obvious answers.",
            medium: "Conceptual understanding. Requires thinking but not tricky.",
            difficult: "Application and analysis. Multi-step reasoning, 'which of these' style.",
            nightmare: "Expert trap questions. Subtle distinctions, common misconceptions as tempting wrong answers, edge cases. Make students THINK."
        };

        const prompt = `You are an expert exam writer. Generate exactly ${count} multiple-choice quiz questions.

CONTENT:
${content.substring(0, 40000)}

DIFFICULTY: ${difficulty.toUpperCase()} - ${difficultyGuide[difficulty] || difficultyGuide.medium}

RULES:
1. Each question must have exactly 4 options
2. Only one option should be correct
3. For NIGHTMARE: Use common misconceptions as wrong answers, include "all of the above" traps
4. Include a brief explanation for the correct answer
5. Mix question types: definitions, applications, comparisons

Return ONLY valid JSON (no markdown):
{
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation"
    }
  ],
  "title": "Quiz title"
}`;

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    controller.enqueue(encoder.encode(`data: {"status":"generating","message":"Creating ${count} questions (${difficulty})..."}\n\n`));
                    
                    const responseText = await hydraGenerateContent(prompt, { jsonMode: false, timeoutMs: 45000 });
                    
                    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                    const parsed = JSON.parse(cleaned);
                    
                    // Stream each question
                    for (let i = 0; i < parsed.questions.length; i++) {
                        const q = parsed.questions[i];
                        controller.enqueue(encoder.encode(`data: {"type":"question","index":${i},"total":${parsed.questions.length},"question":${JSON.stringify(q)}}\n\n`));
                        await new Promise(r => setTimeout(r, 80));
                    }
                    
                    // Save to database for persistence
                    try {
                        await supabase.from("generations").insert({
                            user_id: user.id,
                            type: "quiz",
                            title: parsed.title || 'Quiz',
                            content: { questions: parsed.questions }
                        });
                    } catch (dbError) {
                        console.error("Failed to save quiz to DB:", dbError);
                        // Don't fail the stream, just log it
                    }
                    
                    controller.enqueue(encoder.encode(`data: {"status":"complete","title":"${parsed.title || 'Quiz'}","count":${parsed.questions.length}}\n\n`));
                    controller.close();
                } catch (error: any) {
                    console.error("Quiz Stream Error:", error);
                    controller.enqueue(encoder.encode(`data: {"status":"error","message":"${error?.message || 'Generation failed'}"}\n\n`));
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        });
    } catch (error: any) {
        console.error("Quiz Error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
