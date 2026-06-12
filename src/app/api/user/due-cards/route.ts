export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";



export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date().toISOString();

        // Fetch due cards and total count concurrently
        const [dueCardsResult, totalCardsCountResult] = await Promise.all([
            supabase
                .from("card_reviews")
                .select("*")
                .eq("user_id", user.id)
                .lte("next_review_at", now)
                .order("next_review_at", { ascending: true })
                .limit(50),
            supabase
                .from("card_reviews")
                .select("*", { count: 'exact', head: true })
                .eq("user_id", user.id)
        ]);

        const dueCards = dueCardsResult.data;
        const error = dueCardsResult.error;
        const totalCardsCount = totalCardsCountResult.count;

        if (error) throw error;

        // Group by generation_id for deck info
        const deckMap = new Map<string, any[]>();
        for (const card of (dueCards || [])) {
            const gid = card.generation_id || "unknown";
            if (!deckMap.has(gid)) deckMap.set(gid, []);
            deckMap.get(gid)!.push(card);
        }

        // Fetch generation titles for each deck
        const generationIds = [...deckMap.keys()].filter(id => id !== "unknown");
        let deckTitles: Record<string, string> = {};

        if (generationIds.length > 0) {
            const { data: gens } = await supabase
                .from("generations")
                .select("id, title")
                .in("id", generationIds);

            if (gens) {
                for (const g of gens) {
                    deckTitles[g.id] = g.title;
                }
            }
        }

        // Build response
        const decks = [...deckMap.entries()].map(([genId, cards]) => ({
            generationId: genId,
            title: deckTitles[genId] || "Unknown Deck",
            dueCount: cards.length,
            cards: cards.map(c => ({
                id: c.id,
                cardId: c.card_id,
                front: c.front_text,
                back: c.back_text,
                rating: c.rating,
                intervalDays: c.interval_days,
                reviewCount: c.review_count,
                nextReviewAt: c.next_review_at,
            })),
        }));

        const totalDue = dueCards?.length || 0;
        // ~15 seconds per card review
        const estimatedMinutes = Math.max(1, Math.round((totalDue * 15) / 60));

        return NextResponse.json({
            totalDue,
            totalCardsCount: totalCardsCount || 0,
            estimatedMinutes,
            decks,
        });
    } catch (error: any) {
        console.error("Due cards error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch" }, { status: 500 });
    }
}
