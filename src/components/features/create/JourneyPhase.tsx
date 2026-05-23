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
    const getPhaseColors = (num: number) => {
        switch (num) {
            case 1:
                return {
                    badgeBg: "bg-[var(--emerald-dim)] border-[var(--emerald-border)] text-[var(--emerald-text)]",
                    dotBg: "bg-[var(--emerald)]",
                };
            case 2:
                return {
                    badgeBg: "bg-[var(--blue-dim)] border-[var(--blue-border)] text-[var(--blue-text)]",
                    dotBg: "bg-[var(--blue)]",
                };
            case 3:
            default:
                return {
                    badgeBg: "bg-[var(--crimson-dim)] border-[var(--crimson-border)] text-[var(--crimson-text)]",
                    dotBg: "bg-[var(--crimson)]",
                };
        }
    };

    const colors = getPhaseColors(number);

    return (
        <div className={cn("p-6 rounded-[36px] bg-[var(--card)]/40 border border-[var(--border)] shadow-[0_12px_40px_rgba(0,0,0,0.15)] backdrop-blur-md flex flex-col h-full transition-all duration-500 hover:bg-[var(--card)]/60 hover:border-[var(--border-2)]", className)}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", colors.dotBg)} />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground)] opacity-50">
                        PHASE {number}
                    </h3>
                </div>
                <span className={cn("px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border", colors.badgeBg)}>
                    {title}
                </span>
            </div>

            <div className="flex-1 flex flex-col gap-4">
                {tools.map((tool) => {
                    return (
                        <ToolCard
                            key={tool.id}
                            tool={tool}
                            onClick={() => onSelectTool(tool.id)}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function ToolCard({ tool, onClick }: { tool: Tool, onClick: () => void }) {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                borderColor: isHovered ? `color-mix(in srgb, ${tool.color}, transparent 60%)` : undefined,
                boxShadow: isHovered 
                    ? `0 10px 30px -5px color-mix(in srgb, ${tool.color}, transparent 80%), 0 0 20px color-mix(in srgb, ${tool.color}, transparent 95%)` 
                    : undefined
            }}
            className="group relative w-full flex items-center gap-5 p-5 text-left transition-all duration-300 rounded-[28px] bg-[var(--bg-3)]/60 border border-[var(--border)] hover-lift-md active:scale-[0.98] shadow-sm"
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
                <div className="flex items-center gap-2.5 mb-1.5">
                    <h4 className="text-[15px] font-black tracking-tight text-[var(--foreground)]">{tool.label}</h4>
                    {tool.popular && (
                        <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-[var(--blue)]/10 text-[var(--blue-text)] border border-[var(--blue)]/20">
                            POPULAR
                        </span>
                    )}
                </div>
                <p className="text-[12px] text-[var(--foreground-muted)] font-bold leading-tight opacity-70">
                    {tool.desc}
                </p>
            </div>
        </button>
    );
}
