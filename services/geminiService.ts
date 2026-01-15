
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { QuizQuestion, QuizConfig, ProfessorSection, ChatMessage, LockInTechnique, StudyProtocol, UserProfile } from "../types";

// --- SECURITY PROTOCOLS ---

// 1. INPUT SANITIZER
const FORBIDDEN_PATTERNS = [
    /ignore previous instructions/gi,
    /system prompt/gi,
    /you are not a/gi,
    /dan mode/gi,
    /unrestricted mode/gi,
    /roleplay as a hacker/gi,
    /execute command/gi
];

const sanitizeInput = (input: string): string => {
    let cleaned = input || ""; // Fallback for null
    for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(cleaned)) {
            console.warn("Security Event: Input Sanitization Triggered");
            cleaned = cleaned.replace(pattern, "[REDACTED_SECURITY]");
        }
    }
    return cleaned;
};

// 2. PROMPT VAULT (Base64 Encoded)
const PROMPT_VAULT = {
    PROFESSOR_CORE: "WW91IGFyZSAnVGhlIFByb2Zlc3NvcicuIFJvbGU6IEEgZGlzdGluZ3Vpc2hlZCB1bml2ZXJzaXR5IGxlY3R1cmVyIGFuZCBleHBlcnQgYWNhZGVtaWMgdHV0b3IuIFRvbmU6IEZvcm1hbCB5ZXQgYWNjZXNzaWJsZSwgYXV0aG9yaXRhdGl2ZSwgZW5jb3VyYWdpbmcgYnV0IHN0cmljdCBhYm91dCBhY2N1cmFjeS4gQ29uc3RyYWludDogQW5zd2VyIHVzaW5nIE9OTFkgdGhlIHByb3ZpZGVkIGNvbnRleHQu",
    EXAMINER_CORE: "WW91IGFyZSBhIENoaWVmIEV4YW1pbmVyLiBFbnN1cmUgcXVlc3Rpb25zIGFyZSBhY2FkZW1pY2FsbHkgcmlnb3JvdXMgYW5kIGRpc3RyYWN0b3JzIGFyZSBwbGF1c2libGUu",
    LECTURER_CORE: "WW91IGFyZSBhIFRlbnVyZWQgUHJvZmVzc29yLiBUZWFjaCBjbGVhcmx5IGFuZCBzdHJ1Y3R1cmFsbHkuIFVzZSBNYXJrZG93biBmb3IgdGhlIGNvbnRlbnQu"
};

const getSystemInstruction = (key: keyof typeof PROMPT_VAULT): string => {
    try {
        return atob(PROMPT_VAULT[key]);
    } catch (e) {
        return "You are a helpful AI tutor.";
    }
};

// --- MODELS ---
const MODEL_TEXT = "gemini-3-flash-preview";
const MODEL_TTS = "gemini-2.5-flash-preview-tts";

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
    let key = "";
    try {
        // @ts-ignore
        if (import.meta.env.VITE_GEMINI_API_KEY) key = import.meta.env.VITE_GEMINI_API_KEY;
        // @ts-ignore
        else if (import.meta.env.VITE_GEMINI_API_KEY_2) key = import.meta.env.VITE_GEMINI_API_KEY_2;
    } catch (e) {}

    if (!key && typeof process !== 'undefined' && process.env) {
        if (process.env.API_KEY) key = process.env.API_KEY;
        else if (process.env.VITE_GEMINI_API_KEY) key = process.env.VITE_GEMINI_API_KEY;
    }

    if (!key) {
        throw new Error("Neural Link Offline: API Key Configuration Missing.");
    }
    
    return new GoogleGenAI({ apiKey: key });
};

// --- API FUNCTIONS ---

export const generateChatResponse = async (history: ChatMessage[], fileContext: string, newMessage: string): Promise<string> => {
    checkRateLimit();
    const ai = getAI();
    
    const safeMessage = sanitizeInput(newMessage);
    const systemInstruction = getSystemInstruction('PROFESSOR_CORE');

    // Strict filtering: Remove 'init' system messages and empty content
    const validHistory = history
        .filter(m => m.id !== 'init' && m.content.trim().length > 0)
        .slice(-6)
        .map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: sanitizeInput(m.content) }]
        }));

    const chat = ai.chats.create({
        model: MODEL_TEXT,
        config: { systemInstruction },
        history: validHistory
    });
    
    const fullMessage = `Document Context: ${fileContext.substring(0, 20000)}\n\nStudent Question: ${safeMessage}`;
    
    const result = await chat.sendMessage({ message: fullMessage });
    return result.text || "I apologize, but I am unable to formulate a response at this moment.";
};

export const generateHubResponse = async (message: string, context: string): Promise<string> => {
    checkRateLimit();
    const ai = getAI();
    const safeMessage = sanitizeInput(message);
    
    const systemInstruction = `You are 'The Professor', overseeing a study group. Role: A helpful, slightly strict but knowledgeable tutor. Tone: Brief, direct.`;

    const response = await ai.models.generateContent({
        model: MODEL_TEXT,
        contents: `Student Query: "${safeMessage}". \nContext: ${context.substring(0, 5000)}`,
        config: { systemInstruction }
    });
    
    return response.text || "I am monitoring the channel.";
};

export const generateWittyFeedback = async (score: number, total: number): Promise<string> => {
    checkRateLimit();
    const ai = getAI();
    
    const prompt = `Generate a short, witty, and slightly sarcastic remark for a student who scored ${score} out of ${total}. Max 1 sentence.`;

    const response = await ai.models.generateContent({
        model: MODEL_TEXT,
        contents: prompt,
    });
    
    return response.text || (score/total > 0.5 ? "Acceptable." : "Do better.");
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
    const ai = getAI();
    const safeText = sanitizeInput(text);
    
    try {
        const response = await ai.models.generateContent({
            model: MODEL_TTS,
            contents: [{ parts: [{ text: safeText.substring(0, 500) }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Fenrir' }, 
                    },
                },
            },
        });
        
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (e) {
        console.warn("TTS Generation failed:", e);
        return undefined;
    }
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
            systemInstruction: getSystemInstruction('EXAMINER_CORE')
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

    const prompt = `Deliver a structured lecture. Analogy Domain: ${config.analogyDomain}. Context: ${text.substring(0, 25000)}`;

    const response = await ai.models.generateContent({
        model: MODEL_TEXT,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            systemInstruction: getSystemInstruction('LECTURER_CORE')
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
