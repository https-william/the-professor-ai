"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Tool {
    id: string;
    label: string;
    desc: string;
    icon: LucideIcon;
    color: string;
    popular?: boolean;
}

interface JourneyPhaseProps {
    number: number;
    title: string;
    tools: Tool[];
    onSelectTool: (id: string) => void;
    className?: string;
}

export default function JourneyPhase({ number, title, tools, onSelectTool, className }: JourneyPhaseProps) {
    return (
        <div className={cn("space-y-6", className)}>
            <div className="flex items-center gap-4 px-2 mb-4">
                <span className="text-[14px] font-black text-[var(--foreground-muted)]">{number}</span>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--foreground-muted)]">
                    PHASE {number}: {title}
                </h3>
            </div>

            <div className="grid gap-4">
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => onSelectTool(tool.id)}
                        className="group relative w-full flex items-center gap-5 p-6 text-left transition-all duration-300 rounded-[32px] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--blue)]/30 hover-lift-lg active:scale-[0.98] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]"
                    >
                        <div 
                            className="w-14 h-14 rounded-[22px] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover-scale-sm"
                            style={{
                                background: `color-mix(in srgb, ${tool.color}, transparent 94%)`,
                                border: `1px solid color-mix(in srgb, ${tool.color}, transparent 85%)`,
                            }}
                        >
                            <tool.icon size={26} strokeWidth={2.2} style={{ color: tool.color }} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <h4 className="text-[15px] font-black tracking-tight text-[var(--foreground)]">{tool.label}</h4>
                                {tool.popular && (
                                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-[var(--blue)]/10 text-[var(--blue)] border border-[var(--blue)]/20">
                                        POPULAR
                                    </span>
                                )}
                            </div>
                            <p className="text-[12px] text-[var(--foreground-muted)] font-bold leading-tight opacity-70">
                                {tool.desc}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
