import { QuizQuestion, QuizConfig, ProfessorSection, ChatMessage, LockInTechnique, StudyProtocol, UserProfile, SubscriptionTier } from "../types";
import { supabase } from "./supabase";
import { createRateLimiter } from '../utils/security';

// Rate Limiter: 60 requests per minute
const rateLimiter = createRateLimiter(60, 60000);

// --- HELPER: JSON REPAIR & PARSE ---
const safeJSONParse = (input: string): any => {
    try {
        // 1. Try direct parse
        return JSON.parse(input);
    } catch (e) {
        try {
            // 2. Try extracting from Markdown code blocks
            const match = input.match(/```json([\s\S]*?)```/);
            if (match && match[1]) return JSON.parse(match[1]);
            
            // 3. Last ditch: Strip all non-JSON characters from start/end
            const firstBrace = input.indexOf('{');
            const firstBracket = input.indexOf('[');
            const start = firstBrace === -1 ? firstBracket : (firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket));
            const lastBrace = input.lastIndexOf('}');
            const lastBracket = input.lastIndexOf(']');
            const end = Math.max(lastBrace, lastBracket);
            
            if (start !== -1 && end !== -1) {
                return JSON.parse(input.substring(start, end + 1));
            }
            throw new Error("No JSON found");
        } catch (finalErr) {
            console.error("Critical JSON Parse Error", input);
            throw new Error("The Neural Link received corrupt data. Please try again.");
        }
    }
};

// --- SECURE AI GATEWAY CALL ---
async function callAIGateway(messages: any[], systemInstruction?: string, jsonMode: boolean = false, retries = 2): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Authentication required for AI services.");

    let lastError: any;

    for (let i = 0; i <= retries; i++) {
        try {
            const { data, error } = await supabase.functions.invoke('ai-gateway', {
                body: { messages, systemInstruction, jsonMode }
            });

            if (error) throw new Error(error.message || "Gateway Error");
            if (!data || !data.data) throw new Error("Empty response from Neural Core.");

            return data.data;

        } catch (e: any) {
            console.warn(`Attempt ${i + 1} failed:`, e.message);
            lastError = e;
            // Wait 1s before retry
            if (i < retries) await new Promise(r => setTimeout(r, 1000));
        }
    }

    throw new Error(lastError?.message || "AI Service Unavailable. Please check your connection.");
}

// --- PUBLIC METHODS ---

export const generateChatResponse = async (history: ChatMessage[], fileContext: string, newMessage: string, tier: SubscriptionTier = 'Fresher'): Promise<string> => {
    const cleanedMessage = newMessage.replace(/system prompt/gi, ""); 
    const messages = [
        ...history.slice(-5).map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.content })),
        { role: "user", content: `Context: ${fileContext.substring(0, 15000)}\n\nQuestion: ${cleanedMessage}` } // Increased context limit
    ];

    const systemInstruction = "You are The Professor, an elite AI tutor committed to academic excellence. Be concise, accurate, and encouraging.";
    return await callAIGateway(messages, systemInstruction);
};

export const generateHubResponse = async (message: string, context: string): Promise<string> => {
    if (!rateLimiter()) return "Rate limit exceeded. The Hub is busy.";
    return await callAIGateway([
        { role: "user", content: `Student Query: "${message}". \nContext: ${context.substring(0, 5000)}` }
    ], "You are overseeing a study group. Be brief, helpful, and encourage collaboration.");
};

export const generateMotivation = async (): Promise<string> => {
    return await callAIGateway([
        { role: "user", content: "Generate a short, calm, and reassuring academic motivational quote. Max 15 words." }
    ]);
};

export const generateQuizFromText = async (text: string, config: QuizConfig, userProfile?: UserProfile): Promise<QuizQuestion[]> => {
    if (!rateLimiter()) throw new Error("Rate limit exceeded.");

    const systemPrompt = "You are a Chief Examiner. Create a rigorous yet fair exam. Output ONLY valid JSON array.";
    const prompt = `Construct a ${config.questionCount}-question examination. Difficulty: ${config.difficulty}. Type: ${config.questionType}. 
    Return a JSON array where each object has: 'question', 'options' (array of strings), 'correct_answer' (string matching one option), and 'explanation'.
    Context: ${text.substring(0, 25000)}`;

    const response = await callAIGateway([{ role: "user", content: prompt }], systemPrompt, true);

    try {
        const data = safeJSONParse(response);
        const questions = Array.isArray(data) ? data : (data.questions || data.items || []);
        if (questions.length === 0) throw new Error("No questions generated.");
        return questions.map((q: any, i: number) => ({ ...q, id: i + 1, type: config.questionType }));
    } catch (e: any) {
        console.error("Quiz Generation Failed:", e);
        throw new Error("Failed to parse examination data. Please simplify the source text or try again.");
    }
};

export const generateProfessorContent = async (text: string, config: QuizConfig): Promise<ProfessorSection[]> => {
    if (!rateLimiter()) throw new Error("Rate limit exceeded.");

    const systemPrompt = "You are a kind, clear, and engaging Professor. Use simple language. Output ONLY valid JSON.";
    const prompt = `Deliver a structured lecture. Analogy Domain: ${config.analogyDomain}. 
    Return JSON array of sections. Each section: 'title', 'content', 'analogy', 'key_takeaway'.
    Context: ${text.substring(0, 25000)}`;

    const response = await callAIGateway([{ role: "user", content: prompt }], systemPrompt, true);

    try {
        const data = safeJSONParse(response);
        const sections = Array.isArray(data) ? data : (data.sections || data.items || []);
        return sections.map((s: any, i: number) => ({ ...s, id: i + 1 }));
    } catch (e) {
        throw new Error("Failed to structure lecture content.");
    }
};

export const generateStudyProtocol = async (content: string, technique: LockInTechnique): Promise<StudyProtocol> => {
    if (technique === 'STANDARD') return { step: 'READ', survey: '', questions: [] };
    
    const response = await callAIGateway([
        { role: "user", content: `Develop a ${technique} study framework for: ${content.substring(0, 15000)}` }
    ], "You are a Study Coach. Output ONLY JSON with 'survey' (string) and 'questions' (string array).", true);

    const data = safeJSONParse(response);
    return { step: technique === 'SQ3R' ? 'SURVEY' : 'QUESTION', ...data };
};

export const generateSuddenDeathQuestion = async (text: string): Promise<QuizQuestion> => {
    const response = await callAIGateway([
        { role: "user", content: `Generate ONE extremely difficult multiple choice question based on: ${text.substring(0, 5000)}` }
    ], "You are the Final Exam Proctor. Output properties: question, options, correct_answer, explanation.", true);

    const data = safeJSONParse(response);
    return { ...data, id: 999, type: 'Multiple Choice' };
};

export const generateWittyFeedback = async (score: number, total: number): Promise<string> => {
    return await callAIGateway([
        { role: "user", content: `Generate a short, reassuring remark for a student who scored ${score} out of ${total}. Max 1 sentence.` }
    ]);
};

export const simplifyExplanation = async (explanation: string, type: 'ELI5' | 'ELA', customInstruction?: string): Promise<string> => {
    return await callAIGateway([
        { role: "user", content: `${customInstruction || ''} Simplify: ${explanation}` }
    ], type === 'ELI5' ? "Explain to a child." : "Summarize in 5 words.");
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
    console.warn("TTS temporarily disabled during security upgrade.");
    return undefined; 
};
