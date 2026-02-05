"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * GlassCard
 * Frosted glass effect card with subtle border and optional glow
 */
export const GlassCard = ({
    children,
    className,
    gradient = false,
}: {
    children: React.ReactNode;
    className?: string;
    gradient?: boolean;
}) => {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl",
                gradient && "bg-gradient-to-br from-white/10 to-white/5",
                className
            )}
        >
            {/* Optional inner glow for depth */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50" />

            {/* Content */}
            <div className="relative z-10">{children}</div>
        </div>
    );
};

/**
 * Grainient
 * Animated mesh gradient background with noise texture
 */
export const Grainient = ({
    className,
}: {
    className?: string;
}) => {
    return (
        <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
            {/* Noise Overlay */}
            <div
                className="absolute inset-0 opacity-20 z-20 mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Moving Blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-purple-500/20 blur-[100px] animate-blob mix-blend-screen" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-amber-500/20 blur-[100px] animate-blob animation-delay-2000 mix-blend-screen" />
            <div className="absolute top-[30%] left-[30%] w-[50vw] h-[50vw] rounded-full bg-pink-500/20 blur-[100px] animate-blob animation-delay-4000 mix-blend-screen" />
        </div>
    );
};
