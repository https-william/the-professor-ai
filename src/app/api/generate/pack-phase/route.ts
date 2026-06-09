export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { startGenerating, finishGenerating } from "@/lib/queue";
import { hydraChatStream, hydraGenerateStream } from "@/lib/ai/hydra";
import { 
    buildBreakdownPrompt,
    buildSummaryPrompt,
    buildFlashcardsPrompt, 
    buildQuizPrompt,
    buildRoadmapPrompt,
    guardContentSize
} from "@/lib/ai/prompts";
import { MASTER_SYSTEM_PROMPT } from "@/lib/ai/professor-prompt";

export async function POST(req: NextRequest) {
    try {
        const { packId, phaseId, sourceText } = await req.json();
        const supabase = supabaseAdmin;
        
        const supabaseClient = await createClient();
        const { data: { user } } = await supabaseClient.auth.getUser();
        const userId = user?.id || "anonymous";

        if (!packId || !phaseId || !sourceText) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { content: safeContent, wasTruncated } = guardContentSize(sourceText);

        // 1. Check if already generated
        const { data: pack, error: fetchError } = await supabase
            .from("study_packs")
            .select("phases_data")
            .eq("id", packId)
            .single();

        if (fetchError) throw fetchError;
        
        const encoder = new TextEncoder();

        // If already generated in DB, return as a stream complete event
        if (pack.phases_data?.[phaseId]) {
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "complete", data: pack.phases_data[phaseId] })}\n\n`));
                    controller.close();
                }
            });
            return new Response(stream, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                }
            });
        }

        // 2. Generate based on Phase
        let prompt = "";
        let isChatStream = true; // true for markdown (breakdown, distill, predict), false for json stream (retain, test)

        switch (phaseId) {
            case "breakdown":
                prompt = buildBreakdownPrompt(safeContent);
                isChatStream = true;
                break;
            case "distill":
                prompt = buildSummaryPrompt(safeContent, "detailed");
                isChatStream = true;
                break;
            case "retain":
                prompt = buildFlashcardsPrompt(safeContent, 10, "medium");
                isChatStream = false;
                break;
            case "test":
                prompt = buildQuizPrompt(safeContent, 15, "medium");
                isChatStream = false;
                break;
            case "predict":
                prompt = buildRoadmapPrompt(safeContent);
                isChatStream = true;
                break;
            default:
                return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
        }

        let aiStream: ReadableStream;
        try {
            if (isChatStream) {
                aiStream = await hydraChatStream(
                    MASTER_SYSTEM_PROMPT,
                    [{ role: "user", content: prompt }],
                    { feature: "study_pack", timeoutMs: 60_000 }
                );
            } else {
                aiStream = await hydraGenerateStream(prompt, {
                    feature: phaseId === "retain" ? "flashcards" : "quiz",
                    timeoutMs: 60_000,
                });
            }
        } catch (aiError: any) {
            console.error("Pack Phase AI Error:", aiError);
            return NextResponse.json({ error: "The Professor is momentarily busy. Please try again." }, { status: 503 });
        }

        const reader = aiStream.getReader();
        const decoder = new TextDecoder();

        const stream = new ReadableStream({
            async start(controller) {
                startGenerating(userId);
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "generating", message: `Generating ${phaseId} phase...`, wasTruncated })}\n\n`));

                    let fullTextBuffer = "";
                    const accumulatedItems: any[] = [];
                    let lineBuffer = "";

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        if (isChatStream) {
                            const chunk = decoder.decode(value, { stream: true });
                            fullTextBuffer += chunk;
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "chunk", chunk })}\n\n`));
                        } else {
                            // Forward the raw stream chunk to client
                            controller.enqueue(value);

                            const chunkStr = decoder.decode(value, { stream: true });
                            lineBuffer += chunkStr;

                            let lineEndIndex;
                            while ((lineEndIndex = lineBuffer.indexOf('\n')) !== -1) {
                                const line = lineBuffer.slice(0, lineEndIndex).trim();
                                lineBuffer = lineBuffer.slice(lineEndIndex + 1);

                                if (line.startsWith('data: ')) {
                                    try {
                                        const data = JSON.parse(line.slice(6));
                                        if (data.type === 'flashcard' && data.card) {
                                            accumulatedItems.push(data.card);
                                        }
                                        if (data.type === 'question' && data.question) {
                                            accumulatedItems.push(data.question);
                                        }
                                    } catch (e) {}
                                }
                            }
                        }
                    }

                    // 3. Prepare final data structure
                    let finalData: any;
                    if (phaseId === "breakdown") {
                        finalData = { breakdown: fullTextBuffer };
                    } else if (phaseId === "distill") {
                        finalData = { summary: fullTextBuffer };
                    } else if (phaseId === "predict") {
                        finalData = { title: "Study Roadmap", roadmap: fullTextBuffer };
                    } else {
                        finalData = accumulatedItems;
                    }

                    // 4. Save to Supabase
                    const newPhasesData = {
                        ...(pack.phases_data || {}),
                        [phaseId]: finalData
                    };

                    await supabase
                        .from("study_packs")
                        .update({ phases_data: newPhasesData })
                        .eq("id", packId);

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "complete", data: finalData })}\n\n`));
                    controller.close();
                } catch (error: any) {
                    console.error("Pack Phase Stream Error:", error);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "error", error: error.message })}\n\n`));
                    controller.close();
                } finally {
                    finishGenerating();
                }
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        });

    } catch (error: any) {
        console.error("Pack Phase API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
