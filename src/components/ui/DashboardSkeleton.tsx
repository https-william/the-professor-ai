import React from "react";
import StandardContainer from "@/components/ui/StandardContainer";

export default function DashboardSkeleton() {
    return (
        <div className="w-full min-h-screen relative bg-[#060608]">
            {/* Grid Line Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-60 z-0" />
            
            {/* Desaturated Ambient Radial Halos */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.03),transparent_60%)] filter blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.02),transparent_60%)] filter blur-[120px] pointer-events-none z-0" />

            <StandardContainer className="pt-16 pb-20 relative z-10">
                {/* Hero Zone Skeleton with Mnemonic Loading */}
                <div className="mb-8 p-6 sm:p-8 rounded-3xl overflow-hidden bg-transparent border-b border-white/5">
                    <div className="w-24 h-3 bg-white/5 rounded animate-pulse mb-3" />
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-white/30 text-2xl sm:text-3xl font-mono">simple as </span>
                        <span className="relative inline-block align-middle text-2xl sm:text-3xl font-black">
                            <span className="opacity-30 text-white/20">ABC</span>
                            <svg className="absolute inset-[-20%] w-[140%] h-[140%] overflow-visible pointer-events-none" viewBox="0 0 100 40" preserveAspectRatio="none">
                                <line 
                                    x1="0" y1="20" x2="100" y2="20" 
                                    stroke="rgba(255,255,255,0.15)" 
                                    strokeWidth="4" 
                                    strokeLinecap="round"
                                    className="animate-strike-draw"
                                    style={{ strokeDasharray: 100, strokeDashoffset: 100 }}
                                />
                            </svg>
                        </span>
                        <span className="opacity-40 text-white/20 text-2xl sm:text-3xl">→</span>
                        <span className="text-2xl sm:text-3xl font-black animate-pulse text-white/40">
                            XYZ.
                        </span>
                    </div>
                    <div className="w-48 sm:w-72 h-4 bg-white/5 rounded animate-pulse" />
                </div>

                {/* Stat Ribbon Skeleton */}
                <div className="mb-6 flex flex-wrap gap-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3 px-2 py-2.5 flex-1 min-w-[140px] border-b border-transparent">
                            <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="w-12 h-4 bg-white/5 rounded animate-pulse" />
                                <div className="w-20 h-2 bg-white/5 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Level Progress Skeleton */}
                <div className="mb-6 py-4 border-t border-b border-white/5 flex items-center gap-3">
                    <div className="w-16 h-3 bg-white/5 rounded animate-pulse shrink-0" />
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full animate-pulse" />
                    <div className="w-16 h-3 bg-white/5 rounded animate-pulse shrink-0" />
                </div>

                {/* Main Grid Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Col 1+2: Workspace */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <div className="p-6 rounded-2xl h-24 bg-white/[0.03] border border-white/5 animate-pulse" />
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="p-4 rounded-2xl h-28 bg-white/[0.03] border border-white/5 animate-pulse" />
                            ))}
                        </div>
 
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 h-32 bg-white/[0.03] rounded-2xl border border-white/5 animate-pulse" />
                            <div className="p-4 h-32 bg-white/[0.03] rounded-2xl border border-white/5 animate-pulse" />
                        </div>
                    </div>
 
                    {/* Col 3: Focus Panel */}
                    <div className="flex flex-col gap-4">
                        <div className="p-6 rounded-3xl h-64 bg-white/[0.03] border border-white/5 animate-pulse" />
                        <div className="p-5 rounded-2xl h-24 bg-white/[0.03] border border-white/5 animate-pulse" />
                    </div>
                </div>
            </StandardContainer>
        </div>
    );
}
