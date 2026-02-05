import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML input to prevent XSS attacks.
 * Uses DOMPurify to strip malicious tags and attributes.
 */
export const sanitizeInput = (dirty: string): string => {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'li', 'code', 'pre'],
        ALLOWED_ATTR: ['href', 'target', 'class']
    });
};

/**
 * Creates a rate limiter function.
 * @param limit Max number of calls within the interval
 * @param interval Window in milliseconds
 */
export const createRateLimiter = (limit: number, interval: number) => {
    let calls = 0;
    let startTime = Date.now();

    return (): boolean => {
        const now = Date.now();
        if (now - startTime > interval) {
            startTime = now;
            calls = 0;
        }

        if (calls < limit) {
            calls++;
            return true;
        }
        return false;
    };
};

/**
 * Simple debounce function for input handlers
 */
export const debounce = <T extends (...args: any[]) => void>(func: T, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};
