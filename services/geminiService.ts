
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, QuizConfig, ProfessorSection, UserProfile, ChatMessage } from "../types";

// --- MEMORY BANK (SMART CACHE) ---
const CACHE_PREFIX = 'gemini_stealth_cache_';
const CACHE_EXPIRY = 1000 * 60 * 60 * 24; // 24 Hours

const generateCacheKey = (text: string, config: any, mode: string): string => {
  // Create a unique fingerprint for the request
  const contentSignature = text.substring(0, 50) + text.length + text.slice(-50);
  const configSignature = JSON.stringify(config);
  let hash = 0;
  const str = `${mode}_${contentSignature}_${configSignature}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return `${CACHE_PREFIX}${hash}`;
};

const getFromCache = <T>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const entry = JSON.parse(cached);
    if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(key);
      return null;
    }
    // Stealth Log: Cache hit means 0 API risk
    console.debug("⚡ Memory Bank Access: Undetected");
    return entry.data as T;
  } catch (e) {
    return null;
  }
};

const saveToCache = (key: string, data: any) => {
  try {
    // Garbage collection: Keep storage clean to avoid quota errors
    if (localStorage.length > 150) {
        const items = [];
        for (let i=0; i<localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(CACHE_PREFIX)) items.push(k);
        }
        items.slice(0, 50).forEach(k => localStorage.removeItem(k));
    }
    const entry = { timestamp: Date.now(), data };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    // Silent fail on storage error
  }
};

// --- HYDRA PROTOCOL V2: MULTI-KEY ROTATION WITH BANISHING ---
interface KeyNode {
    key: string;
    index: number;
    cooldownUntil: number;
}

let keyPool: KeyNode[] = [];
let currentKeyIndex = 0;

const initKeyPool = () => {
    if (keyPool.length > 0) return; // Already initialized

    const getEnv = (key: string): string => {
        if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) return (import.meta as any).env[key];
        if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
        return "";
    };

    const keys: string[] = [];
    const mainKey = getEnv("VITE_GEMINI_API_KEY");
    if (mainKey) keys.push(mainKey);

    // Scan for auxiliary keys (Explicitly checking for 2, 3, 4 as requested, and up to 10)
    for (let i = 2; i <= 10; i++) {
        const k = getEnv(`VITE_GEMINI_API_KEY_${i}`);
        if (k) keys.push(k);
    }

    if (keys.length === 0) {
        throw new Error("Protocol Failure: No Neural Keys Detected. Please check your .env configuration.");
    }
    
    // Initialize nodes
    keyPool = keys.map((k, i) => ({ key: k, index: i + 1, cooldownUntil: 0 }));
    
    // Randomized Start to distribute load
    currentKeyIndex = Math.floor(Math.random() * keys.length);
    console.log(`🔌 Hydra System Online: ${keyPool.length} Neural Nodes Connected. Initializing on Node #${keyPool[currentKeyIndex].index}.`);
};

const getActiveAI = (): GoogleGenAI => {
    if (keyPool.length === 0) initKeyPool();
    
    // Find a valid key (not in cooldown)
    let attempts = 0;
    while (attempts < keyPool.length) {
        const node = keyPool[currentKeyIndex];
        if (Date.now() > node.cooldownUntil) {
            return new GoogleGenAI({ apiKey: node.key });
        }
        // If current is in cooldown, move to next
        currentKeyIndex = (currentKeyIndex + 1) % keyPool.length;
        attempts++;
    }

    // If all are in cooldown, pick the one with shortest wait (or just the current one and hope)
    console.warn("⚠️ All Neural Nodes are cooling down. Forcing execution on current node.");
    return new GoogleGenAI({ apiKey: keyPool[currentKeyIndex].key });
};

const banishCurrentKey = async () => {
    if (keyPool.length <= 1) return false;
    
    // Mark current key as "cooling down" for 60 seconds
    keyPool[currentKeyIndex].cooldownUntil = Date.now() + 60000;
    console.warn(`🚫 Node #${keyPool[currentKeyIndex].index} Banished for 60s (Rate Limit).`);

    // Rotate to next
    currentKeyIndex = (currentKeyIndex + 1) % keyPool.length;
    
    // Add jitter
    const jitter = 500 + Math.random() * 1000;
    await new Promise(r => setTimeout(r, jitter));
    
    console.log(`🔄 Rerouting to Node #${keyPool[currentKeyIndex].index}...`);
    return true;
};

// --- EXECUTION ENGINE ---

const executeWithHydra = async <T>(
    operation: (ai: GoogleGenAI) => Promise<T>, 
    retries = 3
): Promise<T> => {
    try {
        const ai = getActiveAI();
        return await operation(ai);
    } catch (error: any) {
        const msg = (error.message || '').toLowerCase();
        const status = error.status || error.response?.status;

        // INTERCEPT: Rate Limits (429) & Quota Exhaustion
        if (status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('exhausted')) {
            // Attempt Rotation
            const rotated = await banishCurrentKey();
            
            if (rotated) {
                // Retry with new key
                return executeWithHydra(operation, retries); 
            }
            
            // If we run out of keys or rotation fails, perform standard backoff
            if (retries > 0) {
                // Exponential Backoff with Jitter
                const delay = 2000 + (Math.random() * 1000);
                await new Promise(resolve => setTimeout(resolve, delay));
                return executeWithHydra(operation, retries - 1);
            }
            throw new Error("System Capacity Reached. All 4 Neural Nodes are overloaded. Please wait 1 minute.");
        }
        
        // INTERCEPT: Server Overload (503)
        if (status === 503 || msg.includes('overloaded')) {
             if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return executeWithHydra(operation, retries - 1);
             }
        }

        throw error;
    }
};

// Safety & Privacy Middleware
const checkSafety = async (text: string) => {
    const forbiddenPatterns = ["ignore previous instructions", "generate nsfw"];
    const lower = text.toLowerCase();
    if (forbiddenPatterns.some(p => lower.includes(p))) {
        throw new Error("Content Policy Violation.");
    }
};

// --- PUBLIC INTERFACE ---

export const generateQuizFromText = async (text: string, config: QuizConfig, userProfile?: UserProfile): Promise<QuizQuestion[]> => {
  const cacheKey = generateCacheKey(text, config, 'QUIZ');
  const cached = getFromCache<QuizQuestion[]>(cacheKey);
  if (cached) return cached;

  await checkSafety(text);
  const model = "gemini-2.5-flash"; 

  const { difficulty, questionType, questionCount, useOracle, useWeaknessDestroyer, isCramMode } = config;

  let typeInstruction: string = questionType;
  if (questionType === 'Mixed') {
    typeInstruction = "a mix of Multiple Choice, True/False, and Fill in the Gap";
  }

  let instructions = `Generate ${questionCount} ${difficulty} questions. Type: ${typeInstruction}. Strict JSON.`;
  if (useOracle) instructions += " Predict probable exam questions.";
  if (useWeaknessDestroyer && userProfile?.weaknessFocus) instructions += ` Focus on ${userProfile.weaknessFocus}.`;
  if (isCramMode) instructions += " Short, rapid-fire questions.";

  const limitedText = text.substring(0, 30000);

  const promptText = `
    ${instructions}
    Return JSON array: [{ "question": "...", "options": ["..."], "correct_answer": "...", "explanation": "..." }]
    Context: ${limitedText} 
  `;

  let contentParts: any[] = [{ text: promptText }];
  if (text.includes("[IMAGE_DATA:")) {
      const matches = text.match(/\[IMAGE_DATA:(.*?)\]/);
      if (matches && matches[1]) {
          contentParts = [
              { inlineData: { mimeType: "image/jpeg", data: matches[1] } },
              { text: instructions + " Analyze this image. Solve if math/science." }
          ];
      }
  }

  try {
      const response = await executeWithHydra(async (ai) => {
        return await ai.models.generateContent({
          model: model,
          contents: { role: 'user', parts: contentParts },
          config: {
            systemInstruction: "You are an exam generator. Output raw JSON only. No markdown.",
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
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        const result = data.map((q: any, index: number) => ({ ...q, id: index + 1 }));
        saveToCache(cacheKey, result);
        return result;
      } else {
        throw new Error("Empty response");
      }
  } catch (error: any) {
      console.error(error);
      if (error.message.includes("Capacity")) throw error;
      return [];
  }
};

export const generateProfessorContent = async (text: string, config: QuizConfig): Promise<ProfessorSection[]> => {
  const cacheKey = generateCacheKey(text, config, 'PROFESSOR');
  const cached = getFromCache<ProfessorSection[]>(cacheKey);
  if (cached) return cached;

  await checkSafety(text);
  const model = "gemini-2.5-flash";
  const { personality, analogyDomain } = config;
  const limitedText = text.substring(0, 30000);

  const promptText = `
    Teach this. Logical sections. Brief.
    Persona: ${personality}. Analogy: ${analogyDomain}.
    Complex topics? Include Mermaid.js in 'diagram_markdown'.
    Context: ${limitedText}
  `;

  let contentParts: any[] = [{ text: promptText }];
  if (text.includes("[IMAGE_DATA:")) {
      const matches = text.match(/\[IMAGE_DATA:(.*?)\]/);
      if (matches && matches[1]) {
          contentParts = [
              { inlineData: { mimeType: "image/jpeg", data: matches[1] } },
              { text: promptText + " Analyze this image visually." }
          ];
      }
  }

  try {
      const response = await executeWithHydra(async (ai) => {
        return await ai.models.generateContent({
          model: model,
          contents: { role: 'user', parts: contentParts },
          config: {
            systemInstruction: `You are an expert educator. Output raw JSON only. Concise.`,
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
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        const result = data.map((s: any, index: number) => ({ ...s, id: index + 1 }));
        saveToCache(cacheKey, result);
        return result;
      } else {
        throw new Error("Empty response");
      }
  } catch (error: any) {
      console.error(error);
      if (error.message.includes("Capacity")) throw error;
      return [];
  }
};

export const generateChatResponse = async (history: ChatMessage[], fileContext: string, newMessage: string): Promise<string> => {
    try {
        const model = "gemini-2.5-flash";
        const recentHistory = history.slice(-6).map(msg => {
            if (msg.image) {
                return {
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: msg.image } },
                        { text: msg.content || "Analyze." }
                    ]
                };
            }
            return {
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            };
        });

        const limitedContext = fileContext.substring(0, 5000);
        const systemInstruction = `You are The Professor. Precise. Academic. Context: ${limitedContext}.`;

        const response = await executeWithHydra(async (ai) => {
            const chat = ai.chats.create({
                model: model,
                config: { 
                    systemInstruction,
                    maxOutputTokens: 256,
                    temperature: 0.7
                },
                history: recentHistory
            });
            return await chat.sendMessage({ message: newMessage });
        }, 1); // Reduced retries for chat
        
        return response.text || "I cannot answer that right now.";

    } catch (error) {
        return "Connection interrupted. The library is closed.";
    }
}

export const simplifyExplanation = async (explanation: string, type: 'ELI5' | 'ELA', context?: string): Promise<string> => {
    const cacheKey = generateCacheKey(explanation, { type, context }, 'EXPLAIN');
    const cached = getFromCache<string>(cacheKey);
    if (cached) return cached;

    try {
        const model = "gemini-2.5-flash";
        let prompt = `Rewrite simply (ELI5): "${explanation}"`;
        if (type === 'ELA') prompt = `Rewrite as ${context}: "${explanation}"`;

        const response = await executeWithHydra(async (ai) => {
            return await ai.models.generateContent({
                model: model,
                contents: prompt,
                config: {
                    maxOutputTokens: 150,
                    temperature: 0.8
                }
            });
        }, 2);
        
        const result = response.text || explanation;
        saveToCache(cacheKey, result);
        return result;
    } catch (e) {
        return explanation;
    }
}
