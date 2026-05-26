"use client";
import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useAppPlatform } from "@/hooks/useAppPlatform";
import { usePathname } from "next/navigation";

// Dynamically import platform-specific components with SSR disabled.
// This ensures Tauri-specific chunks are never loaded in a regular browser environment.
const DesktopTitleBar = dynamic(() => import("@/components/ui/DesktopTitleBar").catch((err) => {
    if (typeof window !== "undefined" && (err.name === "ChunkLoadError" || err.message?.includes("Failed to load chunk"))) {
        window.location.reload();
    }
    throw err;
}), { ssr: false });

const MobileNavigation = dynamic(() => import("@/components/navigation/MobileNavigation").catch((err) => {
    if (typeof window !== "undefined" && (err.name === "ChunkLoadError" || err.message?.includes("Failed to load chunk"))) {
        window.location.reload();
    }
    throw err;
}), { ssr: false });

export default function PlatformLoader() {
    const pathname = usePathname();
    const { isDesktop, isMobile, isWeb, isLoaded } = useAppPlatform();

    const HIDDEN_PATHS = ["/login", "/signup", "/forgot-password", "/onboarding", "/blog", "/library/pack"];
    const shouldHideNav = HIDDEN_PATHS.some(p => pathname.startsWith(p)) || pathname === "/";

    useEffect(() => {
        if (!isLoaded) return;
        
        const showNav = !shouldHideNav;
        document.documentElement.setAttribute('data-mobile-nav-visible', showNav.toString());
    }, [pathname, isLoaded, shouldHideNav]);

    if (!isLoaded) return null;

    return (
        <>
            {isDesktop && <DesktopTitleBar />}
            {!shouldHideNav && <MobileNavigation />}
        </>
    );
}
