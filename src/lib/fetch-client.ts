/**
 * Smart Fetch Client
 * Provides automated retry mechanisms with exponential backoff, rate limit handling,
 * and offline status detection/blocking to prevent raw unhandled network errors.
 */

export async function smartFetch(url: string, options: RequestInit = {}, retries = 3, delay = 1000): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        // If navigator is offline, block and wait for internet connectivity
        if (typeof window !== "undefined" && !navigator.onLine) {
            await new Promise<void>((resolve) => {
                const handleOnline = () => {
                    window.removeEventListener("online", handleOnline);
                    resolve();
                };
                window.addEventListener("online", handleOnline);
            });
        }

        try {
            const res = await fetch(url, options);

            // Successfully received response
            if (res.ok) {
                return res;
            }

            // Retry on server errors or rate limit
            const shouldRetry = res.status === 429 || (res.status >= 500 && res.status < 600);
            if (!shouldRetry || i === retries - 1) {
                return res;
            }
        } catch (err) {
            // Network failures / fetch failures
            if (i === retries - 1) {
                throw err;
            }
        }

        // Wait with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
    }
    throw new Error("Request failed after maximum retries");
}
