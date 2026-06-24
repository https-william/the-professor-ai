export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { callOpenAICompatible } from "@/lib/ai/providers";
import { createClient } from "@/lib/supabase/server";
import { deductCredits } from "@/lib/saas/guard";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { question, options, correctIndex, explanation, userAnswerIndex } = body;

        if (!question || !options || correctIndex === undefined) {
            return NextResponse.json({ error: "Missing required quiz details" }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // ── SaaS Guard: Check and deduct credits for logged-in user ──────────────────
            // Profile credits check
            const { data: profile } = await supabase
                .from("profiles")
                .select("credits, plan_status")
                .eq("id", user.id)
                .single();

            if (profile && profile.plan_status !== "unlimited" && profile.credits < 1) {
                return NextResponse.json({ 
                    error: "Insufficient credits. Asking the Professor costs 1 credit.",
                    code: "INSUFFICIENT_CREDITS"
                }, { status: 402 });
            }

            // Deduct 1 credit (using 'chat' category as it costs 1 credit in guard.ts)
            await deductCredits(supabase, user.id, 'chat');
        } else {
            // Guest user: Enforce 3-query limit using cookies
            const tokenCookie = req.cookies.get("guest_tutor_tokens");
            const guestTokenCount = parseInt(tokenCookie?.value || "0");

            if (guestTokenCount >= 3) {
                return NextResponse.json({ 
                    error: "You've used all 3 free tutor explanations. Sign up to get unlimited access!",
                    code: "GUEST_LIMIT_REACHED"
                }, { status: 403 });
            }
        }

        // Build the prompt for Groq
        const optionsList = options.map((opt: string, i: number) => `${i}: ${opt}`).join("\n");
        const correctText = options[correctIndex] || "";
        const userText = userAnswerIndex !== undefined ? options[userAnswerIndex] : "";

        const systemPrompt = `You are 'The Professor', a brilliant, approachably witty academic study coach with a warm, supportive, coffee-shop personality.
Your job is to explain a difficult concept to a student using a clear, highly-retentive real-world analogy.
Rules:
1. Strict limit: Under 60 words. Keep it short, punchy, and conversational.
2. If appropriate, use local Nigerian analogies or phrases (e.g. comparing packets to Lagos Danfo buses, NEPA/power grid fluctuations, or a busy market) to make it memorable, but keep it natural.
3. Be encouraging, warm, and intellectually sharp.
4. Output plain text ONLY. DO NOT use markdown, lists, headers, or bold tags.`;

        const userPrompt = `Question: ${question}
Options:
${optionsList}
Correct Answer: ${correctIndex} (${correctText})
${userText ? `Student Answer: ${userAnswerIndex} (${userText})` : ""}
${explanation ? `Base Explanation: ${explanation}` : ""}`;

        let generatedExplanation = "";
        try {
            generatedExplanation = await callOpenAICompatible("groq", [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ], { temperature: 0.8, maxTokens: 150, timeoutMs: 15000 });
        } catch (e) {
            console.error("Groq explanation failed:", e);
            generatedExplanation = explanation || "Think of this like a bucket of water. If you poke a hole in the bottom, it leaks from the highest pressure point first.";
        }

        const response = NextResponse.json({ explanation: generatedExplanation.trim() });

        // If guest, increment the cookie
        if (!user) {
            const tokenCookie = req.cookies.get("guest_tutor_tokens");
            const guestTokenCount = parseInt(tokenCookie?.value || "0");
            response.cookies.set("guest_tutor_tokens", String(guestTokenCount + 1), { 
                maxAge: 86400 * 7, // 7 days
                path: '/'
            });
        }

        return response;

    } catch (error) {
        console.error("Explain endpoint error:", error);
        return NextResponse.json({ error: "Failed to generate explanation" }, { status: 500 });
    }
}
