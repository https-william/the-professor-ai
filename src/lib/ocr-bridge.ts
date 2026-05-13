import { createWorker } from 'tesseract.js';

/**
 * High-performance OCR Bridge for "The Professor"
 * Processes images extracted from PDF/PPTX using Tesseract.js (WASM)
 */
export async function performOCR(images: { data: string; ext: string }[]): Promise<string> {
    if (!images || images.length === 0) return "";

    const worker = await createWorker('eng');
    let combinedText = "";

    try {
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            // images from backend are base64 strings
            const base64Data = `data:image/${img.ext};base64,${img.data}`;
            
            const { data: { text } } = await worker.recognize(base64Data);
            combinedText += `\n\n--- OCR Page/Image ${i + 1} ---\n\n${text}`;
        }
    } finally {
        await worker.terminate();
    }

    return combinedText;
}

/**
 * Strategy:
 * 1. PDF/PPTX -> Backend (Extract Images)
 * 2. Backend -> Returns JSON with base64 images
 * 3. Frontend -> OCR Bridge (this file) -> Markdown
 */
