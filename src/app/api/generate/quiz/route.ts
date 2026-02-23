import { NextRequest } from "next/server";
import { hydraGenerateContent } from "@/lib/ai/hydra";
import { validateContent, validateCount, validateDifficulty, safeErrorResponse } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";
import { buildQuizPrompt } from "@/lib/ai/prompts";
import { parseQuizResponse } from "@/lib/ai/schemas";
import { getCredits, deductCredits } from "@/lib/credits";

export const runtime = "edge";

const COST = 2;

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const balance = await getCredits(supabase, user.id);
        if (balance < COST) {
            return new Response(JSON.stringify({ error: "Insufficient credits. Please top up." }), { status: 402 });
        }

        const ok = await deductCredits(supabase, user.id, balance, COST);
        if (!ok) {
            return new Response(JSON.stringify({ error: "Transaction failed" }), { status: 500 });
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

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    controller.enqueue(encoder.encode(`data: {"status":"generating","message":"Creating ${count} questions (${difficulty})..."}\n\n`));

                    const responseText = await hydraGenerateContent(prompt, {
                        feature: "quiz",
                        jsonMode: true,
                        timeoutMs: 60_000,
                    });

                    const parsed = parseQuizResponse(responseText);

                    // Stream each question
                    for (let i = 0; i < parsed.questions.length; i++) {
                        const q = parsed.questions[i];
                        controller.enqueue(encoder.encode(`data: {"type":"question","index":${i},"total":${parsed.questions.length},"question":${JSON.stringify(q)}}\n\n`));
                        await new Promise(r => setTimeout(r, 80));
                    }

                    controller.enqueue(encoder.encode(`data: {"status":"complete","title":${JSON.stringify(parsed.title)},"count":${parsed.questions.length}}\n\n`));

                    // Save to database
                    try {
                        await supabase.from("generations").insert({
                            user_id: user.id,
                            type: "quiz",
                            title: parsed.title,
                            content: { questions: parsed.questions },
                        });
                    } catch (dbError) {
                        console.error("Failed to save quiz to DB:", dbError);
                    }

                    controller.close();
                } catch (error: unknown) {
                    const msg = error instanceof Error ? error.message : "Generation failed";
                    console.error("Quiz Stream Error:", error);
                    controller.enqueue(encoder.encode(`data: {"status":"error","message":${JSON.stringify(msg)}}\n\n`));
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
