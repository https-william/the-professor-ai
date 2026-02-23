/**
 * schemas.ts — Zod schemas for all AI generation outputs.
 *
 * These schemas validate and auto-repair AI responses before they reach
 * the frontend. Common AI failures (trailing commas, extra markdown,
 * missing fields) are all handled here.
 */

import { z } from "zod";

// ─── Install check: if Zod is not installed, this import will fail at build.
// Run: npm install zod

// ─── Shared helpers ───────────────────────────────────────────────────────────

/**
 * Strip markdown fences and leading/trailing whitespace from an AI response.
 * Handles: ```json\n...\n```, ```\n...\n```, and plain whitespace.
 */
export function stripMarkdown(raw: string): string {
    return raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
}

/**
 * Extract the first valid JSON object from a string that may contain
 * surrounding prose. AI models sometimes output text before or after the JSON.
 */
export function extractJSON(raw: string): string {
    const stripped = stripMarkdown(raw);

    // If it already starts with { or [, return as-is
    if (stripped.startsWith("{") || stripped.startsWith("[")) {
        return stripped;
    }

    // Find first { ... } block
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
        return stripped.slice(start, end + 1);
    }

    throw new Error("No JSON object found in AI response");
}

/**
 * Parse an AI response as JSON with better error messages.
 * Returns the parsed object or throws with the raw text for debugging.
 */
export function parseAIJson(raw: string): unknown {
    const extracted = extractJSON(raw);
    try {
        return JSON.parse(extracted);
    } catch {
        // Last-ditch: try to fix trailing commas (common AI mistake)
        const fixed = extracted
            .replace(/,\s*([}\]])/g, "$1")  // trailing commas before } or ]
            .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');  // unquoted keys
        try {
            return JSON.parse(fixed);
        } catch {
            throw new Error(
                `AI returned invalid JSON. Raw response (first 500 chars): ${raw.substring(0, 500)}`
            );
        }
    }
}

// ─── Flashcard Schema ─────────────────────────────────────────────────────────
export const FlashcardSchema = z.object({
    front: z.string().min(5, "Flashcard front too short"),
    back: z.string().min(5, "Flashcard back too short"),
    topic: z.string().optional().default("General"),
});

export const FlashcardsResponseSchema = z.object({
    title: z.string().min(1).default("Flashcard Set"),
    flashcards: z.array(FlashcardSchema).min(1, "AI returned no flashcards"),
});

export type Flashcard = z.infer<typeof FlashcardSchema>;
export type FlashcardsResponse = z.infer<typeof FlashcardsResponseSchema>;

export function parseFlashcardsResponse(raw: string): FlashcardsResponse {
    const parsed = parseAIJson(raw);
    const result = FlashcardsResponseSchema.safeParse(parsed);

    if (!result.success) {
        console.error("Flashcard schema validation failed:", result.error.flatten());
        // Try to recover: if the AI returned a plain array
        if (Array.isArray(parsed)) {
            return FlashcardsResponseSchema.parse({
                title: "Flashcard Set",
                flashcards: parsed,
            });
        }
        throw new Error(`Flashcard generation produced an unexpected format. ${result.error.issues[0]?.message}`);
    }
    return result.data;
}

// ─── Quiz Schema ──────────────────────────────────────────────────────────────
export const QuizQuestionSchema = z.object({
    question: z.string().min(10, "Question too short"),
    options: z.array(z.string()).length(4, "Must have exactly 4 options"),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string().min(10, "Explanation too short"),
    topic: z.string().optional().default("General"),
});

export const QuizResponseSchema = z.object({
    title: z.string().min(1).default("Quiz"),
    questions: z.array(QuizQuestionSchema).min(1, "AI returned no questions"),
});

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type QuizResponse = z.infer<typeof QuizResponseSchema>;

export function parseQuizResponse(raw: string): QuizResponse {
    const parsed = parseAIJson(raw);
    const result = QuizResponseSchema.safeParse(parsed);

    if (!result.success) {
        console.error("Quiz schema validation failed:", result.error.flatten());
        throw new Error(`Quiz generation produced an unexpected format. ${result.error.issues[0]?.message}`);
    }
    return result.data;
}

// ─── Podcast Schema ───────────────────────────────────────────────────────────
export const PodcastSegmentSchema = z.object({
    speaker: z.string().min(1),
    text: z.string().min(10, "Podcast line too short"),
});

export const PodcastResponseSchema = z.object({
    title: z.string().min(1).default("Study Cast"),
    summary: z.string().optional().default(""),
    script: z.array(PodcastSegmentSchema).min(4, "Podcast too short — need at least 4 lines"),
    keyTakeaway: z.string().optional().default(""),
});

export type PodcastSegment = z.infer<typeof PodcastSegmentSchema>;
export type PodcastResponse = z.infer<typeof PodcastResponseSchema>;

export function parsePodcastResponse(raw: string): PodcastResponse {
    const parsed = parseAIJson(raw);

    // Handle the old format where data was nested under "podcast.script"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalized: any =
        typeof parsed === "object" && parsed !== null && "podcast" in parsed
            ? (parsed as Record<string, unknown>).podcast
            : parsed;

    // Also handle top-level script vs segments
    if (normalized && !normalized.script && normalized.segments) {
        normalized.script = normalized.segments;
    }

    const result = PodcastResponseSchema.safeParse(normalized);
    if (!result.success) {
        console.error("Podcast schema validation failed:", result.error.flatten());
        throw new Error(`Podcast generation produced an unexpected format. ${result.error.issues[0]?.message}`);
    }
    return result.data;
}

// ─── Mind Map Schema ──────────────────────────────────────────────────────────
export const MindMapLeafSchema = z.object({
    label: z.string().min(1),
});

export const MindMapBranchSchema = z.object({
    label: z.string().min(1),
    color: z.string().optional().default("#F59E0B"),
    children: z.array(MindMapLeafSchema).min(1),
});

export const MindMapResponseSchema = z.object({
    topic: z.string().min(1).default("Topic"),
    branches: z.array(MindMapBranchSchema).min(2, "Mind map needs at least 2 branches"),
});

export type MindMapResponse = z.infer<typeof MindMapResponseSchema>;

export function parseMindMapResponse(raw: string): MindMapResponse {
    const parsed = parseAIJson(raw);
    const result = MindMapResponseSchema.safeParse(parsed);

    if (!result.success) {
        console.error("MindMap schema validation failed:", result.error.flatten());
        throw new Error(`Mind map generation produced an unexpected format. ${result.error.issues[0]?.message}`);
    }
    return result.data;
}

// ─── Summary (markdown, no JSON schema) ──────────────────────────────────────
export function parseSummaryResponse(raw: string): string {
    // Summaries are plain markdown — just clean up any accidental JSON fences
    return raw
        .replace(/^```(?:markdown|md)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
}
