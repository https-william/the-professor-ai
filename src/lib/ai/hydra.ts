/**
 * Hydra AI System — Multi-provider resilience.
 *
 * Provider priority:
 *   1. GPT4Free (g4f)           — Primary, free multi-provider
 *   2. OllamaFreeAPI            — Secondary, free open-source models
 *   3. Kimi 2.5 (NVIDIA)        — Backup fast provider
 *   4. Trinity Large (OpenRouter) — Next backup
 *   5. Gemini Flash              — Reliable fallback
 *   6. Groq                      — Last resort
 *
 * Features:
 *   - Per-feature temperature support
 *   - Feature-specific system prompts
 *   - Input chunking for documents > CHUNK_THRESHOLD chars
 *   - Full error logging
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { callOpenAICompatible, AI_PROVIDERS } from "./providers";
import { logAIError, logAISuccess } from "@/lib/error-logger";

// ─── Per-feature temperatures ──────────────────────────────────────────────────
export const FEATURE_TEMPERATURES: Record<string, number> = {
    flashcards: 0.4,  // Factual precision — low creativity
    quiz:       0.3,  // Maximum accuracy — lowest temperature
    summary:    0.5,  // Balanced — some reorganization is fine
    mindmap:    0.5,  // Structured but room for insight
    chat:       0.7,  // Conversational
    default:    0.6,
};

// ─── Input chunking (for large documents) ─────────────────────────────────────
const CHUNK_THRESHOLD = 32_000; // ~24k tokens — safe limit for most providers
const CHUNK_SIZE      = 28_000; // chars per chunk
const CHUNK_OVERLAP   = 2_000;  // overlap to maintain context

function chunkContent(content: string): string[] {
    if (content.length <= CHUNK_THRESHOLD) return [content];
    const chunks: string[] = [];
    let start = 0;
    while (start < content.length) {
        chunks.push(content.slice(start, start + CHUNK_SIZE));
        start += CHUNK_SIZE - CHUNK_OVERLAP;
    }
    return chunks;
}

// ─── Gemini key rotation ───────────────────────────────────────────────────────
function getGeminiKeys(): string[] {
    const keys: string[] = [];
    const multiKeys = process.env.GEMINI_API_KEYS;
    if (multiKeys) {
        keys.push(...multiKeys.split(",").map(k => k.trim()).filter(Boolean));
    }
    if (keys.length === 0 && process.env.GEMINI_API_KEY) {
        keys.push(process.env.GEMINI_API_KEY);
    }
    return keys;
}

let currentGeminiKeyIndex = 0;

// ─── Main generator ───────────────────────────────────────────────────────────
export interface HydraOptions {
    feature?: string;
    temperature?: number;
    jsonMode?: boolean;
    timeoutMs?: number;
    model?: string;
    systemPrompt?: string;
}

export async function hydraGenerateContent(
    prompt: string,
    options: HydraOptions = {}
): Promise<string> {
    const {
        feature = "default",
        jsonMode = false,
        timeoutMs = 30_000,
        model = "gemini-2.0-flash",
        systemPrompt,
    } = options;

    const temperature = options.temperature
        ?? FEATURE_TEMPERATURES[feature]
        ?? FEATURE_TEMPERATURES.default;

    const sysPrompt = systemPrompt ?? (
        jsonMode
            ? "You are an expert AI assistant. Output valid JSON only. No markdown, no prose, no commentary."
            : "You are The Professor — a senior academic mentor. Be precise, insightful, and clear."
    );

    const errors: string[] = [];
    const startTime = Date.now();

    // ── PROVIDER 1: GPT4Free ─────────────────────────────────────────────────
    // g4f runs locally or on EC2 — no API key needed
    if (process.env.G4F_ENABLED === "true") {
        try {
            const g4fModel = AI_PROVIDERS.g4f.model;
            console.log(`Hydra: g4f [${g4fModel}] [${feature}, t=${temperature}] ...`);
            const result = await callOpenAICompatible("g4f", [
                { role: "system", content: sysPrompt },
                { role: "user",   content: prompt },
            ], { temperature, timeoutMs: Math.min(timeoutMs, 20_000) });
            
            if (!result || result.trim().length === 0) {
                throw new Error("g4f returned empty response");
            }
            
            logAISuccess("g4f", feature, Date.now() - startTime);
            return result;
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.warn(`Hydra: g4f failed: ${msg.substring(0, 120)}`);
            logAIError("g4f", feature, msg, Date.now() - startTime);
            errors.push(`g4f: ${msg}`);
        }
    }

    // ── PROVIDER 2: OllamaFreeAPI ───────────────────────────────────────────
    if (process.env.OLLAMAFREE_ENABLED === "true") {
        try {
            const ollamaModel = AI_PROVIDERS.ollamafree.model;
            console.log(`Hydra: ollamafree [${ollamaModel}] [${feature}, t=${temperature}] ...`);
            const result = await callOpenAICompatible("ollamafree", [
                { role: "system", content: sysPrompt },
                { role: "user",   content: prompt },
            ], { temperature, timeoutMs: Math.min(timeoutMs, 20_000) });
            
            if (!result || result.trim().length === 0) {
                throw new Error("ollamafree returned empty response");
            }
            
            logAISuccess("ollamafree", feature, Date.now() - startTime);
            return result;
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.warn(`Hydra: ollamafree failed: ${msg.substring(0, 120)}`);
            logAIError("ollamafree", feature, msg, Date.now() - startTime);
            errors.push(`ollamafree: ${msg}`);
        }
    }

    // ── PROVIDER 3: Kimi 2.5 (NVIDIA NIM) ───────────────────────────────────
    if (process.env.NVIDIA_API_KEY) {
        try {
            console.log(`Hydra: Kimi [${feature}, t=${temperature}] ...`);
            const result = await callOpenAICompatible("moonshot", [
                { role: "system", content: sysPrompt },
                { role: "user",   content: prompt },
            ], { temperature, timeoutMs });
            logAISuccess("kimi", feature, Date.now() - startTime);
            return result;
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.warn(`Hydra: Kimi failed: ${msg.substring(0, 80)}`);
            logAIError("kimi", feature, msg, Date.now() - startTime);
            errors.push(`Kimi: ${msg}`);
        }
    }

    // ── PROVIDER 3: Trinity Large (OpenRouter) ───────────────────────────────
    if (process.env.OPENROUTER_API_KEY) {
        try {
            console.log(`Hydra: Trinity [${feature}, t=${temperature}] ...`);
            const result = await callOpenAICompatible("trinity", [
                { role: "system", content: sysPrompt },
                { role: "user",   content: prompt },
            ], { temperature, timeoutMs });
            logAISuccess("trinity", feature, Date.now() - startTime);
            return result;
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.warn(`Hydra: Trinity failed: ${msg.substring(0, 80)}`);
            logAIError("trinity", feature, msg, Date.now() - startTime);
            errors.push(`Trinity: ${msg}`);
        }
    }

    // ── PROVIDER 4: Gemini (round-robin keys) ────────────────────────────────
    const geminiKeys = getGeminiKeys();
    const attempts = Math.min(geminiKeys.length, 2);

    for (let i = 0; i < attempts; i++) {
        const keyIdx = (currentGeminiKeyIndex + i) % geminiKeys.length;
        const apiKey = geminiKeys[keyIdx];

        try {
            console.log(`Hydra: Gemini key ${keyIdx + 1} [${feature}, t=${temperature}] ...`);
            const genAI = new GoogleGenerativeAI(apiKey);

            const modelConfig = jsonMode
                ? { model, generationConfig: { responseMimeType: "application/json" as const, temperature } }
                : { model, generationConfig: { temperature } };

            const geminiModel = genAI.getGenerativeModel(modelConfig);
            const result = await geminiModel.generateContent([sysPrompt, prompt]);
            currentGeminiKeyIndex = keyIdx;
            logAISuccess("gemini", feature, Date.now() - startTime);
            return result.response.text();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.warn(`Hydra: Gemini ${keyIdx + 1} failed: ${msg.substring(0, 80)}`);
            logAIError(`gemini-${keyIdx + 1}`, feature, msg, Date.now() - startTime);
            errors.push(`Gemini(${keyIdx}): ${msg}`);
        }
    }

    // ── PROVIDER 5: Groq (last resort) ───────────────────────────────────────
    if (process.env.GROQ_API_KEY) {
        try {
            console.log(`Hydra: Groq [${feature}, t=${temperature}] ...`);
            const result = await callOpenAICompatible("groq", [
                { role: "system", content: sysPrompt },
                { role: "user",   content: prompt },
            ], { temperature, timeoutMs });
            logAISuccess("groq", feature, Date.now() - startTime);
            return result;
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.warn(`Hydra: Groq failed: ${msg.substring(0, 80)}`);
            logAIError("groq", feature, msg, Date.now() - startTime);
            errors.push(`Groq: ${msg}`);
        }
    }

    throw new Error(
        `All AI providers failed for ${feature}. Errors: ${errors.join(" | ")}`
    );
}

/**
 * Generate content over a large document by chunking it.
 */
export async function hydraGenerateWithChunking(
    buildPrompt: (contentChunk: string, chunkIndex: number, totalChunks: number) => string,
    content: string,
    options: HydraOptions = {}
): Promise<string> {
    const chunks = chunkContent(content);

    if (chunks.length === 1) {
        return hydraGenerateContent(buildPrompt(chunks[0], 0, 1), options);
    }

    console.log(`Hydra: Chunking ${chunks.length} chunks for ${options.feature ?? "default"}`);

    const results = await Promise.allSettled(
        chunks.map((chunk, i) =>
            hydraGenerateContent(buildPrompt(chunk, i, chunks.length), options)
        )
    );

    const successful = results.find(r => r.status === "fulfilled");
    if (successful && successful.status === "fulfilled") {
        return successful.value;
    }

    throw new Error("All chunks failed during generation");
}
