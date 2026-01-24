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
const GROQ_MODEL = "llama-3.3-70b-versatile"; // Updated to new stable model

// ...

export const generateChatResponse = async (history: ChatMessage[], fileContext: string, newMessage: string, tier: SubscriptionTier = 'Fresher'): Promise<string> => {
    // ... (keep pre-checks)
        // PATH A: VISION (Keep as is)
        // ... 

        // PATH B: TEXT ONLY (Groq First -> Gemini -> OpenRouter -> DeepSeek)
        const messages = [
            ...history.slice(-5).map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.content })),
            { role: "user", content: `Context: ${fileContext.substring(0, 10000)}\n\nQuestion: ${newMessage}` }
        ];

        // Tier 1: Groq (Llama 3 70b) - Super Fast
        try {
            return await callGroq(messages, systemPrompt);
        } catch (groqError) {
            console.warn("⚠️ Groq Offline. Re-routing to Gemini...");
            
            // Tier 2: Gemini Flash (More reliable than DeepSeek right now)
            try {
                 const ai = getAI();
                 const response = await safeGenerateContent(ai, {
                    contents: `System: ${systemPrompt}\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`
                 });
                 return response.text || "";
            } catch (geminiError) {
                console.warn("⚠️ Gemini Overload. Engaging OpenRouter (Free Fleet)...");

                // Tier 3: OpenRouter (Infinite Fallback)
                try {
                    const { callOpenRouter } = await import('./openRouterService');
                    return await callOpenRouter(messages, systemPrompt);
                } catch (openRouterError) {
                    console.warn("⚠️ OpenRouter Unavailable. Trying DeepSeek R1 (Last Resort)...");
                    
                    // Tier 4: DeepSeek V3 (Moved to last due to 402 errors)
                    try {
                        // @ts-ignore
                        return await callDeepSeek(messages, systemPrompt, false, false);
                    } catch (deepSeekError) {
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
