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

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { generation_id, time_limit_seconds = 600, wager_xp = 50 } = body;

        if (!generation_id) {
            return NextResponse.json({ error: "Generation ID is required" }, { status: 400 });
        }

        // Verify the generation exists and belongs to the user (or is public)
        const { data: generation, error: genError } = await supabase
            .from("generations")
            .select("id, type, content, title, user_id")
            .eq("id", generation_id)
            .single();

        if (genError || !generation) {
            return NextResponse.json({ error: "Generation not found" }, { status: 404 });
        }

        // Only quiz types can be used for duels
        if (generation.type !== 'quiz') {
            return NextResponse.json({ error: "Only quizzes can be used for duels" }, { status: 400 });
        }

        // Generate unique code
        let code: string = '';
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

        // Create duel
        const { data: duel, error: duelError } = await supabase
            .from("duels")
            .insert({
                code,
                host_id: user.id,
                generation_id,
                status: 'WAITING',
                time_limit_seconds,
                wager_xp
            })
            .select(`
                *,
                host:profiles!host_id(id, username, first_name, avatar_url)
            `)
            .single();

        if (duelError) {
            console.error("Duel creation error:", duelError);
            return NextResponse.json({ error: "Failed to create duel" }, { status: 500 });
        }

        // Create host session
        await supabase
            .from("duel_sessions")
            .insert({
                duel_id: duel.id,
                user_id: user.id,
                is_ready: false
            });

        return NextResponse.json({
            success: true,
            duel: {
                id: duel.id,
                code: duel.code,
                status: duel.status,
                host: {
                    id: user.id,
                    name: generation.user_id === user.id ? 'You' : 'Host'
                },
                generation: {
                    id: generation.id,
                    title: generation.title,
                    questionCount: generation.content?.questions?.length || 0
                },
                timeLimit: time_limit_seconds,
                wagerXp: duel.wager_xp || wager_xp
            }
        });
    } catch (error) {
        console.error("Arena POST Error:", error);
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
        const code = searchParams.get("code");
        const myDuels = searchParams.get("my") === "true";

        if (code) {
            // Join duel by code
            const { data: duel, error: duelError } = await supabase
                .from("duels")
                .select(`
                    *,
                    host:profiles!host_id(id, username, first_name, last_name, avatar_url, xp_total),
                    challenger:profiles!challenger_id(id, username, first_name, last_name, avatar_url, xp_total)
                `)
                .eq("code", code.toUpperCase())
                .single();

            if (duelError || !duel) {
                return NextResponse.json({ error: "Duel not found" }, { status: 404 });
            }

            const { data: gen } = await supabase
                .from("generations")
                .select("id, title, content, type")
                .eq("id", duel.generation_id)
                .single();

            // Check if duel is joinable
            if (duel.status !== 'WAITING') {
                return NextResponse.json({ error: "Duel is no longer available" }, { status: 400 });
            }

            // Check if user is already the host
            if (duel.host_id === user.id) {
                return NextResponse.json({
                    success: true,
                    duel: {
                        id: duel.id,
                        code: duel.code,
                        status: duel.status,
                        isHost: true,
                        host: {
                            id: duel.host?.id,
                            name: duel.host?.username || duel.host?.first_name || 'You'
                        },
                        challenger: null,
                        generation: {
                            id: gen?.id,
                            title: gen?.title || 'Quiz',
                            questionCount: gen?.content?.questions?.length || 0
                        }
                    }
                });
            }

            // Join as challenger
            const { data: updatedDuel, error: joinError } = await supabase
                .from("duels")
                .update({ challenger_id: user.id })
                .eq("id", duel.id)
                .select(`
                    *,
                    host:profiles!host_id(id, username, first_name, last_name, avatar_url, xp_total),
                    challenger:profiles!challenger_id(id, username, first_name, last_name, avatar_url, xp_total)
                `)
                .single();

            if (joinError) {
                console.error("Join duel error:", joinError);
                return NextResponse.json({ error: "Failed to join duel" }, { status: 500 });
            }

            const { data: updatedGen } = await supabase
                .from("generations")
                .select("id, title, content, type")
                .eq("id", updatedDuel.generation_id)
                .single();

            // Create challenger session
            await supabase
                .from("duel_sessions")
                .insert({
                    duel_id: duel.id,
                    user_id: user.id,
                    is_ready: false
                });

            return NextResponse.json({
                success: true,
                duel: {
                    id: updatedDuel.id,
                    code: updatedDuel.code,
                    status: updatedDuel.status,
                    isHost: false,
                    host: {
                        id: updatedDuel.host?.id,
                        name: updatedDuel.host?.username || updatedDuel.host?.first_name || 'Host',
                        xp: updatedDuel.host?.xp_total || 0
                    },
                    challenger: {
                        id: user.id,
                        name: 'You'
                    },
                    generation: {
                        id: updatedGen?.id,
                        title: updatedGen?.title || 'Quiz',
                        questionCount: updatedGen?.content?.questions?.length || 0
                    }
                }
            });
        }

        if (myDuels) {
            // Get user's active duels
            const { data: myDuelsList, error: myDuelsError } = await supabase
                .from("duels")
                .select(`
                    *,
                    host:profiles!host_id(id, username, first_name, avatar_url),
                    challenger:profiles!challenger_id(id, username, first_name, avatar_url)
                `)
                .or(`host_id.eq.${user.id},challenger_id.eq.${user.id}`)
                .in('status', ['WAITING', 'READY', 'IN_PROGRESS'])
                .order('created_at', { ascending: false })
                .limit(10);

            if (myDuelsError) {
                return NextResponse.json({ error: "Failed to fetch duels" }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                duels: myDuelsList?.map(d => ({
                    id: d.id,
                    code: d.code,
                    status: d.status,
                    isHost: d.host_id === user.id,
                    host: {
                        id: d.host?.id,
                        name: d.host?.username || d.host?.first_name || 'Unknown'
                    },
                    challenger: d.challenger ? {
                        id: d.challenger.id,
                        name: d.challenger.username || d.challenger.first_name || 'Challenger'
                    } : null,
                    wagerXp: d.wager_xp || 50
                }))
            });
        }

        // Return open public duels (status = 'WAITING')
        const { data: openDuels, error: openDuelsError } = await supabase
            .from("duels")
            .select(`
                *,
                host:profiles!host_id(id, username, first_name, avatar_url)
            `)
            .eq("status", "WAITING")
            .order("created_at", { ascending: false })
            .limit(20);

        if (openDuelsError) {
            return NextResponse.json({ error: "Failed to fetch open duels" }, { status: 500 });
        }

        let duelsWithGen: any[] = [];
        if (openDuels && openDuels.length > 0) {
            const genIds = Array.from(new Set(openDuels.map(d => d.generation_id)));
            const { data: gens } = await supabase
                .from("generations")
                .select("id, title")
                .in("id", genIds);
            
            const genMap = new Map(gens?.map(g => [g.id, g]) || []);
            
            duelsWithGen = openDuels.map(d => ({
                id: d.id,
                code: d.code,
                status: d.status.toLowerCase(),
                hostName: d.host?.first_name || d.host?.username || 'Classmate',
                packTitle: genMap.get(d.generation_id)?.title || 'Study Quiz',
                wagerXp: d.wager_xp || 50,
                spectators: 0,
                hostId: d.host_id
            }));
        }

        return NextResponse.json({
            success: true,
            duels: duelsWithGen
        });
    } catch (error) {
        console.error("Arena GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
