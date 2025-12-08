
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, QuizConfig, ProfessorSection, UserProfile } from "../types";

// Helper to safely get the AI instance
const getAI = () => {
  // Check standard process.env.API_KEY or React specific REACT_APP_GEMINI_API_KEY
  const apiKey = (typeof process !== 'undefined' && process.env)
    ? (process.env.API_KEY || import.meta.env.VITE_GEMINI_API_KEY)
    : undefined;

  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment variables (.env).");
  }
  return new GoogleGenAI({ apiKey });
};

// Robust Error Handler
const handleGeminiError = (error: any): never => {
  console.error("Gemini API Error Detail:", error);

  const msg = error.message || '';
  const status = error.status || 0;

  // Authentication Issues
  if (msg.includes('API_KEY') || status === 400 || status === 401 || status === 403) {
    throw new Error("Access Denied: The API Key is invalid or expired. Please check your configuration.");
  }

  // Rate Limiting (The most common issue)
  if (status === 429 || msg.includes('429') || msg.includes('quota')) {
    throw new Error("Neural Overload: The Professor is handling too many students right now (Rate Limit). Please wait 30 seconds and try again.");
  }

  // Server Errors
  if (status === 500 || status === 502 || status === 503) {
    throw new Error("Campus Maintenance: Google's AI servers are temporarily down. Please try again in a minute.");
  }

  // Safety Filters
  if (msg.includes('SAFETY') || msg.includes('BLOCKED') || (error.response && error.response.promptFeedback?.blockReason)) {
    throw new Error("Content Restricted: The study material triggered safety filters. Please verify the content does not violate safety guidelines.");
  }

  // Model Overload / Length
  if (msg.includes('candidate') && msg.includes('finishReason')) {
    throw new Error("Generation Incomplete: The material was too complex for a single pass. Try breaking the content into smaller chunks.");
  }

  // JSON Parsing Errors (often happens if model hallucinates format)
  if (msg.includes('JSON')) {
    throw new Error("Curriculum Error: The Professor returned a malformed lesson plan. Please try generating again.");
  }

  throw new Error(`System Error: ${msg || "An unexpected error occurred."}`);
};

export const generateQuizFromText = async (text: string, config: QuizConfig, userProfile?: UserProfile): Promise<QuizQuestion[]> => {
  try {
    const ai = getAI();
    const model = "gemini-2.5-flash";

    const { difficulty, questionType, questionCount } = config;

    // Type Instruction
    let typeInstruction = "";
    if (questionType === 'True/False') {
      typeInstruction = "Generate True/False questions. The 'options' array MUST contain exactly two strings: 'True' and 'False'.";
    } else if (questionType === 'Fill in the Gap') {
      typeInstruction = "Generate 'Fill in the gap' style questions. The 'question' text must contain a blank represented by underscores (e.g., '_______'). The 'options' should be potential words or phrases to fill that gap.";
    } else if (questionType === 'Scenario-based') {
      typeInstruction = "Generate scenario-based questions. Each question should start with a short descriptive scenario or case study, followed by a question about it.";
    } else if (questionType === 'Matching') {
      typeInstruction = "Generate questions where the user must identify the correct pair or association. Format as a multiple choice question where the question asks for the match, and options are pairs or single items that complete the match.";
    } else if (questionType === 'Random') {
      typeInstruction = "Generate a mix of question types including Multiple Choice, True/False, Fill in the Gap, and Scenario-based. Randomly distribute them.";
    } else {
      typeInstruction = "Generate standard multiple-choice questions.";
    }

    // Difficulty Instruction
    let difficultyPrompt = `The questions should test deep understanding appropriate for the ${difficulty} level.`;
    if (difficulty === 'Nightmare') {
      difficultyPrompt = "WARNING: You are in NIGHTMARE mode. Generate exceptionally challenging questions that require deep synthesis of multiple concepts, multi-part logical reasoning, or knowledge of obscure historical/theoretical contexts. Focus strictly on edge cases, counter-intuitive examples, and exceptions to general rules. The distractors (wrong options) must be highly plausible, addressing common misconceptions or partial truths. Do not be merciful.";
    }

    // Weakness focus
    let weaknessPrompt = "";
    if (userProfile && userProfile.weaknessFocus.trim()) {
      weaknessPrompt = `The user specifically struggles with: "${userProfile.weaknessFocus}". Prioritize generating questions related to these topics if they appear in the text.`;
    }

    const prompt = `
      You are a strict university professor. 
    Analyze the text provided and generate EXACTLY ${questionCount} questions based on the key concepts.
      
      Configuration:
      - Difficulty: ${difficulty}
      - Question Type: ${questionType}
      - Number of Questions: ${questionCount}
      
      Instructions:
      ${typeInstruction}
      ${difficultyPrompt}
      ${weaknessPrompt}
      - Ensure the 'correct_answer' is exactly one of the strings in 'options'.
      - The 'explanation' should be detailed but brief. ${userProfile?.feedbackDetail === 'Deep Dive' ? 'Provide historical context or derivation where possible.' : 'Keep it concise and direct.'}
      - Return ONLY the JSON object.
      
      Text Content:
      ${text.substring(0, 40000)} 
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
              question: {
                type: Type.STRING,
                description: "The text of the question"
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of possible answers (usually 4, or 2 for True/False)"
              },
              correct_answer: {
                type: Type.STRING,
                description: "The correct answer (must match one of the options exactly)"
              },
              explanation: {
                type: Type.STRING,
                description: "A detailed explanation of why the answer is correct and why others are wrong."
              }
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
    return []; // Unreachable due to handleGeminiError throwing, but keeps TS happy
  }
};

export const generateProfessorContent = async (text: string, config: QuizConfig): Promise<ProfessorSection[]> => {
  try {
    const ai = getAI();
    const model = "gemini-2.5-flash";
    const { personality, analogyDomain } = config;

    let personaInstruction = "";
    switch (personality) {
      case 'Buddy':
        personaInstruction = "You are a casual, encouraging study buddy. Use slang (moderately), be super supportive, and keep the vibe chill. Don't be too formal.";
        break;
      case 'Drill Sergeant':
        personaInstruction = "You are a Drill Sergeant. Be direct, short, and focus on eliminating mistakes. No fluff. Use imperative commands.";
        break;
      case 'ELI5':
        personaInstruction = "Explain Like I'm 5. Use extreme simplification, simple words, and childlike wonder. Assume zero prior knowledge.";
        break;
      case 'Academic':
      default:
        personaInstruction = "You are a formal academic professor. Be precise, definitions-first, and structured.";
        break;
    }

    const prompt = `
      You are a world-class educator who masters the Feynman Technique. 
      Your goal is to teach the user the contents of the provided text.
      
      Persona: ${personaInstruction}
      Analogy Domain: Make analogies related to ${analogyDomain}.
      
      Instructions:
      1. Analyze the text thoroughly.
      2. Break it down into logical sequential learning sections (Minimum 4, Maximum 8 sections).
      3. For each section, explain the concept simply (Feynman technique).
      4. Use a creative real-world analogy from the domain: "${analogyDomain}" to make it stick.
      5. Include occasional slight humor appropriate for exam prep (stress relief).
      6. Provide a key takeaway for each section.
      
      Text Content:
      ${text.substring(0, 40000)}
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
              title: { type: Type.STRING, description: "Title of this lesson section" },
              content: { type: Type.STRING, description: "The core explanation" },
              analogy: { type: Type.STRING, description: `A creative analogy related to ${analogyDomain}` },
              key_takeaway: { type: Type.STRING, description: "One sentence summary" }
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
