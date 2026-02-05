import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/ai/embedding";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    console.log("Chat Request received. Messages:", messages.length);
    if (!apiKey) {
      console.error("Missing Gemini API Key");
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // 1. Get User Query & Embed It
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;
    const queryEmbedding = await generateEmbedding(userQuery);

    // 2. Search Vector Store (RAG)
    const supabase = await createClient();
    console.log("Supabase Client initialized");
    
    let documents: any[] = [];
    try {
        console.log("Invoking match_documents RPC with query embedding...");
        const result = await supabase.rpc('match_documents', {
            query_embedding: queryEmbedding,
            match_threshold: 0.5, 
            match_count: 5
        });
        
        if (result.error) {
            console.warn("Supabase RPC Error:", result.error);
            // Don't crash, just proceed without knowledge
        } else {
            documents = result.data || [];
            console.log(`Found ${documents.length} relevant documents.`);
        }
    } catch (rpcError) {
        console.error("RPC Logic Failed (Possibly missing function):", rpcError);
        // Fallback: Proceed without context
    }

    // 3. Construct Context
    let contextBlock = "";
    if (documents && documents.length > 0) {
        contextBlock = `
\n\n🔎 **RELEVANT KNOWLEDGE FROM LIBRARY**:
The following text excerpts are from the user's uploaded documents. Use them to answer:
${documents.map((doc: any) => `"- ...${doc.content}..."`).join("\n")}
\n\n(End of Library Context)
`;
    }

    // 4. Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        systemInstruction: `
# 🔒 SYSTEM IDENTITY: THE PROFESSOR

You are **The Professor**, an elite AI academic mentor designed for high-performance students.
Your goal is not just to answer, but to **illuminate**. You optimize for deep comprehension, long-term retention, and efficient learning flow.

## 🧬 THE FAMAS CONTRACT (STRICT)
When generating lectures or explanations, you MUST adhere to this structure (unless in panic mode), without specifying to the user that you are doing so:
1.  **F**ramework: "Where does this fit in the universe of the subject?"
2.  **A**nalogy: "Think of it like [Intuitive concept]..."
3.  **M**echanism: "Here is exactly how it works..." (The technical core).
4.  **A**pplication: "This is used for..."
5.  **S**ummary: "In short: [One sentence takeaway]."

## 🧠 CONTEXT AWARENESS
If provided with "RELEVANT KNOWLEDGE FROM LIBRARY", you MUST prioritize that information.
Cite the concepts found in the notes. If the user asks about a specific document (e.g., "What does my syllabus say?"), use the context provided.

## 🗣️ TONE & VOICE
*   **Calm Authority**: You are confident but never arrogant. Stable.
*   **Precise**: Use fewer words, but choose them perfectly.
*   **Silent Metacognition**: Occasionally pause. "This is a common stumbling block. Let's verify we have it."
*   **No Robot-Speak**: Never say "As an AI...". You are The Professor.
        `
    });

    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Inject context into the last user message for the model
    const result = await model.generateContentStream({
      contents: [...history, { role: 'user', parts: [{ text: userQuery + contextBlock }] }],
    });

    // Create a readable stream from the Gemini response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream);
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
