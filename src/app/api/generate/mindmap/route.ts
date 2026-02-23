import { NextRequest, NextResponse } from "next/server";
import { hydraGenerateContent } from "@/lib/ai/hydra";
import { validateContent } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";
import { buildMindMapPrompt } from "@/lib/ai/prompts";
import { parseMindMapResponse } from "@/lib/ai/schemas";
import { getCredits, deductCredits } from "@/lib/credits";

export const runtime = "edge";

const COST = 2;

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const balance = await getCredits(supabase, user.id);
        if (balance < COST) {
            return NextResponse.json({ error: "Insufficient credits. Please top up." }, { status: 402 });
        }

        const ok = await deductCredits(supabase, user.id, balance, COST);
        if (!ok) {
            return NextResponse.json({ error: "Transaction failed" }, { status: 500 });
        }

        const body = await req.json();

        const contentResult = validateContent(body.content);
        if (!contentResult.isValid) {
            return NextResponse.json({ error: contentResult.error || "Invalid content" }, { status: 400 });
        }
        const content = contentResult.sanitized!;

        const prompt = buildMindMapPrompt(content.substring(0, 35_000), body.explainStyle);

        const responseText = await hydraGenerateContent(prompt, {
            feature: "mindmap",
            jsonMode: true,
            timeoutMs: 45_000,
        });

        // Zod validation — catches the "raw JSON dumps to user" bug
        const parsed = parseMindMapResponse(responseText);

        // Save to database
        try {
            await supabase.from("generations").insert({
                user_id: user.id,
                type: "mindmap",
                title: `Mind Map: ${parsed.topic}`,
                content: { topic: parsed.topic, branches: parsed.branches },
            });
        } catch (dbError) {
            console.error("Failed to save mindmap:", dbError);
        }

        return NextResponse.json({
            mindmap: {
                topic: parsed.topic,
                branches: parsed.branches,
            },
            title: parsed.topic,
        });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Failed to generate mind map";
        console.error("Mindmap Error:", error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
