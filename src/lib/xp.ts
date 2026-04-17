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
    type: 'quiz' | 'flashcards' | 'summary' | 'roadmap' | 'daily_challenge', 
    existingSupabase?: any,
    userId?: string,
    customXp?: number
) {
    const supabase = existingSupabase || await createClient();
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;

    if (!targetUserId) return null;

    // 1. Calculate XP based on activity
    const xpMap: Record<string, number> = {
        quiz: 10,
        flashcards: 5,
        summary: 3,
        roadmap: 15,
        daily_challenge: 0
    };
    const xpToAdd = customXp !== undefined ? customXp : (xpMap[type] || 0);

    // 2. Fetch current profile stats (including streak freeze)
    const { data: profile } = await supabase
        .from("profiles")
        .select("xp_total, current_streak, last_study_date, streak_freeze_count")
        .eq("id", targetUserId)
        .single();

    if (!profile) return null;

    // 3. Streak Logic (UTC Date based) with Freeze Support
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // "YYYY-MM-DD"
    
    let newStreak = profile.current_streak || 0;
    let freezeUsed = false;
    let streakReset = false;
    const lastDate = profile.last_study_date;
    const freezeCount = profile.streak_freeze_count || 0;

    if (!lastDate) {
        // First ever activity
        newStreak = 1;
    } else {
        const last = new Date(lastDate);
        const diffTime = now.getTime() - last.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (today === lastDate) {
            // Already studied today, keep streak as is
        } else if (diffDays === 1) {
            // Studied yesterday, increment streak
            newStreak += 1;
        } else if (diffDays === 2 && freezeCount > 0) {
            // Missed exactly 1 day but have a streak freeze
            newStreak += 1; // Continue streak
            freezeUsed = true;
        } else if (diffDays > 1) {
            // Missed too many days, reset streak
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

