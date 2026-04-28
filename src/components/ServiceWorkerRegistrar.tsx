"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            window.addEventListener("load", () => {
                navigator.serviceWorker
                    .register("/sw.js")
                    .then((registration) => {
                        console.log("SW registered");

                        // Check for updates
                        registration.addEventListener("updatefound", () => {
                            const newWorker = registration.installing;
                            if (newWorker) {
                                newWorker.addEventListener("statechange", () => {
                                    if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                                        // New content is available, but wait for user to refresh or handle it
                                        console.log("New content available");
                                        window.dispatchEvent(new CustomEvent("pwa-update-available"));
                                    }
                                });
                            }
                        });
                    })
                    .catch((error) => {
                        console.error("SW registration failed:", error);
                    });
            });

            // Handle controller change (e.g. after skipWaiting)
            let refreshing = false;
            navigator.serviceWorker.addEventListener("controllerchange", () => {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });
        }
    }, []);

    return null;
}
