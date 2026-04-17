import { NextRequest } from "next/server";
import { hydraGenerateContent } from "@/lib/ai/hydra";
import { createClient } from "@/lib/supabase/server";
import {
    buildProfessorQuestionsPrompt,
    buildProfessorEvaluationPrompt,
    buildProfessorReportPrompt,
} from "@/lib/ai/professor-prompt";
import { parseAIJson } from "@/lib/ai/schemas";

/**
 * POST /api/professor
 *
 * Actions:
 *   - "generate"  → Generate oral exam questions from content
 *   - "evaluate"  → Evaluate a single student answer
 *   - "report"    → Generate final exam report
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const body = await req.json();

        // ── Oral Exam logic deprecated as per project overhaul ───────────────────
        return new Response(
            JSON.stringify({ 
                success: false, 
                error: "Oral Exam mode is currently undergoing a scholarly update. Check back soon!" 
            }), 
            { status: 403, headers: { "Content-Type": "application/json" } }
        );
    } catch (error: unknown) {
        console.error("Professor API Error:", error);
        const msg = error instanceof Error ? error.message : "Internal Server Error";
        return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
