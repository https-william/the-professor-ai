const fs = require('fs');
const path = require('path');

function loadEnv() {
    try {
        const envPath = path.join(__dirname, '../.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('.env.local file not found');
            return;
        }
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const parts = trimmed.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim();
                    process.env[key] = value;
                }
            }
        });
    } catch (e) {
        console.error('Error loading env:', e);
    }
}

loadEnv();

// Mock dependencies to run hydraChatStream directly
const AI_PROVIDERS = {
    groq: {
        name: 'Groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        envKey: 'GROQ_API_KEY',
    }
};

async function callOpenAICompatibleStream(
    provider,
    messages,
    options = {}
) {
    const config = AI_PROVIDERS[provider];
    const envValue = process.env[config.envKey] || "";
    const keys = envValue.includes(",") ? envValue.split(",").map(k => k.trim()).filter(Boolean) : [envValue];
    
    const availableKeys = Math.max(1, keys.length);
    const startIdx = Math.floor(Math.random() * availableKeys);
    let lastError = null;

    for (let i = 0; i < availableKeys; i++) {
        const keyIdx = (startIdx + i) % availableKeys;
        const apiKey = keys[keyIdx] || "";
        let selectedModel = config.model;
        
        for (let attempt = 1; attempt <= 2; attempt++) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? 45000);

            const body = {
                model: selectedModel,
                messages,
                temperature: options.temperature ?? 0.6,
                max_tokens: options.maxTokens ?? 8192,
                stream: true
            };

            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
            };

            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }

            try {
                console.log(`[Stream Test] Sending request with Key ${keyIdx+1}/${availableKeys}, attempt ${attempt}, model ${selectedModel}`);
                const response = await fetch(`${config.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                    signal: controller.signal
                });

                if (!response.ok) {
                    clearTimeout(timeoutId);
                    const errorText = await response.text();
                    lastError = new Error(`${config.name} API error: ${response.status} - ${errorText}`);
                    
                    if (response.status === 429 || response.status === 503 || response.status >= 500) {
                        console.warn(`[Stream Test] key ${keyIdx+1} failed (${response.status}). Retrying with fallback model llama-3.1-8b-instant...`);
                        selectedModel = 'llama-3.1-8b-instant';
                        if (attempt < 2) {
                            await new Promise(res => setTimeout(res, 500 * attempt));
                            continue;
                        }
                        break;
                    }
                    throw lastError;
                }
                clearTimeout(timeoutId);
                return response;
            } catch (error) {
                clearTimeout(timeoutId);
                lastError = error;
                console.warn(`[Stream Test] key ${keyIdx+1} attempt ${attempt} threw exception: ${error.message}`);
                selectedModel = 'llama-3.1-8b-instant';
                if (attempt < 2) {
                    await new Promise(res => setTimeout(res, 500 * attempt));
                    continue;
                }
                break;
            }
        }
    }
    throw lastError || new Error("All keys failed");
}

async function testHydraStream() {
    try {
        const response = await callOpenAICompatibleStream(
            'groq',
            [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: 'Say hello in 5 words.' }
            ],
            { timeoutMs: 15000 }
        );

        console.log("Success! Response status:", response.status);
        console.log("Headers:", Object.fromEntries(response.headers.entries()));

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value, { stream: true });
            buffer += text;
            process.stdout.write(text);
        }
        console.log("\nStream finished successfully.");
    } catch (err) {
        console.error("Test Failed:", err);
    }
}

testHydraStream();
