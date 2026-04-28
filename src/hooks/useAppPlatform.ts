"use client";

import { useEffect, useState } from "react";

export type PlatformType = "web" | "desktop" | "mobile";

interface PlatformState {
    platform: PlatformType;
    isNative: boolean;
    isDesktop: boolean;
    isMobile: boolean;
    isWeb: boolean;
    isLoaded: boolean; // Vital for avoiding hydration mismatches
}

/**
 * Hook to detect the current platform.
 * Returns a neutral "web" state during SSR and initial hydration 
 * to ensure the client matches the server's "Generic Web" view perfectly.
 */
export function useAppPlatform(): PlatformState {
    // Initial state matching the Server-Side Render (SSR)
    const [state, setState] = useState<PlatformState>({
        platform: "web",
        isNative: false,
        isDesktop: false,
        isMobile: false,
        isWeb: true,
        isLoaded: false,
    });

    useEffect(() => {
        // Read platform attributes from the DOM set by the script in Head
        const html = document.documentElement;
        const platformAttr = html.getAttribute("data-platform") as PlatformType || "web";
        const isNativeAttr = html.getAttribute("data-native") === "true";

        setState({
            platform: platformAttr,
            isNative: isNativeAttr,
            isDesktop: platformAttr === "desktop",
            isMobile: platformAttr === "mobile",
            isWeb: platformAttr === "web",
            isLoaded: true,
        });
    }, []);

    return state;
}

