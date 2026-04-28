export const dynamic = 'force-dynamic';


import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hydraChatStream } from "@/lib/ai/hydra";
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

        const systemPrompt = "You are 'The Professor'. Your task is to 'Explain Like I'm 5' (ELI5). The user will provide a complex academic or technical excerpt. Explain the core concept using a brilliant, intuitive, and simple everyday analogy. Be extremely concise (maximum 3 sentences). Do not use markdown headers.";
        
        const messages = [
            { role: "user", content: `Explain this to me simply: ${text.substring(0, 5000)}` }
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
            }
        });

    } catch (err: any) {
        console.error("ELI5 Generation Error:", err);
        return new Response("Internal Server Error", { status: 500 });
    }
}
