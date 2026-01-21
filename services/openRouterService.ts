
// OpenRouter Service - The "Infinite Fallback" Layer
// Rotates through free models (Gemma, Mistral, Phi-3, Zephyr) to ensure zero cost availability.

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// List of "Free Forever" models on OpenRouter
// Prioritize fast, high-quality small models
const FREE_MODELS = [
    "google/gemma-7b-it:free",
    "mistralai/mistral-7b-instruct:free",
    "microsoft/phi-3-mini-128k-instruct:free",
    "huggingfaceh4/zephyr-7b-beta:free",
    "openchat/openchat-7b:free"
];

const getAPIKey = () => {
    // @ts-ignore
    if (import.meta.env.VITE_OPENROUTER_API_KEY) return import.meta.env.VITE_OPENROUTER_API_KEY;
    if (typeof process !== 'undefined' && process.env.VITE_OPENROUTER_API_KEY) return process.env.VITE_OPENROUTER_API_KEY;
    return "";
};

export const callOpenRouter = async (messages: any[], systemPrompt: string, jsonMode: boolean = false): Promise<string> => {
    const key = getAPIKey();
    if (!key) throw new Error("OpenRouter Key Missing");

    // Try models in order until one works
    for (const model of FREE_MODELS) {
        try {
            console.log(`📡 OpenRouter: Trying ${model}...`);
            const payload = {
                model: model,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages
                ],
                temperature: 0.7,
                // Some free models don't support json_object mode, so we rely on prompt engineering if jsonMode is true
                // But we pass it if valid.
                response_format: jsonMode ? { type: "json_object" } : undefined
            };

            const response = await fetch(OPENROUTER_API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${key}`,
                    "HTTP-Referer": "https://theprofessor.ai", // Required by OpenRouter
                    "X-Title": "The Professor",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                 const err = await response.text();
                 console.warn(`OpenRouter ${model} failed: ${err}`);
                 continue; // Try next model
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || "";

        } catch (e) {
            console.warn(`OpenRouter ${model} error:`, e);
            // Continue to next model
        }
    }

    throw new Error("All OpenRouter Free Models Unavailable.");
};
