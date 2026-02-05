import { NextRequest } from "next/server";
import { hydraGenerateContent } from "@/lib/ai/hydra";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const { content, style = "educational" } = await req.json();

        if (!content || content.trim().length < 100) {
            return new Response(JSON.stringify({ error: "Please provide more content (minimum 100 characters)" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const styleGuide: Record<string, string> = {
            educational: "Clear and informative. One host explains, another asks clarifying questions.",
            casual: "Friendly banter between two hosts. Jokes and analogies welcome.",
            debate: "Two hosts with different perspectives. Present arguments and counterarguments."
        };

        const prompt = `You are an expert podcast script writer. Create a podcast script in ${style} style.

CONTENT TO COVER:
${content.substring(0, 35000)}

STYLE: ${style.toUpperCase()} - ${styleGuide[style] || styleGuide.educational}

Create a 5-7 minute podcast script with two hosts discussing the material.

Return ONLY valid JSON (no markdown):
{
  "title": "Episode title",
  "summary": "Brief episode description",
  "script": [
    {"speaker": "Host 1", "text": "What they say"},
    {"speaker": "Host 2", "text": "Response"}
  ],
  "duration": "Estimated duration"
}`;

        const responseText = await hydraGenerateContent(prompt, { timeoutMs: 45000 });
        
        const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return new Response(JSON.stringify({ 
            podcast: parsed,
            title: parsed.title,
            summary: parsed.summary
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("Podcast Error:", error);
        return new Response(JSON.stringify({ error: error?.message || "Failed to generate podcast" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
