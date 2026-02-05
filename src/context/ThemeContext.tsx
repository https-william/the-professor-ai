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
    return "light";
}

function getStoredTheme(): Theme {
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem("theme");
        if (stored === "light" || stored === "dark" || stored === "system") {
            return stored;
        }
    }
    return "system"; // Default to system
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("system");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
    const [mounted, setMounted] = useState(false);

    // Initial mount - read from storage
    useEffect(() => {
        const storedTheme = getStoredTheme();
        const systemTheme = getSystemTheme();
        const resolved = storedTheme === "system" ? systemTheme : storedTheme;

        setThemeState(storedTheme);
        setResolvedTheme(resolved);

        // Apply to DOM
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(resolved);

        setMounted(true);
    }, []); // Only run once on mount

    // Listen for system theme changes
    useEffect(() => {
        if (!mounted) return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const handleChange = () => {
            if (theme === "system") {
                const newResolved = getSystemTheme();
                setResolvedTheme(newResolved);
                document.documentElement.classList.remove("light", "dark");
                document.documentElement.classList.add(newResolved);
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [mounted, theme]);

    const setTheme = useCallback((newTheme: Theme) => {
        const resolved = newTheme === "system" ? getSystemTheme() : newTheme;

        setThemeState(newTheme);
        setResolvedTheme(resolved);

        // Apply to DOM immediately
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(resolved);

        // Persist
        localStorage.setItem("theme", newTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        // Simple toggle: light <-> dark (exit system mode on toggle)
        const newTheme = resolvedTheme === "light" ? "dark" : "light";
        setTheme(newTheme);
    }, [resolvedTheme, setTheme]);

    // Show nothing until mounted to prevent hydration mismatch
    if (!mounted) {
        return null;
    }

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
