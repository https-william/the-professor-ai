
import { GoogleGenAI } from "@google/genai";
import { QuizQuestion, QuizConfig, ProfessorSection, UserProfile, ChatMessage, LockInTechnique, StudyProtocol } from "../types";

// --- SECURITY PROTOCOL ---
// Keys must come from Environment Variables. 
const GROQ_API_KEY = (import.meta as any).env?.VITE_GROQ_API_KEY || "";
const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.API_KEY || "";
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
    if (bucket.tokens <= 0) throw new Error("Neural Overload. Rate limit exceeded. Please wait a moment.");
    bucket.tokens -= 1;
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(bucket));
};

const cleanJson = (text: string): any => {
    if (!text) return [];
    try {
        return JSON.parse(text);
    } catch (e) {
        let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
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

const withFallback = async <T>(
    geminiOp: () => Promise<T>, 
    groqOp: () => Promise<T>,
    featureName: string
): Promise<T> => {
    checkRateLimit();
    
    const hasGemini = !!(process.env.API_KEY || GEMINI_API_KEY);
    const hasGroq = !!GROQ_API_KEY;

    if (!hasGemini && !hasGroq) {
        throw new Error("System Offline: AI Configuration missing. Please contact administrator.");
    }

    try {
        if (hasGemini) {
            return await geminiOp();
        }
        throw new Error("Gemini Key Missing");
    } catch (error: any) {
        console.warn(`Gemini (${featureName}) Failed:`, error.message);
        if (hasGroq) {
            console.log(`Rerouting to Backup Node...`);
            return await groqOp();
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

const constructSystemPrompt = (role: string, goal: string, constraints: string[]) => {
    return `Act as 'The Professor', an elite academic engine. 
    Role: ${role}
    Goal: ${goal}
    Constraints: ${constraints.join(', ')}
    Format: JSON where applicable.
    Tone: Professional, strict, efficient.`;
};

// ... [Existing export functions remain same but use the new secure withFallback] ...
// Re-exporting simplified versions for brevity in XML response
export const generateChatResponse = async (history: ChatMessage[], fileContext: string, newMessage: string): Promise<string> => {
    const systemInstruction = constructSystemPrompt("Tutor", "Answer based on context.", ["Keep it brief."]) + `\nCONTEXT: ${fileContext.substring(0, 15000)}`;
    return withFallback(
        async () => {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || GEMINI_API_KEY });
            const chat = ai.chats.create({ model: "gemini-2.5-flash", config: { systemInstruction }, history: history.slice(-5).map(m => ({ role: m.role, parts: [{ text: m.content }] })) });
            const result = await chat.sendMessage({ message: newMessage });
            return result.text || "No response.";
        },
        async () => callGroq(systemInstruction, newMessage),
        "Chat"
    );
}

export const generateQuizFromText = async (text: string, config: QuizConfig, userProfile?: UserProfile): Promise<QuizQuestion[]> => {
  const systemPrompt = constructSystemPrompt("Exam Creator", `Create ${config.questionCount} ${config.difficulty} questions.`, ["Output strictly valid JSON array", "Structure: [{question, options[], correct_answer, explanation}]"]);
  return withFallback(
      async () => {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || GEMINI_API_KEY });
          const res = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: { role: 'user', parts: [{ text: systemPrompt + "\n" + text.substring(0, 20000) }] }, config: { responseMimeType: "application/json" } });
          const data = cleanJson(res.text || '[]');
          const arrayData = Array.isArray(data) ? data : (data.questions || []);
          return arrayData.map((q:any, i:number) => ({ ...q, id: i + 1, type: config.questionType }));
      },
      async () => {
          const jsonStr = await callGroq(systemPrompt, text.substring(0, 20000), true);
          const data = cleanJson(jsonStr);
          const arrayData = Array.isArray(data) ? data : (data.questions || []);
          return arrayData.map((q:any, i:number) => ({ ...q, id: i + 1, type: config.questionType }));
      },
      "Quiz Gen"
  );
};

export const generateProfessorContent = async (text: string, config: QuizConfig): Promise<ProfessorSection[]> => {
  const systemPrompt = constructSystemPrompt("Professor", "Teach core concepts.", ["Output JSON array", "Structure: [{title, content, analogy, key_takeaway}]"]);
  return withFallback(
      async () => {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || GEMINI_API_KEY });
          const res = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: { role: 'user', parts: [{ text: systemPrompt + "\n" + text.substring(0, 20000) }] }, config: { responseMimeType: "application/json" } });
          const data = cleanJson(res.text || '[]');
          const arrayData = Array.isArray(data) ? data : (data.sections || []);
          return arrayData.map((s:any, i:number) => ({ ...s, id: i+1 }));
      },
      async () => {
          const jsonStr = await callGroq(systemPrompt, text.substring(0, 20000), true);
          const data = cleanJson(jsonStr);
          return (Array.isArray(data) ? data : (data.sections || [])).map((s:any, i:number) => ({ ...s, id: i+1 }));
      },
      "Lecture Gen"
  );
};

export const simplifyExplanation = async (explanation: string, type: 'ELI5' | 'ELA', customInstruction?: string): Promise<string> => {
    const prompt = `Simplify: ${explanation}. ${customInstruction || ''}`;
    return withFallback(
        async () => {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || GEMINI_API_KEY });
            const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { role: 'user', parts: [{ text: prompt }] } });
            return res.text || explanation;
        },
        async () => callGroq("Simplifier", prompt),
        "Simplification"
    );
}

export const generateSummary = async (text: string): Promise<string> => {
    return withFallback(
        async () => {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || GEMINI_API_KEY });
            const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { role: 'user', parts: [{ text: "Summarize in markdown:\n" + text.substring(0, 10000) }] } });
            return res.text || "Summary failed.";
        },
        async () => callGroq("Summarizer", text.substring(0, 10000)),
        "Summary"
    );
}

export const generateStudyProtocol = async (content: string, technique: LockInTechnique): Promise<StudyProtocol> => {
    if (technique === 'STANDARD') return { step: 'READ', survey: '', questions: [] };
    const systemPrompt = `Create ${technique} plan. JSON: {survey, questions[]}`;
    return withFallback(
        async () => {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || GEMINI_API_KEY });
            const res = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: { role: 'user', parts: [{ text: systemPrompt + "\n" + content.substring(0, 10000) }] }, config: { responseMimeType: "application/json" } });
            const data = cleanJson(res.text || '{}');
            return { step: technique === 'SQ3R' ? 'SURVEY' : 'QUESTION', ...data };
        },
        async () => {
            const jsonStr = await callGroq(systemPrompt, content.substring(0, 10000), true);
            return { step: technique === 'SQ3R' ? 'SURVEY' : 'QUESTION', ...cleanJson(jsonStr) };
        },
        "Protocol"
    );
}

export const generateSuddenDeathQuestion = async (text: string): Promise<QuizQuestion> => {
    const systemPrompt = "Generate ONE Nightmare difficulty question. JSON.";
    return withFallback(
        async () => {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || GEMINI_API_KEY });
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
