import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AILens — Multimodal Perception Utility
 * converts complex / visual documents (Images, Scanned PDFs, Spreadsheets)
 * into high-fidelity semantic Markdown for study material generation.
 */

function getGeminiKey(): string {
    const multiKeys = process.env.GEMINI_API_KEYS;
    if (multiKeys) {
        const keys = multiKeys.split(",").map(k => k.trim()).filter(Boolean);
        if (keys.length > 0) return keys[0];
    }
    return process.env.GEMINI_API_KEY || "";
}

/**
 * Uses Gemini 1.5 Flash Vision to "see" and transcribe study materials.
 * Handles JPG, PNG, WEBP, and Scanned PDFs (as images).
 */
export async function transcribeMultimodalContent(
    buffer: Buffer,
    mimeType: string,
    contextHint: string = ""
): Promise<{ text: string; confidence: number }> {
    const apiKey = getGeminiKey();
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // ── STABILITY LOOP: Try multiple model IDs to avoid region-specific 404s ──
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash-001"];
    let lastError: any = null;

    for (const modelId of modelsToTry) {
        try {
            console.log(`[AILens] Attempting transcription with ${modelId}...`);
            const model = genAI.getGenerativeModel({ model: modelId });

            const prompt = `
                You are a Document Understanding Specialist for "The Professor" AI Study Companion.
                
                TASK:
                Transcribe the attached file into high-fidelity, semantic Markdown.
                The file is a student's study material: ${contextHint}.
                
                RULES:
                1. Accuracy is paramount. Transcribe equations, formulas, and technical terms precisely.
                2. Identify structure: Use Markdown headings (# ## ###) for logical sections.
                3. Table Fidelity: If you see a table or spreadsheet data, represent it as a clean Markdown Table.
                4. Math: Use LaTeX-like syntax for equations (e.g. $E = mc^2$).
                5. Visual Elements: If there's a diagram or chart, provide a concise [IMAGE_DESCRIPTION: ...] tag.
                6. Handwriting: If the notes are handwritten, do your absolute best to decipher every word. Use [UNCERTAIN: ...] if needed.
                7. Format: Return the raw transcribed Markdown only. No commentary.
            `;

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: buffer.toString("base64"),
                        mimeType: mimeType
                    }
                }
            ]);

            const response = await result.response;
            const text = response.text();

            return {
                text: text.trim(),
                confidence: 0.95
            };
        } catch (error: any) {
            lastError = error;
            console.warn(`[AILens] Model ${modelId} failed:`, error.message);
            // If it's a 404, we continue to the next model
            if (error.message.includes("404") || error.message.includes("not found")) {
                continue;
            }
            // If it's a different error (like Auth), we throw immediately
            throw error;
        }
    }

    throw new Error(`AI Lens extraction failed after trying all models: ${lastError?.message}`);
}
