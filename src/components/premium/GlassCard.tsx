
import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export function GlassCard({
    children,
    className,
    hoverEffect = false,
    ...props
}: GlassCardProps) {
    return (
        <div
            className={cn(
                "bg-[#111111]/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl transition-all duration-300",
                hoverEffect && "hover:bg-[#161616]/80 hover-scale-sm hover:border-white/10 hover:shadow-2xl cursor-pointer",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
