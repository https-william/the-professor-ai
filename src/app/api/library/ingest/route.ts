import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/ai/embedding";
import { parseDocument } from "@/lib/parser";
import { logParserError, logParserSuccess } from "@/lib/error-logger";

// ~1000 chars per chunk with 200 char overlap
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

function chunkText(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
        chunks.push(text.slice(start, start + CHUNK_SIZE));
        start += CHUNK_SIZE - CHUNK_OVERLAP;
    }
    return chunks;
}

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate User
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized. Please log in to ingest documents." }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        console.log(`[Ingest] Processing: ${file.name} for user ${user.id}`);

        // 2. Upload to Supabase Storage (Temporary)
        const fileName = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
            .from("documents")
            .upload(fileName, file);

        if (uploadError) {
            console.error("[Ingest] Storage Upload Error:", uploadError);
            return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 });
        }

        // 3. Parse Document via Universal Parser
        let textChunks: string[] = [];
        let fileType = "unknown";
        let wordCount = 0;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const parseStart = Date.now();

            const parsed = await parseDocument(buffer, file.type, file.name, file.size);
            fileType = parsed.fileType;
            wordCount = parsed.wordCount;

            logParserSuccess(fileType, file.size, wordCount, Date.now() - parseStart);
            textChunks = chunkText(parsed.text);
        } catch (parseError: unknown) {
            console.error("[Ingest] Parser Error:", parseError);
            const msg = parseError instanceof Error ? parseError.message : String(parseError);
            logParserError(file.type || "unknown", file.size, msg);
            await supabase.storage.from("documents").remove([fileName]);
            return NextResponse.json({ error: msg }, { status: 422 });
        }

        // 4. Optimized Embedding & Storage (Batching)
        try {
            console.log(`[Ingest] Vectorizing ${textChunks.length} chunks...`);
            
            // Parallelize embedding generation for speed
            const embeddingPromises = textChunks.map(chunk => generateEmbedding(chunk));
            const embeddings = await Promise.all(embeddingPromises);

            // Bulk Insert into Supabase
            const { error: dbError } = await supabase
                .from("document_chunks")
                .insert(textChunks.map((chunk, i) => ({
                    user_id: user.id,
                    content: chunk,
                    embedding: embeddings[i],
                    file_path: fileName,
                    metadata: { file_name: file.name },
                })));

            if (dbError) throw dbError;

            // 5. STORAGE OPTIMIZATION (Process & Purge)
            // Immediately delete the heavy file to save storage quota (500MB free tier)
            console.log(`[Ingest] Purging source file: ${fileName}`);
            await supabase.storage.from("documents").remove([fileName]);

            // 6. DB CLEANUP: Automatically purge this user's vectors older than 7 days
            try {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                console.log(`[Ingest] Running 7-day vector expiry cleanup...`);
                await supabase
                    .from("document_chunks")
                    .delete()
                    .eq('user_id', user.id)
                    .lt('created_at', sevenDaysAgo.toISOString());
            } catch (err) {
                console.warn("[Ingest] Non-fatal: Could not purge old vectors (check if created_at column exists).", err);
            }

            return NextResponse.json({ 
                success: true, 
                chunks: textChunks.length,
                wordCount
            });

        } catch (error: unknown) {
            await supabase.storage.from("documents").remove([fileName]);
            console.error("[Ingest] Critical Failure:", error);
            const msg = error instanceof Error ? error.message : "Unknown error during indexing";
            return NextResponse.json({ error: msg }, { status: 500 });
        }

    } catch (error: unknown) {
        console.error("[Ingest] Request Error:", error);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
}
