"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface VellumCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    glow?: boolean;
}

export function VellumCard({
    children,
    className,
    hover = false,
    glow = false,
    ...props
}: VellumCardProps) {
    return (
        <div
            className={cn(
                // Base: Subtle aged-paper texture effect through layered gradients
                "relative overflow-hidden",
                "bg-gradient-to-br from-[#0f0f12] via-[#0c0c0f] to-[#0a0a0d]",
                "border border-[#1f1f24]",
                "rounded-2xl",
                "shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_4px_24px_rgba(0,0,0,0.4)]",
                "transition-all duration-300 ease-out",
                // Hover state
                hover && [
                    "cursor-pointer",
                    "hover:border-[#2a2a30]",
                    "hover:shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_32px_rgba(0,0,0,0.5)]",
                    "hover-lift-sm",
                ],
                // Gold glow accent
                glow && "ring-1 ring-[#C4A35A]/20",
                className
            )}
            {...props}
        >
            {/* Subtle inner highlight at top */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
