/**
 * Multi-Provider AI Configuration
 * 
 * Priority Order:
 * 1. OpenAI (GPT-4o-mini) - Primary, fastest & most reliable
 * 2. Kimi 2.5 (NVIDIA) - Secondary
 * 3. Trinity Large (OpenRouter) - Backup
 * 4. Gemini Flash - Fallback
 * 5. Groq - Last resort
 */

export type AIProvider = 'openai' | 'moonshot' | 'trinity' | 'gemini' | 'groq' | 'cerebras';

interface ProviderConfig {
    name: string;
    baseUrl: string;
    model: string;
    envKey: string;
    bestFor: string;
}

export const AI_PROVIDERS: Record<AIProvider, ProviderConfig> = {
    openai: {
        name: 'OpenAI GPT-4o-mini',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
        envKey: 'OPENAI_API_KEY',
        bestFor: 'Primary - Fastest, most reliable, great at JSON',
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
 * Check if a provider is configured (has API key)
 */
export function isProviderConfigured(provider: AIProvider): boolean {
    const config = AI_PROVIDERS[provider];
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
    
    if (!apiKey) {
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

    // OpenRouter requires additional headers
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

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
            const error = await response.text();
            throw new Error(`${config.name} API error: ${error.substring(0, 200)}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    } finally {
        clearTimeout(timeoutId);
    }
}
