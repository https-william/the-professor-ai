import { QuizQuestion, QuizConfig, ProfessorSection, ChatMessage, LockInTechnique, StudyProtocol, UserProfile, SubscriptionTier } from "../types";
import { supabase } from "./supabase";
import { createRateLimiter } from '../utils/security';

// Rate Limiter: 60 requests per minute
const rateLimiter = createRateLimiter(60, 60000); // Keeping client-side throttle for UI feedback

// --- SECURE AI GATEWAY CALL ---
async function callAIGateway(messages: any[], systemInstruction?: string, jsonMode: boolean = false): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Authentication required for AI services.");

    const { data, error } = await supabase.functions.invoke('ai-gateway', {
        body: { messages, systemInstruction, jsonMode }
    });

    if (error) {
        console.error("AI Gateway Error:", error);
        throw new Error(error.message || "AI Service disruption.");
    }

    return data.data || "";
}

// --- PUBLIC METHODS ---

export const generateChatResponse = async (history: ChatMessage[], fileContext: string, newMessage: string, tier: SubscriptionTier = 'Fresher'): Promise<string> => {
    // Basic Sanitization
    const cleanedMessage = newMessage.replace(/system prompt/gi, ""); 

    // Prepare Messages
    const messages = [
        ...history.slice(-5).map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.content })),
        { role: "user", content: `Context: ${fileContext.substring(0, 10000)}\n\nQuestion: ${cleanedMessage}` }
    ];

    const systemInstruction = "You are The Professor, an elite AI tutor committed to academic excellence.";
    
    return await callAIGateway(messages, systemInstruction);
};

export const generateHubResponse = async (message: string, context: string): Promise<string> => {
    if (!rateLimiter()) return "The Hub is experiencing heavy traffic.";
    
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

    const systemPrompt = "You are a Chief Examiner. Create a rigorous yet fair exam. Output ONLY JSON.";
    const prompt = `Construct a ${config.questionCount}-question examination. Difficulty: ${config.difficulty}. Type: ${config.questionType}. 
    Return a JSON array with 'question', 'options' (array), 'correct_answer', and 'explanation'.
    Context: ${text.substring(0, 20000)}`;

    const response = await callAIGateway([
        { role: "user", content: prompt }
    ], systemPrompt, true);

    try {
        const cleaned = response.replace(/```json/g, '').replace(/```/g, '');
        const data = JSON.parse(cleaned);
        const questions = Array.isArray(data) ? data : (data.questions || data.items || []);
        return questions.map((q: any, i: number) => ({ ...q, id: i + 1, type: config.questionType }));
    } catch (e) {
        console.error("Quiz Parse Error", e);
        return [];
    }
};

export const generateProfessorContent = async (text: string, config: QuizConfig): Promise<ProfessorSection[]> => {
    if (!rateLimiter()) throw new Error("Rate limit exceeded.");

    const systemPrompt = "You are a kind, clear, and engaging Professor. Use simple language. Output ONLY JSON.";
    const prompt = `Deliver a structured lecture. Analogy Domain: ${config.analogyDomain}. 
    Return JSON array with 'title', 'content', 'analogy', 'key_takeaway'.
    Context: ${text.substring(0, 20000)}`;

    const response = await callAIGateway([
        { role: "user", content: prompt }
    ], systemPrompt, true);

    try {
        const cleaned = response.replace(/```json/g, '').replace(/```/g, '');
        const data = JSON.parse(cleaned);
        const sections = Array.isArray(data) ? data : (data.sections || data.items || []);
        return sections.map((s: any, i: number) => ({ ...s, id: i + 1 }));
    } catch (e) {
        return [];
    }
};

export const generateStudyProtocol = async (content: string, technique: LockInTechnique): Promise<StudyProtocol> => {
    if (technique === 'STANDARD') return { step: 'READ', survey: '', questions: [] };
    
    const response = await callAIGateway([
        { role: "user", content: `Develop a ${technique} study framework for: ${content.substring(0, 15000)}` }
    ], "You are a Study Coach. Output ONLY JSON with 'survey' (string) and 'questions' (string array).", true);

    const data = JSON.parse(response.replace(/```json/g, '').replace(/```/g, '') || '{}');
    return { step: technique === 'SQ3R' ? 'SURVEY' : 'QUESTION', ...data };
};

export const generateSuddenDeathQuestion = async (text: string): Promise<QuizQuestion> => {
    const response = await callAIGateway([
        { role: "user", content: `Generate ONE extremely difficult multiple choice question based on: ${text.substring(0, 5000)}` }
    ], "You are the Final Exam Proctor. Output properties: question, options, correct_answer, explanation.", true);

    const data = JSON.parse(response.replace(/```json/g, '').replace(/```/g, '') || '{}');
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
    // Note: TTS is extremely expensive/hard to proxy simply via JSON.
    // For now, we stub it or we'd need a dedicated Edge Function for binary streaming.
    // Returning undefined temporarily to secure the lock.
    console.warn("TTS temporarily disabled during security upgrade.");
    return undefined; 
};
