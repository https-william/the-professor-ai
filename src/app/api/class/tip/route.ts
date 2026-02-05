import { NextRequest, NextResponse } from "next/server";
import { hydraGenerateContent } from "@/lib/ai/hydra";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const { topic, context } = await req.json();

        if (!topic) {
            return NextResponse.json({ error: "Topic required" }, { status: 400 });
        }

        const prompt = `You are The Professor. Give a brief, helpful study tip about "${topic}".
${context ? `Context: ${context}` : ''}

Keep it concise (2-3 sentences max). Be encouraging and practical.`;

        const responseText = await hydraGenerateContent(prompt, { timeoutMs: 10000 });

        return NextResponse.json({ tip: responseText });

    } catch (error: any) {
        console.error("Tip Error:", error);
        return NextResponse.json({ error: "Failed to get tip" }, { status: 500 });
    }
}
