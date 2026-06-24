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
    return "dark"; // Default to dark mode
}

function getStoredTheme(): Theme {
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem("theme") as Theme | null;
        if (stored === "light" || stored === "dark" || stored === "system") {
            return stored;
        }
    }
    return "dark"; // Default to dark mode for The Professor
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("dark");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const stored = getStoredTheme();
        setThemeState(stored);
        const resolved = stored === "system" ? getSystemTheme() : stored;
        setResolvedTheme(resolved);

        if (typeof window !== "undefined") {
            document.documentElement.classList.remove("light", "dark");
            document.documentElement.classList.add(resolved);
        }
        setMounted(true);
    }, []);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        const resolved = newTheme === "system" ? getSystemTheme() : newTheme;
        setResolvedTheme(resolved);

        if (typeof window !== "undefined") {
            localStorage.setItem("theme", newTheme);
            document.documentElement.classList.remove("light", "dark");
            document.documentElement.classList.add(resolved);
        }
    }, []);

    const toggleTheme = useCallback(() => {
        const currentResolved = theme === "system" ? getSystemTheme() : theme;
        const nextTheme = currentResolved === "dark" ? "light" : "dark";
        setTheme(nextTheme);
    }, [theme, setTheme]);

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
