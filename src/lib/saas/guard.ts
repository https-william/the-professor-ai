import { SupabaseClient } from "@supabase/supabase-js";

/**
 * SaaS Guard — Centralized logic for plan and credit enforcement.
 */
export async function canUserGenerate(
    supabase: SupabaseClient,
    userId: string,
    feature: 'flashcards' | 'quiz' | 'summary' | 'roadmap' | 'chat' | 'mind-map' | 'podcast'
): Promise<{ allowed: boolean; reason?: string; creditsLeft?: number }> {
    // 1. Fetch user profile
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("credits, plan_status")
        .eq("id", userId)
        .single();

    // If profile doesn't exist, create one with free credits
    if (error || !profile) {
        console.log("[Guard] Profile not found, creating for user:", userId);
        await supabase.from("profiles").insert({
            id: userId,
            username: `user_${userId.slice(0, 8)}`,
            credits: 100,
            xp: 0,
            streak: 0,
            plan_status: 'free'
        });
        
        // Return allow since we just created the profile with credits
        return { allowed: true, creditsLeft: 100 };
    }

    const costs: Record<string, number> = {
        flashcards: 1,
        quiz: 2,
        summary: 2,
        roadmap: 2,
        chat: 1,
    };

    const cost = costs[feature] || 5;

    // Allow if user has credits OR if credits are 0 (free tier unlimited - OpenRouter is free)
    if (profile.credits > 0 && profile.credits < cost) {
        return { 
            allowed: false, 
            reason: `Insufficient credits. This operation requires ${cost} units.`,
            creditsLeft: profile.credits
        };
    }

    return { allowed: true, creditsLeft: profile.credits };
}

/**
 * Deducts credits on the server-side after generation.
 * Note: OpenRouter is free, so we skip actual deduction to avoid blocking users with 0 credits.
 */
export async function deductCredits(
    supabase: SupabaseClient,
    userId: string,
    feature: 'flashcards' | 'quiz' | 'summary' | 'roadmap' | 'chat' | 'mind-map' | 'podcast'
): Promise<void> {
    // Skip deduction since OpenRouter is free
    // This allows users with 0 credits to continue generating content
    console.log(`[Guard] Generation complete for ${feature} (credits not deducted - free tier)`);
    return;
}