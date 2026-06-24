export const dynamic = 'force-dynamic';

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hydraChatStream } from "@/lib/ai/hydra";
import { guardContentSize } from "@/lib/ai/prompts";
import { canUserGenerate, deductCredits } from "@/lib/saas/guard";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response("Unauthorized", { status: 401 });
        }

        // Deduct 1 credit for plan adjustments
        const { allowed, reason } = await canUserGenerate(supabase, user.id, 'chat');
        if (!allowed) {
            return new Response(JSON.stringify({ error: reason || "Insufficient credits" }), { status: 402 });
        }

        const body = await req.json();
        const { schedule, userPrompt } = body;

        if (!schedule || !userPrompt) {
            return new Response("Missing schedule or prompt", { status: 400 });
        }

        await deductCredits(supabase, user.id, 'chat');

        const { content: safeSchedule } = guardContentSize(JSON.stringify(schedule));
        const { content: safePrompt } = guardContentSize(userPrompt);

        const systemPrompt = `You are 'The Professor', an elite academic strategist. Nigerian academic energy. First-person plural.
        Your task is to adjust the study schedule based on the student's request. Keep it highly practical.
        Be extremely concise (maximum 3-4 sentences). End with: "Just the good parts sha."`;

        const messages = [
            { 
                role: "user", 
                content: `Here is our current study schedule: ${safeSchedule}\n\nOur request: ${safePrompt}` 
            }
        ];

        const stream = await hydraChatStream(systemPrompt, messages, {
            feature: "chat",
            temperature: 0.7
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        });

    } catch (err: any) {
        console.error("Roadmap Adjuster Error:", err);
        return new Response("Internal Server Error", { status: 500 });
    }
}
