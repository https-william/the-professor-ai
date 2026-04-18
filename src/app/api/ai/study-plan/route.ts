import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hydraGenerateContent } from "@/lib/ai/hydra";

export const dynamic = "force-static";
// Enable edge caching or timeout rules if needed

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch User Profile to get Onboarding data (education level, goal)
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("alias, first_name, age, education_level, study_goal")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: "Failed to fetch profile data" }, { status: 500 });
        }

        const name = profile.alias || profile.first_name || "Scholar";
        const age = profile.age || "unknown";
        const educationLevel = profile.education_level || "a student";
        const studyGoal = profile.study_goal || "to master their coursework";

        const systemPrompt = `You are a hyper-intelligent academic strategist. 
Your tone is serious, analytical, and highly structured (Neumorphic tech aesthetic style).
Always output using formatting that can be rendered directly into a Dark Mode interface.

The user is ${name}, a ${age}-year-old whose education level is "${educationLevel}".
Their primary academic pain point or study goal is: "${studyGoal}".

Your Task:
Generate a personalized, high-yield "Neural Study Matrix" (an actionable study plan) tailored EXACTLY to their stated education level and goal.
Do NOT just give generic advice. Give them a heavily structured, concrete framework using terminology like "Phase 1: Knowledge Acquisition", "Phase 2: Active Recall Protocol", etc.
Keep it extremely concise—no fluff. Output in Markdown format. Limit your response to 200 words.`;

        const userPrompt = "Generate my personalized Neural Study Matrix.";

        // Use Hydra for highly reliable multi-provider generation
        const generatedPlan = await hydraGenerateContent(userPrompt, {
            systemPrompt,
            timeoutMs: 30000,
            temperature: 0.4
        });

        return NextResponse.json({ plan: generatedPlan });
        
    } catch (error: any) {
        console.error("Study Plan Error:", error);
        return NextResponse.json({ error: "Failed to generate study plan" }, { status: 500 });
    }
}
