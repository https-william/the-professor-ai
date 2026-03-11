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
    const apiKey = process.env[config.envKey];
    
    if (!config.noKeyRequired && !apiKey) {
        throw new Error(`${config.name} API key not configured`);
    }

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

    // Only add auth header if we have a key (g4f doesn't need one)
    if (apiKey && !config.noKeyRequired) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // OpenRouter requires additional headers
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
            const error = await response.text();
            throw new Error(`${config.name} API error: ${error.substring(0, 200)}`);
        }

        const data = await response.json();
        let content = data.choices[0]?.message?.content || '';
        
        // g4f providers sometimes inject ads/watermarks — strip them
        if (provider === 'g4f' && content) {
            content = cleanG4fResponse(content);
        }
        
        return content;
    } finally {
        clearTimeout(timeoutId);
    }
}
