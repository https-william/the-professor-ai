
import posthog from 'posthog-js';

// Robust Env Getter
const getEnv = (key: string) => {
    try {
        // @ts-ignore
        return import.meta.env[key];
    } catch {
        // Check standard process.env if strictly needed
        if (typeof process !== 'undefined' && process.env) return process.env[key];
        return undefined;
    }
}

const PH_KEY = getEnv('VITE_POSTHOG_KEY');
const PH_HOST = getEnv('VITE_POSTHOG_HOST') || 'https://app.posthog.com';

let isInitialized = false;

export const initAnalytics = () => {
    if (isInitialized) return;
    
    if (PH_KEY) {
        posthog.init(PH_KEY, {
            api_host: PH_HOST,
            autocapture: true, // Auto-track clicks/interactions
            capture_pageview: false // We handle this manually in SPA
        });
        isInitialized = true;
        console.log("Telemetry: Online");
    } else {
        console.log("Telemetry: Offline (No Key)");
    }
};

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    if (!isInitialized) {
        // Dev log
        console.log(`[Analytics] ${eventName}`, properties);
        return;
    }
    posthog.capture(eventName, properties);
};

export const identifyUser = (userId: string, email?: string) => {
    if (!isInitialized) return;
    posthog.identify(userId, { email });
};

export const trackPageView = (path: string) => {
    if (!isInitialized) return;
    posthog.capture('$pageview', {
        $current_url: window.location.origin + path
    });
};
