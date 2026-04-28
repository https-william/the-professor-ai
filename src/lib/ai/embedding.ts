/**
 * Embedding Utility — Vector Generation
 * NOTE: Gemini API usage has been removed per user request.
 * RAG features will require a new embedding provider (e.g. OpenAI).
 * Returning a zero-vector for now to maintain database schema compatibility.
 */

export async function generateEmbedding(text: string): Promise<number[]> {
  console.warn("[Embedding] Gemini disabled. Returning zero-vector for RAG compatibility.");
  
  // Clean text is still good for logs
  // const cleanText = text.replace(/\n/g, " ");
  
  // Return a 768-dimension zero vector (Standard pgvector requirement for this app)
  return new Array(768).fill(0);
}
