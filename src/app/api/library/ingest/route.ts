import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/ai/embedding";
import { parseDocument } from "@/lib/parser";

// 1MB chunk size approx (characters)
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

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
    
    // Store original file
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
        const { text, metadata } = await parseDocument(file);
        
        console.log(`Document Parsed. Length: ${text.length}`);
        
        // Simple chunking (approx 1000 chars)
        textChunks = text.match(/[\s\S]{1,1000}/g) || [];
    } catch (parseError: any) {
        console.error("Parser Error:", parseError);
        // cleanup file
        await supabase.storage.from('documents').remove([fileName]);
        throw new Error(`Failed to parse document: ${parseError.message}`);
    }

    // 3. Generate Embeddings & Store
    try {
        for (const chunk of textChunks) {
            const embedding = await generateEmbedding(chunk);
            
            const { error: dbError } = await supabase
                .from('document_chunks')
                .insert({
                    content: chunk,
                    embedding,
                    file_path: fileName,
                    metadata: { file_name: fileName }
                });

            if (dbError) throw dbError;
        }
    } catch (dbError: any) {
        // cleanup file if embedding fails
        await supabase.storage.from('documents').remove([fileName]);
        throw new Error(`Database Error: ${dbError.message}`);
    }

    return NextResponse.json({ 
      success: true, 
      fileName 
    });

  } catch (error: any) {
    console.error("Ingestion Error Details:", error);
    
    // Nice error formatting
    let msg = error.message || "Unknown error";
    if (msg.includes("pdf")) msg = `PDF Error: ${msg}`;
    
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
