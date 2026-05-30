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

    // 2. Bypass check for Unlimited tier
    if (profile.plan_status === "unlimited") {
        return { allowed: true, creditsLeft: 999999 };
    }

    // 3. Allow if user has credits
    if (profile.credits < cost) {
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
 */
export async function deductCredits(
    supabase: SupabaseClient,
    userId: string,
    feature: 'flashcards' | 'quiz' | 'summary' | 'roadmap' | 'chat' | 'mind-map' | 'podcast'
): Promise<void> {
    // Fetch profile to verify plan and credits
    const { data: profile } = await supabase
        .from("profiles")
        .select("credits, plan_status")
        .eq("id", userId)
        .single();

    if (!profile) return;
    if (profile.plan_status === "unlimited") {
        console.log(`[Guard] Unlimited user generated ${feature} (no credits deducted)`);
        return;
    }

    const costs: Record<string, number> = {
        flashcards: 1,
        quiz: 2,
        summary: 2,
        roadmap: 2,
        chat: 1,
    };
    const cost = costs[feature] || 5;
    const newCredits = Math.max(0, profile.credits - cost);

    await supabase
        .from("profiles")
        .update({ credits: newCredits })
        .eq("id", userId);

    console.log(`[Guard] Deducted ${cost} credits for ${feature}. New balance: ${newCredits}`);
}