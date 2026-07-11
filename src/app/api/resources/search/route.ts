export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hydraGenerateContent } from "@/lib/ai/hydra";
import { guardContentSize } from "@/lib/ai/prompts";
// @ts-ignore — youtube-sr has no types bundled; works fine at runtime
import YouTube from "youtube-sr";

// ─── Extract search queries via Hydra (uses existing key rotation) ────────────
async function extractTopics(
    sourceText: string
): Promise<{ searchQuery: string; reasonToWatch: string; difficulty: string }[]> {
    const prompt = `You are The Professor — a sharp, warm study advisor.

Analyze the student's notes below. Identify the 4 most important topics where a short YouTube tutorial would help them understand faster or fill a gap.

For each, return:
- "searchQuery": a precise, short YouTube search string (e.g. "sodium potassium pump animation")
- "reasonToWatch": one punchy sentence on why this unlocks the concept (warm, direct tone)  
- "difficulty": exactly one of: "Concept Intro", "Deep Dive", or "Exam Prep"

STUDENT NOTES:
${sourceText.slice(0, 6000)}

Return ONLY a JSON array. No markdown, no prose. Start with [ and end with ].`;

    const raw = await hydraGenerateContent(prompt, {
        feature: "resources",
        jsonMode: true,
        timeoutMs: 30_000,
    });

    try {
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) return parsed;
    } catch {
        // Try to extract array from anywhere in the string
        const match = raw.match(/\[[\s\S]*\]/);
        if (match) {
            try { return JSON.parse(match[0]); } catch {}
        }
    }
    return [];
}

// ─── Search YouTube via youtube-sr (no API key needed) ───────────────────────
async function searchYouTube(query: string) {
    try {
        const results = await YouTube.search(query, { limit: 1, type: "video" });
        const video = results?.[0];
        if (!video) return null;
        return {
            videoId: video.id ?? null,
            title: video.title ?? query,
            channel: video.channel?.name ?? "YouTube",
            thumbnail: video.thumbnail?.url ?? null,
            duration: video.durationFormatted ?? null,
        };
    } catch (err) {
        console.warn(`youtube-sr failed for "${query}":`, err);
        return null;
    }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const { packId, sourceText, refresh } = await req.json();

        if (!packId || !sourceText) {
            return NextResponse.json({ error: "Missing packId or sourceText" }, { status: 400 });
        }

        // Auth
        const supabaseClient = await createClient();
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { content: safeContent } = guardContentSize(sourceText);

        // 1. Check DB cache first (unless refresh is requested)
        const supabase = supabaseAdmin;
        if (!refresh) {
            try {
                const { data } = await supabase
                    .from("study_packs")
                    .select("phases_data")
                    .eq("id", packId)
                    .single();

                const cached = data?.phases_data?.resources;
                if (cached && Array.isArray(cached) && cached.length > 0) {
                    return NextResponse.json({ success: true, resources: cached });
                }
            } catch {}
        }

        // 2. Extract topics via Hydra (uses existing key rotation: G4F → OpenRouter → Groq)
        const topics = await extractTopics(safeContent);

        if (!topics.length) {
            return NextResponse.json(
                { error: "Could not extract topics. Please try again." },
                { status: 500 }
            );
        }

        // 3. Search YouTube for each topic in parallel (no key needed)
        const settled = await Promise.allSettled(
            topics.map(async (topic) => {
                const video = await searchYouTube(topic.searchQuery);
                return {
                    title: video?.title ?? topic.searchQuery,
                    channel: video?.channel ?? "YouTube",
                    duration: video?.duration ?? "~10 mins",
                    difficulty: topic.difficulty,
                    reasonToWatch: topic.reasonToWatch,
                    searchQuery: topic.searchQuery,
                    youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic.searchQuery)}`,
                    videoId: video?.videoId ?? null,
                    thumbnail: video?.thumbnail ?? null,
                };
            })
        );

        const resources = settled
            .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
            .map((r) => r.value);

        if (!resources.length) {
            return NextResponse.json(
                { error: "Could not find YouTube videos. Please try again." },
                { status: 500 }
            );
        }

        // 4. Cache in Supabase
        try {
            const { data: pack } = await supabase
                .from("study_packs")
                .select("phases_data")
                .eq("id", packId)
                .single();

            await supabase
                .from("study_packs")
                .update({
                    phases_data: {
                        ...(pack?.phases_data ?? {}),
                        resources,
                    },
                })
                .eq("id", packId);
        } catch (dbErr) {
            console.error("Failed to persist resources:", dbErr);
        }

        return NextResponse.json({ success: true, resources });

    } catch (error: any) {
        console.error("Resources API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
