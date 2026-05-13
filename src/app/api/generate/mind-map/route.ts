import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hydraGenerateContent } from "@/lib/ai/hydra";
import { buildMindMapPrompt, guardContentSize } from "@/lib/ai/prompts";
import { MASTER_SYSTEM_PROMPT } from "@/lib/ai/professor-prompt";
import { canUserGenerate, deductCredits } from "@/lib/saas/guard";
import { recordActivity } from "@/lib/xp";

export async function POST(req: NextRequest) {
    try {
        const { text, title } = await req.json();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const { allowed, reason } = await canUserGenerate(supabase, user.id, 'mind-map');
        if (!allowed) {
            return NextResponse.json({ error: reason || "Insufficient credits" }, { status: 402 });
        }

        const { content: safeContent, wasTruncated } = guardContentSize(text);
        const prompt = buildMindMapPrompt(safeContent);

        const responseText = await hydraGenerateContent(prompt, {
            feature: "mind_map",
            jsonMode: true,
            timeoutMs: 60_000,
            systemPrompt: MASTER_SYSTEM_PROMPT,
            temperature: 0.3
        });

        let mindMapData;
        try {
            mindMapData = JSON.parse(responseText);
        } catch (e) {
            console.error("Mind Map JSON Parse Error:", responseText);
            return NextResponse.json({ error: "Failed to generate structured mind map" }, { status: 500 });
        }

        // Deduct credits and record activity
        await deductCredits(supabase, user.id, 'mind-map');
        const stats = await recordActivity('mind-map', supabase, user.id);

        return NextResponse.json({ 
            success: true, 
            data: mindMapData,
            wasTruncated,
            xpEarned: stats?.xpGained
        });

    } catch (error: any) {
        console.error("Mind Map API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
