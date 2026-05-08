import React from "react";
import StandardContainer from "@/components/ui/StandardContainer";

export default function DashboardSkeleton() {
    return (
        <div className="w-full min-h-screen relative bg-[var(--bg)]">
            <StandardContainer className="pt-16 pb-20 relative z-10">
                {/* Hero Zone Skeleton with Mnemonic Loading */}
                <div className="mb-8 p-6 sm:p-8 rounded-3xl overflow-hidden bg-transparent border-b border-[var(--border)]">
                    <div className="w-24 h-3 bg-[var(--text)]/5 rounded animate-pulse mb-3" />
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-[var(--text)]/50 text-2xl sm:text-3xl font-mono">simple as </span>
                        <span className="relative inline-block align-middle text-2xl sm:text-3xl font-black">
                            <span className="opacity-30 text-[var(--text-3)]">ABC</span>
                            <svg className="absolute inset-[-20%] w-[140%] h-[140%] overflow-visible pointer-events-none" viewBox="0 0 100 40" preserveAspectRatio="none">
                                <line 
                                    x1="0" y1="20" x2="100" y2="20" 
                                    stroke="var(--text-3)" 
                                    strokeWidth="4" 
                                    strokeLinecap="round"
                                    className="animate-strike-draw"
                                    style={{ strokeDasharray: 100, strokeDashoffset: 100 }}
                                />
                            </svg>
                        </span>
                        <span className="opacity-40 text-[var(--text-3)] text-2xl sm:text-3xl">→</span>
                        <span className="text-2xl sm:text-3xl font-black animate-pulse"
                            style={{
                                background: "linear-gradient(135deg, var(--blue) 0%, var(--cyan) 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            }}
                        >
                            XYZ.
                        </span>
                    </div>
                    <div className="w-48 sm:w-72 h-4 bg-[var(--text)]/5 rounded animate-pulse" />
                </div>

                {/* Stat Ribbon Skeleton */}
                <div className="mb-6 flex flex-wrap gap-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3 px-2 py-2.5 flex-1 min-w-[140px] border-b border-transparent">
                            <div className="w-8 h-8 rounded-lg bg-[var(--text)]/10 animate-pulse shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="w-12 h-4 bg-[var(--text)]/10 rounded animate-pulse" />
                                <div className="w-20 h-2 bg-[var(--text)]/5 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Level Progress Skeleton */}
                <div className="mb-6 py-4 border-t border-b border-[var(--border)] flex items-center gap-3">
                    <div className="w-16 h-3 bg-[var(--text)]/5 rounded animate-pulse shrink-0" />
                    <div className="flex-1 h-1.5 bg-[var(--text)]/5 rounded-full animate-pulse" />
                    <div className="w-16 h-3 bg-[var(--text)]/5 rounded animate-pulse shrink-0" />
                </div>

                {/* Main Grid Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Col 1+2: Workspace */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <div className="p-6 rounded-2xl h-24 bg-[var(--text)]/5 border border-[var(--border)] animate-pulse" />
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="p-4 rounded-2xl h-28 bg-[var(--text)]/5 border border-[var(--border)] animate-pulse" />
                            ))}
                        </div>
 
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 h-32 bg-[var(--text)]/5 rounded-2xl border border-[var(--border)] animate-pulse" />
                            <div className="p-4 h-32 bg-[var(--text)]/5 rounded-2xl border border-[var(--border)] animate-pulse" />
                        </div>
                    </div>
 
                    {/* Col 3: Focus Panel */}
                    <div className="flex flex-col gap-4">
                        <div className="p-6 rounded-3xl h-64 bg-[var(--text)]/5 border border-[var(--border)] animate-pulse" />
                        <div className="p-5 rounded-2xl h-24 bg-[var(--text)]/5 border border-[var(--border)] animate-pulse" />
                    </div>
                </div>
            </StandardContainer>
        </div>
    );
}
