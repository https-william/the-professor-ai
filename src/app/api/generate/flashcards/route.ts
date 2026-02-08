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

        // Deduct Credits immediately (Optimistic)
        const { error: deductError } = await supabase
            .from("profiles")
            .update({ credits: (profile.credits || 0) - COST })
            .eq("id", user.id);
            
        if (deductError) {
             console.error("Credit deduction failed:", deductError);
             // Proceed anyway? Or fail? Better to fail safe for business.
             return new Response(JSON.stringify({ error: "Transaction failed. Please try again." }), { status: 500 });
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
            easy: "Simple recall questions, basic definitions. Straightforward answers.",
            medium: "Conceptual understanding. Requires connecting ideas.",
            difficult: "Application and analysis. Multi-step reasoning required.",
            nightmare: "Expert-level tricky questions. Edge cases, exceptions, common misconceptions as wrong answers."
        };

        const prompt = `You are an expert educator. Generate exactly ${count} flashcards from the following content.

CONTENT:
${content.substring(0, 40000)}

DIFFICULTY: ${difficulty.toUpperCase()} - ${difficultyGuide[difficulty] || difficultyGuide.medium}

RULES:
1. Each flashcard must have a clear question/term on the front and a concise answer on the back
2. For NIGHTMARE difficulty: Include trick questions, edge cases, and subtle distinctions
3. Make questions specific and testable
4. Keep answers concise but complete

Return ONLY valid JSON (no markdown):
{
  "flashcards": [
    {"front": "Question or term", "back": "Answer or definition"}
  ],
  "title": "Brief title for this flashcard set"
}`;

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Send initial status
                    controller.enqueue(encoder.encode(`data: {"status":"generating","message":"Creating ${count} flashcards..."}\n\n`));
                    
                    const responseText = await hydraGenerateContent(prompt, { jsonMode: false, timeoutMs: 30000 });
                    
                    // Parse response
                    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                    const parsed = JSON.parse(cleaned);
                    
                    // Stream each flashcard
                    for (let i = 0; i < parsed.flashcards.length; i++) {
                        const card = parsed.flashcards[i];
                        controller.enqueue(encoder.encode(`data: {"type":"flashcard","index":${i},"total":${parsed.flashcards.length},"card":${JSON.stringify(card)}}\n\n`));
                        // Small delay for visual effect
                        await new Promise(r => setTimeout(r, 50));
                    }
                    
                    // Send completion
                    controller.enqueue(encoder.encode(`data: {"status":"complete","title":"${parsed.title || 'Flashcard Set'}","count":${parsed.flashcards.length}}\n\n`));
                    
                    // PERSISTENCE: Save to database
                    try {
                        await supabase.from("generations").insert({
                            user_id: user.id,
                            type: "flashcards",
                            title: parsed.title || "Flashcard Set",
                            content: { flashcards: parsed.flashcards, title: parsed.title }
                        });
                    } catch (dbError) {
                        console.error("Failed to save generation:", dbError);
                    }

                    controller.close();
                } catch (error: any) {
                    console.error("Flashcard Stream Error:", error);
                    // Refund credits on failure? This is complex with streams.
                    // For now, no refund, or handle separately.
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
        console.error("Flashcard Error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
