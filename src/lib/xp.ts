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
    type: 'quiz' | 'flashcards' | 'summary' | 'roadmap' | 'daily_challenge' | 'mind-map' | 'podcast' | 'exam_sprint' | 'tour_complete' | 'trivia_duel', 
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
        podcast: 40,
        exam_sprint: 100,
        tour_complete: 100,
        trivia_duel: 50
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
    // Use Africa/Lagos (WAT) timezone to handle midnight boundaries correctly for users in Nigeria
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Africa/Lagos",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
    const parts = formatter.formatToParts(new Date());
    const year = parts.find(p => p.type === "year")?.value;
    const month = parts.find(p => p.type === "month")?.value;
    const day = parts.find(p => p.type === "day")?.value;
    const todayStr = `${year}-${month}-${day}`;
    
    let newStreak = profile.current_streak || 0;
    let freezeUsed = false;
    let streakReset = false;
    const lastDateStr = profile.last_study_date;
    const freezeCount = profile.streak_freeze_count || 0;

    if (!lastDateStr) {
        newStreak = 1;
    } else {
        // Parse as local midnight (avoid timezone-induced off-by-one)
        const [ty, tm, td] = todayStr.split('-').map(Number);
        const [ly, lm, ld] = lastDateStr.split('-').map(Number);
        const today = new Date(ty, tm - 1, td);
        const last  = new Date(ly, lm - 1, ld);
        
        const diffTime = today.getTime() - last.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Already studied today — keep current streak, no change
        } else if (diffDays === 1) {
            // Studied exactly yesterday — consecutive day!
            newStreak += 1;
        } else if (diffDays === 2 && freezeCount > 0) {
            // Missed exactly one day but have a streak freeze — use it
            newStreak += 1;
            freezeUsed = true;
        } else {
            // Gap too large (or diffDays===2 with no freeze) — reset
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
        last_study_date: todayStr,
    };

    // Consume freeze if used
    if (freezeUsed) {
        updateData.streak_freeze_count = freezeCount - 1;
    }

    // Run profile update first to ensure user stats are always preserved
    const { data: updatedProfile, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", targetUserId)
        .select()
        .single();

    if (error) {
        console.error("Error updating stats:", error);
        return null;
    }

    // Non-blocking insert into user_activity
    supabase
        .from("user_activity")
        .insert({
            user_id: targetUserId,
            xp_earned: xpToAdd,
            activity_type: type,
        })
        .then((res: any) => {
            if (res.error) console.warn("Non-critical: user_activity insert failed", res.error);
        })
        .catch((err: any) => console.warn("Non-critical: user_activity insert error", err));

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

