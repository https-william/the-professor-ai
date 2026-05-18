import type { Buffer } from "node:buffer";
import { extractTextWithGemini } from "./ai/vision";

export type ParseResult = {
    text: string;
    pageCount?: number;
    wordCount: number;
    fileType: string;
    isMultimodal?: boolean;
};

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // Expanded to 15MB for high-fidelity images/PDFs
const MIN_TEXT_LENGTH = 10; // Lowered for multimodal transcription

// ─── PDF Parsing ──────────────────────────────────────────────────────────────
async function parsePDF(buffer: Buffer): Promise<{ text: string; isScanned: boolean }> {
    // Lazy require to avoid edge runtime issues
    /* eslint-disable @typescript-eslint/no-require-imports */
    let pdfParse = require("pdf-parse");
    if (pdfParse && typeof pdfParse === "object" && "default" in pdfParse) {
        pdfParse = pdfParse.default;
    }
    /* eslint-enable @typescript-eslint/no-require-imports */

    try {
        // max: 0 means all pages, but pdf-parse is optimized. We ensure pagerender is clean.
        const data = await pdfParse(buffer, { pagerender: undefined, max: 0 });
        const rawText = (data.text || "").trim();

        // Heuristic: If we have multiple pages but almost no text, it's likely scanned
        const isScanned = rawText.length < 50 && data.numpages > 0;
        
        return { text: rawText, isScanned };
    } catch (err: unknown) {
        // If pdf-parse fails entirely, we treat it as a potential scanned/complex PDF
        return { text: "", isScanned: true };
    }
}

// ─── NATIVE OFFICE EXTRACTION (PPTX, XLSX, DOCX) ─────────────────────────────
async function parseOffice(buffer: Buffer, fileName: string, ext: string): Promise<string> {
    const { extractRawTextFromOffice } = require("./parser/raw-xml");
    const { extractor } = require("office-text-extractor");
    const officeParser = require("officeparser");
    const XLSX = require("xlsx");
    
    let text = "";

    // ── LAYER 0: THE PERMANENT SOLUTION (RAW XML) ──
    try {
        console.log(`[Parser] Running "The Permanent Solution" (Raw XML) for ${fileName}...`);
        text = await extractRawTextFromOffice(buffer, ext);
        if (text && text.length > MIN_TEXT_LENGTH) return text;
    } catch (err) {
        console.warn(`[Parser] Permanent Solution failed for ${fileName}:`, err);
    }

    // ── LAYER 1: SPECIALIZED LOCAL HANDLERS (Memory Optimized for 1GB RAM) ──
    try {
        if (["xlsx", "xls", "csv"].includes(ext)) {
            console.log(`[Parser] Attempting specialized XLSX extraction for ${fileName}...`);
            // sheetRows: 500 strictly limits memory allocation on 1GB RAM budget devices
            const workbook = XLSX.read(buffer, { type: "buffer", sheetRows: 500 });
            const sheetNames = workbook.SheetNames.slice(0, 5); // Limit to first 5 sheets
            text = sheetNames.map((name: string) => {
                const sheet = workbook.Sheets[name];
                return XLSX.utils.sheet_to_txt(sheet);
            }).join("\n\n");
        } 
        else if (["pptx", "docx"].includes(ext)) {
            console.log(`[Parser] Attempting specialized Office extraction for ${fileName}...`);
            text = await extractor().extract(buffer);
        }
        
        if (text && text.length > MIN_TEXT_LENGTH) return text.trim();
    } catch (err) {
        console.warn(`[Parser] Layer 1 extraction failed for ${fileName}:`, err);
    }

    // ── LAYER 2: GENERIC LOCAL FAILOVER (officeparser) ──
    try {
        console.log(`[Parser] Attempting Layer 2 (officeparser) for ${fileName}...`);
        const result = await officeParser.parseOfficeAsync(buffer);
        if (result && result.length > MIN_TEXT_LENGTH) return result.trim();
    } catch (err) {
        console.warn(`[Parser] Layer 2 extraction failed for ${fileName}:`, err);
    }

    throw new Error(`Local extraction failed for ${fileName}. Please ensure the file is not corrupted.`);
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export async function parseDocument(
    buffer: Buffer,
    mimeType: string,
    fileName: string,
    fileSizeBytes?: number
): Promise<ParseResult> {
    const size = fileSizeBytes ?? buffer.byteLength;
    if (size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`File too large (${(size / 1024 / 1024).toFixed(1)} MB). Limit is 15MB.`);
    }

    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
    let text = "";
    let fileType = "unknown";
    let isMultimodal = false;

    // ── NATIVE OFFICE PATH (PPTX, XLSX, DOCX) ──
    const isDigitalOffice = [
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.ms-excel",
        "application/vnd.ms-office",
        "application/msword"
    ].includes(mimeType) || ["pptx", "xlsx", "docx", "ppt", "xls", "doc"].includes(ext);

    if (isDigitalOffice) {
        fileType = ext.toUpperCase() || "OFFICE";
        text = await parseOffice(buffer, fileName, ext);
    } 
    // ── IMAGE SUPPORT ──
    else if (mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "webp"].includes(ext)) {
        fileType = "IMAGE";
        const base64 = buffer.toString('base64');
        return {
            text: "",
            wordCount: 0,
            fileType: "IMAGE",
            isMultimodal: true,
            // @ts-ignore - Adding images for frontend OCR flow
            images: [{ data: base64, ext: ext || 'png' }],
            isOcrRequired: true
        };
    } 
    // ── PDF ──
    else if (mimeType === "application/pdf" || ext === "pdf") {
        fileType = "PDF";
        const { text: rawText, isScanned } = await parsePDF(buffer);
        
        if (isScanned && rawText.length === 0) {
            throw new Error("This PDF appears to be images only (no selectable text). Please upload the original .pptx or .docx file for perfect extraction.");
        } else {
            text = rawText;
        }
    } 
    // ── CSV (Memory Optimized for 1GB RAM) ──
    else if (mimeType === "text/csv" || ext === "csv") {
        const { default: Papa } = await import("papaparse");
        // preview: 500 strictly stops parsing after 500 rows, saving massive memory
        const result = Papa.parse(buffer.toString("utf-8"), { header: true, skipEmptyLines: true, preview: 500 });
        text = result.data.map((row: any) => Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(" | ")).join("\n");
        fileType = "CSV";
    } 
    // ── TXT / MD ──
    else if (["text/plain", "text/markdown"].includes(mimeType) || ["txt", "md"].includes(ext)) {
        fileType = "TXT";
        text = buffer.toString("utf-8").trim();
    } 
    else {
        throw new Error(`Unsupported file type: .${ext}. Please upload standard academic files.`);
    }

    if (!text || text.length < MIN_TEXT_LENGTH) {
        throw new Error(`Extraction failed for ${fileType}. The file may be empty or corrupted.`);
    }

    return {
        text: text.replace(/\n{3,}/g, "\n\n").trim(),
        wordCount: text.split(/\s+/).filter(Boolean).length,
        fileType,
        isMultimodal: false
    };
}

