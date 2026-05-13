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

        // Deduct 1 credit for ELI5 (cheaper than full deck)
        const { allowed, reason } = await canUserGenerate(supabase, user.id, 'chat');
        if (!allowed) {
            return new Response(JSON.stringify({ error: reason || "Insufficient credits" }), { status: 402 });
        }

        const body = await req.json();
        const { text } = body;

        if (!text || text.length === 0) {
            return new Response("No text provided", { status: 400 });
        }

        await deductCredits(supabase, user.id, 'chat');

        const { content: safeContent, wasTruncated } = guardContentSize(text);
        
        const systemPrompt = `You are 'The Professor', an elite academic strategist. Nigerian academic energy. First-person plural. 
        Your task is to 'Explain Like I'm 5' (ELI5). Use a brilliant, intuitive, and simple everyday analogy. 
        Be extremely concise (maximum 3-4 sentences). End with: "Simple as ABC sha."`;
        
        const messages = [
            { role: "user", content: `Explain this to me simply: ${safeContent}` }
        ];

        const stream = await hydraChatStream(systemPrompt, messages, {
            feature: "chat",
            temperature: 0.7
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Content-Truncated": wasTruncated ? "true" : "false"
            }
        });

    } catch (err: any) {
        console.error("ELI5 Generation Error:", err);
        return new Response("Internal Server Error", { status: 500 });
    }
}
