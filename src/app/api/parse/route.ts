import { NextRequest, NextResponse } from "next/server";
import { parseDocument } from "@/lib/parser";
import { logParserError, logParserSuccess } from "@/lib/error-logger";

export const dynamic = "force-static";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        console.log(`[Parser] Received: ${file.name} (${file.type})`);
        
        // Convert File → Buffer for parser
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const parseStart = Date.now();

        try {
            const { text, wordCount, fileType } = await parseDocument(
                buffer,
                file.type,
                file.name,
                file.size
            );

            logParserSuccess(fileType, file.size, wordCount, Date.now() - parseStart);
            console.log(`[Parser] Success. Type: ${fileType}, Words: ${wordCount}, Length: ${text.length}`);

            return NextResponse.json({ 
                success: true, 
                text, 
                wordCount, 
                fileType 
            });
        } catch (parseError: unknown) {
            console.error("[Parser] Error:", parseError);
            const msg = parseError instanceof Error ? parseError.message : String(parseError);
            logParserError(file.type || "unknown", file.size, msg);
            return NextResponse.json({ error: msg }, { status: 422 });
        }

    } catch (error: unknown) {
        console.error("[API] Parse Error:", error);
        return NextResponse.json({ error: "Failed to parse document" }, { status: 500 });
    }
}
