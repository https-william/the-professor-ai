export const dynamic = 'force-dynamic';


import { NextRequest } from "next/server";
import { hydraGenerateStream } from "@/lib/ai/hydra";
import { validateContent, validateCount, validateDifficulty, safeErrorResponse } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";
import { buildQuizPrompt } from "@/lib/ai/prompts";
import { canUserGenerate, deductCredits } from "@/lib/saas/guard";
import { generateAITitle } from "@/lib/ai/titling";
import { recordActivity } from "@/lib/xp";

const COST = 2;

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        // ── SaaS Guard: Enforce Plan & Credits ──────────────────────
        const { allowed, reason: guardError } = await canUserGenerate(supabase, user.id, 'quiz');
        if (!allowed) {
            return new Response(JSON.stringify({ 
                error: guardError || "You have reached your limit. Please upgrade or purchase credits.",
                code: "INSUFFICIENT_CREDITS"
            }), { status: 402, headers: { "Content-Type": "application/json" } });
        }

        const body = await req.json();

        const contentResult = validateContent(body.content);
        if (!contentResult.isValid) {
            return safeErrorResponse(contentResult.error || "Invalid content");
        }
        const content = contentResult.sanitized!;

        const { value: count } = validateCount(body.count, 10);
        const difficulty = validateDifficulty(body.difficulty);

        const prompt = buildQuizPrompt(
            content.substring(0, 40_000),
            count,
            difficulty,
            body.explainStyle
        );

        let aiStream: ReadableStream;
        try {
            aiStream = await hydraGenerateStream(prompt, {
                feature: "quiz",
                timeoutMs: 60_000,
            });
        } catch (aiError) {
            console.error("Quiz AI Error:", aiError);
            return new Response(JSON.stringify({ error: "AI generation failed." }), {
                status: 503,
                headers: { "Content-Type": "application/json" }
            });
        }

        const reader = aiStream.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "generating", message: `Creating ${count} questions (${difficulty})...` })}\n\n`));

                    const generatedQuestions: any[] = [];
                    let title = "Generated Quiz";
                    let lineBuffer = "";

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        // Pass the raw SSE chunk to the client
                        controller.enqueue(value);

                        const chunkStr = decoder.decode(value, { stream: true });
                        lineBuffer += chunkStr;
                        
                        let lineEndIndex;
                        while ((lineEndIndex = lineBuffer.indexOf('\n')) !== -1) {
                            const line = lineBuffer.slice(0, lineEndIndex).trim();
                            lineBuffer = lineBuffer.slice(lineEndIndex + 1);

                            if (line.startsWith('data: ')) {
                                try {
                                    const data = JSON.parse(line.slice(6));
                                    if (data.type === 'question' && data.question) {
                                        generatedQuestions.push(data.question);
                                    }
                                } catch (e) {}
                            }
                        }
                    }

                    // Force strict count adherence (server-side truncation)
                    const finalQuestions = generatedQuestions.slice(0, count);

                    // If no questions were generated, refund
                    if (finalQuestions.length === 0) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "error", message: "No questions were generated." })}\n\n`));
                    } else {
                        // Generate a dynamic title via Groq
                        const finalTitle = await generateAITitle(content, 'quiz');

                        // Update XP and Streaks
                        const stats = await recordActivity('quiz', supabase, user.id);

                        // Save to database
                        let gId = null;
                        const { data, error: dbError } = await supabase.from("generations").insert({
                            user_id: user.id,
                            type: "quiz",
                            title: finalTitle,
                            content: { questions: finalQuestions },
                            xp_earned: stats?.xpGained || 0
                        }).select("id").single();

                        if (dbError) {
                            console.error("Critical Quiz Save Error:", dbError.message);
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                                status: "save_failed", 
                                message: "Quiz generated and XP earned, but failed to save to your library. Please screenshot this screen if you need the questions.",
                                questions: finalQuestions,
                                xpEarned: stats?.xpGained
                            })}\n\n`));
                        } else if (data) {
                            gId = data.id;
                        }

                        // Send the final completion message with the ID and XP
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                            status: "complete", 
                            id: gId, 
                            title: finalTitle,
                            questions: finalQuestions,
                            xpEarned: stats?.xpGained,
                            newXpTotal: stats?.newXpTotal,
                            newStreak: stats?.newStreak
                        })}\n\n`));

                        // Deduct credits ONLY after successful completion
                        await deductCredits(supabase, user.id, 'quiz');
                    }

                    controller.close();
                } catch (error: unknown) {
                    console.error("Quiz Stream Parser Error:", error);
                    const msg = error instanceof Error ? error.message : "Generation failed";
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "error", message: msg + " Credits refunded." })}\n\n`));
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        });
    } catch (error: unknown) {
        console.error("Quiz Error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
