/**
 * Hydra AI System - Multi-provider resilience with streaming support
 * 
 * Priority:
 * 1. Kimi 2.5 (Instant) - Primary
 * 2. Trinity Large - Parallel backup
 * 3. Gemini Flash - Fallback
 * 4. Groq - Last resort
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { callOpenAICompatible } from "./providers";

function getGeminiKeys(): string[] {
    const keys: string[] = [];
    const multiKeys = process.env.GEMINI_API_KEYS;
    if (multiKeys) {
        keys.push(...multiKeys.split(',').map(k => k.trim()).filter(Boolean));
    }
    if (keys.length === 0 && process.env.GEMINI_API_KEY) {
        keys.push(process.env.GEMINI_API_KEY);
    }
    return keys;
}

let currentKeyIndex = 0;

export async function hydraGenerateContent(
    prompt: string,
    options: {
        model?: string;
        jsonMode?: boolean;
        timeoutMs?: number;
    } = {}
): Promise<string> {
    const { 
        model = "gemini-2.0-flash", 
        jsonMode = false,
        timeoutMs = 20000
    } = options;
    
    const errors: string[] = [];
    const systemPrompt = jsonMode 
        ? "You are a helpful assistant. Output valid JSON only, no markdown."
        : "You are The Professor, an expert educator.";
    
    // -------------------------------------------
    // PHASE 1: NVIDIA NIM (Kimi 2.5 Instant)
    // -------------------------------------------
    if (process.env.NVIDIA_API_KEY) {
        try {
            console.log("Hydra: Kimi 2.5 (Instant)...");
            return await callOpenAICompatible('moonshot', [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ], { timeoutMs });
        } catch (error: any) {
            console.warn(`Hydra: Kimi failed: ${error?.message?.substring(0, 50)}`);
            errors.push(`Kimi: ${error?.message}`);
        }
    }

    // -------------------------------------------
    // PHASE 2: Trinity Large (OpenRouter)
    // -------------------------------------------
    if (process.env.OPENROUTER_API_KEY) {
        try {
            console.log("Hydra: Trinity Large...");
            return await callOpenAICompatible('trinity', [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ], { timeoutMs });
        } catch (error: any) {
            console.warn(`Hydra: Trinity failed: ${error?.message?.substring(0, 50)}`);
            errors.push(`Trinity: ${error?.message}`);
        }
    }

    // -------------------------------------------
    // PHASE 3: Gemini (Round Robin)
    // -------------------------------------------
    const geminiKeys = getGeminiKeys();
    const geminiAttempts = Math.min(geminiKeys.length, 2);
    
    for (let i = 0; i < geminiAttempts; i++) {
        const keyIndex = (currentKeyIndex + i) % geminiKeys.length;
        const apiKey = geminiKeys[keyIndex];
        
        try {
            console.log(`Hydra: Gemini Key ${keyIndex + 1}...`);
            const genAI = new GoogleGenerativeAI(apiKey);
            const modelConfig = jsonMode 
                ? { model, generationConfig: { responseMimeType: "application/json" } }
                : { model };
            
            const geminiModel = genAI.getGenerativeModel(modelConfig);
            const result = await geminiModel.generateContent(prompt);
            currentKeyIndex = keyIndex;
            return result.response.text();
        } catch (error: any) {
            console.warn(`Hydra: Gemini ${keyIndex + 1} failed: ${error?.message?.substring(0, 50)}`);
            errors.push(`Gemini(${keyIndex}): ${error?.message}`);
        }
    }

    // -------------------------------------------
    // PHASE 4: Groq (Last Resort)
    // -------------------------------------------
    if (process.env.GROQ_API_KEY) {
        try {
            console.log("Hydra: Groq (Last Resort)...");
            return await callOpenAICompatible('groq', [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ], { timeoutMs });
        } catch (error: any) {
            console.warn(`Hydra: Groq failed: ${error?.message?.substring(0, 50)}`);
            errors.push(`Groq: ${error?.message}`);
        }
    }

    throw new Error(`All providers failed: ${errors.join(' | ')}`);
}
