
import React from 'react';

export const SkeletonLoader: React.FC = () => {
    return (
        <div className="flex bg-[#050505] min-h-screen font-sans text-gray-100 overflow-hidden">
            {/* Sidebar Skeleton */}
            <div className="w-16 md:w-20 lg:w-64 border-r border-white/5 bg-[#0a0a0a] flex flex-col p-4 gap-6 hidden md:flex animate-pulse">
                <div className="w-8 h-8 rounded-full bg-white/10 mb-4 self-center lg:self-start"></div>
                <div className="w-full h-10 rounded-xl bg-white/5"></div>
                <div className="w-full h-10 rounded-xl bg-white/5"></div>
                <div className="w-full h-10 rounded-xl bg-white/5"></div>
                <div className="mt-auto w-full h-12 rounded-xl bg-white/5 opacity-50"></div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1 flex flex-col relative">
                {/* Header Skeleton */}
                <div className="h-16 border-b border-white/5 bg-[#0a0a0a]/50 flex items-center justify-between px-6 animate-pulse">
                    <div className="w-32 h-6 rounded-lg bg-white/10"></div>
                    <div className="flex gap-4">
                        <div className="w-24 h-8 rounded-full bg-white/5"></div>
                        <div className="w-8 h-8 rounded-full bg-white/10"></div>
                    </div>
                </div>

                {/* Body Skeleton */}
                <div className="flex-1 p-6 md:p-12 max-w-5xl mx-auto w-full space-y-8 animate-pulse">
                    {/* Hero Text */}
                    <div className="space-y-4 text-center mt-10 mb-16">
                        <div className="w-48 h-4 rounded-full bg-white/5 mx-auto"></div>
                        <div className="w-96 h-12 rounded-2xl bg-white/10 mx-auto"></div>
                        <div className="w-64 h-6 rounded-xl bg-white/5 mx-auto"></div>
                    </div>

                    {/* Input Area */}
                    <div className="w-full h-32 rounded-3xl bg-white/5 border border-white/10 mx-auto"></div>

                    {/* Quick Accessories */}
                    <div className="flex justify-center gap-4 mt-8">
                        <div className="w-12 h-12 rounded-2xl bg-white/5"></div>
                        <div className="w-12 h-12 rounded-2xl bg-white/5"></div>
                        <div className="w-12 h-12 rounded-2xl bg-white/5"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
