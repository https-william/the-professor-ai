import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hydraGenerateContent } from "@/lib/ai/hydra";
import { 
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
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        
        if (pack.phases_data?.[phaseId]) {
            return NextResponse.json({ success: true, data: pack.phases_data[phaseId] });
        }

        // 2. Generate based on Phase
        let prompt = "";
        let jsonMode = true;

        switch (phaseId) {
            case "distill":
                prompt = buildSummaryPrompt(safeContent, "detailed");
                jsonMode = false; // Summary is markdown
                break;
            case "retain":
                prompt = buildFlashcardsPrompt(safeContent, 10, "medium");
                break;
            case "test":
                prompt = buildQuizPrompt(safeContent, 15, "medium");
                break;
            case "predict":
                prompt = buildRoadmapPrompt(safeContent);
                break;
            default:
                return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
        }

        const responseText = await hydraGenerateContent(prompt, {
            feature: "study_pack",
            jsonMode,
            timeoutMs: 60_000,
            systemPrompt: MASTER_SYSTEM_PROMPT,
            temperature: phaseId === "test" ? 0.2 : 0.4
        });

        let phaseData: any = responseText;
        if (jsonMode) {
            try {
                phaseData = JSON.parse(responseText);
            } catch (e) {
                console.error("JSON Parse Error for Phase:", phaseId, responseText);
                return NextResponse.json({ 
                    error: "Generation format error", 
                    details: responseText.substring(0, 100) + "..." 
                }, { status: 500 });
            }
        }

        // 3. Save to Supabase
        const newPhasesData = {
            ...(pack.phases_data || {}),
            [phaseId]: phaseData
        };

        const { error: updateError } = await supabase
            .from("study_packs")
            .update({ phases_data: newPhasesData })
            .eq("id", packId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, data: phaseData });

    } catch (error: any) {
        console.error("Pack Phase API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
