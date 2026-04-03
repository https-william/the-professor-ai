/**
 * Multi-Provider AI Configuration
 * 
 * Priority Order:
 * 1. GPT4Free (g4f) - Free, multi-provider — uses g4f server or public API
 * 2. Kimi 2.5 (NVIDIA) - Secondary
 * 3. Trinity Large (OpenRouter) - Backup
 * 4. Gemini Flash - Fallback (round-robin keys)
 * 5. Groq - Last resort
 */

export type AIProvider = 'g4f' | 'ollamafree' | 'moonshot' | 'trinity' | 'gemini' | 'groq' | 'cerebras';

interface ProviderConfig {
    name: string;
    baseUrl: string;
    model: string;
    envKey: string;
    bestFor: string;
    /** If true, skip API key check (g4f doesn't require one) */
    noKeyRequired?: boolean;
}

export const AI_PROVIDERS: Record<AIProvider, ProviderConfig> = {
    g4f: {
        name: 'GPT4Free',
        baseUrl: process.env.G4F_API_URL || 'http://localhost:1337/v1',
        model: process.env.G4F_MODEL || 'gpt-4o-mini',
        envKey: 'G4F_ENABLED',
        bestFor: 'Primary - Free multi-provider LLM access',
        noKeyRequired: true,
    },
    ollamafree: {
        name: 'OllamaFreeAPI',
        baseUrl: 'https://ollamafree.daif.one/api/v1',
        model: process.env.OLLAMAFREE_MODEL || 'llama3:8b', // Highly available fast model
        envKey: 'OLLAMAFREE_ENABLED',
        bestFor: 'Secondary Primary - Free distributed LLMs',
        noKeyRequired: true,
    },
    moonshot: {
        name: 'Kimi 2.5 (NVIDIA)',
        baseUrl: 'https://integrate.api.nvidia.com/v1',
        model: 'moonshotai/kimi-k2.5',
        envKey: 'NVIDIA_API_KEY',
        bestFor: 'Secondary - Fast responses (Instant mode)',
    },
    trinity: {
        name: 'Trinity Large (OpenRouter)',
        baseUrl: 'https://openrouter.ai/api/v1',
        model: 'arcee-ai/arcee-trinity-large-preview',
        envKey: 'OPENROUTER_API_KEY',
        bestFor: 'Backup - High throughput (32-43 tps)',
    },
    gemini: {
        name: 'Google Gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-2.0-flash',
        envKey: 'GEMINI_API_KEY',
        bestFor: 'Fallback - Reliable and free',
    },
    groq: {
        name: 'Groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        model: 'llama-3.3-70b-versatile',
        envKey: 'GROQ_API_KEY',
        bestFor: 'Last resort - Fast Llama 3',
    },
    cerebras: {
        name: 'Cerebras',
        baseUrl: 'https://api.cerebras.ai/v1',
        model: 'llama3.1-70b',
        envKey: 'CEREBRAS_API_KEY',
        bestFor: 'Real-time tutoring',
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

    for (let i = 0; i < availableKeys; i++) {
        const apiKey = keys[i] || "";
        
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

        if (provider === 'trinity') {
            headers['Authorization'] = `Bearer ${apiKey}`;
            headers['HTTP-Referer'] = 'https://the-professor.app';
            headers['X-Title'] = 'The Professor';
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
                lastError = new Error(`${config.name} API error (Key ${i+1}/${availableKeys}): ${response.status} - ${errorText.substring(0, 150)}`);
                
                // Retry on rate limit (429), server errors (500+), or unauthorized (401) if trying another key
                if (response.status === 429 || response.status >= 500 || response.status === 401) {
                    console.warn(`[AI Key Rotation] ${provider} key ${i+1} failed with status ${response.status}. Retrying next key...`);
                    continue; // Loop to next key
                }
                
                throw lastError; // Stop rotation for Bad Request (400)
            }

            const data = await response.json();
            let content = data.choices[0]?.message?.content || '';
            
            if (provider === 'g4f' && content) {
                content = cleanG4fResponse(content);
            }
            
            return content;
        } catch (error: any) {
            lastError = error;
            // If it's a network/abort error, retry
            console.warn(`[AI Key Rotation] ${provider} key ${i+1} threw exception. Retrying... (${error.message})`);
            continue;
        } finally {
            clearTimeout(timeoutId);
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

    for (let i = 0; i < availableKeys; i++) {
        const apiKey = keys[i] || "";
        
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

        if (provider === 'trinity') {
            headers['HTTP-Referer'] = 'https://the-professor.app';
            headers['X-Title'] = 'The Professor';
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
                lastError = new Error(`${config.name} API error (Key ${i+1}/${availableKeys}): ${response.status} - ${errorText.substring(0, 150)}`);
                
                if (response.status === 429 || response.status >= 500 || response.status === 401) {
                    console.warn(`[AI Key Rotation Stream] ${provider} key ${i+1} failed with status ${response.status}. Retrying...`);
                    continue;
                }
                throw lastError;
            }

            // Stream successful, consumer responsible for clearing timeout (handled in caller)
            return response;
        } catch (error: any) {
            clearTimeout(timeoutId);
            lastError = error;
            console.warn(`[AI Key Rotation Stream] ${provider} key ${i+1} threw exception. Retrying... (${error.message})`);
            continue;
        }
    }
    
    throw lastError || new Error(`${config.name} STREAM API failed on all configured keys.`);
}
