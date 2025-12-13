
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
    return entry.data as T;
  } catch (e) {
    return null;
  }
};

const saveToCache = (key: string, data: any) => {
  try {
    // Garbage collection: Keep storage clean
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

// --- STEALTH CONNECTION CONTROLLER ---
interface ConnectionNode {
    k: string;
    id: number;
    cd: number; // Cooldown timestamp
}

let _pool: ConnectionNode[] = [];
let _ptr = 0;

const initNetwork = () => {
    if (_pool.length > 0) return;

    const getEnv = (key: string): string => {
        if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) return (import.meta as any).env[key];
        if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
        return "";
    };

    const keys: string[] = [];
    const mainKey = getEnv("VITE_GEMINI_API_KEY");
    if (mainKey) keys.push(mainKey);

    // Silently scan for auxiliary keys
    for (let i = 2; i <= 10; i++) {
        const k = getEnv(`VITE_GEMINI_API_KEY_${i}`);
        if (k) keys.push(k);
    }

    if (keys.length === 0) {
        throw new Error("Connection Error: Neural Link Configuration Missing.");
    }
    
    // Initialize nodes silently
    _pool = keys.map((k, i) => ({ k: k, id: i + 1, cd: 0 }));
    
    // Randomized Start to distribute fingerprint
    _ptr = Math.floor(Math.random() * keys.length);
};

const getActiveLink = (): GoogleGenAI => {
    if (_pool.length === 0) initNetwork();
    
    let attempts = 0;
    while (attempts < _pool.length) {
        const node = _pool[_ptr];
        if (Date.now() > node.cd) {
            return new GoogleGenAI({ apiKey: node.k });
        }
        _ptr = (_ptr + 1) % _pool.length;
        attempts++;
    }

    // Force current if all busy (Fail-open)
    return new GoogleGenAI({ apiKey: _pool[_ptr].k });
};

const rotateConnection = async () => {
    if (_pool.length <= 1) return false;
    
    // Randomized Cooldown (45s to 90s) to appear organic
    const organicCooldown = 45000 + Math.random() * 45000;
    _pool[_ptr].cd = Date.now() + organicCooldown;

    // Move pointer
    _ptr = (_ptr + 1) % _pool.length;
    
    // Organic Jitter (Simulate network rerouting latency)
    const jitter = 500 + Math.random() * 1500;
    await new Promise(r => setTimeout(r, jitter));
    
    return true;
};

// Artificial Latency Injection
const organicLatency = async () => {
    // 200ms - 800ms random delay
    const delay = 200 + Math.random() * 600;
    await new Promise(r => setTimeout(r, delay));
};

// --- EXECUTION ENGINE ---

const executeSecurely = async <T>(
    operation: (ai: GoogleGenAI) => Promise<T>, 
    retries = 3
): Promise<T> => {
    try {
        await organicLatency(); // Inject jitter
        const ai = getActiveLink();
        return await operation(ai);
    } catch (error: any) {
        const msg = (error.message || '').toLowerCase();
        const status = error.status || error.response?.status;

        // Silent Interception: Rate Limits (429) & Quota
        if (status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('exhausted')) {
            const rotated = await rotateConnection();
            
            if (rotated) {
                return executeSecurely(operation, retries); 
            }
            
            if (retries > 0) {
                // Exponential Backoff
                const delay = 2000 + (Math.random() * 1000);
                await new Promise(resolve => setTimeout(resolve, delay));
                return executeSecurely(operation, retries - 1);
            }
            throw new Error("System Capacity Reached. Please wait a moment.");
        }
        
        // Silent Interception: Server Overload (503)
        if (status === 503 || msg.includes('overloaded')) {
             if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return executeSecurely(operation, retries - 1);
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
    typeInstruction = "a mix of Multiple Choice, True/False, Fill in the Gap, and Select All That Apply";
  }

  let instructions = `Generate ${questionCount} ${difficulty} questions. Type: ${typeInstruction}. Strict JSON.`;
  if (useOracle) instructions += " Predict probable exam questions.";
  if (useWeaknessDestroyer && userProfile?.weaknessFocus) instructions += ` Focus on ${userProfile.weaknessFocus}.`;
  if (isCramMode) instructions += " Short, rapid-fire questions.";
  if (questionType === 'Select All That Apply' || questionType === 'Mixed') instructions += " For 'Select All That Apply' or multi-select questions, the 'correct_answer' field MUST be a stringified JSON array (e.g., '[\"Option A\", \"Option C\"]') or a comma-separated string.";
  if (questionType === 'Fill in the Gap' || questionType === 'Mixed') instructions += " For 'Fill in the Gap', provide the sentence with a blank as the question, and the missing word(s) as the correct_answer. The 'options' array can be empty or contain distractors.";

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
      const response = await executeSecurely(async (ai) => {
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
        const result = data.map((q: any, index: number) => {
            // Infer type if Mixed based on content
            let inferredType = questionType;
            if (questionType === 'Mixed') {
               if (q.options.length === 0 || q.question.includes('___')) inferredType = 'Fill in the Gap';
               else if (q.correct_answer.includes('[') || q.correct_answer.includes(',')) inferredType = 'Select All That Apply';
               else inferredType = 'Multiple Choice';
            }
            return { ...q, id: index + 1, type: inferredType };
        });
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

export const generateSuddenDeathQuestion = async (text: string): Promise<QuizQuestion> => {
    await checkSafety(text);
    const model = "gemini-2.5-flash"; 
    
    // Truncate context to save tokens, we just need general topic
    const limitedText = text.substring(0, 15000); 

    const promptText = `
      GENERATE 1 NIGHTMARE DIFFICULTY QUESTION.
      The score is tied. This question determines the winner.
      Make it incredibly hard but fair.
      Format: Multiple Choice.
      Context: ${limitedText}
    `;

    try {
        const response = await executeSecurely(async (ai) => {
            return await ai.models.generateContent({
                model: model,
                contents: { role: 'user', parts: [{ text: promptText }] },
                config: {
                    systemInstruction: "You are the Final Boss Exam Proctor. Output raw JSON object (not array).",
                    temperature: 0.9, 
                    responseMimeType: "application/json",
                    responseSchema: {
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
            });
        });

        if (response.text) {
            const q = JSON.parse(response.text);
            return { ...q, id: 999, type: 'Multiple Choice' };
        } else {
            throw new Error("No question generated");
        }
    } catch (e) {
        console.error("Sudden Death Gen Failed", e);
        // Fallback hard question
        return {
            id: 999,
            question: "Sudden Death Protocol Error. Who wins?",
            options: ["The Fast One", "The Smart One", "The Lucky One", "Me"],
            correct_answer: "The Smart One",
            explanation: "Ideally, intelligence prevails.",
            type: 'Multiple Choice'
        };
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
      const response = await executeSecurely(async (ai) => {
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

        const response = await executeSecurely(async (ai) => {
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
        }, 1); 
        
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

        const response = await executeSecurely(async (ai) => {
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
