import { createClient } from "@/lib/supabase/server";
import { calculateLevel, getLevelProgress } from "@/lib/profiles-client";

export { calculateLevel, getLevelProgress };

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
