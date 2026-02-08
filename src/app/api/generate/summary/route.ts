import { NextRequest } from "next/server";
import { hydraGenerateContent } from "@/lib/ai/hydra";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'edge';

const COST = 5;

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
             return new Response(JSON.stringify({ error: "Unauthorized" }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
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
                headers: { 'Content-Type': 'application/json' }
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
                headers: { 'Content-Type': 'application/json' }
             });
        }

        const { content, style = "concise" } = await req.json();

        if (!content || content.trim().length < 50) {
            return new Response(JSON.stringify({ error: "Please provide more content (minimum 50 characters)" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const styleGuide: Record<string, string> = {
            concise: "Bullet points organized by topic. Be brief but comprehensive.",
            detailed: "Full paragraphs with explanations. Include context and examples.",
            study: "Study guide format with key terms, definitions, and review questions."
        };

        const prompt = `You are The Professor. Create a ${style} summary of the following content.

CONTENT:
${content.substring(0, 45000)}

STYLE: ${style.toUpperCase()} - ${styleGuide[style] || styleGuide.concise}

Return a well-organized summary. Use markdown formatting (headers, bullets, bold for key terms).`;

        const responseText = await hydraGenerateContent(prompt, { timeoutMs: 30000 });

        // PERSISTENCE: Save to database
        try {
            await supabase.from("generations").insert({
                user_id: user.id,
                type: "summary",
                title: "Summary: " + (content.substring(0, 30) + "..."),
                content: { summary: responseText, style }
            });
        } catch (dbError) {
            console.error("Failed to save generation:", dbError);
        }

        return new Response(JSON.stringify({ 
            summary: responseText,
            title: "Summary Generated",
            style 
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("Summary Error:", error);
        return new Response(JSON.stringify({ error: error?.message || "Failed to generate summary" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
