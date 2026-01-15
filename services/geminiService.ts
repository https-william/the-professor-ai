
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { QuizQuestion, QuizConfig, ProfessorSection, ChatMessage, LockInTechnique, StudyProtocol, UserProfile, SubscriptionTier } from "../types";

// --- SECURITY & QUEUE SYSTEM ---

const FORBIDDEN_PATTERNS = [
    /ignore previous instructions/gi,
    /system prompt/gi,
    /you are not a/gi,
    /dan mode/gi,
    /unrestricted mode/gi,
    /execute command/gi
];

const sanitizeInput = (input: string): string => {
    let cleaned = input || ""; 
    for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(cleaned)) {
            cleaned = cleaned.replace(pattern, "[REDACTED]");
        }
    }
    return cleaned;
};

// --- PRIORITY QUEUE MANAGER ---
class RequestQueue {
    private queue: { task: () => Promise<any>, resolve: Function, reject: Function, tier: SubscriptionTier }[] = [];
    private activeRequests = 0;
    private CONCURRENCY_LIMIT = 3; // Client-side throttle
    private RATE_LIMIT_DELAY = 2000;

    async add<T>(task: () => Promise<T>, tier: SubscriptionTier = 'Fresher'): Promise<T> {
        return new Promise((resolve, reject) => {
            const item = { task, resolve, reject, tier };
            
            // Priority Sort: Excellentia > Scholar > Fresher
            if (tier === 'Excellentia') {
                this.queue.unshift(item);
            } else if (tier === 'Scholar') {
                // Find last Excellentia and insert after
                let lastExIndex = -1;
                for (let i = this.queue.length - 1; i >= 0; i--) {
                    if (this.queue[i].tier === 'Excellentia') {
                        lastExIndex = i;
                        break;
                    }
                }
                this.queue.splice(lastExIndex + 1, 0, item);
            } else {
                this.queue.push(item);
            }
            
            this.process();
        });
    }

    private async process() {
        if (this.activeRequests >= this.CONCURRENCY_LIMIT || this.queue.length === 0) return;

        this.activeRequests++;
        const item = this.queue.shift();
        
        if (!item) {
            this.activeRequests--;
            return;
        }

        try {
            const result = await this.executeWithRetry(item.task);
            item.resolve(result);
        } catch (e) {
            item.reject(e);
        } finally {
            this.activeRequests--;
            this.process();
        }
    }

    private async executeWithRetry(task: () => Promise<any>, retries = 3, delay = 1000): Promise<any> {
        try {
            return await task();
        } catch (error: any) {
            // Check for Rate Limit (429) or Overloaded (503)
            if (retries > 0 && (error.status === 429 || error.status === 503 || error.message?.includes('429'))) {
                console.warn(`⚠️ Neural Overload. Retrying silently in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
                return this.executeWithRetry(task, retries - 1, delay * 2); // Exponential backoff
            }
            throw error;
        }
    }
}

const requestQueue = new RequestQueue();

// --- CLIENT INITIALIZATION ---
const getAI = () => {
    let key = "";
    try {
        // @ts-ignore
        if (import.meta.env.VITE_GEMINI_API_KEY) key = import.meta.env.VITE_GEMINI_API_KEY;
    } catch (e) {}

    if (!key && typeof process !== 'undefined' && process.env) {
        if (process.env.API_KEY) key = process.env.API_KEY;
        else if (process.env.VITE_GEMINI_API_KEY) key = process.env.VITE_GEMINI_API_KEY;
    }

    if (!key) throw new Error("Neural Link Offline: API Key Missing.");
    return new GoogleGenAI({ apiKey: key });
};

const MODEL_TEXT = "gemini-3-flash-preview";
const MODEL_TTS = "gemini-2.5-flash-preview-tts";

// --- WRAPPED API FUNCTIONS ---

export const generateChatResponse = async (history: ChatMessage[], fileContext: string, newMessage: string, tier: SubscriptionTier = 'Fresher'): Promise<string> => {
    return requestQueue.add(async () => {
        const ai = getAI();
        const safeMessage = sanitizeInput(newMessage);
        
        const validHistory = history
            .filter(m => m.id !== 'init' && m.content.trim().length > 0)
            .slice(-10) // Increased context window
            .map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: sanitizeInput(m.content) }]
            }));

        const chat = ai.chats.create({
            model: MODEL_TEXT,
            config: { systemInstruction: "You are 'The Professor'. A distinguished academic tutor. Be concise, authoritative, yet helpful." },
            history: validHistory
        });
        
        const fullMessage = `Document Context: ${fileContext.substring(0, 25000)}\n\nStudent Question: ${safeMessage}`;
        const result = await chat.sendMessage({ message: fullMessage });
        return result.text || "Connection interrupted.";
    }, tier);
};

export const generateHubResponse = async (message: string, context: string): Promise<string> => {
    return requestQueue.add(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: MODEL_TEXT,
            contents: `Student Query: "${sanitizeInput(message)}". \nContext: ${context.substring(0, 5000)}`,
            config: { systemInstruction: "You are overseeing a study group. Be brief and helpful." }
        });
        return response.text || "Monitoring...";
    });
};

export const generateMotivation = async (): Promise<string> => {
    return requestQueue.add(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: MODEL_TEXT,
            contents: "Generate a short, intense academic motivational quote. Max 15 words.",
        });
        return response.text || "Focus. Execute. Succeed.";
    }, 'Fresher'); // Low priority
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
    // TTS is heavy, queue it
    return requestQueue.add(async () => {
        const ai = getAI();
        try {
            const response = await ai.models.generateContent({
                model: MODEL_TTS,
                contents: [{ parts: [{ text: text.substring(0, 500) }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
                },
            });
            return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        } catch (e) {
            return undefined;
        }
    }, 'Scholar');
};

export const generateQuizFromText = async (text: string, config: QuizConfig, userProfile?: UserProfile): Promise<QuizQuestion[]> => {
    return requestQueue.add(async () => {
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

        const prompt = `Construct a ${config.questionCount}-question examination. Difficulty: ${config.difficulty}. Type: ${config.questionType}. Context: ${text.substring(0, 25000)}`;

        const response = await ai.models.generateContent({
            model: MODEL_TEXT,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                systemInstruction: "You are a Chief Examiner. Questions must be rigorous."
            }
        });

        const data = JSON.parse(response.text || '[]');
        return data.map((q: any, i: number) => ({ ...q, id: i + 1, type: config.questionType }));
    }, userProfile?.subscriptionTier);
};

export const generateProfessorContent = async (text: string, config: QuizConfig): Promise<ProfessorSection[]> => {
    return requestQueue.add(async () => {
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
                systemInstruction: "You are a Tenured Professor. Teach clearly."
            }
        });

        const data = JSON.parse(response.text || '[]');
        return data.map((s: any, i: number) => ({ ...s, id: i + 1 }));
    });
};

export const generateStudyProtocol = async (content: string, technique: LockInTechnique): Promise<StudyProtocol> => {
    if (technique === 'STANDARD') return { step: 'READ', survey: '', questions: [] };
    
    return requestQueue.add(async () => {
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
    });
};

export const generateSuddenDeathQuestion = async (text: string): Promise<QuizQuestion> => {
    return requestQueue.add(async () => {
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
                systemInstruction: "You are the Final Exam Proctor."
            }
        });

        const data = JSON.parse(response.text || '{}');
        return { ...data, id: 999, type: 'Multiple Choice' };
    });
};

export const generateWittyFeedback = async (score: number, total: number): Promise<string> => {
    return requestQueue.add(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: MODEL_TEXT,
            contents: `Generate a short, witty, sarcasm remark for a student who scored ${score} out of ${total}. Max 1 sentence.`,
        });
        return response.text || "Acceptable.";
    });
};

export const simplifyExplanation = async (explanation: string, type: 'ELI5' | 'ELA', customInstruction?: string): Promise<string> => {
    return requestQueue.add(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: MODEL_TEXT,
            contents: `${customInstruction || ''} Simplify: ${explanation}`,
            config: {
                systemInstruction: type === 'ELI5' ? "Explain to a child." : "Summarize in 5 words."
            }
        });
        return response.text || explanation;
    });
};