import { createClient } from "@/lib/supabase/server";

const STREAK_MILESTONES = [7, 14, 30, 60, 100];

/**
 * Record study activity, awarding XP and updating streaks.
 * Now supports streak freezes and milestone detection.
 * @param type 'quiz' | 'flashcards' | 'summary' | 'roadmap'
 * @param existingSupabase optional supabase instance to avoid re-init
 * @param userId optional userId to avoid re-auth
 */
export async function recordActivity(
    type: 'quiz' | 'flashcards' | 'summary' | 'roadmap' | 'daily_challenge' | 'mind-map' | 'podcast', 
    existingSupabase?: any,
    userId?: string,
    customXp?: number
) {
    const supabase = existingSupabase || await createClient();
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;

    if (!targetUserId) return null;

    // 1. Calculate XP based on activity (Boosted for better progression feel)
    const xpMap: Record<string, number> = {
        quiz: 50,
        flashcards: 30,
        summary: 20,
        roadmap: 100,
        daily_challenge: 25,
        "mind-map": 35,
        podcast: 40
    };
    const xpToAdd = customXp !== undefined ? customXp : (xpMap[type] || 0);

    // 2. Fetch current profile stats
    const { data: profile } = await supabase
        .from("profiles")
        .select("xp_total, current_streak, last_study_date, streak_freeze_count")
        .eq("id", targetUserId)
        .single();

    if (!profile) return null;

    // 3. Robust Date-Based Streak Logic
    const now = new Date();
    // Get local date in "YYYY-MM-DD" format (using local time to match user expectation)
    // For now we'll stick to UTC split for consistency, but compare full day differences
    const todayStr = now.toISOString().split('T')[0];
    
    let newStreak = profile.current_streak || 0;
    let freezeUsed = false;
    let streakReset = false;
    const lastDateStr = profile.last_study_date;
    const freezeCount = profile.streak_freeze_count || 0;

    if (!lastDateStr) {
        newStreak = 1;
    } else {
        // Parse dates as "YYYY-MM-DD" at midnight to get clean day differences
        const today = new Date(todayStr);
        const last = new Date(lastDateStr);
        
        const diffTime = today.getTime() - last.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Already studied today according to the date string
            // Keep current streak
        } else if (diffDays === 1) {
            // Studied exactly yesterday
            newStreak += 1;
        } else if (diffDays === 2 && freezeCount > 0) {
            // Missed one day, but have a freeze
            newStreak += 1;
            freezeUsed = true;
        } else {
            // Missed too many days or no freeze available
            newStreak = 1;
            streakReset = true;
        }
    }

    // 4. Detect milestone
    const milestone = STREAK_MILESTONES.find(m => newStreak === m) || null;

    // 5. Update Database (Profile + Activity Log)
    const updateData: Record<string, any> = {
        xp_total: (profile.xp_total || 0) + xpToAdd,
        current_streak: newStreak,
        last_study_date: today,
    };

    // Consume freeze if used
    if (freezeUsed) {
        updateData.streak_freeze_count = freezeCount - 1;
    }

    // Run updates in parallel
    const [profileUpdate, activityLog] = await Promise.all([
        supabase
            .from("profiles")
            .update(updateData)
            .eq("id", targetUserId)
            .select()
            .single(),
        supabase
            .from("user_activity")
            .insert({
                user_id: targetUserId,
                xp_earned: xpToAdd,
                activity_type: type,
            })
    ]);

    const { data: updatedProfile, error } = profileUpdate;

    if (error) {
        console.error("Error updating stats:", error);
        return null;
    }

    return {
        xpGained: xpToAdd,
        newXpTotal: updatedProfile.xp_total,
        newStreak: updatedProfile.current_streak,
        streakIncremented: newStreak > (profile.current_streak || 0),
        streakReset,
        freezeUsed,
        milestone,
    };
}

