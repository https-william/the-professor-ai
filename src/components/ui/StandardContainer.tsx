"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface StandardContainerProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    /**
     * Optional narrow mode for focused content like FAQ or CTA
     */
    narrow?: boolean;
}

/**
 * StandardContainer: The source of truth for horizontal alignment across the platform.
 * Enforces consistent max-width and responsive padding.
 */
export default function StandardContainer({ 
    children, 
    className,
    style,
    narrow = false 
}: StandardContainerProps) {
    return (
        <div 
            className={cn(
                "mx-auto px-5 md:px-10 w-full",
                narrow ? "max-w-4xl" : "max-w-6xl",
                className
            )}
            style={style}
        >
            {children}
        </div>
    );
}
