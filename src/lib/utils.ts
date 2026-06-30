import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanDocumentTitle(title: string): string {
    if (!title) return "";
    let cleaned = title;
    // Strip prefixes like "DOCUMENT:" or "Document:"
    cleaned = cleaned.replace(/^(document|file|notes|doc)\s*:\s*/i, "");
    // Strip suffixes like "--- --- OCR PAGE/IMAGE" or similar
    cleaned = cleaned.replace(/\s*-+\s*-+\s*ocr\s+page\/image/i, "");
    cleaned = cleaned.replace(/\s*---\s*---\s*.*$/i, "");
    // Strip file extensions like .pdf, .docx, .txt
    cleaned = cleaned.replace(/\.(pdf|docx|txt|html|png|jpg|jpeg)$/i, "");
    
    // Replace hyphens/underscores with spaces
    cleaned = cleaned.replace(/[-_]+/g, " ");
    
    // Parse out course code if any, e.g. "TMC221 LECTUREONE GOAL..." -> "TMC221: Goal Setting..."
    cleaned = cleaned.replace(/^([a-z]{3}\d{3})\s+(lecture\s+\w+|lectureone|lecture\d+|one|two|three)?\s*/i, (match, code, lecture) => {
        return `${code.toUpperCase()}: `;
    });
    
    // Title case/Sentence case conversion
    cleaned = cleaned
        .split(" ")
        .map((word, idx) => {
            if (!word) return "";
            if (idx === 0 && word.endsWith(":")) return word; // course code
            // If it's a small word keep lowercase unless first word
            const lower = word.toLowerCase();
            const smallWords = ["and", "or", "of", "to", "the", "for", "in", "on", "with", "a", "an", "at", "by", "from"];
            if (smallWords.includes(lower) && idx > 1) {
                return lower;
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ");
        
    return cleaned.trim().replace(/:\s*$/, "");
}

