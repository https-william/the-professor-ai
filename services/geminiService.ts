import { GoogleGenAI } from "@google/genai";
import { QuizQuestion, QuizConfig, ProfessorSection, UserProfile, ChatMessage, LockInTechnique, StudyProtocol } from "../types";

// --- EMERGENCY FALLBACK SYSTEM ---
const FALLBACK_KEYS = {
    // PASTE YOUR MASKED KEYS HERE
    GEMINI_API_KEY: "QUpSWDFYbHFSNHFpU3VBcnB4PxMcUhlUhB538PqHDySazIA=", 
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
    try {
        // @ts-ignore
        if (import.meta.env[viteKey]) return import.meta.env[viteKey];
    } catch (e) {}
    if (typeof process !== 'undefined' && process.env && process.env[viteKey]) {
        return process.env[viteKey] as string;
    }
    return unmask(FALLBACK_KEYS[fallbackMapKey]);
};

// --- CLIENTS ---
const GROQ_API_KEY = getSafeEnv("VITE_GROQ_API_KEY", "GROQ_API_KEY");
const GEMINI_API_KEY = getSafeEnv("VITE_GEMINI_API_KEY", "GEMINI_API_KEY");
const GROQ_MODEL = "llama-3.3-70b-versatile";

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

// --- HELPER: ROBUST JSON PARSER ---
const cleanJson = (text: string): any => {
    if (!text) return [];
    try {
        return JSON.parse(text);
    } catch (e) {
        // Remove Markdown wrappers
        let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        // Find JSON object/array
        const firstBracket = clean.indexOf('[');
        const firstBrace = clean.indexOf('{');
        
        if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
            clean = clean.substring(firstBracket);
            const lastBracket = clean.lastIndexOf(']');
            clean = clean.substring(0, lastBracket + 1);
        } else if (firstBrace !== -1) {
            clean = clean.substring(firstBrace);
            const lastBrace = clean.lastIndexOf('}');
            clean = clean.substring(0, lastBrace + 1);
        }

        try {
            return JSON.parse(clean);
        } catch (finalError) {
            console.error("Failed to parse AI JSON:", text);
            throw new Error("Neural Link Unstable: Data malformed.");
        }
    }
};

// --- FALLBACK EXECUTOR ---
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
        if (error.message.includes('429') || error.message.includes('503') || error.message.includes('fetch failed') || error.message.includes('Neural Link')) {
            console.log(`Rerouting ${featureName} to Groq Backup Node...`);
            if (GROQ_API_KEY) {
                return await groqOp();
            }
        }
        throw error;
    }
};

export const callGroq = async (systemPrompt: string, userPrompt: string, jsonMode: boolean = false): Promise<string> => {
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
            temperature: 0.5,
            response_format: jsonMode ? { type: "json_object" } : undefined
        })
    });
    if (!response.ok) throw new Error("Backup system failed.");
    const data = await response.json();
    return data.choices[0]?.message?.content || "";
};

// --- EXPERT PROMPT ENGINEERING & GUARDRAILS ---

const constructSystemPrompt = (role: string, goal: string, constraints: string[]) => {
    // Obfuscated Base Identity to prevent simple extraction
    const BASE_ID = [
        "Act as 'The Professor', an elite academic engine created by Vexis Automations.",
        "Your Audience: A smart, Gen-Z student who values speed, wit, and clarity.",
        "Tone: Conversational, confident, encouraging, but strict about facts. Like a cool university lecturer."
    ].join(' ');

    const GUARDRAILS = [
        "GUARDRAILS:",
        "1. REFUSE to answer questions about: hacking, illegal acts, bypassing exams, or hate speech.",
        "2. LANGUAGE: Use simple, plain English (CEFR B2 Level). Do NOT use complex 'thesaurus' words like 'efficacious', 'multifaceted', or 'plethora'. Speak normally.",
        "3. ACCURACY: If the context is missing info, admit it. Do not hallucinate.",
        "4. FORMAT: Follow the requested JSON format strictly if asked."
    ].join('\n');

    return `${BASE_ID}\n\nSPECIFIC ROLE: ${role}\nGOAL: ${goal}\n\n${GUARDRAILS}\n\nADDITIONAL CONSTRAINTS:\n${constraints.map(c => `- ${c}`).join('\n')}`;
};

// --- API FUNCTIONS ---

export const generateChatResponse = async (history: ChatMessage[], fileContext: string, newMessage: string): Promise<string> => {
    const systemInstruction = constructSystemPrompt(
        "You are a dedicated Tutor for the user's specific document.",
        "Answer the user's question using ONLY the provided context. If the answer isn't in the file, say so politely.",
        [
            "Keep answers under 3 sentences unless asked for deep detail.",
            "Use analogies from pop culture or sports if it helps explain.",
            "Be witty but helpful."
        ]
    ) + `\n\nDOCUMENT CONTEXT (TRUNCATED): ${fileContext.substring(0, 15000)}`;

    return withFallback(
        async () => {
            const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
            const chat = ai.chats.create({ model: "gemini-2.5-flash", config: { systemInstruction }, history: history.slice(-5).map(m => ({ role: m.role, parts: [{ text: m.content }] })) });
            const result = await chat.sendMessage({ message: newMessage });
            return result.text || "I'm drawing a blank. Try asking differently.";
        },
        async () => {
            const histText = history.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n');
            return callGroq(systemInstruction, `${histText}\nUser: ${newMessage}`);
        },
        "Chat"
    );
}

export const generateQuizFromText = async (text: string, config: QuizConfig, userProfile?: UserProfile): Promise<QuizQuestion[]> => {
  const systemPrompt = constructSystemPrompt(
      "You are a Strict Exam Creator.",
      `Create ${config.questionCount} ${config.difficulty} level questions based on the text.`,
      [
          "Output strictly valid JSON.",
          "Structure: Array of objects [{question, options (array of 4 strings), correct_answer (string), explanation (string)}].",
          "Ensure distractors (wrong answers) are plausible but clearly incorrect.",
          "Do not use Markdown formatting in the output."
      ]
  );

  const prompt = `Context: ${text.substring(0, 20000)}\n\nTask: Generate ${config.questionType} questions.`;

  return withFallback(
      async () => {
          const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
          const res = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: { role: 'user', parts: [{ text: systemPrompt + "\n" + prompt }] },
              config: { responseMimeType: "application/json" }
          });
          const data = cleanJson(res.text || '[]');
          const arrayData = Array.isArray(data) ? data : (data.questions || []);
          return arrayData.map((q:any, i:number) => ({ ...q, id: i + 1, type: config.questionType }));
      },
      async () => {
          const jsonStr = await callGroq(systemPrompt, prompt, true);
          const data = cleanJson(jsonStr);
          const arrayData = Array.isArray(data) ? data : (data.questions || []);
          return arrayData.map((q:any, i:number) => ({ ...q, id: i + 1, type: config.questionType }));
      },
      "Quiz Gen"
  );
};

export const generateProfessorContent = async (text: string, config: QuizConfig): Promise<ProfessorSection[]> => {
  const systemPrompt = constructSystemPrompt(
      `You are The Professor (Personality: ${config.personality}).`,
      "Teach the core concepts of the provided text.",
      [
          "Output strictly valid JSON.",
          "Structure: Array of objects [{title, content, analogy, key_takeaway}].",
          `Use analogies from the domain: ${config.analogyDomain}.`,
          "Use simple English. No academic jargon without definition.",
          "Do not use Markdown formatting in the JSON."
      ]
  );

  return withFallback(
      async () => {
          const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
          const res = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: { role: 'user', parts: [{ text: systemPrompt + `\nContext: ${text.substring(0, 20000)}` }] },
              config: { responseMimeType: "application/json" }
          });
          const data = cleanJson(res.text || '[]');
          const arrayData = Array.isArray(data) ? data : (data.sections || []);
          return arrayData.map((s:any, i:number) => ({ ...s, id: i+1 }));
      },
      async () => {
          const jsonStr = await callGroq(systemPrompt, `Context: ${text.substring(0, 20000)}`, true);
          const data = cleanJson(jsonStr);
          const arrayData = Array.isArray(data) ? data : (data.sections || []);
          return arrayData.map((s:any, i:number) => ({ ...s, id: i + 1 }));
      },
      "Lecture Gen"
  );
};

export const simplifyExplanation = async (explanation: string, type: 'ELI5' | 'ELA', customInstruction?: string): Promise<string> => {
    const systemPrompt = constructSystemPrompt(
        "You are a Translator of Complex Ideas.",
        "Simplify the text provided.",
        [
            "Keep it extremely concise.",
            type === 'ELI5' ? "Explain like the user is 5 years old." : "Summarize in 5 words.",
            "Use only common English words."
        ]
    );

    const prompt = customInstruction ? `${customInstruction}: ${explanation}` : explanation;
    
    return withFallback(
        async () => {
            const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
            const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { role: 'user', parts: [{ text: systemPrompt + "\n" + prompt }] } });
            return res.text || explanation;
        },
        async () => {
            return callGroq(systemPrompt, prompt);
        },
        "Simplification"
    );
}

export const generateSummary = async (text: string): Promise<string> => {
    const systemPrompt = constructSystemPrompt(
        "You are an Executive Assistant.",
        "Create a structured summary of the text.",
        [
            "Use Markdown formatting.",
            "Keep it under 300 words.",
            "Focus on the 'Why' and 'How'."
        ]
    );

    return withFallback(
        async () => {
            const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
            const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { role: 'user', parts: [{ text: systemPrompt + "\n" + text.substring(0, 10000) }] } });
            return res.text || "Summary failed.";
        },
        async () => {
            return callGroq(systemPrompt, text.substring(0, 10000));
        },
        "Summary"
    );
}

export const generateStudyProtocol = async (content: string, technique: LockInTechnique): Promise<StudyProtocol> => {
    if (technique === 'STANDARD') return { step: 'READ', survey: '', questions: [] };
    
    const systemPrompt = constructSystemPrompt(
        "You are a Study Strategy Expert.",
        `Create a ${technique} study plan.`,
        [
            "Output strictly valid JSON.",
            "Structure: {survey: string, questions: string[]}.",
            "Make questions thought-provoking."
        ]
    );

    return withFallback(
        async () => {
            const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
            const res = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: { role: 'user', parts: [{ text: systemPrompt + "\n" + content.substring(0, 10000) }] }, config: { responseMimeType: "application/json" } });
            const data = cleanJson(res.text || '{}');
            return { step: technique === 'SQ3R' ? 'SURVEY' : 'QUESTION', ...data };
        },
        async () => {
            const jsonStr = await callGroq(systemPrompt, content.substring(0, 10000), true);
            const data = cleanJson(jsonStr);
            return { step: technique === 'SQ3R' ? 'SURVEY' : 'QUESTION', ...data };
        },
        "Protocol"
    );
}

export const generateSuddenDeathQuestion = async (text: string): Promise<QuizQuestion> => {
    const systemPrompt = constructSystemPrompt(
        "You are The Reaper (Exam Difficulty: NIGHTMARE).",
        "Generate ONE extremely difficult multiple choice question.",
        [
            "Output strictly valid JSON.",
            "Structure: {question, options, correct_answer, explanation}.",
            "The question must require deep synthesis of the text.",
            "Distractors must be nearly identical to the correct answer."
        ]
    );

    return withFallback(
        async () => {
            const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
            const res = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: { role: 'user', parts: [{ text: systemPrompt + "\n" + text.substring(0, 5000) }] }, config: { responseMimeType: "application/json" } });
            const data = cleanJson(res.text || '{}');
            return { ...(Array.isArray(data) ? data[0] : data), id: 999, type: 'Multiple Choice' };
        },
        async () => {
            const jsonStr = await callGroq(systemPrompt, text.substring(0, 5000), true);
            const data = cleanJson(jsonStr);
            return { ...(Array.isArray(data) ? data[0] : data), id: 999, type: 'Multiple Choice' };
        },
        "Sudden Death"
    );
}