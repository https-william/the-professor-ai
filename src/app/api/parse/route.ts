export const dynamic = 'force-dynamic';


import { NextRequest, NextResponse } from "next/server";
import { parseDocument } from "@/lib/parser";
import { logParserError, logParserSuccess } from "@/lib/error-logger";



export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        console.log(`[Parser] Received: ${file.name} (${file.type})`);
        
        const parseStart = Date.now();
        // ── MARKITDOWN INTEGRATION ──────────────────────────────────────────
        // We forward the file to our Python-based MarkItDown converter
        const markitdownUrl = `${new URL(req.url).origin}/api/markitdown`;
        
        try {
            const pythonResponse = await fetch(markitdownUrl, {
                method: "POST",
                body: formData, // Forward the original formData
            });

            if (!pythonResponse.ok) {
                const errorData = await pythonResponse.json().catch(() => ({}));
                throw new Error(errorData.error || "Python parser failed");
            }

            const { text, fileType } = await pythonResponse.json();
            const wordCount = text.split(/\s+/).filter(Boolean).length;

            logParserSuccess(fileType || "UNKNOWN", file.size, wordCount, Date.now() - parseStart);
            console.log(`[Parser] MarkItDown Success. Type: ${fileType}, Words: ${wordCount}`);

            return NextResponse.json({ 
                success: true, 
                text, 
                wordCount, 
                fileType,
                isMultimodal: false // MarkItDown handles layout/text natively
            });

        } catch (parseError: unknown) {
            const primaryMsg = parseError instanceof Error ? parseError.message : String(parseError);
            console.warn("[Parser] Python service unavailable or failed:", primaryMsg, "→ Falling back to native local extraction.");
            
            // Fallback to native local parser (handles PDF, DOCX, etc. natively without AI)
            try {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const { text, wordCount, fileType, isMultimodal } = await parseDocument(
                    buffer,
                    file.type,
                    file.name,
                    file.size
                );
                logParserSuccess(fileType, file.size, wordCount, Date.now() - parseStart);
                console.log(`[Parser] Local extraction success. Type: ${fileType}, Words: ${wordCount}`);
                return NextResponse.json({ success: true, text, wordCount, fileType, isMultimodal });
            } catch (fallbackError) {
                const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
                logParserError(file.type || "unknown", file.size, fallbackMsg);
                return NextResponse.json({ 
                    error: `I ran into an issue reading ${file.name}: ${fallbackMsg}. Try re-saving the file or converting it to a different format.` 
                }, { status: 422 });
            }
        }

    } catch (error: unknown) {
        console.error("[API] Parse Error:", error);
        return NextResponse.json({ error: "Failed to parse document" }, { status: 500 });
    }
}
