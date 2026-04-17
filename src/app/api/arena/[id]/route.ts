import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'edge';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const { data: duel, error: duelError } = await supabase
            .from("duels")
            .select(`
                *,
                host:profiles!host_id(id, username, first_name, last_name, avatar_url, xp_total, current_streak),
                challenger:profiles!challenger_id(id, username, first_name, last_name, avatar_url, xp_total, current_streak),
                generation:generations(id, title, content, type)
            `)
            .eq("id", id)
            .single();

        if (duelError || !duel) {
            return NextResponse.json({ error: "Duel not found" }, { status: 404 });
        }

        // Check if user is a participant
        const isHost = duel.host_id === user.id;
        const isChallenger = duel.challenger_id === user.id;

        if (!isHost && !isChallenger) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Get session data for both participants
        const { data: sessions } = await supabase
            .from("duel_sessions")
            .select("*")
            .eq("duel_id", id);

        const hostSession = sessions?.find(s => s.user_id === duel.host_id);
        const challengerSession = sessions?.find(s => s.user_id === duel.challenger_id);

        // Calculate scores if duel is in progress or completed
        let hostScore = 0;
        let challengerScore = 0;
        let questions: any[] = [];

        if (duel.generation?.content?.questions) {
            questions = duel.generation.content.questions;
            
            if (hostSession?.answers) {
                const hostAnswers = hostSession.answers as Record<string, number>;
                hostScore = questions.filter((q, idx) => hostAnswers[idx] === q.correctIndex).length;
            }
            
            if (challengerSession?.answers) {
                const challengerAnswers = challengerSession.answers as Record<string, number>;
                challengerScore = questions.filter((q, idx) => challengerAnswers[idx] === q.correctIndex).length;
            }
        }

        return NextResponse.json({
            success: true,
            duel: {
                id: duel.id,
                code: duel.code,
                status: duel.status,
                isHost,
                host: {
                    id: duel.host?.id,
                    name: duel.host?.username || duel.host?.first_name || 'Host',
                    avatar: duel.host?.avatar_url,
                    xp: duel.host?.xp_total || 0,
                    streak: duel.host?.current_streak || 0,
                    score: hostScore,
                    finishedAt: duel.host_finished_at,
                    session: hostSession ? {
                        currentQuestionIndex: hostSession.current_question_index,
                        isReady: hostSession.is_ready,
                        answers: hostSession.answers
                    } : null
                },
                challenger: duel.challenger ? {
                    id: duel.challenger.id,
                    name: duel.challenger.username || duel.challenger.first_name || 'Challenger',
                    avatar: duel.challenger.avatar_url,
                    xp: duel.challenger.xp_total || 0,
                    streak: duel.challenger.current_streak || 0,
                    score: challengerScore,
                    finishedAt: duel.challenger_finished_at,
                    session: challengerSession ? {
                        currentQuestionIndex: challengerSession.current_question_index,
                        isReady: challengerSession.is_ready,
                        answers: challengerSession.answers
                    } : null
                } : null,
                generation: {
                    id: duel.generation?.id,
                    title: duel.generation?.title,
                    questions: duel.status === 'COMPLETED' ? questions : undefined,
                    questionCount: questions.length
                },
                timeLimit: duel.time_limit_seconds,
                winnerId: duel.winner_id,
                createdAt: duel.created_at
            }
        });
    } catch (error) {
        console.error("Duel status error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { action } = body;

        // Get current duel state
        const { data: duel, error: duelError } = await supabase
            .from("duels")
            .select("*")
            .eq("id", id)
            .single();

        if (duelError || !duel) {
            return NextResponse.json({ error: "Duel not found" }, { status: 404 });
        }

        const isHost = duel.host_id === user.id;
        const isChallenger = duel.challenger_id === user.id;

        if (!isHost && !isChallenger) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        switch (action) {
            case 'ready': {
                // Mark user as ready to start
                await supabase
                    .from("duel_sessions")
                    .update({ is_ready: true })
                    .eq("duel_id", id)
                    .eq("user_id", user.id);

                // Check if both are ready
                const { data: sessions } = await supabase
                    .from("duel_sessions")
                    .select("user_id, is_ready")
                    .eq("duel_id", id);

                const allReady = sessions?.every(s => s.is_ready);

                if (allReady && duel.challenger_id) {
                    await supabase
                        .from("duels")
                        .update({ status: 'IN_PROGRESS' })
                        .eq("id", id);
                }

                return NextResponse.json({ success: true, allReady });
            }

            case 'start': {
                // Host can force start
                if (!isHost) {
                    return NextResponse.json({ error: "Only host can start" }, { status: 403 });
                }

                if (duel.status !== 'READY') {
                    return NextResponse.json({ error: "Cannot start duel" }, { status: 400 });
                }

                await supabase
                    .from("duels")
                    .update({ status: 'IN_PROGRESS' })
                    .eq("id", id);

                return NextResponse.json({ success: true });
            }

            case 'cancel': {
                // Cancel the duel
                await supabase
                    .from("duels")
                    .update({ status: 'CANCELLED' })
                    .eq("id", id);

                return NextResponse.json({ success: true });
            }

            case 'abandon': {
                // Challenger abandons
                if (isChallenger) {
                    await supabase
                        .from("duels")
                        .update({ 
                            status: 'COMPLETED',
                            winner_id: duel.host_id
                        })
                        .eq("id", id);
                }

                return NextResponse.json({ success: true });
            }

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Duel action error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
