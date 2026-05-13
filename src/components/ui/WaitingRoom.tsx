"use client";

import React from "react";
import { motion } from "framer-motion";
import BrandLogo from "@/components/ui/BrandLogo";

interface WaitingRoomProps {
    onRetry: () => void;
}

/**
 * WaitingRoom — The high-traffic "Cool Down" state.
 * Implements the "Experience Architecture" traffic management.
 */
export default function WaitingRoom({ onRetry }: WaitingRoomProps) {
    return (
        <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-12 text-center">
            <div className="relative mb-10">
                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl">
                    <BrandLogo size="md" />
                </div>
                <motion.div 
                    className="absolute -top-2 -right-2 px-3 py-1 rounded-full bg-amber-500 text-black text-[9px] font-black uppercase tracking-widest"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    High Traffic
                </motion.div>
            </div>

            <h2 className="text-2xl font-black text-white mb-4 tracking-tight">The Professor is in high demand sha.</h2>
            <p className="text-white/40 text-sm max-w-md mx-auto mb-10 leading-relaxed font-medium">
                Too many students are cramming at the same time. Our AI servers need a quick breather to maintain quality. Take a 30-second water break and try again.
            </p>

            <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
                <button
                    onClick={onRetry}
                    className="px-10 py-5 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                >
                    Try Again Now
                </button>
                
                <p className="text-[10px] text-white/10 uppercase tracking-[0.3em] font-black">
                    SERVER RATE LIMIT REACHED
                </p>
            </div>
        </div>
    );
}
