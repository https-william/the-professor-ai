import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'edge';

/**
 * GET /api/user/activity-history
 * Returns the user's study activity for the current week + recent generations.
 * Powers the dashboard streak calendar and recent activity feed.
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the start of the current week (Monday)
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);

        // Fetch profile for streak data
        const { data: profile } = await supabase
            .from("profiles")
            .select("xp_total, current_streak, last_study_date, education_level, study_goal")
            .eq("id", user.id)
            .single();

        // Fetch this week's generations (for activity dots on streak calendar)
        const { data: weekGenerations } = await supabase
            .from("generations")
            .select("created_at, type, title")
            .eq("user_id", user.id)
            .gte("created_at", monday.toISOString())
            .order("created_at", { ascending: false });

        // Extract unique active dates this week
        const activeDates = new Set<string>();
        (weekGenerations || []).forEach(gen => {
            const date = new Date(gen.created_at).toISOString().split('T')[0];
            activeDates.add(date);
        });

        // Also check last_study_date from profile (covers activity recorded by xp.ts)
        if (profile?.last_study_date) {
            const lastStudy = new Date(profile.last_study_date);
            if (lastStudy >= monday) {
                activeDates.add(profile.last_study_date);
            }
        }

        // Fetch recent activity (last 8 generations for the activity feed)
        const { data: recentActivity } = await supabase
            .from("generations")
            .select("id, title, type, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(8);

        // Fetch total counts by type
        const { count: totalFlashcards } = await supabase
            .from("generations")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("type", "flashcards");

        const { count: totalQuizzes } = await supabase
            .from("generations")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("type", "quiz");

        const { count: totalSummaries } = await supabase
            .from("generations")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("type", "summary");

        return NextResponse.json({
            streak: profile?.current_streak || 0,
            lastStudyDate: profile?.last_study_date || null,
            xp: profile?.xp_total || 0,
            educationLevel: profile?.education_level || null,
            studyGoal: profile?.study_goal || null,
            activeDatesThisWeek: Array.from(activeDates),
            totalThisWeek: weekGenerations?.length || 0,
            recentActivity: (recentActivity || []).map(item => ({
                id: item.id,
                title: item.title,
                type: item.type,
                createdAt: item.created_at,
            })),
            stats: {
                flashcards: totalFlashcards || 0,
                quizzes: totalQuizzes || 0,
                summaries: totalSummaries || 0,
            }
        });

    } catch (error) {
        console.error("Activity History Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
