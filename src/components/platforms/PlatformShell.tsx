"use client";

import React from "react";
import { useAppPlatform } from "@/hooks/useAppPlatform";
import { motion, AnimatePresence } from "framer-motion";

interface PlatformShellProps {
    children?: React.ReactNode;
    desktop?: React.ReactNode;
    mobile?: React.ReactNode;
    web?: React.ReactNode;
    loading?: React.ReactNode;
}

class PlatformErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console so it appears in DevTools even without a crash boundary popup
    console.error("[PlatformShell] Component error caught:", error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-[var(--foreground)] font-bold text-lg">Something went wrong loading this view.</p>
          <p className="text-[var(--foreground-muted)] text-sm max-w-md font-mono break-all">
            {this.state.error?.message || "Unknown error"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-6 py-2 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-sm font-bold"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * PlatformShell is a hydration-safe guard that preserves the "Generic Web"
 * view during initial mount to avoid Next.js hydration mismatches.
 * Once mounted, it transitions to the platform-specific UI.
 */
export default function PlatformShell({ 
    children, 
    desktop, 
    mobile, 
    web,
    loading 
}: PlatformShellProps) {
    const { isLoaded, isDesktop, isMobile, isWeb } = useAppPlatform();

    // Fallback logic for when platform-specific components fail or are missing
    const content = (
        <>
            {isDesktop && (desktop || children)}
            {isMobile && (mobile || children)}
            {isWeb && (web || children)}
            {/* If no platform matches or all passed are null, always fallback to children */}
            {!isDesktop && !isMobile && !isWeb && children}
        </>
    );

    // During hydration/SSR, we render a non-displacing structural shell.
    if (!isLoaded) {
        return (
            <div id="platform-shell-gate" className="contents" suppressHydrationWarning>
                {children || loading || null}
            </div>
        );
    }

    return (
        <PlatformErrorBoundary>
            <AnimatePresence mode="wait">
                <motion.div
                    key={isDesktop ? "desktop" : isMobile ? "mobile" : "web"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="contents"
                    id="platform-root"
                >
                    {content}
                </motion.div>
            </AnimatePresence>
        </PlatformErrorBoundary>
    );
}
