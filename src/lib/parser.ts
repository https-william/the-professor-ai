import { generateEmbedding } from "@/lib/ai/embedding";
import { getTextExtractor } from "office-text-extractor";
import Papa from "papaparse";
// @ts-ignore
import PDFParser from "pdf2json";

export type ParsedDocument = {
    text: string;
    metadata: Record<string, any>;
};

// Robust PDF Parser using pdf2json (Class-based, no import export ambiguity)
async function parsePDF(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        // Timeout Safety
        const timeout = setTimeout(() => {
             reject(new Error("PDF Parsing timed out after 15s"));
        }, 15000);

        try {
            console.log("Importing pdf2json...");
            const PDFParser = require("pdf2json");
            console.log("pdf2json Type:", typeof PDFParser);

            const parser = new PDFParser(null, 1); // 1 = text only

            parser.on("pdfParser_dataError", (errData: any) => {
                clearTimeout(timeout);
                console.error("PDF2JSON Error Event:", errData.parserError);
                reject(new Error(errData.parserError));
            });

            parser.on("pdfParser_dataReady", (pdfData: any) => {
                 clearTimeout(timeout);
                 console.log("PDF2JSON Ready Event Fired");
                 try {
                    const rawText = parser.getRawTextContent();
                    resolve(rawText);
                 } catch (e) {
                    try {
                        const text = pdfData.Pages.map((p: any) => 
                            p.Texts.map((t: any) => decodeURIComponent(t.R[0].T)).join(" ")
                        ).join("\n\n");
                        resolve(text);
                    } catch(err) {
                        reject(err);
                    }
                 }
            });

            console.log("Parsing Buffer...");
            parser.parseBuffer(buffer);

        } catch (err) {
            clearTimeout(timeout);
            console.error("PDF2JSON sync error:", err);
            reject(err);
        }
    });
}

export async function parseDocument(file: File): Promise<ParsedDocument> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const type = file.type;
    const name = file.name.toLowerCase();

    let text = "";

    console.log(`[Parser] Processing: ${name} (${type})`);

    try {
        // 1. PDF
        if (type === "application/pdf" || name.endsWith(".pdf")) {
            text = await parsePDF(buffer);
        } 
        // 2. Office Documents (PPTX, DOCX, XLSX)
        else if (
            name.endsWith(".pptx") || 
            name.endsWith(".docx") || 
            name.endsWith(".xlsx") ||
            type.includes("presentation") || 
            type.includes("document") ||
            type.includes("sheet")
        ) {
            const extractor = getTextExtractor();
            text = await extractor.extractText({ input: buffer, type: 'buffer' });
        }
        // 3. CSV / Text
        else if (type === "text/csv" || name.endsWith(".csv")) {
            const fileText = await file.text();
            const result = Papa.parse(fileText, { header: true });
            // Convert rows to meaningful string
            text = result.data.map((row: any) => JSON.stringify(row)).join("\n");
        }
        // 4. Plain Text / Markdown
        else if (type.startsWith("text/") || name.endsWith(".md") || name.endsWith(".txt")) {
            text = await file.text();
        }
        else {
            throw new Error(`Unsupported file type: ${type}`);
        }
    } catch (err: any) {
        console.error(`[Parser] Extraction failed for ${name}:`, err);
        throw new Error(`Extraction Logic Failed: ${err.message}`);
    }

    if (!text || text.trim().length < 1) {
        console.warn("[Parser] Text was empty, fallback to basic name/metadata");
        text = `File: ${name}`; 
    }

    return {
        text,
        metadata: {
            source: name,
            type: type,
            size: file.size,
            processedAt: new Date().toISOString()
        }
    };
}
