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
    console.log("API: /api/library/ingest Hit!");
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // 1. Upload to Supabase Storage
        const supabase = await createClient();
        const fileName = `${Date.now()}_${file.name}`;

        const { error: uploadError } = await supabase.storage
            .from("documents")
            .upload(fileName, file);

        if (uploadError) {
            console.error("Storage Upload Error:", uploadError);
            return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 });
        }

        // 2. Parse Document via Universal Parser
        let textChunks: string[] = [];

        try {
            console.log("Invoking Universal Parser...");
            // Convert File → Buffer for parser
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const parseStart = Date.now();

            const { text, wordCount, fileType } = await parseDocument(
                buffer,
                file.type,
                file.name,
                file.size
            );

            logParserSuccess(fileType, file.size, wordCount, Date.now() - parseStart);
            console.log(`Document Parsed. Type: ${fileType}, Words: ${wordCount}, Length: ${text.length}`);

            textChunks = chunkText(text);
        } catch (parseError: unknown) {
            console.error("Parser Error:", parseError);
            const msg = parseError instanceof Error ? parseError.message : String(parseError);
            logParserError(file.type || "unknown", file.size, msg);
            // Cleanup uploaded file on parse failure
            await supabase.storage.from("documents").remove([fileName]);
            return NextResponse.json({ error: msg }, { status: 422 });
        }

        // 3. Generate Embeddings & Store
        try {
            for (const chunk of textChunks) {
                const embedding = await generateEmbedding(chunk);

                const { error: dbError } = await supabase
                    .from("document_chunks")
                    .insert({
                        content: chunk,
                        embedding,
                        file_path: fileName,
                        metadata: { file_name: file.name },
                    });

                if (dbError) throw dbError;
            }
        } catch (dbError: unknown) {
            await supabase.storage.from("documents").remove([fileName]);
            const msg = dbError instanceof Error ? dbError.message : String(dbError);
            throw new Error(`Database Error: ${msg}`);
        }

        return NextResponse.json({ success: true, fileName });

    } catch (error: unknown) {
        console.error("Ingestion Error Details:", error);
        const msg = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
