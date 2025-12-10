
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

// Safety Middleware to prevent Jailbreaks / Non-Academic use
const checkSafety = async (text: string) => {
    const forbiddenPatterns = [
        "ignore previous instructions",
        "write a poem",
        "how to build a bomb",
        "generate nsfw"
    ];
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

    let typeInstruction = "";
    if (questionType === 'True/False') {
      typeInstruction = "Generate True/False questions. 'options' MUST be ['True', 'False'].";
    } else if (questionType === 'Fill in the Gap') {
      typeInstruction = "Generate 'Fill in the gap' questions. Use underscores for blanks.";
    } else if (questionType === 'Scenario-based') {
      typeInstruction = "Generate scenario-based questions starting with a short case study.";
    } else if (questionType === 'Matching') {
      typeInstruction = "Generate matching pair questions structured as multiple choice.";
    } else if (questionType === 'Random') {
      typeInstruction = "Generate a mix of question types.";
    } else {
      typeInstruction = "Generate standard multiple-choice questions.";
    }

    let difficultyPrompt = `Level: ${difficulty}.`;
    if (difficulty === 'Nightmare') {
      difficultyPrompt = "WARNING: NIGHTMARE MODE. Generate exceptionally challenging questions requiring synthesis and edge-case knowledge. Distractors must be highly plausible.";
    }

    let weaknessPrompt = "";
    if (useWeaknessDestroyer && userProfile?.weaknessFocus.trim()) {
      weaknessPrompt = `WEAKNESS DESTROYER: User struggles with "${userProfile.weaknessFocus}". Prioritize these topics.`;
    }

    let oraclePrompt = "";
    if (useOracle) {
        oraclePrompt = "ORACLE PROTOCOL: Infer potential exam questions based on high-level academic predictions, not just explicit text.";
    }

    const prompt = `
      Act as a strict university professor. Generate ${questionCount} questions.
      
      Config:
      - Difficulty: ${difficulty}
      - Type: ${questionType}
      
      Instructions:
      ${typeInstruction}
      ${difficultyPrompt}
      ${weaknessPrompt}
      ${oraclePrompt}
      - Return ONLY JSON.
      
      Context:
      ${text.substring(0, 50000)} 
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert educational content generator.",
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

    let personaInstruction = "You are a formal academic professor.";
    if (personality === 'Buddy') personaInstruction = "You are a casual study buddy.";
    if (personality === 'Drill Sergeant') personaInstruction = "You are a strict Drill Sergeant.";
    if (personality === 'ELI5') personaInstruction = "Explain Like I'm 5.";

    const prompt = `
      Teach the provided text content.
      
      Persona: ${personaInstruction}
      Analogy Domain: ${analogyDomain}
      
      Instructions:
      1. Break into 4-8 logical sections.
      2. Explain simply (Feynman Technique).
      3. Use creative analogies.
      4. IF a concept involves a process, hierarchy, or timeline, provide a valid Mermaid.js markdown string in 'diagram_markdown'. Otherwise leave it empty string.
      
      Context:
      ${text.substring(0, 50000)}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: `You are an award-winning educator. ${personaInstruction}`,
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
              diagram_markdown: { type: Type.STRING, description: "Optional Mermaid.js markdown code (e.g. graph TD; A-->B;)" }
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
        await checkSafety(newMessage);
        const ai = getAI();
        const model = "gemini-2.5-flash";

        const recentHistory = history.slice(-10).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        const systemInstruction = `
            You are The Professor.
            Context:
            ${fileContext.substring(0, 30000)}
            
            Answer specifically based on this context. Be concise and academic.
        `;

        const chat = ai.chats.create({
            model: model,
            config: { systemInstruction },
            history: recentHistory
        });

        const response = await chat.sendMessage({ message: newMessage });
        return response.text;

    } catch (error) {
        handleGeminiError(error);
        return "The Professor cannot answer right now.";
    }
}
