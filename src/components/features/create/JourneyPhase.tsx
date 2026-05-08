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
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center gap-3 mb-2 px-2">
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <span className="text-[10px] font-black opacity-40">{number}</span>
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] opacity-60">
                    Phase {number}: {title}
                </h3>
            </div>

            <div className="grid gap-2">
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => onSelectTool(tool.id)}
                        className="group relative w-full flex items-center gap-4 p-4 text-left transition-all duration-300 rounded-[24px] bg-[var(--bg-2)]/40 backdrop-blur-md border border-[var(--border)] hover:border-[var(--blue)]/40 hover:bg-[var(--bg-2)]/60 hover:translate-y-[-1px] hover:shadow-xl"
                    >
                        <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110"
                            style={{
                                background: `color-mix(in srgb, ${tool.color}, transparent 90%)`,
                                border: `1px solid color-mix(in srgb, ${tool.color}, transparent 80%)`,
                            }}
                        >
                            <tool.icon size={18} strokeWidth={2.5} style={{ color: tool.color }} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h4 className="text-[13px] font-black tracking-tight">{tool.label}</h4>
                                {tool.popular && (
                                    <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-[var(--blue)]/10 text-[var(--blue)] border border-[var(--blue)]/20">
                                        Popular
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-[var(--foreground-muted)] font-medium leading-tight opacity-70 truncate">
                                {tool.desc}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
