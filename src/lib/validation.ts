/**
 * Input Validation & Security Utilities
 * Guards against prompt injection and validates user input
 */

// Maximum content lengths
export const LIMITS = {
    MAX_CONTENT_LENGTH: 50000,  // 50k chars max
    MAX_TOPIC_LENGTH: 500,
    MAX_QUESTION_COUNT: 70,
    MIN_QUESTION_COUNT: 1,
    MIN_CONTENT_LENGTH: 10,
};

// Suspicious patterns that might indicate prompt injection
const INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|commands?)/i,
    /disregard\s+(all\s+)?(previous|prior|above)/i,
    /forget\s+(everything|all|what)\s+(i\s+said|you\s+know)/i,
    /you\s+are\s+now\s+a/i,
    /pretend\s+(to\s+be|you\s+are)/i,
    /act\s+as\s+(if|a|an)/i,
    /new\s+instructions?:/i,
    /override\s+(previous\s+)?instructions?/i,
    /system\s*:\s*/i,
    /\[system\]/i,
    /\[instruction\]/i,
    /###\s*(system|instruction)/i,
    /<\/?system>/i,
    /\bDAN\b.*mode/i,
    /jailbreak/i,
    /bypass\s+(safety|filter|restriction)/i,
];

// Content type validation
const VALID_CONTENT_PATTERNS = {
    // Educational content should have actual text, not just special chars
    hasAlphanumeric: /[a-zA-Z0-9]/,
    // Should have some sentence structure
    hasSentenceStructure: /[.!?]/,
};

export interface ValidationResult {
    isValid: boolean;
    error?: string;
    sanitized?: string;
}

/**
 * Sanitize and validate user content input
 */
export function validateContent(content: unknown): ValidationResult {
    // Type check
    if (typeof content !== "string") {
        return { isValid: false, error: "Content must be a string" };
    }

    // Length checks
    if (content.length < LIMITS.MIN_CONTENT_LENGTH) {
        return { isValid: false, error: "Content is too short. Please provide more text." };
    }

    if (content.length > LIMITS.MAX_CONTENT_LENGTH) {
        return { isValid: false, error: `Content exceeds ${LIMITS.MAX_CONTENT_LENGTH} characters` };
    }

    // Check for injection patterns
    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(content)) {
            // Don't reveal which pattern matched
            return { isValid: false, error: "Invalid content detected. Please provide educational material only." };
        }
    }

    // Ensure it looks like real content
    if (!VALID_CONTENT_PATTERNS.hasAlphanumeric.test(content)) {
        return { isValid: false, error: "Content must contain readable text" };
    }

    // Sanitize: remove potential control characters, normalize whitespace
    const sanitized = content
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Control chars
        .replace(/\r\n/g, "\n") // Normalize line endings
        .trim();

    return { isValid: true, sanitized };
}

/**
 * Validate topic/title input
 */
export function validateTopic(topic: unknown): ValidationResult {
    if (typeof topic !== "string") {
        return { isValid: false, error: "Topic must be a string" };
    }

    if (topic.length > LIMITS.MAX_TOPIC_LENGTH) {
        return { isValid: false, error: `Topic exceeds ${LIMITS.MAX_TOPIC_LENGTH} characters` };
    }

    // Check for injection in topic
    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(topic)) {
            return { isValid: false, error: "Invalid topic" };
        }
    }

    const sanitized = topic.replace(/[\x00-\x1F\x7F]/g, "").trim();
    
    return { isValid: true, sanitized };
}

/**
 * Validate count parameter
 */
export function validateCount(count: unknown, defaultValue = 10): { isValid: boolean; value: number } {
    if (count === undefined || count === null) {
        return { isValid: true, value: defaultValue };
    }

    const num = typeof count === "string" ? parseInt(count, 10) : count;
    
    if (typeof num !== "number" || isNaN(num)) {
        return { isValid: true, value: defaultValue };
    }

    // Clamp to valid range
    const clamped = Math.max(LIMITS.MIN_QUESTION_COUNT, Math.min(LIMITS.MAX_QUESTION_COUNT, num));
    
    return { isValid: true, value: clamped };
}

/**
 * Validate difficulty level
 */
export function validateDifficulty(difficulty: unknown): "easy" | "medium" | "difficult" | "nightmare" {
    const valid = ["easy", "medium", "difficult", "nightmare"];
    if (typeof difficulty === "string" && valid.includes(difficulty.toLowerCase())) {
        return difficulty.toLowerCase() as "easy" | "medium" | "difficult" | "nightmare";
    }
    return "medium"; // Default
}

/**
 * Validate email (basic check - not a security feature, just UX)
 */
export function validateEmail(email: unknown): ValidationResult {
    if (typeof email !== "string") {
        return { isValid: false, error: "Email must be a string" };
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, error: "Invalid email format" };
    }

    // No injection in email
    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(email)) {
            return { isValid: false, error: "Invalid email" };
        }
    }

    return { isValid: true, sanitized: email.toLowerCase().trim() };
}

/**
 * Generate a safe error response
 */
export function safeErrorResponse(message: string, status = 400): Response {
    return new Response(
        JSON.stringify({ error: message }),
        { status, headers: { "Content-Type": "application/json" } }
    );
}
