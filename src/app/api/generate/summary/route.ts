export const dynamic = 'force-dynamic';


import { NextRequest } from "next/server";
import { hydraChatStream } from "@/lib/ai/hydra";
import { createClient } from "@/lib/supabase/server";
import { buildSummaryPrompt, guardContentSize, LARGE_CONTENT_THRESHOLD } from "@/lib/ai/prompts";
import { parseSummaryResponse } from "@/lib/ai/schemas";
import { validateContent } from "@/lib/validation";
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
        const { allowed, reason: guardError } = await canUserGenerate(supabase, user.id, 'summary');
        if (!allowed) {
            return new Response(JSON.stringify({ 
                error: guardError || "You have reached your limit. Please upgrade or purchase credits.",
                code: "INSUFFICIENT_CREDITS"
            }), { status: 402, headers: { "Content-Type": "application/json" } });
        }

        const body = await req.json();
        const { style = "concise" } = body;

        const contentResult = validateContent(body.content);
        if (!contentResult.isValid) {
            return new Response(JSON.stringify({ error: contentResult.error || "Invalid content" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        const rawContent = contentResult.sanitized!;
        const { content, wasTruncated } = guardContentSize(rawContent);

        if (rawContent.length > LARGE_CONTENT_THRESHOLD) {
            console.info(`[Summary] Large content detected: ${rawContent.length} chars. Truncated: ${wasTruncated}.`);
        }

        const prompt = buildSummaryPrompt(
            content,
            style,
            body.explainStyle
        );

        let aiStream: ReadableStream;
        try {
            aiStream = await hydraChatStream(
                "You are a master study coach. Output the requested summary in plain markdown. Generous spacing between ## sections is mandatory.",
                [{ role: "user", content: prompt }],
                { feature: "summary", timeoutMs: 60_000 }
            );
        } catch (aiError: any) {
            console.error("Summary AI Error:", aiError);
            const isContextOverflow = aiError?.message?.toLowerCase().includes("context") || aiError?.message?.toLowerCase().includes("token");
            const userMsg = isContextOverflow
                ? "Your notes are too large for a single distill session sha. Split them into smaller sections and try again."
                : "The Professor is momentarily busy. Try again in a few seconds.";
            return new Response(JSON.stringify({ error: userMsg }), {
                status: 503, headers: { "Content-Type": "application/json" }
            });
        }

        const reader = aiStream.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "generating", message: "Distilling core concepts...", wasTruncated })}\n\n`));

                    let fullMarkdown = "";
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        fullMarkdown += chunk;
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "chunk", chunk })}\n\n`));
                    }

                    // Finalize: Titling, Stats, Saving
                    const title = await generateAITitle(content, 'summary');
                    const stats = await recordActivity('summary', supabase, user.id);

                    let generationId = null;
                    const { data, error: dbError } = await supabase.from("generations").insert({
                        user_id: user.id,
                        type: "summary",
                        title,
                        content: { summary: fullMarkdown, style },
                        xp_earned: stats?.xpGained || 0
                    }).select("id").single();

                    if (data) {
                        generationId = data.id;
                    }

                    await deductCredits(supabase, user.id, 'summary');

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                        status: "complete", 
                        id: generationId, 
                        title,
                        xpEarned: stats?.xpGained,
                        newXpTotal: stats?.newXpTotal,
                        newStreak: stats?.newStreak
                    })}\n\n`));

                    controller.close();
                } catch (error: any) {
                    console.error("Summary Stream Error:", error);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "error", error: error.message })}\n\n`));
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
        console.error("Summary Route Error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
}
