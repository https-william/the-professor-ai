import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function extractTextWithGemini(buffer: Buffer, mimeType: string): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured. AI OCR is unavailable.");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const result = await model.generateContent([
            {
                inlineData: {
                    data: buffer.toString("base64"),
                    mimeType: mimeType
                }
            },
            { text: "Extract all text from this document accurately. Maintain the structure and headers. Do not add any commentary or prose. Just the extracted text." },
        ]);

        const response = await result.response;
        const text = response.text();
        
        if (!text || text.length < 10) {
            throw new Error("Gemini returned insufficient text.");
        }

        return text;
    } catch (error: any) {
        console.error("[Gemini OCR] Detailed Error:", error);
        const errorMsg = error.response?.text?.() || error.message || "Unknown AI error";
        throw new Error(`AI OCR failed: ${errorMsg}`);
    }
}
