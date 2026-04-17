/**
 * Hydra AI System — Multi-provider resilience.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
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

    // 5. Gemini
    const geminiKeys = getGeminiKeys();
    for (let i = 0; i < Math.min(geminiKeys.length, 2); i++) {
        const keyIdx = (currentGeminiKeyIndex + i) % geminiKeys.length;
        try {
            const genAI = new GoogleGenerativeAI(geminiKeys[keyIdx]);
            const config = jsonMode ? { model, generationConfig: { responseMimeType: "application/json" as const, temperature } } : { model, generationConfig: { temperature } };
            const m = genAI.getGenerativeModel(config);
            const res = await m.generateContent([sysPrompt, prompt]);
            currentGeminiKeyIndex = keyIdx;
            logAISuccess("gemini", feature, Date.now() - startTime);
            return cleanJson(res.response.text());
        } catch (error: any) {
            errors.push(`Gemini: ${error.message}`);
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
    if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```[a-z]*\n/i, "");
        cleaned = cleaned.replace(/\n```$/m, "");
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
    const { feature = "default", timeoutMs = 45_000, model = "gemini-2.0-flash", systemPrompt } = options;
    const temperature = options.temperature ?? FEATURE_TEMPERATURES[feature] ?? FEATURE_TEMPERATURES.default;
    const sysPrompt = systemPrompt ?? "You are an expert AI assistant. Output JSON only.";
    
    const tryStream = async (p: any): Promise<Response | null> => {
        try {
            if (p === 'gemini') {
                const keys = getGeminiKeys();
                const genAI = new GoogleGenerativeAI(keys[currentGeminiKeyIndex % keys.length]);
                const m = genAI.getGenerativeModel({ model, generationConfig: { temperature } });
                const res = await m.generateContentStream([sysPrompt, prompt]);
                const encoder = new TextEncoder();
                return new Response(new ReadableStream({
                    async start(c) {
                        for await (const chunk of res.stream) c.enqueue(encoder.encode(`data: {"choices":[{"delta":{"content": ${JSON.stringify(chunk.text())}}}]}\n\n`));
                        c.enqueue(encoder.encode("data: [DONE]\n\n"));
                        c.close();
                    }
                }));
            }
            return await callOpenAICompatibleStream(p, [{ role: "system", content: sysPrompt }, { role: "user", content: prompt }], { temperature, timeoutMs });
        } catch { return null; }
    };

    let resp = null;
    if (process.env.GROQ_API_KEY) resp = await tryStream("groq");
    if (!resp) resp = await tryStream("gemini");
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
    const { feature = "chat", timeoutMs = 45_000, model = "gemini-2.0-flash" } = options;
    const temperature = options.temperature ?? FEATURE_TEMPERATURES[feature] ?? FEATURE_TEMPERATURES.default;

    const tryStream = async (p: any): Promise<Response | null> => {
        try {
            if (p === 'gemini') {
                const keys = getGeminiKeys();
                const genAI = new GoogleGenerativeAI(keys[currentGeminiKeyIndex % keys.length]);
                const m = genAI.getGenerativeModel({ model, generationConfig: { temperature } });
                const history = messages.map(msg => ({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] }));
                const res = await m.generateContentStream({ contents: [{ role: 'user', parts: [{ text: systemPrompt }] }, ...history] });
                const encoder = new TextEncoder();
                return new Response(new ReadableStream({
                    async start(c) {
                        for await (const chunk of res.stream) { const t = chunk.text(); if (t) c.enqueue(encoder.encode(t)); }
                        c.close();
                    }
                }));
            }
            return await callOpenAICompatibleStream(p, [{ role: "system", content: systemPrompt }, ...messages], { temperature, timeoutMs });
        } catch { return null; }
    };

    let resp = null;
    if (process.env.GROQ_API_KEY) resp = await tryStream("groq");
    if (!resp && process.env.OPENROUTER_API_KEY) resp = await tryStream("trinity");
    if (!resp) resp = await tryStream("gemini");
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
