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

async function testKeys() {
    const envValue = process.env.GROQ_API_KEY || "";
    const keys = envValue.includes(",") ? envValue.split(",").map(k => k.trim()).filter(Boolean) : [envValue];
    console.log(`Found ${keys.length} keys.`);

    for (let i = 0; i < keys.length; i++) {
        const apiKey = keys[i];
        console.log(`Testing Key ${i + 1}: ${apiKey.substring(0, 10)}...`);
        try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 10
                })
            });
            console.log(`Key ${i + 1} Status: ${res.status}`);
            const text = await res.text();
            console.log(`Key ${i + 1} Response:`, text.substring(0, 200));
        } catch (err) {
            console.error(`Key ${i + 1} Error:`, err.message);
        }
    }
}

testKeys();
