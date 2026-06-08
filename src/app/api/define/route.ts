import { NextRequest, NextResponse } from "next/server";
import { callOpenAICompatible } from "@/lib/ai/providers";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const term = searchParams.get("term");

        if (!term || term.trim().length === 0) {
            return NextResponse.json({ error: "Term is required" }, { status: 400 });
        }

        const systemPrompt = `You are 'The Professor', an elite academic mentor. 
Your task is to provide a single, highly-intuitive, extremely brief definition (maximum 1-2 sentences, under 150 characters) for a key study concept.
Make the definition clear, engaging, and friendly, as if you're explaining it to a student. Use plain text (no markdown, no bold, no quotes, no emojis).`;

        const userPrompt = `Define this term: ${term}`;

        let definition = "";
        try {
            definition = await callOpenAICompatible("groq", [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ], { temperature: 0.6, maxTokens: 80, timeoutMs: 10000 });
        } catch (e) {
            console.error("Groq definition generation failed:", e);
            definition = `A key concept in this study material: ${term}.`;
        }

        return NextResponse.json({ definition: definition.trim() });
    } catch (error) {
        console.error("Definition generation error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
