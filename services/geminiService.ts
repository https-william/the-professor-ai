
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

// Robust Error Handler
const handleGeminiError = (error: any): never => {
  console.error("Gemini API Error Detail:", error);

  const msg = error.message || '';
  const status = error.status || 0;

  if (msg.includes('API_KEY') || status === 400 || status === 401 || status === 403) {
    throw new Error("Access Denied: The API Key is invalid or expired.");
  }
  if (status === 429 || msg.includes('429') || msg.includes('quota')) {
    throw new Error("Neural Overload: Rate Limit Reached. Please wait 30 seconds.");
  }
  if (status === 500 || status === 502 || status === 503) {
    throw new Error("Campus Maintenance: AI Servers are temporarily down.");
  }
  if (msg.includes('SAFETY') || msg.includes('BLOCKED')) {
    throw new Error("Content Restricted: Safety filters triggered.");
  }
  if (msg.includes('JSON')) {
    throw new Error("Curriculum Error: Malformed lesson plan. Try again.");
  }

  throw new Error(`System Error: ${msg || "An unexpected error occurred."}`);
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

    const { difficulty, questionType, questionCount, useOracle, useWeaknessDestroyer } = config;

    let typeInstruction: string = questionType;
    if (questionType === 'Mixed') {
      typeInstruction = "a mix of Multiple Choice, True/False, and Fill in the Gap";
    }

    let instructions = `Generate ${questionCount} ${difficulty} questions. Type: ${typeInstruction}. Strict JSON. No fluff.`;
    
    if (useOracle) instructions += " Predict probable exam questions.";
    if (useWeaknessDestroyer && userProfile?.weaknessFocus) instructions += ` Focus heavily on ${userProfile.weaknessFocus}.`;

    const promptText = `
      ${instructions}
      Return JSON array of objects with keys: question, options (array), correct_answer, explanation.
      Context: ${text.substring(0, 30000)} 
    `;

    // Handle Image Content Placeholder
    let contentParts: any[] = [{ text: promptText }];
    
    if (text.includes("[IMAGE_DATA:")) {
        // Extract base64 image data
        const matches = text.match(/\[IMAGE_DATA:(.*?)\]/);
        if (matches && matches[1]) {
            contentParts = [
                { inlineData: { mimeType: "image/jpeg", data: matches[1] } },
                { text: instructions + " Analyze this image content for the exam." }
            ];
        }
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: { role: 'user', parts: contentParts },
      config: {
        systemInstruction: "You are an automated exam generator. Output raw JSON only. No markdown. No chatter.",
        temperature: 0.7, // Optimized for creativity vs speed
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
      Context: ${text.substring(0, 30000)}
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

    const response = await ai.models.generateContent({
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

        // Add file context to system instruction if text, or prepend to first message
        const systemInstruction = `You are The Professor. Be precise, concise, and academic. Context: ${fileContext.substring(0, 5000)}.`;

        const chat = ai.chats.create({
            model: model,
            config: { 
                systemInstruction,
                maxOutputTokens: 256, // LOWER TOKEN LIMIT FOR SPEED
                temperature: 0.7
            },
            history: recentHistory
        });

        const response = await chat.sendMessage({ message: newMessage });
        return response.text || "I cannot answer that right now.";

    } catch (error) {
        console.error(error);
        return "Connection interrupted.";
    }
}
