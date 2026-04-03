import type { SupabaseClient } from "@supabase/supabase-js";

const STARTER_CREDITS = 100;

/**
 * Fetches the user's credit balance, auto-granting STARTER_CREDITS
 * if the profile row exists but was created without any credits (e.g. via DB trigger).
 *
 * Returns the current credit balance.
 */
export async function getCredits(
    supabase: SupabaseClient,
    userId: string
): Promise<number> {
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single();

    if (error) {
        // PGRST116 = no row found — create the profile with starter credits
        if (error.code === "PGRST116") {
            const { data: newProfile } = await supabase
                .from("profiles")
                .insert({
                    id: userId,
                    credits: STARTER_CREDITS,
                    streak: 0,
                    xp: 0,
                })
                .select("credits")
                .single();
            return newProfile?.credits ?? STARTER_CREDITS;
        }
        // Other DB errors — return 0 so the caller can gate appropriately
        console.error("credits: fetch error", error);
        return 0;
    }

    // Profile exists but credits column is null or 0 — first-time user whose
    // row was created by a Supabase trigger without setting credits.
    if (!profile.credits) {
        await supabase
            .from("profiles")
            .update({ credits: STARTER_CREDITS })
            .eq("id", userId);
        return STARTER_CREDITS;
    }

    return profile.credits as number;
}

/**
 * Deducts `cost` credits from the user's balance.
 * Returns true if successful, false if the DB update failed.
 */
export async function deductCredits(
    supabase: SupabaseClient,
    userId: string,
    currentBalance: number,
    cost: number
): Promise<boolean> {
    const { error } = await supabase
        .from("profiles")
        .update({ credits: currentBalance - cost })
        .eq("id", userId);

    if (error) {
        console.error("credits: deduction failed", error);
        return false;
    }
    return true;
}

/**
 * Refunds `cost` credits back to the user (on generation failure).
 */
export async function refundCredits(
    supabase: SupabaseClient,
    userId: string,
    cost: number
): Promise<void> {
    const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single();

    const current = profile?.credits ?? 0;
    await supabase
        .from("profiles")
        .update({ credits: current + cost })
        .eq("id", userId);
    console.log(`credits: refunded ${cost} to user ${userId}`);
}
