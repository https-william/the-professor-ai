"use client";

import React from "react";
import { useAppPlatform } from "@/hooks/useAppPlatform";
import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from "@/components/ui/BrandLogo";
import ProfessorCeremony from "@/components/ui/ProfessorCeremony";

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
        <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-12 text-center bg-[#08080E]/40 backdrop-blur-md rounded-[2.5rem] border border-white/5 my-8">
           <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 shadow-2xl">
              <BrandLogo size="md" />
           </div>
           
           <h2 className="text-xl font-bold text-white mb-2 tracking-tight">This view hit a snag.</h2>
           <p className="text-white/40 text-sm max-w-xs mx-auto mb-8 leading-relaxed font-medium">
             The Professor encountered a minor hiccup while loading this specific view.
           </p>

           <button
             onClick={() => window.location.reload()}
             className="px-8 py-3.5 rounded-2xl bg-white text-[#08080E] text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-98 transition-all shadow-[0_15px_30px_rgba(255,255,255,0.05)]"
           >
             Reload View
           </button>

           <p className="mt-8 text-[9px] text-white/10 uppercase tracking-[0.3em] font-black">
             PLATFORM COMPONENT ERROR
           </p>
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

    return (
        <PlatformErrorBoundary>
            <div id="platform-shell-gate" className="contents" suppressHydrationWarning>
                <AnimatePresence mode="wait">
                    {!isLoaded ? (
                        <motion.div
                            key="platform-shell-loading"
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="contents"
                        >
                            <div className="fixed inset-0 z-50 bg-[#08080E] flex items-center justify-center">
                                <ProfessorCeremony />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={isDesktop ? "desktop" : isMobile ? "mobile" : "web"}
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="contents"
                            id="platform-root"
                        >
                            {content}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PlatformErrorBoundary>
    );
}
