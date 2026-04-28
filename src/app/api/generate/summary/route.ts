export const dynamic = 'force-dynamic';


import { NextRequest } from "next/server";
import { hydraGenerateContent } from "@/lib/ai/hydra";
import { createClient } from "@/lib/supabase/server";
import { buildSummaryPrompt } from "@/lib/ai/prompts";
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
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
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
            return new Response(JSON.stringify({ error: contentResult.error || "Invalid content" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }
        const content = contentResult.sanitized!;

        const prompt = buildSummaryPrompt(
            content.substring(0, 45_000),
            style,
            body.explainStyle
        );

        const responseText = await hydraGenerateContent(prompt, {
            feature: "summary",
            jsonMode: false,
            timeoutMs: 45_000,
        });

        const summary = parseSummaryResponse(responseText);

        // Generate a dynamic title via Groq
        const title = await generateAITitle(content, 'summary');

        // Update XP and Streaks
        const stats = await recordActivity('summary', supabase, user.id);

        // Save to database
        let generationId = null;
        try {
            const { data, error } = await supabase.from("generations").insert({
                user_id: user.id,
                type: "summary",
                title,
                content: { summary, style },
                xp_earned: stats?.xpGained || 0
            }).select("id").single();
            
            if (!error && data) {
                generationId = data.id;
            }
        } catch (dbError) {
            console.error("Failed to save generation:", dbError);
        }

        // Deduct credits ONLY after successful completion
        await deductCredits(supabase, user.id, 'summary');

        return new Response(JSON.stringify({
            id: generationId,
            summary,
            title,
            style,
            xpEarned: stats?.xpGained,
            newXpTotal: stats?.newXpTotal,
            newStreak: stats?.newStreak
        }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Failed to generate summary";
        console.error("Summary Error:", error);
        return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
