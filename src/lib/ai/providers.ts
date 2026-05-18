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
    let lastError: Error | null = null;
    const maxRetriesPerKey = 2;

    for (let i = 0; i < availableKeys; i++) {
        const apiKey = keys[i] || "";
        
        for (let attempt = 1; attempt <= maxRetriesPerKey; attempt++) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);

            const body: any = {
                model: config.model,
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
                    lastError = new Error(`${config.name} API error (Key ${i+1}/${availableKeys}, attempt ${attempt}/${maxRetriesPerKey}): ${response.status} - ${errorText.substring(0, 150)}`);
                    
                    // Retry on rate limit (429), server errors (500+), or unauthorized (401)
                    if (response.status === 429 || response.status >= 500 || response.status === 401) {
                        console.warn(`[AI Key Rotation] ${provider} key ${i+1} attempt ${attempt} failed (${response.status}). Retrying...`);
                        if (attempt < maxRetriesPerKey) {
                            await new Promise(res => setTimeout(res, 1000 * attempt));
                            continue; // Retry same key
                        }
                        break; // Move to next key
                    }
                    
                    throw lastError; // Stop rotation for Bad Request (400)
                }

                const data = await response.json();
                let content = data.choices[0]?.message?.content || '';
                

                
                return content;
            } catch (error: any) {
                lastError = error;
                console.warn(`[AI Key Rotation] ${provider} key ${i+1} attempt ${attempt} threw exception. Retrying... (${error.message})`);
                if (attempt < maxRetriesPerKey) {
                    await new Promise(res => setTimeout(res, 1000 * attempt));
                    continue;
                }
                break; // Move to next key
            } finally {
                clearTimeout(timeoutId);
            }
        }
    }
    
    throw lastError || new Error(`${config.name} API failed on all configured keys.`);
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
    let lastError: Error | null = null;
    const maxRetriesPerKey = 2;

    for (let i = 0; i < availableKeys; i++) {
        const apiKey = keys[i] || "";
        
        for (let attempt = 1; attempt <= maxRetriesPerKey; attempt++) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? 45000);

            const body: any = {
                model: config.model,
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
                    clearTimeout(timeoutId);
                    const errorText = await response.text();
                    lastError = new Error(`${config.name} API error (Key ${i+1}/${availableKeys}, attempt ${attempt}/${maxRetriesPerKey}): ${response.status} - ${errorText.substring(0, 150)}`);
                    
                    if (response.status === 429 || response.status >= 500 || response.status === 401) {
                        console.warn(`[AI Key Rotation Stream] ${provider} key ${i+1} attempt ${attempt} failed (${response.status}). Retrying...`);
                        if (attempt < maxRetriesPerKey) {
                            await new Promise(res => setTimeout(res, 1000 * attempt));
                            continue;
                        }
                        break; // Move to next key
                    }
                    throw lastError;
                }

                return response;
            } catch (error: any) {
                clearTimeout(timeoutId);
                lastError = error;
                console.warn(`[AI Key Rotation Stream] ${provider} key ${i+1} attempt ${attempt} threw exception. Retrying... (${error.message})`);
                if (attempt < maxRetriesPerKey) {
                    await new Promise(res => setTimeout(res, 1000 * attempt));
                    continue;
                }
                break; // Move to next key
            }
        }
    }
    
    throw lastError || new Error(`${config.name} STREAM API failed on all configured keys.`);
}
