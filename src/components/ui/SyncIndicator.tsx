"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, CheckCircle2, AlertCircle, RotateCw } from "lucide-react";

/**
 * ═══ SyncIndicator ═══
 * Background synchronization status indicator.
 * Provides subtle feedback when the system is syncing in the background.
 */
export default function SyncIndicator() {
    const { user, refreshUser } = useUser();
    const [showSuccess, setShowSuccess] = useState(false);
    
    // Track transitions from loading to not loading
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (!user.isLoading && !user.syncError) {
            setShowSuccess(true);
            timeout = setTimeout(() => setShowSuccess(false), 3000);
        }
        return () => clearTimeout(timeout);
    }, [user.isLoading, user.syncError]);

    // Only show if authenticated and onboarded
    if (!user.isAuthenticated || !user.hasOnboarded) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[150] pointer-events-none">
            <AnimatePresence mode="wait">
                {/* Success/Loading states silenced per user request - only show errors */}

                {user.syncError && !user.isLoading && (
                    <motion.div
                        key="error"
                        initial={{ y: 20, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 20, opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-rose-500/10 backdrop-blur-md border border-rose-500/20 shadow-2xl pointer-events-auto cursor-pointer group"
                        onClick={() => refreshUser()}
                    >
                        <AlertCircle size={14} className="text-rose-500" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Sync Interrupted</span>
                            <span className="text-[8px] font-bold text-rose-500/40 uppercase group-hover:text-rose-500/80 transition-colors">Click to retry</span>
                        </div>
                    </motion.div>
                )}


            </AnimatePresence>
        </div>
    );
}
