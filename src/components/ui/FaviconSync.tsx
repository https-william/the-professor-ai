"use client";

import { useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

/**
 * FaviconSync handles dynamic favicon updates based on the application's theme state.
 * Since browser media queries (media: "(prefers-color-scheme: dark)") only respect
 * the OS theme, we need this component to manually swap favicons when the user
 * toggles the app theme.
 */
export default function FaviconSync() {
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        const updateFavicons = () => {
            const isDark = resolvedTheme === "dark";
            const prefix = isDark ? "/favicons/dark" : "";
            
            // Standard Icons
            const icon32 = document.querySelector('link[sizes="32x32"][type="image/png"]');
            const icon16 = document.querySelector('link[sizes="16x16"][type="image/png"]');
            const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
            
            if (icon32) icon32.setAttribute("href", "/logo.svg");
            if (icon16) icon16.setAttribute("href", "/logo.svg");
            if (appleIcon) appleIcon.setAttribute("href", "/logo.svg");

            // Fallback shortcut icon
            const shortcutIcon = document.querySelector('link[rel="shortcut icon"]');
            if (shortcutIcon) shortcutIcon.setAttribute("href", "/logo.svg");
        };

        updateFavicons();
    }, [resolvedTheme]);

    return null; // This component has no UI
}
