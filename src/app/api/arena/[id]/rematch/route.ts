export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: oldDuelId } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch old duel
        const { data: oldDuel, error: oldDuelError } = await supabase
            .from("duels")
            .select("*")
            .eq("id", oldDuelId)
            .single();

        if (oldDuelError || !oldDuel) {
            return NextResponse.json({ error: "Original duel not found" }, { status: 404 });
        }

        // Check if the user is a participant
        const isHost = user.id === oldDuel.host_id;
        const isChallenger = user.id === oldDuel.challenger_id;

        if (!isHost && !isChallenger) {
            return NextResponse.json({ error: "You were not a participant in this duel" }, { status: 403 });
        }

        // Determine opponent
        const opponentId = isHost ? oldDuel.challenger_id : oldDuel.host_id;
        if (!opponentId) {
            return NextResponse.json({ error: "No opponent was present in the original duel to rematch" }, { status: 400 });
        }

        // Generate unique code for new duel
        let code = '';
        let codeExists = true;
        while (codeExists) {
            code = generateCode();
            const { data: existing } = await supabase
                .from("duels")
                .select("id")
                .eq("code", code)
                .single();
            codeExists = !!existing;
        }

        // Create the new rematch duel
        // The requester becomes the host of the new duel, the opponent is the challenger
        const { data: newDuel, error: newDuelError } = await supabase
            .from("duels")
            .insert({
                code,
                host_id: user.id,
                challenger_id: opponentId,
                generation_id: oldDuel.generation_id,
                status: 'WAITING',
                time_limit_seconds: oldDuel.time_limit_seconds || 600,
                wager_xp: oldDuel.wager_xp || 50
            })
            .select()
            .single();

        if (newDuelError || !newDuel) {
            console.error("Rematch duel creation error:", newDuelError);
            return NextResponse.json({ error: "Failed to create rematch duel" }, { status: 500 });
        }

        // Create new session for the new host (current user)
        await supabase
            .from("duel_sessions")
            .insert({
                duel_id: newDuel.id,
                user_id: user.id,
                is_ready: false
            });

        // Store the rematch_duel_id in the OLD duel session for the current user
        // This will trigger the realtime update for the opponent who is subscribing
        const { data: oldSession } = await supabase
            .from("duel_sessions")
            .select("answers")
            .eq("duel_id", oldDuelId)
            .eq("user_id", user.id)
            .single();

        const oldAnswers = oldSession?.answers || {};
        const updatedAnswers = {
            ...oldAnswers,
            rematch_duel_id: newDuel.id
        };

        await supabase
            .from("duel_sessions")
            .update({ answers: updatedAnswers })
            .eq("duel_id", oldDuelId)
            .eq("user_id", user.id);

        return NextResponse.json({
            success: true,
            rematchDuelId: newDuel.id
        });
    } catch (error) {
        console.error("Rematch API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
