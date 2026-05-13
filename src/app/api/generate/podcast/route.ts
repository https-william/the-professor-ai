import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hydraGenerateContent } from "@/lib/ai/hydra";
import { buildPodcastPrompt, guardContentSize } from "@/lib/ai/prompts";
import { MASTER_SYSTEM_PROMPT } from "@/lib/ai/professor-prompt";
import { canUserGenerate, deductCredits } from "@/lib/saas/guard";
import { recordActivity } from "@/lib/xp";

export async function POST(req: NextRequest) {
    try {
        const { text, style = "educational" } = await req.json();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const { allowed, reason } = await canUserGenerate(supabase, user.id, 'podcast');
        if (!allowed) {
            return NextResponse.json({ error: reason || "Insufficient credits" }, { status: 402 });
        }

        const { content: safeContent, wasTruncated } = guardContentSize(text);
        const prompt = buildPodcastPrompt(safeContent, style);

        const responseText = await hydraGenerateContent(prompt, {
            feature: "podcast",
            jsonMode: true,
            timeoutMs: 90_000,
            systemPrompt: MASTER_SYSTEM_PROMPT,
            temperature: 0.6
        });

        let podcastData;
        try {
            podcastData = JSON.parse(responseText);
        } catch (e) {
            console.error("Podcast JSON Parse Error:", responseText);
            return NextResponse.json({ error: "Failed to generate podcast script" }, { status: 500 });
        }

        // Deduct credits and record activity
        await deductCredits(supabase, user.id, 'podcast');
        const stats = await recordActivity('podcast', supabase, user.id);

        return NextResponse.json({ 
            success: true, 
            data: podcastData,
            wasTruncated,
            xpEarned: stats?.xpGained
        });

    } catch (error: any) {
        console.error("Podcast API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
