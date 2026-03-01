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
        const { action } = body;

        // ── Generate Questions ──────────────────────────────────────
        if (action === "generate") {
            const { content, count = 7 } = body;

            if (!content || content.trim().length < 50) {
                return new Response(
                    JSON.stringify({ error: "Content too short (need 50+ characters)" }),
                    { status: 400 }
                );
            }

            const prompt = buildProfessorQuestionsPrompt(
                content.substring(0, 40_000),
                Math.min(Math.max(count, 3), 15)
            );

            const responseText = await hydraGenerateContent(prompt, {
                feature: "quiz",
                jsonMode: true,
                timeoutMs: 45_000,
            });

            const parsed = parseAIJson(responseText) as {
                topic: string;
                questions: Array<{
                    question: string;
                    modelAnswer: string;
                    difficulty: string;
                    keyTerms: string[];
                }>;
            };

            return new Response(JSON.stringify(parsed), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // ── Evaluate Answer ─────────────────────────────────────────
        if (action === "evaluate") {
            const { question, modelAnswer, studentAnswer, keyTerms = [] } = body;

            if (!question || !studentAnswer) {
                return new Response(
                    JSON.stringify({ error: "Missing question or studentAnswer" }),
                    { status: 400 }
                );
            }

            const prompt = buildProfessorEvaluationPrompt(
                question,
                modelAnswer || "",
                studentAnswer,
                keyTerms
            );

            const responseText = await hydraGenerateContent(prompt, {
                feature: "quiz",
                jsonMode: true,
                timeoutMs: 30_000,
                temperature: 0.3,
            });

            const parsed = parseAIJson(responseText) as {
                grade: string;
                score: number;
                feedback: string;
                correction: string;
            };

            return new Response(JSON.stringify(parsed), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // ── Final Report ────────────────────────────────────────────
        if (action === "report") {
            const { topic, results } = body;

            if (!topic || !results || !Array.isArray(results)) {
                return new Response(
                    JSON.stringify({ error: "Missing topic or results" }),
                    { status: 400 }
                );
            }

            const prompt = buildProfessorReportPrompt(topic, results);

            const responseText = await hydraGenerateContent(prompt, {
                feature: "quiz",
                jsonMode: true,
                timeoutMs: 30_000,
                temperature: 0.5,
            });

            const parsed = parseAIJson(responseText) as {
                closingStatement: string;
                reviewTopics: string[];
                performanceLevel: string;
            };

            // Save to database
            try {
                const totalScore = results.reduce((sum: number, r: { score: number }) => sum + r.score, 0);
                await supabase.from("generations").insert({
                    user_id: user.id,
                    type: "professor_exam",
                    title: `Oral Exam: ${topic}`,
                    content: {
                        topic,
                        results,
                        report: parsed,
                        score: totalScore,
                        maxScore: results.length,
                    },
                });
            } catch (dbError) {
                console.error("Failed to save professor exam:", dbError);
            }

            return new Response(JSON.stringify(parsed), {
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(
            JSON.stringify({ error: `Unknown action: ${action}` }),
            { status: 400 }
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
