export const dynamic = 'force-dynamic';


import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";



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

        // Fetch profile, weekly activities, recent feed activities, and total stats concurrently
        const [
            profileResult,
            weekGenerationsResult,
            weekPacksResult,
            weekActivitiesResult,
            weekSessionsResult,
            recentGenActivityResult,
            recentPackActivityResult,
            totalFlashcardsResult,
            totalQuizzesResult,
            totalSummariesResult,
            totalStudyPacksResult
        ] = await Promise.all([
            supabase.from("profiles").select("xp_total, current_streak, last_study_date, education_level, study_goal").eq("id", user.id).single(),
            supabase.from("generations").select("created_at, type, title").eq("user_id", user.id).gte("created_at", monday.toISOString()).order("created_at", { ascending: false }),
            supabase.from("study_packs").select("created_at, title").eq("user_id", user.id).gte("created_at", monday.toISOString()).order("created_at", { ascending: false }),
            supabase.from("user_activity").select("created_at").eq("user_id", user.id).gte("created_at", monday.toISOString()),
            supabase.from("study_sessions").select("time_spent_seconds, questions_answered, correct_count, cards_flipped").eq("user_id", user.id).gte("started_at", monday.toISOString()),
            supabase.from("generations").select("id, title, type, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8),
            supabase.from("study_packs").select("id, title, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8),
            supabase.from("generations").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("type", "flashcards"),
            supabase.from("generations").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("type", "quiz"),
            supabase.from("generations").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("type", "summary"),
            supabase.from("study_packs").select("id", { count: "exact", head: true }).eq("user_id", user.id)
        ]);

        const profile = profileResult.data;
        const weekGenerations = weekGenerationsResult.data;
        const weekPacks = weekPacksResult.data;
        const weekActivities = weekActivitiesResult.data;
        const weekSessions = weekSessionsResult.data || [];
        const recentGenActivity = recentGenActivityResult.data;
        const recentPackActivity = recentPackActivityResult.data;
        const totalFlashcards = totalFlashcardsResult.count;
        const totalQuizzes = totalQuizzesResult.count;
        const totalSummaries = totalSummariesResult.count;
        const totalStudyPacks = totalStudyPacksResult.count;

        // Aggregate study sessions data
        let totalTimeSpent = 0;
        let totalQuestions = 0;
        let totalCorrect = 0;
        let totalCards = 0;
        weekSessions.forEach(session => {
            totalTimeSpent += (session.time_spent_seconds || 0);
            totalQuestions += (session.questions_answered || 0);
            totalCorrect += (session.correct_count || 0);
            totalCards += (session.cards_flipped || 0);
        });

        // Ensure current date is considered active if streak is active
        if (profile && profile.current_streak > 0) {
            const todayStr = new Date().toISOString().split('T')[0];
            // Will be added to activeDates set below
        }

        // Extract unique active dates this week
        const activeDates = new Set<string>();
        (weekGenerations || []).forEach(gen => {
            const date = new Date(gen.created_at).toISOString().split('T')[0];
            activeDates.add(date);
        });
        (weekPacks || []).forEach(pack => {
            const date = new Date(pack.created_at).toISOString().split('T')[0];
            activeDates.add(date);
        });
        (weekActivities || []).forEach(act => {
            const date = new Date(act.created_at).toISOString().split('T')[0];
            activeDates.add(date);
        });

        // Also check last_study_date from profile (covers activity recorded by xp.ts)
        if (profile?.last_study_date) {
            const lastStudy = new Date(profile.last_study_date);
            if (lastStudy >= monday) {
                activeDates.add(profile.last_study_date);
            }
        }

        // If streak is active, today is always a study day — ensures the calendar
        // flame count matches the streak number shown in the header.
        if (profile?.current_streak && profile.current_streak > 0) {
            const todayStr = new Date().toISOString().split('T')[0];
            activeDates.add(todayStr);
        }

        // Combine and sort recent activity
        const combinedRecent = [
            ...(recentGenActivity || []),
            ...(recentPackActivity || []).map((p: any) => ({ ...p, type: "exam_sprint" }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
         .slice(0, 8);

        return NextResponse.json({
            streak: profile?.current_streak || 0,
            lastStudyDate: profile?.last_study_date || null,
            xp: profile?.xp_total || 0,
            educationLevel: profile?.education_level || null,
            studyGoal: profile?.study_goal || null,
            activeDatesThisWeek: Array.from(activeDates),
            totalThisWeek: (weekGenerations?.length || 0) + (weekPacks?.length || 0),
            recentActivity: combinedRecent.map(item => ({
                id: item.id,
                title: item.title,
                type: item.type,
                createdAt: item.created_at,
            })),
            stats: {
                flashcards: totalFlashcards || 0,
                quizzes: totalQuizzes || 0,
                summaries: totalSummaries || 0,
                examSprints: totalStudyPacks || 0,
                timeSpentSeconds: totalTimeSpent,
                questionsAnswered: totalQuestions,
                correctCount: totalCorrect,
                cardsFlipped: totalCards
            }
        });

    } catch (error) {
        console.error("Activity History Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
