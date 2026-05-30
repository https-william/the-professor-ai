export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: duelId } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch duel
        const { data: duel, error: duelError } = await supabase
            .from("duels")
            .select(`
                *,
                host:profiles!host_id(id, username, first_name, last_name, avatar_url, xp_total, current_streak),
                challenger:profiles!challenger_id(id, username, first_name, last_name, avatar_url, xp_total, current_streak),
                generation:generations(id, title, content, type)
            `)
            .eq("id", duelId)
            .single();

        if (duelError || !duel) {
            return NextResponse.json({ error: "Duel not found" }, { status: 404 });
        }

        // Fetch sessions
        const { data: sessions } = await supabase
            .from("duel_sessions")
            .select("*")
            .eq("duel_id", duelId);

        const hostSession = sessions?.find(s => s.user_id === duel.host_id);
        const challengerSession = duel.challenger_id 
            ? sessions?.find(s => s.user_id === duel.challenger_id)
            : null;

        const isHost = user.id === duel.host_id;

        // Build DuelData structure
        const duelData = {
            id: duel.id,
            code: duel.code,
            status: duel.status,
            isHost,
            host: {
                id: duel.host?.id || duel.host_id,
                name: duel.host?.username || duel.host?.first_name || 'Host',
                avatar: duel.host?.avatar_url,
                xp: duel.host?.xp_total || 0,
                streak: duel.host?.current_streak || 1,
                score: duel.host_score || 0,
                session: hostSession ? {
                    currentQuestionIndex: hostSession.current_question_index,
                    isReady: hostSession.is_ready,
                    answers: hostSession.answers || {}
                } : undefined
            },
            challenger: duel.challenger_id ? {
                id: duel.challenger?.id || duel.challenger_id,
                name: duel.challenger?.username || duel.challenger?.first_name || 'Challenger',
                avatar: duel.challenger?.avatar_url,
                xp: duel.challenger?.xp_total || 0,
                streak: duel.challenger?.current_streak || 1,
                score: duel.challenger_score || 0,
                session: challengerSession ? {
                    currentQuestionIndex: challengerSession.current_question_index,
                    isReady: challengerSession.is_ready,
                    answers: challengerSession.answers || {}
                } : undefined
            } : null,
            generation: {
                id: duel.generation?.id,
                title: duel.generation?.title || 'Quiz',
                questionCount: duel.generation?.content?.questions?.length || 0,
                questions: duel.generation?.content?.questions || []
            },
            timeLimit: duel.time_limit_seconds || 600,
            winnerId: duel.winner_id
        };

        return NextResponse.json({
            success: true,
            duel: duelData
        });
    } catch (error) {
        console.error("Arena GET by ID Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: duelId } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { action } = body;

        // Fetch duel
        const { data: duel, error: duelError } = await supabase
            .from("duels")
            .select("*")
            .eq("id", duelId)
            .single();

        if (duelError || !duel) {
            return NextResponse.json({ error: "Duel not found" }, { status: 404 });
        }

        if (action === "ready") {
            // Check if user is participant
            const isHost = user.id === duel.host_id;
            const isChallenger = user.id === duel.challenger_id;

            if (!isHost && !isChallenger) {
                return NextResponse.json({ error: "Not a participant" }, { status: 403 });
            }

            // Update user readiness session
            await supabase
                .from("duel_sessions")
                .update({ is_ready: true })
                .eq("duel_id", duelId)
                .eq("user_id", user.id);

            // Fetch updated sessions to verify if all are ready
            const { data: sessions } = await supabase
                .from("duel_sessions")
                .select("is_ready")
                .eq("duel_id", duelId);

            // All participants are ready if we have 2 ready sessions (or if challenger exists and both are ready)
            const challengerExists = !!duel.challenger_id;
            const allReady = challengerExists && sessions && sessions.length >= 2 && sessions.every(s => s.is_ready);

            if (allReady) {
                await supabase
                    .from("duels")
                    .update({ status: 'READY' })
                    .eq("id", duelId);
            }

            return NextResponse.json({
                success: true,
                allReady
            });
        }

        if (action === "start") {
            // Only host can start
            if (user.id !== duel.host_id) {
                return NextResponse.json({ error: "Only host can start the duel" }, { status: 403 });
            }

            await supabase
                .from("duels")
                .update({ status: 'IN_PROGRESS' })
                .eq("id", duelId);

            return NextResponse.json({ success: true });
        }

        if (action === "cancel") {
            // Only host or challenger can cancel/leave
            const isHost = user.id === duel.host_id;
            const isChallenger = user.id === duel.challenger_id;

            if (!isHost && !isChallenger) {
                return NextResponse.json({ error: "Not a participant" }, { status: 403 });
            }

            // Update status to CANCELLED
            await supabase
                .from("duels")
                .update({ status: 'CANCELLED' })
                .eq("id", duelId);

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Arena PATCH by ID Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
