import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { QuizQuestion, QuizConfig, ProfessorSection, ChatMessage, LockInTechnique, StudyProtocol, UserProfile, SubscriptionTier } from "../types";
import { callDeepSeek } from "./deepSeekService";
import { createRateLimiter } from '../utils/security';

// Rate Limiter: 60 requests per minute (scaled for 900 users)
const rateLimiter = createRateLimiter(60, 60000);

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

// --- GROQ FALLBACK SYSTEM (Legacy - now handled by Portkey Gateway) ---
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama3-70b-8192"; // Fast, high quality fallback

// Import Portkey Gateway for unified multi-provider routing
import { callPortkeyGateway, TEXT_FALLBACK_CONFIG, checkProviderHealth } from './portkeyGateway';

const callGroq = async (messages: any[], systemPrompt: string, jsonMode: boolean = false): Promise<string> => {
    // Try Portkey Gateway first (handles all fallbacks automatically)
    try {
        return await callPortkeyGateway(messages, systemPrompt, TEXT_FALLBACK_CONFIG, jsonMode);
    } catch (portkeyError) {
        console.warn("⚠️ Portkey Gateway unavailable, falling back to direct Groq...");
    }
    
    // Direct Groq fallback (original behavior)
    let key = "";
    try {
        // @ts-ignore
        if (import.meta.env.VITE_GROQ_API_KEY) key = import.meta.env.VITE_GROQ_API_KEY;
    } catch (e) {}
    
    if (!key && typeof process !== 'undefined' && process.env.VITE_GROQ_API_KEY) {
        key = process.env.VITE_GROQ_API_KEY;
    }

    if (!key) throw new Error("Neural Link Failed & Backup Systems Offline.");

    const payload = {
        model: GROQ_MODEL,
        messages: [
            { role: "system", content: systemPrompt },
            ...messages
        ],
        temperature: 0.7,
        response_format: jsonMode ? { type: "json_object" } : undefined
    };

    const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Backup System Error: ${response.statusText}`);
    const data = await response.json();
    return data.choices[0]?.message?.content || "";
};

// --- PRIORITY QUEUE MANAGER ---
class RequestQueue {
    private queue: { task: () => Promise<any>, resolve: Function, reject: Function, tier: SubscriptionTier }[] = [];
    private activeRequests = 0;
    private CONCURRENCY_LIMIT = 5; // Scaled for 900 users
    
    async add<T>(task: () => Promise<T>, tier: SubscriptionTier = 'Fresher'): Promise<T> {
        return new Promise((resolve, reject) => {
            const item = { task, resolve, reject, tier };
            
            if (tier === 'Excellentia') {
                this.queue.unshift(item);
            } else if (tier === 'Scholar') {
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

    private async executeWithRetry(task: () => Promise<any>, retries = 2, delay = 2000): Promise<any> {
        try {
            return await task();
        } catch (error: any) {
            const msg = error.message || '';
            const status = error.status || 0;
            
            // Check for Rate Limit (429) or Overloaded (503)
            if (retries > 0 && (status === 429 || status === 503 || msg.includes('429') || msg.includes('Quota'))) {
                console.warn(`⚠️ Neural Overload. Engaging Backups...`);
                await new Promise(r => setTimeout(r, delay));
                
                // Fallback to Groq if retries failing on Gemini
                if (retries === 1) {
                     // The task passed is a closure wrapping the specific Gemini call. 
                     // We can't easily swap the engine *inside* the closure without restructuring every function.
                     // Instead, we just retry the Gemini call with backoff.
                     // A full architecture change to "AIProvider" interface is recommended for Phase 2.
                     // For now, we continue retry logic.
                }
                
                return this.executeWithRetry(task, retries - 1, delay * 2);
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

const PRIMARY_MODEL = "gemini-2.0-flash-exp";
const BACKUP_MODEL = "gemini-1.5-flash"; 
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

const safeGenerateContent = async (ai: GoogleGenAI, params: any) => {
    try {
        return await ai.models.generateContent({ ...params, model: PRIMARY_MODEL });
    } catch (error: any) {
        if (error.status === 429 || error.message?.includes('429')) {
            // Try Gemini Backup Model first
            try {
                return await ai.models.generateContent({ ...params, model: BACKUP_MODEL });
            } catch (backupError) {
                throw backupError; // Let the queue retry logic handle or eventually fail to Groq manually if implemented per function
            }
        }
        throw error;
    }
};

// --- WRAPPED API FUNCTIONS ---

export const generateChatResponse = async (history: ChatMessage[], fileContext: string, newMessage: string, tier: SubscriptionTier = 'Fresher'): Promise<string> => {
    if (!rateLimiter()) throw new Error("Rate limit exceeded. Please wait a moment.");
    
    return requestQueue.add(async () => {
        const systemPrompt = "You are 'The Professor'. You are a confident, encouraging, and calm academic tutor. Do not use overly complex vocabulary unless necessary for the subject. Explain things simply, like a caring mentor who wants the student to succeed. Only be strict if they are clearly not trying. Be concise.";
        
        const hasImage = history.some(m => m.image) || (fileContext && fileContext.startsWith('data:image')); // Simple check, improved via fileService flags usually

        // HYDRA 3.0 ROUTER LOGIC
        
        // PATH A: VISION / MULTIMODAL (Must use Gemini)
        if (hasImage) {
            try {
                const ai = getAI();
                const safeMessage = sanitizeInput(newMessage);
                // ... (Existing Gemini Vision Logic) ...
                 const validHistory = history
                    .filter(m => m.id !== 'init' && m.content.trim().length > 0)
                    .slice(-10) 
                    .map(m => ({
                        role: m.role === 'user' ? 'user' : 'model',
                        parts: [{ text: sanitizeInput(m.content) }]
                    }));
                const fullMessage = `Document Context: ${fileContext.substring(0, 25000)}\n\nStudent Question: ${safeMessage}`;
                
                const response = await safeGenerateContent(ai, {
                    contents: [
                        ...validHistory.map(h => ({ role: h.role, parts: h.parts })),
                        { role: 'user', parts: [{ text: fullMessage }] }
                    ],
                    config: { systemInstruction: systemPrompt }
                });
                return response.text || "Connection interrupted.";
            } catch (e) {
                return "I am having trouble seeing the image right now due to high traffic. Please try again or ask a text-only question.";
            }
        }

        // PATH B: TEXT ONLY (Groq First -> DeepSeek -> Gemini -> OpenRouter)
        const messages = [
            ...history.slice(-5).map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.content })),
            { role: "user", content: `Context: ${fileContext.substring(0, 10000)}\n\nQuestion: ${newMessage}` }
        ];

        // Tier 1: Groq (Llama 3 70b) - Super Fast
        try {
            return await callGroq(messages, systemPrompt);
        } catch (groqError) {
            console.warn("⚠️ Groq Offline. Re-routing to DeepSeek...");
            
            // Tier 2: DeepSeek V3
            try {
                // @ts-ignore
                return await callDeepSeek(messages, systemPrompt, false, false);
            } catch (deepSeekError) {
                console.warn("⚠️ DeepSeek Overload. Re-routing to Gemini...");

                // Tier 3: Gemini Flash
                try {
                     const ai = getAI();
                     const response = await safeGenerateContent(ai, {
                        contents: `System: ${systemPrompt}\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`
                     });
                     return response.text || "";
                } catch (geminiError) {
                    console.warn("⚠️ Gemini Overload. Engaging OpenRouter (Free Fleet)...");

                    // Tier 4: OpenRouter (Infinite Fallback)
                    try {
                        const { callOpenRouter } = await import('./openRouterService');
                        return await callOpenRouter(messages, systemPrompt);
                    } catch (finalError) {
                        return "All Neural Links are currently down. Please check your connection.";
                    }
                }
            }
        }
    }, tier);
};

export const generateHubResponse = async (message: string, context: string): Promise<string> => {
    if (!rateLimiter()) return "The Hub is experiencing heavy traffic. Please signal again momentarily.";
    return requestQueue.add(async () => {
        const ai = getAI();
        const response = await safeGenerateContent(ai, {
            contents: `Student Query: "${sanitizeInput(message)}". \nContext: ${context.substring(0, 5000)}`,
            config: { systemInstruction: "You are overseeing a study group. Be brief, helpful, and encourage collaboration." }
        });
        return response.text || "Monitoring...";
    });
};

export const generateMotivation = async (): Promise<string> => {
    return requestQueue.add(async () => {
        const ai = getAI();
        const response = await safeGenerateContent(ai, {
            contents: "Generate a short, calm, and reassuring academic motivational quote. Max 15 words.",
        });
        return response.text || "You have got this. Focus and breathe.";
    }, 'Fresher'); 
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
    return requestQueue.add(async () => {
        const ai = getAI();
        try {
            const response = await ai.models.generateContent({
                model: TTS_MODEL,
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
    if (!rateLimiter()) throw new Error("Rate limit exceeded. Please wait a moment.");
    return requestQueue.add(async () => {
        const systemPrompt = "You are a Chief Examiner. Create a rigorous yet fair exam. Output ONLY JSON.";
        const groqPrompt = `Create ${config.questionCount} questions based on this text. Return a JSON array with 'question', 'options' (array), 'correct_answer', and 'explanation'. Text: ${text.substring(0, 15000)}`;

        // --- HYDRA STRATEGY (v3.1 - OpenRouter First) ---
        // Tier 1: Gemini (Fastest & Highest Quality)
        try {
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

            const response = await safeGenerateContent(ai, {
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                    systemInstruction: systemPrompt
                }
            });

            const data = JSON.parse(response.text || '[]');
            return data.map((q: any, i: number) => ({ ...q, id: i + 1, type: config.questionType }));
        } catch (e: any) {
            console.warn("⚠️ Gemini Overload/Offline. Engaging OpenRouter...");

            // Tier 2: OpenRouter (FREE fleet - no billing issues)
            try {
                const { callOpenRouter } = await import('./openRouterService');
                const jsonStr = await callOpenRouter([
                    { role: "user", content: groqPrompt }
                ], systemPrompt, true);
                const cleaned = jsonStr.replace(/```json/g, '').replace(/```/g, '');
                const data = JSON.parse(cleaned);
                const questions = Array.isArray(data) ? data : (data.questions || data.items || []);
                return questions.map((q: any, i: number) => ({ ...q, id: i + 1, type: config.questionType }));
            } catch (openRouterError) {
                console.warn("⚠️ OpenRouter Unavailable. Trying DeepSeek R1...");
                
                // Tier 3: DeepSeek (Reasoner)
                try {
                    const jsonStr = await callDeepSeek([
                        { role: "user", content: groqPrompt }
                    ], systemPrompt, true, true);
                    const cleaned = jsonStr.replace(/```json/g, '').replace(/```/g, '');
                    const data = JSON.parse(cleaned);
                    const questions = Array.isArray(data) ? data : (data.questions || data.items || []);
                    return questions.map((q: any, i: number) => ({ ...q, id: i + 1, type: config.questionType }));
                } catch (deepSeekError) {
                    console.warn("⚠️ DeepSeek Overload. Engaging Groq System...");

                    // Tier 4: Groq (Last Resort)
                    const jsonStr = await callGroq([
                        { role: "user", content: groqPrompt }
                    ], systemPrompt, true);
                    const data = JSON.parse(jsonStr);
                    const questions = Array.isArray(data) ? data : (data.questions || data.items || []);
                    return questions.map((q: any, i: number) => ({ ...q, id: i + 1, type: config.questionType }));
                }
            }
        }

    }, userProfile?.subscriptionTier);
};

export const generateProfessorContent = async (text: string, config: QuizConfig): Promise<ProfessorSection[]> => {
    if (!rateLimiter()) throw new Error("Rate limit exceeded. Please wait a moment.");
    return requestQueue.add(async () => {
        const systemPrompt = "You are a kind, clear, and engaging Professor. Use simple language. Explain concepts like I am 12 years old if the topic is complex. Output ONLY JSON.";
        try {
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

            const response = await safeGenerateContent(ai, {
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                    systemInstruction: systemPrompt
                }
            });

            const data = JSON.parse(response.text || '[]');
            return data.map((s: any, i: number) => ({ ...s, id: i + 1 }));
        } catch (e) {
             // Hydra Strategy: Gemini -> DeepSeek R1 -> Groq
             const groqPrompt = `Create a structured lecture from this text. Return JSON array with 'title', 'content', 'analogy' (simple), and 'key_takeaway'. Text: ${text.substring(0, 15000)}`;
             
             try {
                console.log("⚠️ Gemini Overload. Re-routing to DeepSeek R1...");
                const jsonStr = await callDeepSeek([
                    { role: "user", content: groqPrompt }
                ], systemPrompt, true, true);

                const cleaned = jsonStr.replace(/```json/g, '').replace(/```/g, '');
                const data = JSON.parse(cleaned);
                const sections = Array.isArray(data) ? data : (data.sections || data.items || []);
                return sections.map((s: any, i: number) => ({ ...s, id: i + 1 }));

             } catch (deepSeekError) {
                 console.log("⚠️ DeepSeek Overload. Engaging Groq System...");
                 const jsonStr = await callGroq([
                     { role: "user", content: groqPrompt }
                 ], systemPrompt, true);
                 const data = JSON.parse(jsonStr);
                 const sections = Array.isArray(data) ? data : (data.sections || data.items || []);
                 return sections.map((s: any, i: number) => ({ ...s, id: i + 1 }));
             }
        }

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

        const response = await safeGenerateContent(ai, {
            contents: `Develop a ${technique} study framework for: ${content.substring(0, 15000)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                systemInstruction: "You are a Study Coach."
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

        const response = await safeGenerateContent(ai, {
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
        const response = await safeGenerateContent(ai, {
            contents: `Generate a short, reassuring remark for a student who scored ${score} out of ${total}. Max 1 sentence.`,
        });
        return response.text || "Good effort.";
    });
};

export const simplifyExplanation = async (explanation: string, type: 'ELI5' | 'ELA', customInstruction?: string): Promise<string> => {
    return requestQueue.add(async () => {
        const ai = getAI();
        const response = await safeGenerateContent(ai, {
            contents: `${customInstruction || ''} Simplify: ${explanation}`,
            config: {
                systemInstruction: type === 'ELI5' ? "Explain to a child." : "Summarize in 5 words."
            }
        });
        return response.text || explanation;
    });
};
