import { NextRequest } from "next/server";
import { hydraGenerateContent } from "@/lib/ai/hydra";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
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
