import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const timeframe = searchParams.get("timeframe") || "weekly"; // daily, weekly, all
        const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
        const offset = parseInt(searchParams.get("offset") || "0");

        let rankings = [];

        if (timeframe === 'all') {
            // Use lifetime stats from profiles + social_stats
            const { data, error } = await supabase
                .from("profiles")
                .select(`
                    id, 
                    username, 
                    alias, 
                    avatar_url, 
                    xp_total, 
                    current_streak, 
                    education_level,
                    social_stats:social_stats!user_id (
                        social_level,
                        rank_title,
                        duel_wins,
                        duel_losses,
                        win_rate
                    )
                `)
                .order("xp_total", { ascending: false })
                .range(offset, offset + limit - 1);
            
            if (error) throw error;
            rankings = data.map((p: any, i) => ({
                rank: offset + i + 1,
                userId: p.id,
                name: p.alias || p.username || "Scholar",
                avatar: p.avatar_url,
                xp: p.xp_total,
                streak: p.current_streak,
                education: p.education_level,
                socialLevel: p.social_stats?.[0]?.social_level || 1,
                rankTitle: p.social_stats?.[0]?.rank_title || "Novice",
                wins: p.social_stats?.[0]?.duel_wins || 0,
                winRate: p.social_stats?.[0]?.win_rate || 0
            }));
        } else {
            // Temporal: Use user_activity
            let dateFilter = new Date();
            if (timeframe === 'daily') {
                dateFilter.setHours(0, 0, 0, 0);
            } else {
                // Weekly starts on Monday
                const day = dateFilter.getDay();
                const diff = dateFilter.getDate() - day + (day === 0 ? -6 : 1);
                dateFilter.setDate(diff);
                dateFilter.setHours(0, 0, 0, 0);
            }

            const { data, error } = await supabase
                .from("user_activity")
                .select(`
                    user_id,
                    xp_earned,
                    profiles:user_id (
                        id,
                        username,
                        alias,
                        avatar_url,
                        current_streak,
                        education_level,
                        social_stats:social_stats!user_id (
                            social_level,
                            rank_title,
                            duel_wins,
                            win_rate
                        )
                    )
                `)
                .gte("created_at", dateFilter.toISOString());

            if (error) throw error;

            const statsMap = new Map();
            data.forEach((row: any) => {
                const userId = row.user_id;
                if (!statsMap.has(userId)) {
                    statsMap.set(userId, {
                        userId,
                        xp: 0,
                        profile: row.profiles
                    });
                }
                statsMap.get(userId).xp += row.xp_earned;
            });

            rankings = Array.from(statsMap.values())
                .sort((a, b) => b.xp - a.xp)
                .slice(offset, offset + limit)
                .map((item, i) => ({
                    rank: offset + i + 1,
                    userId: item.userId,
                    name: item.profile?.alias || item.profile?.username || "Scholar",
                    avatar: item.profile?.avatar_url,
                    xp: item.xp,
                    streak: item.profile?.current_streak || 0,
                    education: item.profile?.education_level,
                    socialLevel: item.profile?.social_stats?.[0]?.social_level || 1,
                    rankTitle: item.profile?.social_stats?.[0]?.rank_title || "Novice",
                    wins: item.profile?.social_stats?.[0]?.duel_wins || 0,
                    winRate: item.profile?.social_stats?.[0]?.win_rate || 0
                }));
        }

        // Find current user's performance and rank
        let userRank = null;
        const existingIdx = rankings.findIndex(r => r.userId === user.id);
        
        if (existingIdx !== -1) {
            userRank = rankings[existingIdx];
        } else {
            // Fetch user rank separately if they are not in the top N
            if (timeframe === 'all') {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("xp_total")
                    .eq("id", user.id)
                    .single();
                
                if (profile) {
                    const { count } = await supabase
                        .from("profiles")
                        .select("*", { count: 'exact', head: true })
                        .gt("xp_total", profile.xp_total);
                    
                    userRank = { rank: (count || 0) + 1, xp: profile.xp_total };
                }
            } else {
                // For weekly/daily we'd need a more complex query, for now return basic stats
                const { data: activity } = await supabase
                    .from("user_activity")
                    .select("xp_earned")
                    .eq("user_id", user.id)
                    .gte("created_at", new Date(new Date().setDate(new Date().getDate() - 7)).toISOString());
                
                const totalXp = activity?.reduce((sum, a) => sum + a.xp_earned, 0) || 0;
                userRank = { rank: ">" + limit, xp: totalXp };
            }
        }

        return NextResponse.json({
            success: true,
            rankings,
            userRank,
            timeframe
        }, {
            headers: {
                'Cache-Control': 'no-store, must-revalidate'
            }
        });

    } catch (error) {
        console.error("Leaderboard API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
