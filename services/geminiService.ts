
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { QuizQuestion, QuizConfig, ProfessorSection, ChatMessage, LockInTechnique, StudyProtocol, UserProfile } from "../types";

// --- MODELS ---
const MODEL_TEXT = "gemini-3-flash-preview";

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
    if (bucket.tokens <= 0) throw new Error("Neural Overload. Please wait a moment.");
    bucket.tokens -= 1;
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(bucket));
};

// --- CLIENT INITIALIZATION ---
const getAI = () => {
    // 1. Try Vite Env Vars (Standard for Vercel/Vite)
    let key = "";
    try {
        // @ts-ignore
        if (import.meta.env.VITE_GEMINI_API_KEY) key = import.meta.env.VITE_GEMINI_API_KEY;
        // @ts-ignore
        else if (import.meta.env.VITE_GEMINI_API_KEY_2) key = import.meta.env.VITE_GEMINI_API_KEY_2;
    } catch (e) {}

    // 2. Try Process Env (Fallback/Legacy)
    if (!key && typeof process !== 'undefined' && process.env) {
        if (process.env.API_KEY) key = process.env.API_KEY;
        else if (process.env.VITE_GEMINI_API_KEY) key = process.env.VITE_GEMINI_API_KEY;
    }

    if (!key) {
        console.error("API Key is missing. Checked VITE_GEMINI_API_KEY and API_KEY.");
        throw new Error("Neural Link Offline: API Key Configuration Missing.");
    }
    
    return new GoogleGenAI({ apiKey: key });
};

// --- API FUNCTIONS ---

export const generateChatResponse = async (history: ChatMessage[], fileContext: string, newMessage: string): Promise<string> => {
    checkRateLimit();
    const ai = getAI();
    
    const systemInstruction = `You are 'The Professor'.
    Role: A distinguished university lecturer and expert academic tutor.
    Tone: Formal yet accessible, authoritative, encouraging but strict about accuracy.
    Constraint: Answer using ONLY the provided context. If the answer isn't in the file, state that clearly.`;

    const chat = ai.chats.create({
        model: MODEL_TEXT,
        config: { systemInstruction },
        history: history.slice(-6).map(m => ({
            role: m.role,
            parts: [{ text: m.content }]
        }))
    });
    
    const fullMessage = `Document Context: ${fileContext.substring(0, 20000)}\n\nStudent Question: ${newMessage}`;
    
    const result = await chat.sendMessage({ message: fullMessage });
    return result.text || "I apologize, but I am unable to formulate a response at this moment.";
};

export const generateQuizFromText = async (text: string, config: QuizConfig, userProfile?: UserProfile): Promise<QuizQuestion[]> => {
    checkRateLimit();
    const ai = getAI();

    const schema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correct_answer: { type: Type.STRING },
                explanation: { type: Type.STRING },
            },
            required: ["question", "options", "correct_answer", "explanation"]
        }
    };

    const prompt = `Construct a ${config.questionCount}-question examination.
    Difficulty: ${config.difficulty}.
    Type: ${config.questionType}.
    Context: ${text.substring(0, 25000)}`;

    const response = await ai.models.generateContent({
        model: MODEL_TEXT,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            systemInstruction: "You are a Chief Examiner. Ensure questions are academically rigorous and distractors are plausible."
        }
    });

    const data = JSON.parse(response.text || '[]');
    return data.map((q: any, i: number) => ({ ...q, id: i + 1, type: config.questionType }));
};

export const generateProfessorContent = async (text: string, config: QuizConfig): Promise<ProfessorSection[]> => {
    checkRateLimit();
    const ai = getAI();

    const schema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                analogy: { type: Type.STRING },
                key_takeaway: { type: Type.STRING }
            },
            required: ["title", "content", "analogy", "key_takeaway"]
        }
    };

    const prompt = `Deliver a structured lecture on the core concepts of the provided text.
    Analogy Domain: ${config.analogyDomain}.
    Context: ${text.substring(0, 25000)}`;

    const response = await ai.models.generateContent({
        model: MODEL_TEXT,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            systemInstruction: "You are a Tenured Professor. Teach clearly and structurally. Use Markdown for the content."
        }
    });

    const data = JSON.parse(response.text || '[]');
    return data.map((s: any, i: number) => ({ ...s, id: i + 1 }));
};

export const simplifyExplanation = async (explanation: string, type: 'ELI5' | 'ELA', customInstruction?: string): Promise<string> => {
    checkRateLimit();
    const ai = getAI();
    const prompt = `${customInstruction || ''} Simplify this concept: ${explanation}`;
    
    const response = await ai.models.generateContent({
        model: MODEL_TEXT,
        contents: prompt,
        config: {
            systemInstruction: type === 'ELI5' ? "Explain this as if to a young student." : "Summarize in exactly 5 words."
        }
    });

    return response.text || explanation;
};

export const generateSummary = async (text: string): Promise<string> => {
    checkRateLimit();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: MODEL_TEXT,
        contents: `Provide an executive summary of this text in under 300 words using Markdown.\n\n${text.substring(0, 15000)}`,
        config: { systemInstruction: "You are a Research Assistant." }
    });
    return response.text || "Summary unavailable.";
};

export const generateStudyProtocol = async (content: string, technique: LockInTechnique): Promise<StudyProtocol> => {
    if (technique === 'STANDARD') return { step: 'READ', survey: '', questions: [] };
    checkRateLimit();
    const ai = getAI();

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            survey: { type: Type.STRING },
            questions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["survey", "questions"]
    };

    const response = await ai.models.generateContent({
        model: MODEL_TEXT,
        contents: `Develop a ${technique} study framework for: ${content.substring(0, 15000)}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            systemInstruction: "You are a Pedagogy Expert."
        }
    });

    const data = JSON.parse(response.text || '{}');
    return { step: technique === 'SQ3R' ? 'SURVEY' : 'QUESTION', ...data };
};

export const generateSuddenDeathQuestion = async (text: string): Promise<QuizQuestion> => {
    checkRateLimit();
    const ai = getAI();

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correct_answer: { type: Type.STRING },
            explanation: { type: Type.STRING }
        },
        required: ["question", "options", "correct_answer", "explanation"]
    };

    const response = await ai.models.generateContent({
        model: MODEL_TEXT,
        contents: `Generate ONE extremely difficult multiple choice question based on: ${text.substring(0, 5000)}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            systemInstruction: "You are the Final Exam Proctor. The question must be rigorously difficult."
        }
    });

    const data = JSON.parse(response.text || '{}');
    return { ...data, id: 999, type: 'Multiple Choice' };
};
