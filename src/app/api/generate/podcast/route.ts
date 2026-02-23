import { NextRequest } from "next/server";
import { hydraGenerateContent } from "@/lib/ai/hydra";
import { createClient } from "@/lib/supabase/server";
import { buildPodcastPrompt } from "@/lib/ai/prompts";
import { parsePodcastResponse } from "@/lib/ai/schemas";
import { validateContent } from "@/lib/validation";
import { getCredits, deductCredits } from "@/lib/credits";

export const runtime = "edge";

const COST = 3; // Podcast costs slightly more (longer output)

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
            return new Response(JSON.stringify({ error: "Transaction failed" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        const body = await req.json();
        const { style = "educational" } = body;

        const contentResult = validateContent(body.content);
        if (!contentResult.isValid) {
            return new Response(JSON.stringify({ error: contentResult.error || "Invalid content" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }
        const content = contentResult.sanitized!;

        const prompt = buildPodcastPrompt(
            content.substring(0, 35_000),
            style,
            body.explainStyle
        );

        const responseText = await hydraGenerateContent(prompt, {
            feature: "podcast",
            jsonMode: true,
            timeoutMs: 60_000,
        });

        const parsed = parsePodcastResponse(responseText);

        // Save to database
        try {
            await supabase.from("generations").insert({
                user_id: user.id,
                type: "podcast",
                title: parsed.title,
                content: {
                    type: "podcast",
                    title: parsed.title,
                    data: { script: parsed.script },
                    summary: parsed.summary,
                    keyTakeaway: parsed.keyTakeaway,
                },
            });
        } catch (dbError) {
            console.error("Failed to save podcast:", dbError);
        }

        // Return in the format the podcast player expects
        return new Response(JSON.stringify({
            podcast: {
                title: parsed.title,
                summary: parsed.summary,
                script: parsed.script,
                keyTakeaway: parsed.keyTakeaway,
            },
            title: parsed.title,
            summary: parsed.summary,
        }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Failed to generate podcast";
        console.error("Podcast Error:", error);
        return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
