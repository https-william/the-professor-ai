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
        if (percentage === 1) context = "The user got a perfect score. Praise them lavishly but playfully.";
        else if (percentage >= 0.8) context = "The user did great. Acknowledge their near-perfection.";
        else if (percentage >= 0.5) context = "The user passed, but just barely. Give them some witty, backhanded encouragement.";
        else context = "The user failed catastrophically. Be sarcastically disappointed but tell them to study harder.";

        const prompt = `Topic: ${topic}
Score: ${score}/${total}
Direction: ${context}`;

        const systemPrompt = `You are a brilliant, slightly unhinged, extremely witty University Professor. 
Your job is to give ONE single, short sentence of feedback to a student who just finished a quiz.
Be directly communicative to the student ("You got 4 out of 5..."). Use appropriate emojis. 
DO NOT output markdown, no titles, and strictly keep it to one punchy sentence.
Make it clever, punchy, and highly personalized to the specific topic they were tested on.`;

        // We try Groq first because it's instantaneous. If Groq isn't configured, fallback to G4F.
        let remark = "";
        
        try {
            if (process.env.GROQ_API_KEY) {
                remark = await callOpenAICompatible("groq", [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ], { temperature: 0.8, maxTokens: 150, timeoutMs: 5000 });
            } else {
                remark = await callOpenAICompatible("ollamafree", [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ], { temperature: 0.8, maxTokens: 150, timeoutMs: 10000 });
            }
        } catch (e) {
            // Last resort fallback
            remark = await callOpenAICompatible("g4f", [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ], { temperature: 0.8, maxTokens: 150, timeoutMs: 15000 });
        }

        return NextResponse.json({ remark: remark.trim() });

    } catch (error) {
        console.error("Remark generation error:", error);
        return NextResponse.json({ 
            remark: "Well, that happened. 📝 My grading matrix crashed, but you survived the quiz." 
        });
    }
}
