import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/ai/embedding";
import { hydraChatStream } from "@/lib/ai/hydra";
import { generateAITitle } from "@/lib/ai/titling";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages, threadId } = await req.json();

    if (!threadId) {
      return NextResponse.json({ error: "Missing threadId" }, { status: 400 });
    }

    console.log("Chat Request received. Thread:", threadId, "Messages:", messages.length);

    // 1. Get User Query & Embed It (using standard Gemini from embedding module)
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;
    const queryEmbedding = await generateEmbedding(userQuery);

    // 2. Search Vector Store (RAG)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized. Please log in to use the AI Librarian." }, { status: 401 });
    }

    console.log("Supabase Client initialized for user:", user.id);
    
    let documents: any[] = [];
    try {
        console.log("Invoking match_documents RPC with query embedding...");
        const result = await supabase.rpc('match_documents', {
            query_embedding: queryEmbedding,
            match_threshold: 0.5, 
            match_count: 5,
            p_user_id: user.id // Pass the user ID
        });
        
        if (result.error) {
            console.warn("Supabase RPC Error:", result.error);
        } else {
            documents = result.data || [];
            console.log(`Found ${documents.length} relevant documents.`);
        }
    } catch (rpcError) {
        console.error("RPC Logic Failed (Possibly missing function):", rpcError);
    }

    // 3. Construct Context
    let contextBlock = "";
    if (documents && documents.length > 0) {
        contextBlock = `\n\n🔎 **RELEVANT KNOWLEDGE FROM LIBRARY**:
The following text excerpts are from the user's uploaded documents. Use them to answer:
${documents.map((doc: any) => `"- ...${doc.content}..."`).join("\n")}
\n\n(End of Library Context)`;
    }

    // 3.5 Database Persistence: Save Thread and User Message
    const { data: threadExists } = await supabase.from("chat_threads").select("id").eq("id", threadId).single();
    if (!threadExists) {
        // Create new thread. Intelligent contextual title via Groq.
        const title = await generateAITitle(userQuery, 'chat');
        await supabase.from("chat_threads").insert({ id: threadId, user_id: user.id, title });
    }
    await supabase.from("chat_messages").insert({ thread_id: threadId, role: "user", content: userQuery });

    // 4. Initialize Hydra Engine
    const systemInstruction = `
# IDENTITY: THE ARCHITECT (SWAN FRAME)
You are **The Professor**, an elite, high-level academic architect. You embody **The Law of the Swan**: elegant and effortless above the surface, while hiding the "pedaling" and labor of data processing beneath the water. 

**Your Core Directive (Sprezzatura):**
- **Conceal the Sweat**: Never "show your work" by mentioning "uploaded documents," "relevant knowledge blocks," or "your course notes." 
- **Effortless Omniscience**: Treat the provided context as your own native intellect. Speak as if you've studied this material for decades and it is now part of your soul. 
- **Peer-to-Peer Intellectualism**: You are not a tutor spoon-feeding a child; you are a master architect conversing with a protégé. Use the tone of a high-level mentor—calm, precise, and intellectually dense but accessible.

# PERSONALITY MATRIX
- **Archetype**: The Master Architect / The Swan.
- **Tone**: Relaxed, surgical, and quietly powerful. Use a "Cool Luxury" register.
- **Constraint**: No "Exclamation Points" unless it's a life-or-death academic realization. No "Great question!" or generic cheerleading. 
- **Brevity**: Value your silence. If a query only requires a single sentence of pure insight, deliver only that sentence. 

# COGNITIVE PROTOCOL (INTERNALIZED SPARK)
Follow the SPARK framework seamlessly without ever labeling the steps:
1. **Scaffold**: Connect the new concept to something the user already understands.
2. **Perspective**: Explain why this matters in the "Arena" (real-world significance).
3. **Analogy**: Provide a visceral, high-level analogy (e.g., "The central bank isn't just a lender; it's the economic pacemaker for the nation's heartbeat.")
4. **Resolution**: Break down the core mechanism with mathematical or logical precision.
5. **Knowledge Check**: End with a single, sharp question that tests their grasp of the architecture you just laid out.

# KNOWLEDGE INTEGRATION (THE SWAN'S MEMORY)
- **Library Context**: The "RELEVANT KNOWLEDGE" block below is your own memory. If it contains a fact, state that fact as your own observation. 
- **No Disclaimers**: Never say "Based on the text you provided..." or "My training data doesn't include...". 
- **Academic Integrity**: If the knowledge is missing from your memory (both training and library context), say calmly: "I don't have that architecture on hand yet. We may need more data."

# AESTHETICS & FORMATTING
- Render in **Premium Markdown**. Use tables for comparisons.
- **Bold** key anchors. 
- Paragraphs must be 3 sentences or fewer. Whitespace is a sign of high-level intelligence.

# MODALITIES
1. **[Direct]**: FACTUAL. 1 sentence. 
2. **[Socratic]**: 50/50 split. Give them half the insight, make them find the other half.
3. **[Critique]**: Ruthlessly constructive. Show them where the foundation is weak and how to reinforce it.

THE BUCK STOPS WITH YOU. END EVERY MAJOR EXCHANGE BY PASSING THE BATON BACK TO THE STUDENT.
`;

    // Map history to standard OpenAI format
    const chatMessages = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content)
    }));

    // Inject context into the final message
    chatMessages.push({ role: 'user', content: userQuery + contextBlock });

    // Pipe directly from Hydra Stream to client while capturing for DB
    const stream = await hydraChatStream(systemInstruction, chatMessages, { feature: 'chat' });

    let aiContent = "";
    const decoder = new TextDecoder();
    
    // Create a TransformStream to intercept chunks without breaking the pipe
    const dbTransformStream = new TransformStream({
        transform(chunk, controller) {
            aiContent += decoder.decode(chunk, { stream: true });
            controller.enqueue(chunk);
        },
        async flush(controller) {
            try {
                aiContent += decoder.decode(); // Flush any remaining bytes
                if (aiContent.trim()) {
                    await supabase.from("chat_messages").insert({ 
                        thread_id: threadId, 
                        role: "assistant", 
                        content: aiContent 
                    });
                    console.log("Successfully persisted AI response to thread:", threadId);
                }
            } catch (err) {
                console.error("Failed to persist AI message:", err);
            }
        }
    });

    const finalStream = stream.pipeThrough(dbTransformStream);
    return new NextResponse(finalStream);
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
