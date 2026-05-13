"use client";

import { useEffect } from "react";

/**
 * Hook to prevent accidental navigation or refresh during high-stakes sessions.
 * Implements the "Experience Architecture" resilience strategy.
 */
export function useUnsavedChanges(hasUnsavedChanges: boolean, message: string = "Oya, we have unsaved progress here. Don't let our hard work go to waste—are you sure you want to leave?") {
    useEffect(() => {
        if (!hasUnsavedChanges) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = message;
            return message;
        };

        const handlePopState = (e: PopStateEvent) => {
            if (hasUnsavedChanges && !window.confirm(message)) {
                // Push current state back to history to "stay" on the page
                window.history.pushState(null, "", window.location.href);
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        
        // This is a bit tricky with Next.js router, but for a simple "back" button check:
        window.history.pushState(null, "", window.location.href);
        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("popstate", handlePopState);
        };
    }, [hasUnsavedChanges, message]);
}
