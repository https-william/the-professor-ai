import { NextRequest } from "next/server";
import { hydraGenerateContent } from "@/lib/ai/hydra";
import { createClient } from "@/lib/supabase/server";
import { buildSummaryPrompt } from "@/lib/ai/prompts";
import { parseSummaryResponse } from "@/lib/ai/schemas";
import { validateContent } from "@/lib/validation";

export const runtime = "edge";

const COST = 5;

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

        // Check Credits
        const { data: profile } = await supabase
            .from("profiles")
            .select("credits")
            .eq("id", user.id)
            .single();

        if (!profile || (profile.credits || 0) < COST) {
            return new Response(JSON.stringify({ error: "Insufficient credits. Please top up." }), {
                status: 402,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Deduct Credits
        const { error: deductError } = await supabase
            .from("profiles")
            .update({ credits: (profile.credits || 0) - COST })
            .eq("id", user.id);

        if (deductError) {
            console.error("Credit deduction failed:", deductError);
            return new Response(JSON.stringify({ error: "Transaction failed" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
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
            style
        );

        const responseText = await hydraGenerateContent(prompt, {
            feature: "summary",
            jsonMode: false,
            timeoutMs: 45_000,
        });

        const summary = parseSummaryResponse(responseText);

        // Generate a meaningful title from the content
        const titleSnippet = content.substring(0, 60).trim().replace(/\s+/g, " ");
        const title = `Summary: ${titleSnippet}${titleSnippet.length < content.length ? "..." : ""}`;

        // Save to database
        try {
            await supabase.from("generations").insert({
                user_id: user.id,
                type: "summary",
                title,
                content: { summary, style },
            });
        } catch (dbError) {
            console.error("Failed to save generation:", dbError);
        }

        return new Response(JSON.stringify({
            summary,
            title: "Summary Generated",
            style,
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
