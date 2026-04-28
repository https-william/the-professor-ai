/**
 * Scholarly API Utilities
 * Standardizes fetch operations to prevent HTML leakage from poisoning JSON parsers.
 */

export interface SafeRes<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export async function safeFetch<T>(
    url: string,
    options?: RequestInit
): Promise<SafeRes<T>> {
    try {
        const res = await fetch(url, options);
        
        // 1. Check for basic Network errors
        if (!res.ok) {
            // Attempt to parse JSON error if available
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errData = await res.json();
                return { success: false, error: errData.error || `Server Error (${res.status})` };
            }
            return { success: false, error: `Scholarly synchronization failed (${res.status})` };
        }

        // 2. Validate Content-Type before parsing JSON
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            console.error("API Leakage Detected: Expected JSON but received", contentType);
            return { 
                success: false, 
                error: "Network synchronization failed. Service momentarily unreachable." 
            };
        }

        const data = await res.json();
        return { success: true, data };
    } catch (error) {
        console.error("SafeFetch Network Error:", error);
        return { 
            success: false, 
            error: "Scholarly services are temporarily unreachable. Verify your connection." 
        };
    }
}
