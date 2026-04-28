"use client";

import React, { useEffect, useState } from "react";
import { 
    X, 
    Square, 
    Minus,
    Maximize2
} from "lucide-react";

/**
 * Custom Titlebar for Tauri Desktop App
 * Includes window dragging and Jelly-styled window controls.
 */
export default function DesktopTitleBar() {
    const [isMaximized, setIsMaximized] = useState(false);
    const [isTauri, setIsTauri] = useState(false);

    useEffect(() => {
        // Only run if we are inside a Tauri environment
        if (window && (window as any).__TAURI_INTERNALS__) {
            setIsTauri(true);
            
            // Dynamics check for maximized state
            const checkMaximized = async () => {
                const { getCurrentWindow } = await import("@tauri-apps/api/window");
                const appWindow = getCurrentWindow();
                setIsMaximized(await appWindow.isMaximized());
            };
            
            checkMaximized();
            
            // Listen for window resize to update maximized state
            window.addEventListener('resize', checkMaximized);
            return () => window.removeEventListener('resize', checkMaximized);
        }
    }, []);

    if (!isTauri) return null;

    const onMinimize = async () => {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        await getCurrentWindow().minimize();
    };

    const onMaximize = async () => {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const appWindow = getCurrentWindow();
        await appWindow.toggleMaximize();
        setIsMaximized(await appWindow.isMaximized());
    };

    const onClose = async () => {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        await getCurrentWindow().close();
    };

    return (
        <header 
            data-tauri-drag-region
            className="fixed top-0 left-0 right-0 h-10 z-[10000] flex items-center justify-between px-4 bg-transparent select-none"
        >
            <div className="flex items-center gap-2 pointer-events-none">
                <div className="w-4 h-4 rounded-full bg-[var(--accent)] shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">The Professor</span>
            </div>

            <div className="flex items-center gap-1">
                {/* Minimize */}
                <button
                    onClick={onMinimize}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:bg-white/5 hover:text-white/80 transition-all active:scale-90"
                    title="Minimize"
                >
                    <Minus size={14} />
                </button>

                {/* Maximize */}
                <button
                    onClick={onMaximize}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:bg-white/5 hover:text-white/80 transition-all active:scale-90"
                    title={isMaximized ? "Restore" : "Maximize"}
                >
                    {isMaximized ? <Square size={12} /> : <Maximize2 size={12} />}
                </button>

                {/* Close */}
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:bg-red-500/80 hover:text-white transition-all active:scale-90"
                    title="Close"
                >
                    <X size={14} />
                </button>
            </div>
        </header>
    );
}
