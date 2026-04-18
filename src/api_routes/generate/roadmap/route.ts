export const dynamic = 'force-dynamic';


import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hydraGenerateContent } from "@/lib/ai/hydra";
import { recordActivity } from "@/lib/xp";
import { canUserGenerate, deductCredits } from "@/lib/saas/guard";



export async function POST(req: Request) {
    console.log("[Roadmap API] Starting...");
    try {
        const { title, context } = await req.json();
        console.log("[Roadmap API] Received:", { title: title?.substring(0, 50), contextLength: context?.length });
        
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log("[Roadmap API] Auth:", { userId: user?.id, authError });

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ── SaaS Guard: Check Credits ────────────────────────────────
        const { allowed, reason: guardError } = await canUserGenerate(supabase, user.id, 'roadmap');
        console.log("[Roadmap API] Guard check:", { allowed, guardError });
        if (!allowed) {
            return NextResponse.json({ 
                error: guardError || "You have reached your roadmap generation limit. Please upgrade or purchase credits.",
                code: "INSUFFICIENT_CREDITS"
            }, { status: 402 });
        }

        console.log("[Roadmap API] Calling AI...");

        const prompt = `
        You are The Professor's Senior Syllabus Architect. 
        Analyze the student's context and goal to generate a HIGHLY PERSONALIZED, multi-phase Mastery Roadmap.
        
        STUDENT CONTEXT & GOAL:
        ${context}
        TOPIC: ${title}
        
        INSTRUCTIONS:
        1. Design a strategy for DEEP MASTERY, not just memorization.
        2. Tailor the tone and difficulty to the student's education level provided in the context.
        3. Incorporate "Active Recall" and "Spaced Repetition" principles.
        4. Focus on "Active Simulations" (dialogue/roleplay) and "Hands-on Projects" (practical application).

        REQUIREMENTS per Phase:
        - "activeSimulation": A specific dialogue-based exercise or roleplay scenario the student should perform with an AI or Peer to internalize the concept.
        - "handsOnExercise": A concrete project, code task, case study, or laboratory-style experiment for direct application.
        - "keyTerms": 3-5 critical academic terms for this phase.

        OUTPUT FORMAT (Strict JSON):
        {
            "title": "Scholar's Path: [Subject]",
            "description": "Comprehensive strategy for deep mastery",
            "phases": [
                {
                    "topic": "Phase Focus Title",
                    "summary": "High-level objective aligned with student's specific pain points",
                    "milestones": ["Milestone 1", "Milestone 2"],
                    "activeSimulation": "Detailed instruction for an AI-guided simulation or Socratic dialogue",
                    "handsOnExercise": "Step-by-step description of a practical project/experiment tailor-made for this topic",
                    "keyTerms": ["Term 1", "Term 2"]
                }
            ]
        }
        `;

        const responseText = await hydraGenerateContent(prompt, {
            feature: "roadmap",
            jsonMode: true,
            timeoutMs: 60_000, 
            model: "trinity" // OpenRouter Free Gemini Flash 1.5 8b
        });

        if (!responseText || responseText.trim() === "") {
            console.error("Empty response from AI");
            return NextResponse.json({ 
                error: "The academic architect is taking a moment. Please try again.",
                code: "EMPTY_RESPONSE"
            }, { status: 500 });
        }

        let roadmapData;
        try {
            roadmapData = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse roadmap JSON:", parseError);
            console.error("Raw response:", responseText);
            return NextResponse.json({ 
                error: "The academic architect encountered a formatting issue. Please try again.",
                code: "PARSE_ERROR"
            }, { status: 500 });
        }

        // Update XP and Streaks
        const stats = await recordActivity('roadmap', supabase, user.id);

        // Save to Database
        let generation: any = null;
        try {
            const { data, error: dbError } = await supabase
                .from("generations")
                .insert({
                    user_id: user.id,
                    type: 'roadmap',
                    title: roadmapData.title || `Roadmap: ${title}`,
                    content: roadmapData,
                    xp_earned: stats?.xpGained || 0
                })
                .select()
                .single();

            if (dbError) {
                console.error("Database save error:", dbError);
                // Fallback: created a temporary object if DB fails so user doesn't get a crash
                generation = {
                    id: `temp_${Date.now()}`,
                    content: roadmapData,
                    title: roadmapData.title || `Roadmap: ${title}`,
                    type: 'roadmap'
                };
            } else {
                generation = data;
            }
        } catch (e) {
            console.error("DB Exception:", e);
            generation = {
                id: `temp_${Date.now()}`,
                content: roadmapData,
                title: roadmapData.title || `Roadmap: ${title}`,
                type: 'roadmap'
            };
        }

        // Deduct credits AFTER successful generation
        await deductCredits(supabase, user.id, 'roadmap');

        return NextResponse.json({ 
            success: true, 
            roadmap: generation,
            xpEarned: stats?.xpGained,
            newXpTotal: stats?.newXpTotal,
            newStreak: stats?.newStreak
        });
    } catch (error: any) {
        console.error("Roadmap API Error:", error);
        const msg = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
