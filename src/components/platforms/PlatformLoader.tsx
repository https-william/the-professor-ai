"use client";
import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useAppPlatform } from "@/hooks/useAppPlatform";
import { usePathname } from "next/navigation";

// Dynamically import platform-specific components with SSR disabled.
// This ensures Tauri-specific chunks are never loaded in a regular browser environment.
const DesktopTitleBar = dynamic(() => import("@/components/ui/DesktopTitleBar"), { ssr: false });
const DesktopSidebar = dynamic(() => import("@/components/navigation/DesktopSidebar"), { ssr: false });
const MobileNavigation = dynamic(() => import("@/components/navigation/MobileNavigation"), { ssr: false });

export default function PlatformLoader() {
    const pathname = usePathname();
    const { isDesktop, isMobile, isWeb, isLoaded } = useAppPlatform();

    const HIDDEN_PATHS = ["/login", "/signup", "/forgot-password", "/onboarding", "/blog", "/library/pack"];
    const shouldHideNav = HIDDEN_PATHS.some(p => pathname.startsWith(p)) || pathname === "/";

    useEffect(() => {
        if (!isLoaded) return;
        
        const showSidebar = !shouldHideNav && isDesktop;
        const showMobileNav = !shouldHideNav && isMobile;
        
        document.documentElement.setAttribute('data-sidebar-visible', showSidebar.toString());
        document.documentElement.setAttribute('data-mobile-nav-visible', showMobileNav.toString());
    }, [pathname, isDesktop, isMobile, isLoaded, shouldHideNav]);

    if (!isLoaded) return null;

    return (
        <>
            {isDesktop && <DesktopTitleBar />}
            {!shouldHideNav && (
                <>
                    {isDesktop && <DesktopSidebar />}
                    {isMobile && <MobileNavigation />}
                </>
            )}
        </>
    );
}
