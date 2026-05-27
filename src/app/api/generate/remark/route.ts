export const dynamic = 'force-dynamic';


import { NextRequest, NextResponse } from "next/server";
import { callOpenAICompatibleStream } from "@/lib/ai/providers";

// We use stream strictly for speed, but wait for the first chunk to return
// Actually Groq is so fast we can just use the atomic call.
import { callOpenAICompatible } from "@/lib/ai/providers";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { score, total, topic = "General" } = body;

        if (typeof score !== 'number' || typeof total !== 'number') {
            return NextResponse.json({ error: "Invalid score data" }, { status: 400 });
        }

        const percentage = score / total;
        
        let context = "";
        if (percentage === 1) context = "The user got a perfect score. Praise their precision and excellent understanding.";
        else if (percentage >= 0.8) context = "The user did great. Acknowledge their near-perfection and high-level retrieval.";
        else if (percentage >= 0.5) context = "The user passed. Give them a smart nudge about their information gaps.";
        else context = "The user failed. Be an elite mentor—firm, direct, and focused on the immediate need for a study reset.";

        const prompt = `Topic: ${topic}
Score: ${score}/${total}
Direction: ${context}`;

        const systemPrompt = `You are 'The Professor', an elite mentor with a background in cognitive science and high-stakes performance. 
Your job is to give ONE single, short sentence of feedback to a student who just finished a quiz.
Be directly communicative to the student ("You got 4 out of 5..."). Use appropriate emojis. 
DO NOT output markdown, no titles, and strictly keep it to one punchy, authoritative sentence that focuses on "Smart Study Habits".`;

        // We use Groq strictly for speed and rotation.
        let remark = "";
        
        try {
            remark = await callOpenAICompatible("groq", [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ], { temperature: 0.8, maxTokens: 150, timeoutMs: 15000 });
        } catch (e) {
            console.error("Groq remark generation failed on all keys:", e);
            remark = "Nothing left to learn here. Go enjoy your evening.";
        }

        return NextResponse.json({ remark: remark.trim() });

    } catch (error) {
        console.error("Remark generation error:", error);
        return NextResponse.json({ 
            remark: "The study lab encountered a sync error. 📝 Your performance is recorded, but The Professor's Insight is pending." 
        });
    }
}
