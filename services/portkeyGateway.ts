/**
 * Portkey Gateway Service
 * Enterprise-grade multi-provider AI routing with automatic failover
 * Supports 900+ concurrent users via load balancing across providers
 */

// Portkey Configuration Types
interface PortkeyTarget {
    provider: string;
    api_key?: string;
    virtual_key?: string;
    weight?: number;
    override_params?: {
        model: string;
        temperature?: number;
    };
}

interface PortkeyConfig {
    strategy: {
        mode: 'fallback' | 'loadbalance';
        on_status_codes?: number[];
    };
    targets: PortkeyTarget[];
}

// Environment variable getter (robust for Vite/Node)
const getEnvVar = (key: string): string => {
    try {
        // @ts-ignore - Vite environment
        if (import.meta.env?.[key]) return import.meta.env[key];
    } catch (e) {}
    
    if (typeof process !== 'undefined' && process.env?.[key]) {
        return process.env[key] as string;
    }
    return '';
};

// Provider API Keys
const PROVIDER_KEYS = {
    portkey: getEnvVar('VITE_PORTKEY_API_KEY'),
    gemini: getEnvVar('VITE_GEMINI_API_KEY'),
    groq: getEnvVar('VITE_GROQ_API_KEY'),
    deepseek: getEnvVar('VITE_DEEPSEEK_API_KEY'),
    openrouter: getEnvVar('VITE_OPENROUTER_API_KEY'),
    mistral: getEnvVar('VITE_MISTRAL_API_KEY'),
    cerebras: getEnvVar('VITE_CEREBRAS_API_KEY'),
    cohere: getEnvVar('VITE_COHERE_API_KEY'),
};

// Fallback Configuration for Text Generation
// Priority: Groq (fast) → DeepSeek → Gemini → Mistral → OpenRouter
export const TEXT_FALLBACK_CONFIG: PortkeyConfig = {
    strategy: {
        mode: 'fallback',
        on_status_codes: [429, 500, 502, 503, 504] // Rate limit + server errors
    },
    targets: [
        {
            provider: 'groq',
            api_key: PROVIDER_KEYS.groq,
            override_params: { model: 'llama3-70b-8192', temperature: 0.7 }
        },
        {
            provider: 'deepseek',
            api_key: PROVIDER_KEYS.deepseek,
            override_params: { model: 'deepseek-chat', temperature: 0.7 }
        },
        {
            provider: 'google',
            api_key: PROVIDER_KEYS.gemini,
            override_params: { model: 'gemini-2.0-flash-exp', temperature: 0.7 }
        },
        {
            provider: 'mistral-ai',
            api_key: PROVIDER_KEYS.mistral,
            override_params: { model: 'mistral-small-latest', temperature: 0.7 }
        },
        {
            provider: 'openrouter',
            api_key: PROVIDER_KEYS.openrouter,
            override_params: { model: 'meta-llama/llama-3.2-3b-instruct:free', temperature: 0.7 }
        }
    ].filter(t => t.api_key) // Only include providers with valid keys
};

// Load Balance Configuration for Quiz Generation (distribute load)
export const QUIZ_LOADBALANCE_CONFIG: PortkeyConfig = {
    strategy: {
        mode: 'loadbalance'
    },
    targets: [
        {
            provider: 'google',
            api_key: PROVIDER_KEYS.gemini,
            weight: 3, // Primary - highest quality
            override_params: { model: 'gemini-2.0-flash-exp' }
        },
        {
            provider: 'groq',
            api_key: PROVIDER_KEYS.groq,
            weight: 2, // Fast backup
            override_params: { model: 'llama3-70b-8192' }
        },
        {
            provider: 'deepseek',
            api_key: PROVIDER_KEYS.deepseek,
            weight: 1, // Reasoning backup
            override_params: { model: 'deepseek-reasoner' }
        }
    ].filter(t => t.api_key)
};

// Vision/Multimodal - Gemini only (no fallback for vision yet)
export const VISION_CONFIG: PortkeyConfig = {
    strategy: { mode: 'fallback' },
    targets: [
        {
            provider: 'google',
            api_key: PROVIDER_KEYS.gemini,
            override_params: { model: 'gemini-2.0-flash-exp' }
        }
    ].filter(t => t.api_key)
};

/**
 * Call Portkey Gateway with automatic failover
 */
export const callPortkeyGateway = async (
    messages: { role: string; content: string }[],
    systemPrompt: string,
    config: PortkeyConfig = TEXT_FALLBACK_CONFIG,
    jsonMode: boolean = false
): Promise<string> => {
    const PORTKEY_API_URL = 'https://api.portkey.ai/v1/chat/completions';
    
    // If Portkey API key is available, use the gateway
    if (PROVIDER_KEYS.portkey) {
        const response = await fetch(PORTKEY_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-portkey-api-key': PROVIDER_KEYS.portkey,
                'x-portkey-config': JSON.stringify(config)
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages
                ],
                ...(jsonMode && { response_format: { type: 'json_object' } })
            })
        });

        if (!response.ok) {
            throw new Error(`Portkey Gateway Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }

    // Fallback: Direct provider calls if no Portkey key (existing behavior)
    return await callDirectFallback(messages, systemPrompt, config, jsonMode);
};

/**
 * Direct fallback without Portkey (for when Portkey key is not configured)
 * Maintains backward compatibility with existing geminiService patterns
 */
const callDirectFallback = async (
    messages: { role: string; content: string }[],
    systemPrompt: string,
    config: PortkeyConfig,
    jsonMode: boolean
): Promise<string> => {
    const errors: string[] = [];
    
    for (const target of config.targets) {
        try {
            const result = await callProvider(target, messages, systemPrompt, jsonMode);
            if (result) return result;
        } catch (e: any) {
            const errMsg = e.message || 'Unknown error';
            errors.push(`${target.provider}: ${errMsg}`);
            console.warn(`⚠️ ${target.provider} failed: ${errMsg}`);
            continue; // Try next provider
        }
    }
    
    throw new Error(`All providers failed. Errors: ${errors.join('; ')}`);
};

/**
 * Call individual provider directly
 */
const callProvider = async (
    target: PortkeyTarget,
    messages: { role: string; content: string }[],
    systemPrompt: string,
    jsonMode: boolean
): Promise<string> => {
    const { provider, api_key, override_params } = target;
    
    if (!api_key) throw new Error(`No API key for ${provider}`);

    const payload = {
        model: override_params?.model,
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages
        ],
        temperature: override_params?.temperature || 0.7,
        ...(jsonMode && { response_format: { type: 'json_object' } })
    };

    let url = '';
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    switch (provider) {
        case 'groq':
            url = 'https://api.groq.com/openai/v1/chat/completions';
            headers['Authorization'] = `Bearer ${api_key}`;
            break;
        case 'deepseek':
            url = 'https://api.deepseek.com/v1/chat/completions';
            headers['Authorization'] = `Bearer ${api_key}`;
            break;
        case 'mistral-ai':
            url = 'https://api.mistral.ai/v1/chat/completions';
            headers['Authorization'] = `Bearer ${api_key}`;
            break;
        case 'openrouter':
            url = 'https://openrouter.ai/api/v1/chat/completions';
            headers['Authorization'] = `Bearer ${api_key}`;
            headers['HTTP-Referer'] = 'https://the-professor.app';
            break;
        case 'google':
            // Gemini uses different API format - skip for now, handled by geminiService
            throw new Error('Use geminiService for Google Gemini');
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`${provider} error ${response.status}: ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
};

/**
 * Health check - verify which providers are available
 */
export const checkProviderHealth = (): { provider: string; available: boolean }[] => {
    return [
        { provider: 'portkey', available: !!PROVIDER_KEYS.portkey },
        { provider: 'gemini', available: !!PROVIDER_KEYS.gemini },
        { provider: 'groq', available: !!PROVIDER_KEYS.groq },
        { provider: 'deepseek', available: !!PROVIDER_KEYS.deepseek },
        { provider: 'openrouter', available: !!PROVIDER_KEYS.openrouter },
        { provider: 'mistral', available: !!PROVIDER_KEYS.mistral },
        { provider: 'cerebras', available: !!PROVIDER_KEYS.cerebras },
        { provider: 'cohere', available: !!PROVIDER_KEYS.cohere },
    ];
};

export default {
    callPortkeyGateway,
    checkProviderHealth,
    TEXT_FALLBACK_CONFIG,
    QUIZ_LOADBALANCE_CONFIG,
    VISION_CONFIG
};
