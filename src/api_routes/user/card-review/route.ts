export const dynamic = 'force-dynamic';


import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";



/**
 * SM-2 Simplified Interval Calculator
 * Rating: 1=Again, 2=Hard, 3=Good, 4=Easy
 */
function getNextInterval(rating: number, currentInterval: number, reviewCount: number): number {
    if (rating === 1) return 1; // Again → 1 day (reset)
    if (reviewCount === 0) {
        // First review
        return rating === 2 ? 1 : rating === 3 ? 3 : 5;
    }
    if (reviewCount === 1) {
        // Second review
        return rating === 2 ? 3 : rating === 3 ? 7 : 10;
    }
    // Subsequent reviews
    const multipliers: Record<number, number> = { 2: 1.2, 3: 2.0, 4: 2.5 };
    const mult = multipliers[rating] || 2.0;
    return Math.round(Math.min(currentInterval * mult, 180)); // Cap at 180 days
}

function getEaseFactor(rating: number, currentEase: number): number {
    const adjustments: Record<number, number> = { 1: -0.2, 2: -0.1, 3: 0, 4: 0.1 };
    return Math.max(1.3, currentEase + (adjustments[rating] || 0));
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { cardId, generationId, rating, front, back } = await request.json();

        if (!generationId || !rating || rating < 1 || rating > 4) {
            return NextResponse.json({ error: "Invalid rating (1-4 required)" }, { status: 400 });
        }

        // The card_id is either a real card ID or a composite key
        const effectiveCardId = cardId || `${generationId}_${Buffer.from(front || "").toString("base64").slice(0, 20)}`;

        // Check for existing review record
        const { data: existing } = await supabase
            .from("card_reviews")
            .select("*")
            .eq("user_id", user.id)
            .eq("card_id", effectiveCardId)
            .single();

        const now = new Date();
        const currentInterval = existing?.interval_days || 0;
        const currentEase = existing?.ease_factor || 2.5;
        const reviewCount = existing?.review_count || 0;

        const nextInterval = getNextInterval(rating, currentInterval, reviewCount);
        const nextEase = getEaseFactor(rating, currentEase);
        const nextReviewDate = new Date(now);
        nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

        if (existing) {
            // Update existing review
            const { error } = await supabase
                .from("card_reviews")
                .update({
                    rating,
                    interval_days: nextInterval,
                    ease_factor: nextEase,
                    review_count: reviewCount + 1,
                    last_reviewed_at: now.toISOString(),
                    next_review_at: nextReviewDate.toISOString(),
                })
                .eq("id", existing.id);

            if (error) throw error;
        } else {
            // Insert new review record
            const { error } = await supabase
                .from("card_reviews")
                .insert({
                    user_id: user.id,
                    card_id: effectiveCardId,
                    generation_id: generationId,
                    front_text: front?.slice(0, 500),
                    back_text: back?.slice(0, 500),
                    rating,
                    interval_days: nextInterval,
                    ease_factor: nextEase,
                    review_count: 1,
                    last_reviewed_at: now.toISOString(),
                    next_review_at: nextReviewDate.toISOString(),
                });

            if (error) throw error;
        }

        return NextResponse.json({
            success: true,
            nextReviewDays: nextInterval,
            nextReviewDate: nextReviewDate.toISOString(),
        });
    } catch (error: any) {
        console.error("Card review error:", error);
        return NextResponse.json({ error: error.message || "Failed to record review" }, { status: 500 });
    }
}
