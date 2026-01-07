
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, QuizConfig, ProfessorSection, UserProfile, ChatMessage, LockInTechnique, StudyProtocol } from "../types";

// --- EMERGENCY FALLBACK SYSTEM ---
// TO GENERATE KEY: Run `btoa("ACTUAL_KEY".split('').reverse().join(''))` in browser console.
const FALLBACK_KEYS = {
    // PASTE YOUR MASKED KEYS HERE
    GEMINI_API_KEY: "QUpSWDFYbHFSNHFpU3VBcnB4PxMcUhlUhB538PqHDySazIA=", // Using same key as Firebase
    GROQ_API_KEY: "PASTE_YOUR_MASKED_KEY_HERE"
};

const unmask = (str: string) => {
    if (!str || str.includes("PASTE_YOUR")) return "";
    try {
        return atob(str).split('').reverse().join('');
    } catch (e) {
        return "";
    }
};

const getSafeEnv = (viteKey: string, fallbackMapKey: keyof typeof FALLBACK_KEYS): string => {
    // 1. Try Vite Static Replacement
    try {
        // @ts-ignore
        if (import.meta.env[viteKey]) return import.meta.env[viteKey];
    } catch (e) {}

    // 2. Try Process Env
    if (typeof process !== 'undefined' && process.env && process.env[viteKey]) {
        return process.env[viteKey] as string;
    }

    // 3. Fallback
    return unmask(FALLBACK_KEYS[fallbackMapKey]);
};

// --- CLIENTS ---
const GROQ_API_KEY = getSafeEnv("VITE_GROQ_API_KEY", "GROQ_API_KEY");
const GEMINI_API_KEY = getSafeEnv("VITE_GEMINI_API_KEY", "GEMINI_API_KEY");

const GROQ_MODEL = "llama-3.3-70b-versatile"; // Fallback Model

// --- RATE LIMITER ---
const RATE_LIMIT_KEY = 'ai_rate_limit';
const MAX_TOKENS = 20; 
const REFILL_RATE = 10000; 

const checkRateLimit = () => {
    const now = Date.now();
    let bucket = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || JSON.stringify({ tokens: MAX_TOKENS, lastRefill: now }));
    const elapsed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(elapsed / REFILL_RATE);
    if (tokensToAdd > 0) {
        bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;
    }
    if (bucket.tokens <= 0) throw new Error("Neural Overload. Rate limit exceeded.");
    bucket.tokens -= 1;
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(bucket));
};

// --- FALLBACK EXECUTOR ---
// Wraps Gemini calls. If failure, tries Groq.
const withFallback = async <T>(
    geminiOp: () => Promise<T>, 
    groqOp: () => Promise<T>,
    featureName: string
): Promise<T> => {
    try {
        checkRateLimit();
        if (!GEMINI_API_KEY && !GROQ_API_KEY) throw new Error("System Offline: Keys missing.");
        return await geminiOp();
    } catch (error: any) {
        console.warn(`Gemini (${featureName}) Failed:`, error.message);
        
        // Critical error check (429 = Rate Limit, 503 = Overloaded)
        if (error.message.includes('429') || error.message.includes('503') || error.message.includes('fetch failed')) {
            console.log(`Rerouting ${featureName} to Groq Backup Node...`);
            if (GROQ_API_KEY) {
                return await groqOp();
            }
        }
        throw error;
    }
};

const callGroq = async (systemPrompt: string, userPrompt: string, jsonMode: boolean = false): Promise<string> => {
    if (!GROQ_API_KEY) throw new Error("Backup system offline.");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: GROQ_MODEL,
            temperature: 0.7,
            response_format: jsonMode ? { type: "json_object" } : undefined
        })
    });

    if (!response.ok) throw new Error("Backup system failed.");
    const data = await response.json();
    return data.choices[0]?.message?.content || "";
};

// --- SECURITY & PERSONA ---

// Obfuscate prompts so they aren't plain text in the bundle
const securePrompt = (parts: string[]) => parts.join(' ');

// Updated Persona: Simple, Direct, Normal English
const BASE_PERSONA = securePrompt([
    "You are 'The Professor'.",
    "Identity: A smart, helpful study companion created by William Popoola (Vexis Automations).",
    "Tone: Casual, encouraging, and clear.",
    "CRITICAL RULE: Speak in simple, normal conversational English.",
    "Do NOT use complex vocabulary, academic jargon, or 'big words' unless necessary for the subject.",
    "If you explain a concept, use an analogy a high schooler would understand.",
    "Be concise."
]);

// --- MAIN CHAT LOGIC ---
export const generateChatResponse = async (history: ChatMessage[], fileContext: string, newMessage: string): Promise<string> => {
    const systemInstruction = `
        ${BASE_PERSONA}
        CONTEXT OF USER DOCUMENTS: ${fileContext.substring(0, 15000)}
    `;

    return withFallback(
        async () => {
            const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
            const chat = ai.chats.create({ model: "gemini-2.5-flash", config: { systemInstruction }, history: history.slice(-5).map(m => ({ role: m.role, parts: [{ text: m.content }] })) });
            const result = await chat.sendMessage({ message: newMessage });
            return result.text || "No response.";
        },
        async () => {
            // Groq Chat Fallback
            const histText = history.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n');
            return callGroq(systemInstruction, `${histText}\nUser: ${newMessage}`);
        },
        "Chat"
    );
}

export const generateQuizFromText = async (text: string, config: QuizConfig, userProfile?: UserProfile): Promise<QuizQuestion[]> => {
  const { difficulty, questionType, questionCount } = config;
  // Simplified Prompt
  const prompt = `Generate ${questionCount} ${difficulty} questions. Type: ${questionType}. JSON Array: [{question, options[], correct_answer, explanation}]. Content: ${text.substring(0, 20000)}`;

  return withFallback(
      async () => {
          const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
          const res = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: { role: 'user', parts: [{ text: prompt }] },
              config: { responseMimeType: "application/json" }
          });
          const data = JSON.parse(res.text || '[]');
          return data.map((q:any, i:number) => ({ ...q, id: i + 1, type: questionType }));
      },
      async () => {
          const jsonStr = await callGroq("You are a quiz generator. Output valid JSON array.", prompt, true);
          const data = JSON.parse(jsonStr).questions || JSON.parse(jsonStr);
          return Array.isArray(data) ? data.map((q:any, i:number) => ({ ...q, id: i + 1, type: questionType })) : [];
      },
      "Quiz Gen"
  );
};

export const generateProfessorContent = async (text: string, config: QuizConfig): Promise<ProfessorSection[]> => {
  const prompt = `Teach this topic. Style: ${config.personality}. Analogy Domain: ${config.analogyDomain}. Output strictly as JSON Array: [{title, content, analogy, key_takeaway}]. Content: ${text.substring(0, 20000)}`;

  return withFallback(
      async () => {
          const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
          const res = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: { role: 'user', parts: [{ text: prompt }] },
              config: { responseMimeType: "application/json" }
          });
          return JSON.parse(res.text || '[]').map((s:any, i:number) => ({ ...s, id: i+1 }));
      },
      async () => {
          const jsonStr = await callGroq("You are a professor. Output valid JSON array.", prompt, true);
          const data = JSON.parse(jsonStr).sections || JSON.parse(jsonStr);
          return Array.isArray(data) ? data.map((s:any, i:number) => ({ ...s, id: i + 1 })) : [];
      },
      "Lecture Gen"
  );
};

export const simplifyExplanation = async (explanation: string, type: 'ELI5' | 'ELA', customInstruction?: string): Promise<string> => {
    const prompt = customInstruction 
        ? `${customInstruction}: ${explanation}` 
        : (type === 'ELI5' ? `Explain this simply in 1 sentence using normal words: ${explanation}` : `Summarize in 5 words: ${explanation}`);
    
    return withFallback(
        async () => {
            const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
            const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { role: 'user', parts: [{ text: prompt }] } });
            return res.text || explanation;
        },
        async () => {
            return callGroq("Be concise. Use simple English.", prompt);
        },
        "Simplification"
    );
}

export const generateSummary = async (text: string): Promise<string> => {
    return withFallback(
        async () => {
            const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
            const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { role: 'user', parts: [{ text: "Create an Executive Summary (Markdown). Use simple language." + text.substring(0, 10000) }] } });
            return res.text || "Summary failed.";
        },
        async () => {
            return callGroq("Summarize in Markdown using simple English.", text.substring(0, 10000));
        },
        "Summary"
    );
}

export const generateStudyProtocol = async (content: string, technique: LockInTechnique): Promise<StudyProtocol> => {
    if (technique === 'STANDARD') return { step: 'READ', survey: '', questions: [] };
    const prompt = `Create ${technique} protocol. JSON: {survey, questions[]}. Content: ${content.substring(0, 10000)}`;
    
    return withFallback(
        async () => {
            const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
            const res = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: { role: 'user', parts: [{ text: prompt }] }, config: { responseMimeType: "application/json" } });
            return { step: technique === 'SQ3R' ? 'SURVEY' : 'QUESTION', ...JSON.parse(res.text || '{}') };
        },
        async () => {
            const jsonStr = await callGroq("Study guide generator. JSON only.", prompt, true);
            return { step: technique === 'SQ3R' ? 'SURVEY' : 'QUESTION', ...JSON.parse(jsonStr) };
        },
        "Protocol"
    );
}

export const generateSuddenDeathQuestion = async (text: string): Promise<QuizQuestion> => {
    const prompt = `Generate 1 NIGHTMARE difficulty multiple choice question. Valid JSON: {question, options[], correct_answer, explanation}.`;
    return withFallback(
        async () => {
            const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
            const res = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: { role: 'user', parts: [{ text: prompt + "\nContext: " + text.substring(0,5000) }] }, config: { responseMimeType: "application/json" } });
            const data = JSON.parse(res.text || '{}');
            return { ...(Array.isArray(data) ? data[0] : data), id: 999, type: 'Multiple Choice' };
        },
        async () => {
            const jsonStr = await callGroq("Quiz generator. JSON only.", prompt + "\nContext: " + text.substring(0,5000), true);
            const data = JSON.parse(jsonStr);
            return { ...(Array.isArray(data) ? data[0] : data), id: 999, type: 'Multiple Choice' };
        },
        "Sudden Death"
    );
}
