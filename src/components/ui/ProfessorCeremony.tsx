"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from "@/components/ui/BrandLogo";

const NARRATIVES = [
    "Opening the vault...",
    "Reading your messy notes sha...",
    "Finding the gaps in your logic...",
    "Strategic focus areas detected.",
    "Mapping the path to your first class...",
    "Almost there. Oya, stand by.",
];

interface ProfessorCeremonyProps {
    className?: string;
}

/**
 * ProfessorCeremony — The "Tactile Loading" experience.
 * Replaces generic spinners with narrative anticipation.
 */
export default function ProfessorCeremony({ className }: ProfessorCeremonyProps) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (index >= NARRATIVES.length - 1) return;

        const timer = setTimeout(() => {
            setIndex((prev) => prev + 1);
        }, 2500); // 2.5s per narrative beat

        return () => clearTimeout(timer);
    }, [index]);

    return (
        <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
            {/* The pulsing anchor of identity */}
            <motion.div 
                className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-10 shadow-2xl relative overflow-hidden"
                animate={{ 
                    boxShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 40px rgba(255,255,255,0.05)", "0 0 0px rgba(255,255,255,0)"] 
                }}
                transition={{ duration: 3, repeat: Infinity }}
            >
                <BrandLogo size="md" />
                <motion.div 
                    className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent"
                    animate={{ y: ["100%", "-100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
            </motion.div>

            <div className="h-6 relative w-full max-w-xs overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={index}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "circOut" }}
                        className="text-xs font-black uppercase tracking-[0.3em] text-white/40 absolute inset-0"
                    >
                        {NARRATIVES[index]}
                    </motion.p>
                </AnimatePresence>
            </div>

            <div className="mt-12 w-48 h-[2px] bg-white/5 rounded-full overflow-hidden relative">
                <motion.div 
                    className="absolute inset-y-0 left-0 bg-white"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((index + 1) / NARRATIVES.length) * 100}%` }}
                    transition={{ duration: 2.5, ease: "linear" }}
                />
            </div>

            <p className="mt-16 text-[9px] font-black text-white/10 uppercase tracking-[0.5em]">
                The Professor • Strategic Thinking
            </p>
        </div>
    );
}
