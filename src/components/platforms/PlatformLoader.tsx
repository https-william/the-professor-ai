"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useAppPlatform } from "@/hooks/useAppPlatform";

// Dynamically import platform-specific components with SSR disabled.
// This ensures Tauri-specific chunks are never loaded in a regular browser environment.
const DesktopTitleBar = dynamic(() => import("@/components/ui/DesktopTitleBar"), { ssr: false });
const DesktopSidebar = dynamic(() => import("@/components/navigation/DesktopSidebar"), { ssr: false });
const MobileNavigation = dynamic(() => import("@/components/navigation/MobileNavigation"), { ssr: false });

export default function PlatformLoader() {
    const { isDesktop, isMobile, isWeb, isLoaded } = useAppPlatform();

    if (!isLoaded) return null;

    return (
        <>
            {isDesktop && <DesktopTitleBar />}
            {(isDesktop || isWeb) && <DesktopSidebar />}
            {isMobile && <MobileNavigation />}
        </>
    );
}
