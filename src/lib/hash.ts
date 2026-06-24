export async function computeFileHash(file: File): Promise<string> {
    try {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (err) {
        console.error("Failed to compute SHA-256 hash:", err);
        return Math.random().toString(36).substring(7); // Fallback
    }
}

export async function computeStringHash(text: string): Promise<string> {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (err) {
        console.error("Failed to compute string hash:", err);
        return Math.random().toString(36).substring(7);
    }
}
