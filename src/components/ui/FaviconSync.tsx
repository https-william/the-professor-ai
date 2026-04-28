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
    const { theme } = useTheme();

    useEffect(() => {
        const updateFavicons = () => {
            const isDark = theme === "dark";
            const prefix = isDark ? "/favicons/dark" : "";
            
            // Standard Icons
            const icon32 = document.querySelector('link[sizes="32x32"][type="image/png"]');
            const icon16 = document.querySelector('link[sizes="16x16"][type="image/png"]');
            const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
            
            if (icon32) icon32.setAttribute("href", `${prefix}/favicon-32x32.png`);
            if (icon16) icon16.setAttribute("href", `${prefix}/favicon-16x16.png`);
            if (appleIcon) appleIcon.setAttribute("href", `${prefix}/apple-touch-icon.png`);

            // Fallback shortcut icon
            const shortcutIcon = document.querySelector('link[rel="shortcut icon"]');
            if (shortcutIcon) shortcutIcon.setAttribute("href", isDark ? "/favicons/dark/favicon.ico" : "/favicon.ico");
        };

        updateFavicons();
    }, [theme]);

    return null; // This component has no UI
}
