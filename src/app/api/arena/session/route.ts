export const dynamic = 'force-dynamic';


import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";



export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { duel_id, current_question_index, answers, is_finished } = body;

        if (!duel_id) {
            return NextResponse.json({ error: "Duel ID is required" }, { status: 400 });
        }

        // Get duel to verify user is a participant
        const { data: duel, error: duelError } = await supabase
            .from("duels")
            .select("id, host_id, challenger_id, status, generation_id")
            .eq("id", duel_id)
            .single();

        if (duelError || !duel) {
            return NextResponse.json({ error: "Duel not found" }, { status: 404 });
        }

        const { data: gen } = await supabase
            .from("generations")
            .select("id, content")
            .eq("id", duel.generation_id)
            .single();

        const isHost = duel.host_id === user.id;
        const isChallenger = duel.challenger_id === user.id;

        if (!isHost && !isChallenger) {
            return NextResponse.json({ error: "Not a participant" }, { status: 403 });
        }

        // Update session
        const updateData: any = {
            current_question_index,
            answers,
            last_ping: new Date().toISOString()
        };

        if (is_finished) {
            updateData.finished_at = new Date().toISOString();
        }

        await supabase
            .from("duel_sessions")
            .update(updateData)
            .eq("duel_id", duel_id)
            .eq("user_id", user.id);

        // Calculate score
        let score = 0;
        const generation = gen as { content?: { questions?: any[] } } | null;
        const questions = generation?.content?.questions || [];
        if (answers && typeof answers === 'object') {
            score = questions.filter((q: any, idx: number) => 
                answers[idx] === q.correctIndex
            ).length;
        }

        // Update duel scores and check for completion
        const updateDuel: any = {};
        
        if (isHost) {
            updateDuel.host_score = score;
            if (is_finished) {
                updateDuel.host_finished_at = new Date().toISOString();
            }
        } else {
            updateDuel.challenger_score = score;
            if (is_finished) {
                updateDuel.challenger_finished_at = new Date().toISOString();
            }
        }

        // Check if both have finished
        const { data: sessions } = await supabase
            .from("duel_sessions")
            .select("user_id, finished_at")
            .eq("duel_id", duel_id);

        const bothFinished = sessions?.every(s => s.finished_at);

        if (bothFinished) {
            // Atomically ensure we only process the completion once
            const { data: completionCheck, error: lockErr } = await supabase
                .from("duels")
                .update({ status: 'COMPLETED' })
                .eq("id", duel_id)
                .eq("status", "IN_PROGRESS")
                .select("id")
                .single();

            if (!lockErr && completionCheck) {
                // Determine winner
                const hostSession = sessions?.find(s => s.user_id === duel.host_id);
                const challengerSession = sessions?.find(s => s.user_id === duel.challenger_id);

                // Get full session data for scoring
                const { data: fullSessions } = await supabase
                    .from("duel_sessions")
                    .select("user_id, answers")
                    .eq("duel_id", duel_id);

                let finalHostScore = 0;
                let finalChallengerScore = 0;

                fullSessions?.forEach(s => {
                    if (s.user_id === duel.host_id && s.answers) {
                        const hostAnswers = s.answers as Record<string, number>;
                        finalHostScore = questions.filter((q: any, idx: number) => 
                            hostAnswers[idx] === q.correctIndex
                        ).length;
                    }
                    if (s.user_id === duel.challenger_id && s.answers) {
                        const challengerAnswers = s.answers as Record<string, number>;
                        finalChallengerScore = questions.filter((q: any, idx: number) => 
                            challengerAnswers[idx] === q.correctIndex
                        ).length;
                    }
                });

                updateDuel.host_score = finalHostScore;
                updateDuel.challenger_score = finalChallengerScore;

                // Determine winner
                if (finalHostScore > finalChallengerScore) {
                    updateDuel.winner_id = duel.host_id;
                } else if (finalChallengerScore > finalHostScore) {
                    updateDuel.winner_id = duel.challenger_id;
                }
                // If tied, winner_id stays null (draw)

                // Update social stats via secure RPC backend
                const winnerId = updateDuel.winner_id;
                const loserId = winnerId === duel.host_id ? duel.challenger_id : duel.host_id;

                await supabase.rpc('update_social_stats_after_duel', {
                    p_winner_id: winnerId,
                    p_loser_id: loserId,
                    p_draw: winnerId === null
                });
                
                await supabase
                    .from("duels")
                    .update(updateDuel)
                    .eq("id", duel_id);
            }
        } else if (Object.keys(updateDuel).length > 0) {
            // Just update partial stuff like host_score if not finished
            await supabase
                .from("duels")
                .update(updateDuel)
                .eq("id", duel_id);
        }

        // Get updated duel state
        const { data: updatedDuel } = await supabase
            .from("duels")
            .select("*")
            .eq("id", duel_id)
            .single();

        return NextResponse.json({
            success: true,
            score,
            duelStatus: updatedDuel?.status,
            winnerId: updatedDuel?.winner_id,
            bothFinished
        });
    } catch (error) {
        console.error("Session update error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const duel_id = searchParams.get("duel_id");

        if (!duel_id) {
            return NextResponse.json({ error: "Duel ID required" }, { status: 400 });
        }

        // Get session for current user
        const { data: session } = await supabase
            .from("duel_sessions")
            .select("*")
            .eq("duel_id", duel_id)
            .eq("user_id", user.id)
            .single();

        // Get opponent's session
        const { data: duel } = await supabase
            .from("duels")
            .select("host_id, challenger_id")
            .eq("id", duel_id)
            .single();

        if (!duel) {
            return NextResponse.json({ error: "Duel not found" }, { status: 404 });
        }

        const opponentId = duel.host_id === user.id ? duel.challenger_id : duel.host_id;
        
        const { data: opponentSession } = opponentId ? await supabase
            .from("duel_sessions")
            .select("*")
            .eq("duel_id", duel_id)
            .eq("user_id", opponentId)
            .single() : { data: null };

        return NextResponse.json({
            success: true,
            session: session ? {
                currentQuestionIndex: session.current_question_index,
                answers: session.answers,
                isReady: session.is_ready,
                finishedAt: session.finished_at
            } : null,
            opponentSession: opponentSession ? {
                currentQuestionIndex: opponentSession.current_question_index,
                answers: opponentSession.answers,
                isReady: opponentSession.is_ready,
                finishedAt: opponentSession.finished_at
            } : null
        });
    } catch (error) {
        console.error("Session GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
