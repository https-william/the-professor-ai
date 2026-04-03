import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();

        if (!text) {
            return new Response(JSON.stringify({ error: "No text provided" }), { status: 400 });
        }

        const ttsUrl = process.env.AWS_TTS_URL;
        
        if (!ttsUrl) {
            return new Response(JSON.stringify({ error: "AWS_TTS_URL not configured" }), { status: 500 });
        }

        // Call the OpenAI-compatible TTS endpoint running on AWS
        const response = await fetch(`${ttsUrl}/v1/audio/speech`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "tts-1",
                input: text,
                voice: "alloy", // or whatever voice the model supports
            }),
        });

        if (!response.ok) {
            throw new Error(`AWS TTS error: ${response.statusText}`);
        }

        // Stream the audio back directly to the client
        return new Response(response.body, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "no-store",
            },
        });
        
    } catch (error: any) {
        console.error("TTS Proxy Error:", error);
        return new Response(JSON.stringify({ error: "Failed to generate speech" }), { status: 500 });
    }
}
