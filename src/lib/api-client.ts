/**
 * Global API Client Utility
 * 
 * Bridges the gap between the Next.js hosted environment and the static Tauri environment.
 * When running in Tauri (protocol://), it uses absolute URLs pointing to the production server.
 */

const IS_NATIVE = typeof window !== 'undefined' && 
                 (window.location.protocol === 'tauri:' || 
                  window.location.protocol === 'asset:' ||
                  window.location.hostname === 'tauri.localhost' ||
                  window.location.hostname === 'localhost' && window.location.port === ''); // Some mobile contexts

export const PRODUCTION_URL = "https://theprofessor.xyz";

/**
 * Resolves a potentially relative API path to an absolute production URL if running in native mode.
 */
export function resolveApiUrl(path: string): string {
    if (!path.startsWith('/')) return path; // Already absolute or malformed
    
    // In Tauri/Static export, we must point to the remote server for API routes
    if (IS_NATIVE || process.env.NEXT_PUBLIC_FORCE_REMOTE_API === 'true') {
        return `${PRODUCTION_URL}${path}`;
    }
    
    return path;
}

/**
 * Resolves the correct redirect URL for Supabase Auth.
 * Native apps use a custom protocol (theprofessor://), while web uses standard origin.
 */
export function getRedirectUrl(): string {
    if (typeof window === 'undefined') return "https://theprofessor.xyz/auth/callback";

    const isNative = window.location.protocol === 'tauri:' || 
                    window.location.protocol === 'asset:' ||
                    window.location.hostname.includes('tauri') ||
                    (window.location.hostname === 'localhost' && window.location.port === '');

    if (isNative) {
        return "theprofessor://auth-callback";
    }

    return `${window.location.origin}/auth/callback`;
}

/**
 * A wrapper around fetch that automatically resolves relative API paths.
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
    const url = resolveApiUrl(path);
    return fetch(url, options);
}
