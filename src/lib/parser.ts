import type { Buffer } from "node:buffer";

export type ParseResult = {
    text: string;
    pageCount?: number;
    wordCount: number;
    fileType: string;
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB hard limit
const MIN_TEXT_LENGTH = 50; // If we extract less than this, warn user

// ─── PDF Parsing ──────────────────────────────────────────────────────────────
async function parsePDF(buffer: Buffer): Promise<string> {
    // Lazy require to avoid edge runtime issues
    /* eslint-disable @typescript-eslint/no-require-imports */
    let pdfParse = require("pdf-parse");
    // Handle Next.js Webpack / Edge module mangling
    if (pdfParse && typeof pdfParse === "object" && "default" in pdfParse) {
        pdfParse = pdfParse.default;
    }
    /* eslint-enable @typescript-eslint/no-require-imports */

    let data: { text: string; numpages: number };
    try {
        data = await pdfParse(buffer, {
            // Don't render pages — raw text only
            pagerender: undefined,
            max: 0, // No page limit
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);

        // Detect scanned-only PDFs
        if (
            msg.includes("No text") ||
            msg.includes("no text") ||
            msg.includes("stream") ||
            msg.includes("password")
        ) {
            throw new Error(
                "SCANNED_PDF: This PDF appears to be image-based (scanned). " +
                "Please paste your text directly instead, or upload a digitally-created PDF."
            );
        }

        throw new Error(`PDF could not be read: ${msg.substring(0, 200)}`);
    }

    const text = (data.text || "").trim();

    if (text.length < MIN_TEXT_LENGTH) {
        throw new Error(
            "SCANNED_PDF: Very little text was extracted from this PDF. " +
            "It may be a scanned document. Try pasting your text directly instead."
        );
    }

    return text;
}

// ─── DOCX / DOC Parsing ───────────────────────────────────────────────────────
async function parseDOCX(buffer: Buffer): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require("mammoth");

    const result = await mammoth.extractRawText({ buffer });

    if (result.messages?.length > 0) {
        // Log non-fatal warnings from mammoth (e.g. unsupported features)
        for (const msg of result.messages) {
            if (msg.type === "warning") {
                console.warn("[Parser] Mammoth warning:", msg.message);
            }
        }
    }

    const text = (result.value || "").trim();
    if (!text) {
        throw new Error(
            "This Word document appears to be empty or contains only images/tables that cannot be extracted. " +
            "Try copying and pasting your text instead."
        );
    }

    return text;
}

// ─── CSV Parsing ──────────────────────────────────────────────────────────────
async function parseCSV(text: string): Promise<string> {
    const { default: Papa } = await import("papaparse");

    const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
    });

    if (result.errors.length > 0 && result.data.length === 0) {
        throw new Error("This CSV file could not be parsed. Please check the file format.");
    }

    // Convert CSV rows to readable text
    const headers = result.meta.fields || [];
    const rows = result.data as Record<string, string>[];

    const lines: string[] = [
        `CSV Data (${rows.length} rows, ${headers.length} columns):`,
        `Columns: ${headers.join(", ")}`,
        "",
        ...rows.slice(0, 500).map(row =>  // Cap at 500 rows to prevent overflow
            headers.map(h => `${h}: ${row[h] ?? ""}`).join(" | ")
        ),
    ];

    if (rows.length > 500) {
        lines.push(`\n[Note: Showing first 500 of ${rows.length} rows]`);
    }

    return lines.join("\n");
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export async function parseDocument(
    buffer: Buffer,
    mimeType: string,
    fileName: string,
    fileSizeBytes?: number
): Promise<ParseResult> {
    // ── Size guard ──
    const size = fileSizeBytes ?? buffer.byteLength;
    if (size > MAX_FILE_SIZE_BYTES) {
        const mb = (size / 1024 / 1024).toFixed(1);
        throw new Error(
            `File too large (${mb} MB). Please keep files under 10 MB. ` +
            "For large documents, try splitting them into sections."
        );
    }

    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

    let text = "";
    let fileType = "unknown";

    // ── Route by MIME type or extension ──
    if (mimeType === "application/pdf" || ext === "pdf") {
        fileType = "PDF";
        text = await parsePDF(buffer);
    } else if (
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        ext === "docx"
    ) {
        fileType = "DOCX";
        text = await parseDOCX(buffer);
    } else if (
        mimeType === "application/msword" ||
        ext === "doc"
    ) {
        fileType = "DOC";
        // mammoth can handle old .doc via buffer too, though with less reliability
        text = await parseDOCX(buffer);
    } else if (mimeType === "text/csv" || ext === "csv") {
        fileType = "CSV";
        text = await parseCSV(buffer.toString("utf-8"));
    } else if (
        mimeType === "text/plain" ||
        ext === "txt" ||
        ext === "md" ||
        ext === "markdown"
    ) {
        fileType = "TXT";
        text = buffer.toString("utf-8").trim();
        if (!text) {
            throw new Error("This text file appears to be empty.");
        }
    } else {
        throw new Error(
            `Unsupported file type: .${ext || mimeType}. ` +
            "Please upload a PDF, DOCX, TXT, or CSV file."
        );
    }

    // ── Post-processing ──
    // Collapse excessive whitespace (3+ blank lines → 1)
    text = text.replace(/\n{3,}/g, "\n\n").trim();

    const wordCount = text.split(/\s+/).filter(Boolean).length;

    if (wordCount < 10) {
        throw new Error(
            `Very little text was extracted from this ${fileType} (${wordCount} words). ` +
            "The file may be empty, image-only, or password-protected."
        );
    }

    return {
        text,
        wordCount,
        fileType,
    };
}
