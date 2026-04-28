"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface PWAContextType {
    isInstallable: boolean;
    installApp: () => Promise<void>;
    notificationPermission: NotificationPermission;
    requestNotificationPermission: () => Promise<NotificationPermission>;
    isUpdateAvailable: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

    useEffect(() => {
        // Handle install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        // Handle update available
        const handleUpdateAvailable = () => {
            setIsUpdateAvailable(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("pwa-update-available", handleUpdateAvailable);

        if ("Notification" in window) {
            setNotificationPermission(Notification.permission);
        }

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("pwa-update-available", handleUpdateAvailable);
        };
    }, []);

    const installApp = async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === "accepted") {
            setDeferredPrompt(null);
            setIsInstallable(false);
        }
    };

    const requestNotificationPermission = async () => {
        if (!("Notification" in window)) return "default";
        
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        return permission;
    };

    return (
        <PWAContext.Provider value={{
            isInstallable,
            installApp,
            notificationPermission,
            requestNotificationPermission,
            isUpdateAvailable
        }}>
            {children}
        </PWAContext.Provider>
    );
}

export function usePWA() {
    const context = useContext(PWAContext);
    if (context === undefined) {
        throw new Error("usePWA must be used within a PWAProvider");
    }
    return context;
}
