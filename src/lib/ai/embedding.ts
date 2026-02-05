import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  
  // Clean text to avoid issues
  const cleanText = text.replace(/\n/g, " ");
  
  const result = await model.embedContent(cleanText);
  return result.embedding.values;
}
