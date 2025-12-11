
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, QuizConfig, ProfessorSection, UserProfile, ChatMessage } from "../types";

// Helper to safely get the AI instance
const getAI = () => {
  const getEnv = (key: string): string => {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) return (import.meta as any).env[key];
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
    return "";
  };

  const apiKey = getEnv("VITE_GEMINI_API_KEY");

  if (!apiKey) {
    throw new Error("Missing API Key. Please configure VITE_GEMINI_API_KEY in your .env file.");
  }
  return new GoogleGenAI({ apiKey });
};

// --- SMART GOVERNOR RETRY PROTOCOL ---
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async <T>(operation: () => Promise<T>, retries = 5, initialDelay = 2000): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const msg = (error.message || '').toLowerCase();
    const status = error.status || error.response?.status;
    
    // Status 429 = Quota Limit. 
    // FIX: Wait 10-12 seconds. The free tier allows ~1 request every 4 seconds. 
    // Bursting causes 429s. We must cool down significantly.
    
    if (retries > 0) {
        let delay = initialDelay;
        
        if (status === 429 || msg.includes('429') || msg.includes('quota')) {
            console.warn(`⚠️ API Quota Hit (429). Deep Freeze for 10s... (${retries} left)`);
            delay = 10000 + (Math.random() * 3000); // 10-13s delay
        } else if (status === 503 || msg.includes('overloaded')) {
            console.warn(`⚠️ Server Busy (503). Retrying in ${delay/1000}s...`);
            delay = delay * 2; // Exponential backoff
        } else {
            // Non-transient error? Rethrow immediately unless it looks like a network blip
            if (!msg.includes('fetch') && !msg.includes('network')) throw error;
        }

        await wait(delay);
        return withRetry(operation, retries - 1, delay);
    }
    throw error;
  }
};

// Robust Error Handler
const handleGeminiError = (error: any): never => {
  console.error("Gemini API Error Detail:", error);

  const msg = (error.message || '').toLowerCase();
  const status = error.status || 0;

  if (msg.includes('api_key') || status === 400 || status === 401 || status === 403) {
    throw new Error("Access Denied: The API Key is invalid or expired.");
  }
  if (status === 429 || msg.includes('429') || msg.includes('quota')) {
    throw new Error("Neural Overload: Traffic is extremely high. Please wait 30 seconds before trying again.");
  }
  if (status === 500 || status === 502 || status === 503 || msg.includes('overloaded')) {
    throw new Error("Campus Maintenance: The AI professors are grading papers. Try again shortly.");
  }
  if (msg.includes('safety') || msg.includes('blocked')) {
    throw new Error("Content Restricted: Safety filters triggered. Try rewording your notes.");
  }
  if (msg.includes('json')) {
    throw new Error("Curriculum Error: The AI failed to format the lesson plan. Try again.");
  }

  throw new Error(`System Error: ${error.message || "An unexpected error occurred."}`);
};

// Safety Middleware
const checkSafety = async (text: string) => {
    const forbiddenPatterns = ["ignore previous instructions", "write a poem", "generate nsfw"];
    const lower = text.toLowerCase();
    if (forbiddenPatterns.some(p => lower.includes(p))) {
        throw new Error("The Professor refuses to engage with non-academic or unsafe prompts.");
    }
};

export const generateQuizFromText = async (text: string, config: QuizConfig, userProfile?: UserProfile): Promise<QuizQuestion[]> => {
  try {
    await checkSafety(text);
    const ai = getAI();
    const model = "gemini-2.5-flash"; 

    const { difficulty, questionType, questionCount, useOracle, useWeaknessDestroyer, isCramMode } = config;

    let typeInstruction: string = questionType;
    if (questionType === 'Mixed') {
      typeInstruction = "a mix of Multiple Choice, True/False, and Fill in the Gap";
    }

    let instructions = `Generate ${questionCount} ${difficulty} questions. Type: ${typeInstruction}. Strict JSON. No fluff.`;
    
    if (useOracle) instructions += " Predict probable exam questions.";
    if (useWeaknessDestroyer && userProfile?.weaknessFocus) instructions += ` Focus heavily on ${userProfile.weaknessFocus}.`;
    if (isCramMode) instructions += " Questions must be short, rapid-fire style for speed reading.";

    // Context limit to 100k for better document coverage
    const promptText = `
      ${instructions}
      Return JSON array of objects with keys: question, options (array), correct_answer, explanation.
      Context: ${text.substring(0, 100000)} 
    `;

    // Handle Image Content Placeholder
    let contentParts: any[] = [{ text: promptText }];
    
    if (text.includes("[IMAGE_DATA:")) {
        // Extract base64 image data
        const matches = text.match(/\[IMAGE_DATA:(.*?)\]/);
        if (matches && matches[1]) {
            contentParts = [
                { inlineData: { mimeType: "image/jpeg", data: matches[1] } },
                { text: instructions + " Analyze this image content for the exam. If it's a math problem, solve it in the explanation." }
            ];
        }
    }

    const response = await withRetry(async () => {
        return await ai.models.generateContent({
          model: model,
          contents: { role: 'user', parts: contentParts },
          config: {
            systemInstruction: "You are an automated exam generator. Output raw JSON only. No markdown. No chatter.",
            temperature: 0.7, 
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correct_answer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["question", "options", "correct_answer", "explanation"]
              }
            }
          }
        });
    }, 6, 4000); // 6 Retries, 4s initial delay

    if (response.text) {
      const data = JSON.parse(response.text);
      return data.map((q: any, index: number) => ({ ...q, id: index + 1 }));
    } else {
      throw new Error("Empty response from Gemini");
    }

  } catch (error) {
    handleGeminiError(error);
    return [];
  }
};

export const generateProfessorContent = async (text: string, config: QuizConfig): Promise<ProfessorSection[]> => {
  try {
    await checkSafety(text);
    const ai = getAI();
    const model = "gemini-2.5-flash";
    const { personality, analogyDomain } = config;

    const promptText = `
      Teach this content. Break into logical sections. Brief content analysis.
      Persona: ${personality}. Analogy: ${analogyDomain}.
      Include a Mermaid.js diagram code in 'diagram_markdown' if complex.
      Context: ${text.substring(0, 100000)}
    `;

    let contentParts: any[] = [{ text: promptText }];
    
    if (text.includes("[IMAGE_DATA:")) {
        const matches = text.match(/\[IMAGE_DATA:(.*?)\]/);
        if (matches && matches[1]) {
            contentParts = [
                { inlineData: { mimeType: "image/jpeg", data: matches[1] } },
                { text: promptText + " Analyze this image visually. If Math, show steps." }
            ];
        }
    }

    const response = await withRetry(async () => {
        return await ai.models.generateContent({
          model: model,
          contents: { role: 'user', parts: contentParts },
          config: {
            systemInstruction: `You are an expert educator. Output raw JSON only. Be concise and fast.`,
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  analogy: { type: Type.STRING },
                  key_takeaway: { type: Type.STRING },
                  diagram_markdown: { type: Type.STRING }
                },
                required: ["title", "content", "analogy", "key_takeaway"]
              }
            }
          }
        });
    }, 6, 4000);

    if (response.text) {
      const data = JSON.parse(response.text);
      return data.map((s: any, index: number) => ({ ...s, id: index + 1 }));
    } else {
      throw new Error("Empty response from Gemini");
    }

  } catch (error) {
    handleGeminiError(error);
    return [];
  }
};

export const generateChatResponse = async (history: ChatMessage[], fileContext: string, newMessage: string): Promise<string> => {
    try {
        const ai = getAI();
        const model = "gemini-2.5-flash";

        const recentHistory = history.slice(-6).map(msg => {
            if (msg.image) {
                return {
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: msg.image } },
                        { text: msg.content || "Analyze this image." }
                    ]
                };
            }
            return {
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            };
        });

        const systemInstruction = `You are The Professor. Be precise, concise, and academic. Context: ${fileContext.substring(0, 10000)}.`;

        const chat = ai.chats.create({
            model: model,
            config: { 
                systemInstruction,
                maxOutputTokens: 256,
                temperature: 0.7
            },
            history: recentHistory
        });

        const response = await withRetry(async () => {
            return await chat.sendMessage({ message: newMessage });
        }, 3, 3000); 
        
        return response.text || "I cannot answer that right now.";

    } catch (error) {
        console.error(error);
        return "Connection interrupted. The library is closed.";
    }
}

export const simplifyExplanation = async (explanation: string, type: 'ELI5' | 'ELA', context?: string): Promise<string> => {
    try {
        const ai = getAI();
        const model = "gemini-2.5-flash";
        
        let prompt = `Rewrite this explanation to be extremely simple, as if explaining to a 5-year-old. Explanation: "${explanation}"`;
        if (type === 'ELA') prompt = `Rewrite this explanation in the style of ${context}. Explanation: "${explanation}"`;

        const response = await withRetry(async () => {
            return await ai.models.generateContent({
                model: model,
                contents: prompt,
                config: {
                    maxOutputTokens: 150,
                    temperature: 0.8
                }
            });
        }, 2, 2000);
        
        return response.text || explanation;
    } catch (e) {
        return explanation;
    }
}
