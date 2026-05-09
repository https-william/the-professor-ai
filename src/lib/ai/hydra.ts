/**
 * Hydra AI System — Multi-provider resilience.
 */

import { callOpenAICompatible, callOpenAICompatibleStream, AI_PROVIDERS } from "./providers";
import { logAIError, logAISuccess } from "@/lib/error-logger";

export const FEATURE_TEMPERATURES: Record<string, number> = {
    flashcards: 0.4,
    quiz:       0.3,
    summary:    0.5,
    mindmap:    0.5,
    chat:       0.7,
    default:    0.6,
};

const CHUNK_THRESHOLD = 32_000;
const CHUNK_SIZE      = 28_000;
const CHUNK_OVERLAP   = 2_000;

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
        model = "llama-3.3-70b-versatile",
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

    // 1. Groq
    if (process.env.GROQ_API_KEY) {
        try {
            const result = await callOpenAICompatible("groq", [
                { role: "system", content: sysPrompt },
                { role: "user",   content: prompt },
            ], { temperature, timeoutMs });
            logAISuccess("groq", feature, Date.now() - startTime);
            return cleanJson(result);
        } catch (error: any) {
            errors.push(`Groq: ${error.message}`);
        }
    }

    // 2. Cerebras
    if (process.env.CEREBRAS_API_KEY) {
        try {
            const result = await callOpenAICompatible("cerebras", [
                { role: "system", content: sysPrompt },
                { role: "user",   content: prompt },
            ], { temperature, timeoutMs });
            logAISuccess("cerebras", feature, Date.now() - startTime);
            return cleanJson(result);
        } catch (error: any) {
            errors.push(`Cerebras: ${error.message}`);
        }
    }

    // 3. OpenRouter (Trinity) - High priority for structured content
    if (process.env.OPENROUTER_API_KEY) {
        try {
            console.log(`Hydra: Trinity [${feature}] ...`);
            const result = await callOpenAICompatible("trinity", [
                { role: "system", content: sysPrompt },
                { role: "user",   content: prompt },
            ], { temperature, timeoutMs });
            logAISuccess("trinity", feature, Date.now() - startTime);
            return cleanJson(result);
        } catch (error: any) {
            errors.push(`Trinity: ${error.message}`);
        }
    }

    // 4. OllamaFree
    if (process.env.OLLAMAFREE_ENABLED === "true") {
        try {
            const result = await callOpenAICompatible("ollamafree", [
                { role: "system", content: sysPrompt },
                { role: "user",   content: prompt },
            ], { temperature, timeoutMs: 20_000 });
            logAISuccess("ollamafree", feature, Date.now() - startTime);
            return cleanJson(result);
        } catch (error: any) {
            errors.push(`OllamaFree: ${error.message}`);
        }
    }


    throw new Error(`All providers failed: ${errors.join(" | ")}`);
}

/**
 * Strips markdown wrappers like ```json ... ``` from AI responses.
 */
function cleanJson(text: string): string {
    if (!text) return text;
    let cleaned = text.trim();
    
    // Remove markdown code fences if present
    if (cleaned.includes("```")) {
        cleaned = cleaned.replace(/```[a-z]*\n?/gi, "");
        cleaned = cleaned.replace(/```/g, "");
    }
    
    // Find the first and last brackets to extract the pure JSON object/array
    const firstBrace = cleaned.indexOf("{");
    const firstBracket = cleaned.indexOf("[");
    const start = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;
    
    const lastBrace = cleaned.lastIndexOf("}");
    const lastBracket = cleaned.lastIndexOf("]");
    const end = (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) ? lastBrace : lastBracket;

    if (start !== -1 && end !== -1 && end > start) {
        return cleaned.substring(start, end + 1);
    }
    
    return cleaned.trim();
}

export async function hydraGenerateWithChunking(
    buildPrompt: (contentChunk: string, i: number, total: number) => string,
    content: string,
    options: HydraOptions = {}
): Promise<string> {
    const chunks = chunkContent(content);
    if (chunks.length === 1) return hydraGenerateContent(buildPrompt(chunks[0], 0, 1), options);
    const results = await Promise.allSettled(chunks.map((c, i) => hydraGenerateContent(buildPrompt(c, i, chunks.length), options)));
    const success = results.find(r => r.status === "fulfilled") as PromiseFulfilledResult<string>;
    if (success) return success.value;
    throw new Error("All chunks failed");
}

export async function hydraGenerateStream(prompt: string, options: HydraOptions = {}): Promise<ReadableStream> {
    const { feature = "default", timeoutMs = 45_000, model = "llama-3.3-70b-versatile", systemPrompt } = options;
    const temperature = options.temperature ?? FEATURE_TEMPERATURES[feature] ?? FEATURE_TEMPERATURES.default;
    const sysPrompt = systemPrompt ?? "You are an expert AI assistant. Output JSON only.";
    
    const tryStream = async (p: any): Promise<Response | null> => {
        try {
            return await callOpenAICompatibleStream(p, [{ role: "system", content: sysPrompt }, { role: "user", content: prompt }], { temperature, timeoutMs });
        } catch { return null; }
    };

    let resp = null;
    if (process.env.GROQ_API_KEY) resp = await tryStream("groq");
    if (!resp && process.env.OPENROUTER_API_KEY) resp = await tryStream("trinity");
    if (!resp) throw new Error("Streaming failed");

    const reader = resp.body!.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    return new ReadableStream({
        async start(controller) {
            let buffer = "";
            let lineBuffer = "";
            const yieldItem = (obj: any) => {
                const type = feature === "flashcards" ? "flashcard" : feature === "quiz" ? "question" : "item";
                const key = feature === "flashcards" ? "card" : feature === "quiz" ? "question" : "data";
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, [key]: obj })}\n\n`));
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                lineBuffer += decoder.decode(value, { stream: true });
                let idx;
                while ((idx = lineBuffer.indexOf('\n')) !== -1) {
                    const line = lineBuffer.slice(0, idx).trim();
                    lineBuffer = lineBuffer.slice(idx + 1);
                    if (line.startsWith("data: ") && line !== "data: [DONE]") {
                        try {
                            const data = JSON.parse(line.slice(6));
                            buffer += data.choices?.[0]?.delta?.content || "";
                            let start = -1, count = 0, str = false, esc = false;
                            for (let i = 0; i < buffer.length; i++) {
                                const c = buffer[i];
                                if (esc) { esc = false; continue; }
                                if (c === '\\') { esc = true; continue; }
                                if (c === '"') { str = !str; continue; }
                                if (!str) {
                                    if (c === '{') { if (count === 0) start = i; count++; }
                                    else if (c === '}') {
                                        count--;
                                        if (count === 0 && start !== -1) {
                                            try { yieldItem(JSON.parse(buffer.substring(start, i + 1))); buffer = buffer.substring(i + 1); start = -1; i = -1; } catch {}
                                        }
                                    }
                                }
                            }
                        } catch {}
                    }
                }
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "complete" })}\n\n`));
            controller.close();
        }
    });
}

export async function hydraChatStream(systemPrompt: string, messages: any[], options: HydraOptions = {}): Promise<ReadableStream> {
    const { feature = "chat", timeoutMs = 45_000, model = "llama-3.3-70b-versatile" } = options;
    const temperature = options.temperature ?? FEATURE_TEMPERATURES[feature] ?? FEATURE_TEMPERATURES.default;

    const tryStream = async (p: any): Promise<Response | null> => {
        try {
            return await callOpenAICompatibleStream(p, [{ role: "system", content: systemPrompt }, ...messages], { temperature, timeoutMs });
        } catch { return null; }
    };

    let resp = null;
    if (!resp && process.env.GROQ_API_KEY) resp = await tryStream("groq");
    if (!resp && process.env.OPENROUTER_API_KEY) resp = await tryStream("trinity");
    if (!resp) throw new Error("Chat sequence failed");

    const isSSE = resp.headers.get("content-type")?.includes("text/event-stream");
    if (!isSSE) return resp.body!;

    const reader = resp.body!.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    return new ReadableStream({
        async start(controller) {
            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                let idx;
                while ((idx = buffer.indexOf('\n')) !== -1) {
                    const line = buffer.slice(0, idx).trim();
                    buffer = buffer.slice(idx + 1);
                    if (line.startsWith("data: ") && line !== "data: [DONE]") {
                        try {
                            const content = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content;
                            if (content) controller.enqueue(encoder.encode(content));
                        } catch {}
                    }
                }
            }
            controller.close();
        }
    });
}
