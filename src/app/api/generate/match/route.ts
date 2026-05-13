export const dynamic = 'force-dynamic';

import { NextRequest } from "next/server";
import { hydraGenerateContent } from "@/lib/ai/hydra";
import { validateContent, validateCount, validateDifficulty, safeErrorResponse } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";
import { buildMatchPrompt, guardContentSize } from "@/lib/ai/prompts";
import { canUserGenerate, deductCredits } from "@/lib/saas/guard";
import { generateAITitle } from "@/lib/ai/titling";
import { recordActivity } from "@/lib/xp";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const { allowed, reason: guardError } = await canUserGenerate(supabase, user.id, 'flashcards');
        if (!allowed) {
            return new Response(JSON.stringify({ 
                error: guardError || "Insufficient credits.",
                code: "INSUFFICIENT_CREDITS"
            }), { status: 402, headers: { "Content-Type": "application/json" } });
        }

        const body = await req.json();

        const contentResult = validateContent(body.content);
        if (!contentResult.isValid) {
            return safeErrorResponse(contentResult.error || "Invalid content");
        }
        const rawContent = contentResult.sanitized!;
        const { content } = guardContentSize(rawContent);

        const { value: count } = validateCount(body.count, 8);
        const difficulty = validateDifficulty(body.difficulty);

        const prompt = buildMatchPrompt(
            content,
            count,
            difficulty,
            body.explainStyle
        );

        // Match uses non-streaming generation (simpler, faster for short outputs)
        const raw = await hydraGenerateContent(prompt, {
            feature: "flashcards",
            jsonMode: true,
            timeoutMs: 30_000,
        });

        let pairs: { term: string; definition: string }[];
        try {
            pairs = JSON.parse(raw);
            if (!Array.isArray(pairs) || pairs.length === 0) throw new Error("Empty result");
        } catch {
            return new Response(JSON.stringify({ error: "Failed to parse match pairs." }), {
                status: 500, headers: { "Content-Type": "application/json" }
            });
        }

        // Enforce count
        pairs = pairs.slice(0, count);

        const title = await generateAITitle(content, 'flashcards');
        const stats = await recordActivity('flashcards', supabase, user.id);

        // Save to DB
        await supabase.from("generations").insert({
            user_id: user.id,
            type: "match",
            title,
            content: { pairs },
            xp_earned: stats?.xpGained || 0
        });

        await deductCredits(supabase, user.id, 'flashcards');

        return new Response(JSON.stringify({
            status: "complete",
            title,
            pairs,
            xpEarned: stats?.xpGained,
            newStreak: stats?.newStreak,
        }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error: unknown) {
        console.error("Match Generation Error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500, headers: { "Content-Type": "application/json" }
        });
    }
}
