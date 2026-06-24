"use client";

import { useEffect } from "react";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { THEME_PRESETS, ThemePreset } from "@/lib/design-tokens";

export default function ThemePresetManager() {
    const { preferences } = useUserPreferences();
    const preset: ThemePreset = preferences?.theme_preset || "midnight-scholar";

    useEffect(() => {
        if (typeof window === "undefined") return;

        const colors = THEME_PRESETS[preset] || THEME_PRESETS["midnight-scholar"];
        const root = document.documentElement;

        // Set CSS Variables dynamically on root element
        root.style.setProperty("--bg", colors.bg);
        root.style.setProperty("--bg-2", colors.bg2);
        root.style.setProperty("--bg-3", colors.bg3);
        root.style.setProperty("--text", colors.text);
        root.style.setProperty("--text-2", colors.textMuted);
        
        root.style.setProperty("--foreground", colors.text);
        root.style.setProperty("--foreground-muted", colors.textMuted);
        root.style.setProperty("--foreground-secondary", colors.textMuted);

        root.style.setProperty("--accent", colors.accent);
        root.style.setProperty("--accent-bg", colors.accentDim);
        root.style.setProperty("--accent-glow", colors.accentDim);
        root.style.setProperty("--accent-border", colors.accentBorder);

        // Derive light and dark variants of accent
        let accentLight = "#F2BE65";
        let accentDark = "#B8821F";

        if (preset === "volcanic-ember") {
            accentLight = "#E6874B";
            accentDark = "#A8521C";
        } else if (preset === "obsidian") {
            accentLight = "#A5A5FF";
            accentDark = "#5E5EFF";
        } else if (preset === "high-contrast") {
            accentLight = "#FFE033";
            accentDark = "#CCAC00";
        }

        root.style.setProperty("--accent-light", accentLight);
        root.style.setProperty("--accent-dark", accentDark);
    }, [preset]);

    return null;
}
