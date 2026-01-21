import { SubscriptionTier } from '../types';

// ENV Helper
const getDeepSeekKey = () => {
    let key = "";
    try {
        // @ts-ignore
        if (import.meta.env.VITE_DEEPSEEK_API_KEY) key = import.meta.env.VITE_DEEPSEEK_API_KEY;
    } catch {}
    
    if (!key && typeof process !== 'undefined' && process.env.VITE_DEEPSEEK_API_KEY) {
        key = process.env.VITE_DEEPSEEK_API_KEY;
    }
    return key;
};

// DeepSeek Models
const MODEL_CHAT = "deepseek-chat"; // V3
const MODEL_REASONER = "deepseek-reasoner"; // R1

export const callDeepSeek = async (
    messages: any[], 
    systemPrompt: string, 
    jsonMode: boolean = false,
    useReasoner: boolean = false
): Promise<string> => {
    const key = getDeepSeekKey();
    if (!key) throw new Error("DeepSeek Offline: API Key Missing.");

    const model = useReasoner ? MODEL_REASONER : MODEL_CHAT;
    
    // R1 (Reasoner) specific handling: it pushes reasoning into built-in COT, 
    // but the API interface is OpenAI compatible.
    
    const payload = {
        model,
        messages: [
            { role: "system", content: systemPrompt },
            ...messages
        ],
        stream: false,
        temperature: useReasoner ? 0.6 : 0.7, // R1 benefits from slightly lower temp
        response_format: jsonMode ? { type: "json_object" } : undefined
    };

    try {
        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${key}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`DeepSeek Error ${response.status}: ${err}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "";
    } catch (error: any) {
        console.error("DeepSeek Call Failed:", error);
        throw error;
    }
};
