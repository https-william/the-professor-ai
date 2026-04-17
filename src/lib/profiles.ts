import { createClient } from "@/lib/supabase/server";

export async function getPublicProfile(username: string) {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from("profiles")
        .select(`
            id,
            username,
            full_name,
            avatar_url,
            xp_total,
            current_streak,
            education_level,
            study_goal,
            created_at
        `)
        .eq("username", username.toLowerCase())
        .single();

    if (error || !data) {
        return null;
    }

    return data;
}

export function calculateLevel(xp: number) {
    // Basic level formula: Level = floor(sqrt(xp / 100)) + 1
    // e.g., 0 XP = Level 1, 100 XP = Level 2, 400 XP = Level 3
    return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function getLevelProgress(xp: number) {
    const level = calculateLevel(xp);
    const currentLevelXp = Math.pow(level - 1, 2) * 100;
    const nextLevelXp = Math.pow(level, 2) * 100;
    
    const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    return Math.min(Math.max(progress, 0), 100);
}
