"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: "light" | "dark";
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): "light" | "dark" {
    if (typeof window !== "undefined") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light"; // Default to light mode
}

function getStoredTheme(): Theme {
    return "dark"; // locked to dark mode for The Professor
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme] = useState<Theme>("dark");
    const [resolvedTheme] = useState<"light" | "dark">("dark");
    const [mounted, setMounted] = useState(false);

    // Initial mount - lock theme to dark
    useEffect(() => {
        if (typeof window !== "undefined") {
            document.documentElement.classList.remove("light");
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        }
        setMounted(true);
    }, []);

    const setTheme = useCallback((newTheme: Theme) => {
        // Theme is locked to dark mode
    }, []);

    const toggleTheme = useCallback(() => {
        // Theme is locked to dark mode
    }, []);

    // Note: We no longer return null here to prevent "Double-Null" hydration blackouts.
    // The documents will render with the resolvedTheme (default light) immediately.

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
