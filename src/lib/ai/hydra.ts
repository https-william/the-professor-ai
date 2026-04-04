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
import { callOpenAICompatible, callOpenAICompatibleStream, AI_PROVIDERS } from "./providers";
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

    // ── PROVIDER 1: Groq (FREE, fast, reliable) ──────────────────────────────
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

    // ── PROVIDER 2: OllamaFreeAPI (FREE distributed) ─────────────────────────
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

    // ── PROVIDER 3: Gemini (round-robin keys, may 429) ───────────────────────
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

    // ── PROVIDER 4: GPT4Free (local, may not be running) ─────────────────────
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

    // ── PROVIDER 5: Kimi (NVIDIA, often times out) ───────────────────────────
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

    // ── PROVIDER 6: Trinity / OpenRouter (key may be expired) ────────────────
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

// ─── Stream generator (Server-Sent Events) ────────────────────────────────────

/**
 * Streams parsed JSON objects (Flashcards, Quizzes) as Server-Sent Events.
 * It reads standard text streams from OpenAI-compatible endpoints and uses
 * a bracket-counting parser to yield fully formed objects as soon as they are complete.
 */
export async function hydraGenerateStream(
    prompt: string,
    options: HydraOptions = {}
): Promise<ReadableStream> {
    const {
        feature = "default",
        timeoutMs = 45_000,
        model = "gemini-2.0-flash",
        systemPrompt,
    } = options;

    const temperature = options.temperature
        ?? FEATURE_TEMPERATURES[feature]
        ?? FEATURE_TEMPERATURES.default;

    // Force the LLM to output a JSON array of objects.
    const sysPrompt = systemPrompt ?? 
            "You are an expert AI assistant. Output your response as a JSON array ONLY. Do not use markdown blocks. Ensure the response starts with [ and ends with ].";

    const errors: string[] = [];
    const startTime = Date.now();

    // Helper to attempt streaming from a provider
    const tryStreamProvider = async (provider: 'g4f' | 'ollamafree' | 'moonshot' | 'trinity' | 'gemini' | 'groq' | 'cerebras'): Promise<Response | null> => {
       try {
           console.log(`Hydra Stream: ${provider} [${feature}, t=${temperature}] ...`);
           
           if (provider === 'gemini') {
               const geminiKeys = getGeminiKeys();
               if (geminiKeys.length === 0) throw new Error("No Gemini keys");
               
               // Try the current key
               const apiKey = geminiKeys[currentGeminiKeyIndex % geminiKeys.length];
               const genAI = new GoogleGenerativeAI(apiKey);
               const geminiModel = genAI.getGenerativeModel({ 
                   model, 
                   generationConfig: { temperature } 
               });
               
               const aiResult = await geminiModel.generateContentStream([sysPrompt, prompt]);
               logAISuccess("gemini", feature + "_stream", Date.now() - startTime);
               currentGeminiKeyIndex = (currentGeminiKeyIndex + 1) % geminiKeys.length;
               
               const encoder = new TextEncoder();
               const stream = new ReadableStream({
                   async start(controller) {
                       try {
                           for await (const chunk of aiResult.stream) {
                               const text = chunk.text();
                               if (text) {
                                  controller.enqueue(encoder.encode(`data: {"choices":[{"delta":{"content": ${JSON.stringify(text)}}}]}\n\n`));
                               }
                           }
                           controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                           controller.close();
                       } catch (e) {
                           controller.error(e);
                       }
                   }
               });
               return new Response(stream);
           }
           
           // Standard OpenAI Compatible Flow
           const res = await callOpenAICompatibleStream(provider, [
                { role: "system", content: sysPrompt },
                { role: "user",   content: prompt },
           ], { temperature, timeoutMs });
           logAISuccess(provider, feature + "_stream", Date.now() - startTime);
           return res;
       } catch (err) {
           const msg = err instanceof Error ? err.message : String(err);
           console.warn(`Hydra Stream: ${provider} failed: ${msg.substring(0, 120)}`);
           logAIError(provider, feature + "_stream", msg, Date.now() - startTime);
           errors.push(`${provider}: ${msg}`);
           return null;
       }
    };

    let response: Response | null = null;

    // Priority: Working free providers first, dead/flaky ones last
    if (process.env.GROQ_API_KEY) response = await tryStreamProvider("groq");
    if (!response && process.env.OLLAMAFREE_ENABLED === "true") response = await tryStreamProvider("ollamafree");
    if (!response) response = await tryStreamProvider("gemini");
    if (!response && process.env.G4F_ENABLED === "true") response = await tryStreamProvider("g4f");
    if (!response && process.env.NVIDIA_API_KEY) response = await tryStreamProvider("moonshot");
    if (!response && process.env.OPENROUTER_API_KEY) response = await tryStreamProvider("trinity");

    if (!response) {
        throw new Error(`All providers failed streaming. Errors: ${errors.join(" | ")}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body to stream");

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    return new ReadableStream({
        async start(controller) {
            try {
                let buffer = "";
                
                // Helper to yield a fully-formed chunk
                const yieldItem = (obj: any) => {
                    if (feature === "flashcards") {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "flashcard", card: obj })}\n\n`));
                    } else if (feature === "quiz") {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "question", question: obj })}\n\n`));
                    } else {
                        // Fallback
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "item", data: obj })}\n\n`));
                    }
                };

                // lineBuffer prevents parsing incomplete lines when network chunks are fragmented
                let lineBuffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    lineBuffer += decoder.decode(value, { stream: true });
                    
                    let lineEndIndex;
                    while ((lineEndIndex = lineBuffer.indexOf('\n')) !== -1) {
                        const line = lineBuffer.slice(0, lineEndIndex).trim();
                        lineBuffer = lineBuffer.slice(lineEndIndex + 1);

                        if (line.startsWith("data: ") && line !== "data: [DONE]") {
                            try {
                                const data = JSON.parse(line.slice(6));
                                const content = data.choices?.[0]?.delta?.content || "";
                                buffer += content;
                                
                                // Incremental Bracket Parser
                                let startIdx = -1;
                                let braceCount = 0;
                                let inString = false;
                                let escape = false;

                                for (let i = 0; i < buffer.length; i++) {
                                    const char = buffer[i];
                                    if (escape) { escape = false; continue; }
                                    if (char === '\\') { escape = true; continue; }
                                    if (char === '"') { inString = !inString; continue; }
                                    if (!inString) {
                                        if (char === '{') {
                                            if (braceCount === 0) startIdx = i;
                                            braceCount++;
                                        } else if (char === '}') {
                                            braceCount--;
                                            if (braceCount === 0 && startIdx !== -1) {
                                                const objStr = buffer.substring(startIdx, i + 1);
                                                try {
                                                    const parsedObj = JSON.parse(objStr);
                                                    yieldItem(parsedObj);
                                                    // Consume the buffer up to this point
                                                    buffer = buffer.substring(i + 1);
                                                    startIdx = -1;
                                                    i = -1; // reset loop since buffer changed
                                                } catch (e) {
                                                    // Not valid yet (e.g. unescaped quotes inside?), keep looking
                                                }
                                            }
                                        }
                                    }
                                }
                            } catch (e) {
                                // Ignore partial line parse errors
                            }
                        }
                    }
                }
                
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "complete" })}\n\n`));
                controller.close();
            } catch (err) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "error", message: (err as Error).message })}\n\n`));
                controller.close();
            }
        }
    });
}

/**
 * Streams raw conversational text (Chat Mode) falling back across Providers.
 * Pipes OpenAI standard SSE streams (Groq, OpenRouter, etc) directly into a raw UTF-8 string buffer for the client.
 */
export async function hydraChatStream(
    systemPrompt: string,
    messages: { role: string; content: string }[],
    options: HydraOptions = {}
): Promise<ReadableStream> {
    const {
        feature = "chat",
        timeoutMs = 45_000,
        model = "gemini-2.5-flash",
    } = options;

    const temperature = options.temperature
        ?? FEATURE_TEMPERATURES[feature]
        ?? FEATURE_TEMPERATURES.default;

    const errors: string[] = [];
    const startTime = Date.now();

    const tryStreamProvider = async (provider: 'g4f' | 'ollamafree' | 'moonshot' | 'trinity' | 'gemini' | 'groq' | 'cerebras'): Promise<Response | null> => {
       try {
           console.log(`Hydra Chat Stream: ${provider} [t=${temperature}] ...`);
           
           if (provider === 'gemini') {
               const geminiKeys = getGeminiKeys();
               if (geminiKeys.length === 0) throw new Error("No Gemini keys");
               
               const apiKey = geminiKeys[currentGeminiKeyIndex % geminiKeys.length];
               const genAI = new GoogleGenerativeAI(apiKey);
               const geminiModel = genAI.getGenerativeModel({ model, generationConfig: { temperature } });
               
               const historyForGemini = messages.map(m => ({ 
                   role: m.role === 'assistant' ? 'model' : 'user', 
                   parts: [{ text: m.content }] 
               }));

               const aiResult = await geminiModel.generateContentStream({
                   contents: [{ role: 'user', parts: [{ text: systemPrompt }] }, ...historyForGemini]
               });
               
               currentGeminiKeyIndex = (currentGeminiKeyIndex + 1) % geminiKeys.length;
               
               const encoder = new TextEncoder();
               const stream = new ReadableStream({
                   async start(controller) {
                       try {
                           for await (const chunk of aiResult.stream) {
                               const text = chunk.text();
                               if (text) controller.enqueue(encoder.encode(text)); // Raw Stream
                           }
                           controller.close();
                       } catch (e) {
                           controller.error(e);
                       }
                   }
               });
               return new Response(stream);
           }
           
           const res = await callOpenAICompatibleStream(provider, [
                { role: "system", content: systemPrompt },
                ...messages
           ], { temperature, timeoutMs });
           
           logAISuccess(provider, feature, Date.now() - startTime);
           return res;
       } catch (err) {
           const msg = err instanceof Error ? err.message : String(err);
           console.warn(`Hydra Chat: ${provider} failed: ${msg.substring(0, 120)}`);
           errors.push(`${provider}: ${msg}`);
           return null;
       }
    };

    let response: Response | null = null;

    // Rotation Priority Strategy (Chat) -> Groq (Blazing Fast) -> Trinity (OpenRouter) -> Ollama -> Gemini -> G4F
    if (process.env.GROQ_API_KEY) response = await tryStreamProvider("groq");
    if (!response && process.env.OPENROUTER_API_KEY) response = await tryStreamProvider("trinity");
    if (!response && process.env.OLLAMAFREE_ENABLED === "true") response = await tryStreamProvider("ollamafree");
    if (!response) response = await tryStreamProvider("gemini");
    if (!response && process.env.G4F_ENABLED === "true") response = await tryStreamProvider("g4f");

    if (!response) {
        throw new Error(`All providers failed chat stream. Errors: ${errors.join(" | ")}`);
    }

    // If Gemini served it, we already formatted it natively in tryStreamProvider.
    // If OpenAI/Groq served it, we must strip the SSE wrapper 'data: {}' and emit raw UTF8 so the frontend doesn't break.
    const isSSE = response.headers.get("content-type")?.includes("text/event-stream");
    
    if (!isSSE) {
        return response.body as ReadableStream; // Gemini returns native
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body to stream");

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    return new ReadableStream({
        async start(controller) {
            try {
                let buffer = "";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    buffer += decoder.decode(value, { stream: true });
                    let lineEndIndex;
                    while ((lineEndIndex = buffer.indexOf('\n')) !== -1) {
                        const line = buffer.slice(0, lineEndIndex).trim();
                        buffer = buffer.slice(lineEndIndex + 1);

                        if (line.startsWith("data: ") && line !== "data: [DONE]") {
                            try {
                                const data = JSON.parse(line.slice(6));
                                const contentChunk = data.choices?.[0]?.delta?.content || "";
                                if (contentChunk) {
                                    controller.enqueue(encoder.encode(contentChunk));
                                }
                            } catch (e) {
                                // Ignore partial blocks
                            }
                        }
                    }
                }
                // Flush remaining
                if (buffer.trim().startsWith("data: ") && buffer.trim() !== "data: [DONE]") {
                     try {
                          const data = JSON.parse(buffer.trim().slice(6));
                          const contentChunk = data.choices?.[0]?.delta?.content || "";
                          if (contentChunk) controller.enqueue(encoder.encode(contentChunk));
                     } catch(e) {}
                }
                controller.close();
            } catch (err) {
                controller.error(err);
            }
        }
    });
}
