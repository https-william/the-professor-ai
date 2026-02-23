"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * GlassCard
 * Frosted glass effect card — updated for Midnight Scholar (warm amber glow on hover)
 */
export const GlassCard = ({
    children,
    className,
    gradient = false,
    glow = false,
    style,
}: {
    children: React.ReactNode;
    className?: string;
    gradient?: boolean;
    glow?: boolean;
    style?: React.CSSProperties;
}) => {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl backdrop-blur-xl shadow-xl transition-all duration-300",
                "border border-white/7 bg-[var(--card)]",
                gradient && "bg-gradient-to-br from-[var(--card)] to-[var(--background-secondary)]",
                glow && "animate-glow-pulse",
                className
            )}
            style={style}
        >
            {/* Inner top highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            {/* Content */}
            <div className="relative z-10">{children}</div>
        </div>
    );
};

/**
 * Grainient
 * Animated mesh gradient background with noise texture — Midnight Scholar palette
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
                className="absolute inset-0 opacity-[0.15] z-20 mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Amber blob — top left */}
            <div
                className="absolute top-[-20%] left-[-10%] w-[65vw] h-[65vw] rounded-full blur-[100px] animate-blob mix-blend-screen"
                style={{ background: "radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 70%)" }}
            />

            {/* Indigo blob — bottom right */}
            <div
                className="absolute bottom-[-20%] right-[-10%] w-[65vw] h-[65vw] rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-screen"
                style={{ background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)" }}
            />

            {/* Subtle warm centre */}
            <div
                className="absolute top-[30%] left-[30%] w-[45vw] h-[45vw] rounded-full blur-[120px] animate-blob animation-delay-4000 mix-blend-screen"
                style={{ background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)" }}
            />
        </div>
    );
};
