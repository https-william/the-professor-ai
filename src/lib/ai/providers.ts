/**
 * Multi-Provider AI Configuration
 * 
 * Priority Order:
 * 1. GPT4Free (g4f) - Free, multi-provider — uses g4f server or public API
 * 2. Kimi 2.5 (NVIDIA) - Secondary
 * 3. Trinity Large (OpenRouter) - Backup
 * 4. Groq - Main logic provider
 */

export type AIProvider = 'groq';

interface ProviderConfig {
    name: string;
    baseUrl: string;
    model: string;
    envKey: string;
    bestFor: string;
    noKeyRequired?: boolean;
}

export const AI_PROVIDERS: Record<AIProvider, ProviderConfig> = {
    groq: {
        name: 'Groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        envKey: 'GROQ_API_KEY',
        bestFor: 'Primary - Fast Llama 3 on Groq rotation',
    },
};

/**
 * Strip ad injections / watermarks from g4f free provider responses.
 * Some providers (like ApiAirforce) append proxy ads to responses.
 */
function cleanG4fResponse(content: string): string {
    // Common known ad patterns injected by free providers
    const adPatterns = [
        /\n+Need proxies cheaper than the market\?[\s\S]*$/i,
        /\n+(?:Visit|Check out|Try)\s+https?:\/\/\S+\s*$/i,
        /\n+(?:Sponsored|Ad|Advertisement):?\s+[\s\S]*$/i,
        /\n+---\n+(?:Powered|Generated) by[\s\S]*$/i,
        /\n+https?:\/\/op\.wtf\s*$/i,
    ];
    
    let cleaned = content;
    for (const pattern of adPatterns) {
        cleaned = cleaned.replace(pattern, '');
    }
    return cleaned.trim();
}

/**
 * Check if a provider is configured (has API key or doesn't need one)
 */
export function isProviderConfigured(provider: AIProvider): boolean {
    const config = AI_PROVIDERS[provider];
    if (config.noKeyRequired) return true;
    return !!process.env[config.envKey];
}

/**
 * Make OpenAI-compatible API call
 */
export async function callOpenAICompatible(
    provider: AIProvider,
    messages: { role: string; content: string }[],
    options: { 
        temperature?: number; 
        maxTokens?: number;
        timeoutMs?: number;
        thinking?: boolean;
    } = {}
): Promise<string> {
    const config = AI_PROVIDERS[provider];
    const envValue = process.env[config.envKey] || "";
    // Support comma-separated API keys for rotation/load-balancing
    const keys = envValue.includes(",") ? envValue.split(",").map(k => k.trim()).filter(Boolean) : [envValue];
    
    if (!config.noKeyRequired && keys.length === 0 && envValue === "") {
        throw new Error(`${config.name} API key not configured`);
    }

    const availableKeys = Math.max(1, keys.length);
    const startIdx = Math.floor(Math.random() * availableKeys);
    let lastError: Error | null = null;
    
    // We try models in priority: llama-3.3-70b-versatile, llama-3.1-8b-instant
    const models = [config.model, 'llama-3.1-8b-instant'];

    for (const model of models) {
        for (let i = 0; i < availableKeys; i++) {
            const keyIdx = (startIdx + i) % availableKeys;
            const apiKey = keys[keyIdx] || "";
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);

            const body: any = {
                model: model,
                messages,
                temperature: options.temperature ?? 0.6,
                max_tokens: options.maxTokens ?? 8192,
                stream: false
            };

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            };

            if (apiKey && !config.noKeyRequired) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }

            try {
                const response = await fetch(`${config.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                    signal: controller.signal
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    lastError = new Error(`${config.name} API error (Model ${model}, Key ${keyIdx+1}/${availableKeys}): ${response.status} - ${errorText.substring(0, 150)}`);
                    
                    console.warn(`[AI Key Rotation] ${provider} key ${keyIdx+1} failed with ${response.status} for model ${model}. Trying next key/model.`);
                    clearTimeout(timeoutId);
                    continue;
                }

                const data = await response.json();
                clearTimeout(timeoutId);
                return data.choices[0]?.message?.content || '';
            } catch (error: any) {
                lastError = error;
                console.warn(`[AI Key Rotation] ${provider} key ${keyIdx+1} failed with exception for model ${model}: ${error.message}`);
                clearTimeout(timeoutId);
                continue;
            }
        }
    }
    
    throw lastError || new Error(`${config.name} API failed on all configured keys and models.`);
}

/**
 * Make OpenAI-compatible API call with Streaming enabled
 */
export async function callOpenAICompatibleStream(
    provider: AIProvider,
    messages: { role: string; content: string }[],
    options: { 
        temperature?: number; 
        maxTokens?: number;
        timeoutMs?: number;
        thinking?: boolean;
    } = {}
): Promise<Response> {
    const config = AI_PROVIDERS[provider];
    const envValue = process.env[config.envKey] || "";
    // Support comma-separated API keys for rotation/load-balancing
    const keys = envValue.includes(",") ? envValue.split(",").map(k => k.trim()).filter(Boolean) : [envValue];
    
    if (!config.noKeyRequired && keys.length === 0 && envValue === "") {
        throw new Error(`${config.name} API key not configured`);
    }

    const availableKeys = Math.max(1, keys.length);
    const startIdx = Math.floor(Math.random() * availableKeys);
    let lastError: Error | null = null;
    
    const models = [config.model, 'llama-3.1-8b-instant'];

    for (const model of models) {
        for (let i = 0; i < availableKeys; i++) {
            const keyIdx = (startIdx + i) % availableKeys;
            const apiKey = keys[keyIdx] || "";
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? 45000);

            const body: any = {
                model: model,
                messages,
                temperature: options.temperature ?? 0.6,
                max_tokens: options.maxTokens ?? 8192,
                stream: true
            };

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
            };

            if (apiKey && !config.noKeyRequired) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }

            try {
                const response = await fetch(`${config.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                    signal: controller.signal
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    lastError = new Error(`${config.name} API error (Model ${model}, Key ${keyIdx+1}/${availableKeys}): ${response.status} - ${errorText.substring(0, 150)}`);
                    
                    console.warn(`[AI Key Rotation Stream] ${provider} key ${keyIdx+1} failed with status ${response.status} for model ${model}. Trying next key/model.`);
                    clearTimeout(timeoutId);
                    continue;
                }

                clearTimeout(timeoutId);
                return response;
            } catch (error: any) {
                clearTimeout(timeoutId);
                lastError = error;
                console.warn(`[AI Key Rotation Stream] ${provider} key ${keyIdx+1} failed with exception for model ${model}: ${error.message}`);
                continue;
            }
        }
    }
    
    throw lastError || new Error(`${config.name} STREAM API failed on all configured keys and models.`);
}
