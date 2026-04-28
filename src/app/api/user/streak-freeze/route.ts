export const dynamic = 'force-dynamic';


import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";



const FREEZE_COST = 1; // credits
const RECOVERY_COST = 3; // credits

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { action } = await request.json();

        // Fetch profile
        const { data: profile, error: profileErr } = await supabase
            .from("profiles")
            .select("credits, streak_freeze_count, last_streak, streak_reset_at, current_streak")
            .eq("id", user.id)
            .single();

        if (profileErr || !profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        if (action === "buy") {
            if (profile.credits < FREEZE_COST) {
                return NextResponse.json({
                    error: "Not enough credits",
                    required: FREEZE_COST,
                    current: profile.credits,
                }, { status: 402 });
            }

            // Max 3 streak freezes banked
            const currentFreezes = profile.streak_freeze_count || 0;
            if (currentFreezes >= 3) {
                return NextResponse.json({
                    error: "Maximum streak freezes reached (3)",
                    current: currentFreezes,
                }, { status: 400 });
            }

            // Deduct credits and add freeze
            const { data: updated, error: updateErr } = await supabase
                .from("profiles")
                .update({
                    credits: profile.credits - FREEZE_COST,
                    streak_freeze_count: currentFreezes + 1,
                })
                .eq("id", user.id)
                .select("credits, streak_freeze_count")
                .single();

            if (updateErr) throw updateErr;

            return NextResponse.json({
                success: true,
                freezesRemaining: updated.streak_freeze_count,
                creditsRemaining: updated.credits,
            });
        } 
        
        if (action === "recover") {
            if (profile.credits < RECOVERY_COST) {
                return NextResponse.json({
                    error: "Not enough credits for recovery",
                    required: RECOVERY_COST,
                    current: profile.credits,
                }, { status: 402 });
            }

            if (!profile.last_streak || !profile.streak_reset_at) {
                return NextResponse.json({ error: "No streak available for recovery" }, { status: 400 });
            }

            // Check if within 24 hours
            const resetAt = new Date(profile.streak_reset_at).getTime();
            const now = Date.now();
            const hoursPassed = (now - resetAt) / (1000 * 60 * 60);

            if (hoursPassed > 24) {
                return NextResponse.json({ error: "Recovery window has expired (24h limit)" }, { status: 400 });
            }

            // Restore streak
            const { data: restored, error: updateErr } = await supabase
                .from("profiles")
                .update({
                    credits: profile.credits - RECOVERY_COST,
                    current_streak: profile.last_streak,
                    last_streak: 0,
                    streak_reset_at: null,
                })
                .eq("id", user.id)
                .select("credits, current_streak")
                .single();

            if (updateErr) throw updateErr;

            return NextResponse.json({
                success: true,
                currentStreak: restored.current_streak,
                creditsRemaining: restored.credits,
            });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        console.error("Streak freeze error:", error);
        return NextResponse.json({ error: error.message || "Failed to process" }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("streak_freeze_count, credits, current_streak")
            .eq("id", user.id)
            .single();

        return NextResponse.json({
            freezes: profile?.streak_freeze_count || 0,
            credits: profile?.credits || 0,
            streak: profile?.current_streak || 0,
            freezeCost: FREEZE_COST,
            maxFreezes: 3,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
