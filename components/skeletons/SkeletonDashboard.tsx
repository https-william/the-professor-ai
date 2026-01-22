import React from 'react';
import { LoadingStream } from '../ui/LoadingStream';

export const SkeletonDashboard: React.FC = () => {
    return (
        <div className="min-h-screen bg-core flex text-text-pri overflow-hidden">
            {/* Sidebar Skeleton */}
            <div className="hidden md:flex w-20 flex-col items-center py-8 border-r border-white/5 gap-8">
                <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse"></div>
                <div className="flex-1 flex flex-col gap-6 w-full px-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="w-full h-8 rounded-lg bg-white/5 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}></div>
                    ))}
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse"></div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative">
                {/* Header Skeleton */}
                <div className="h-20 border-b border-white/5 flex items-center justify-between px-8">
                    <div className="w-32 h-6 bg-white/5 rounded animate-pulse"></div>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse"></div>
                        <div className="w-32 h-10 rounded-full bg-white/5 animate-pulse"></div>
                    </div>
                </div>

                {/* Hero Area */}
                <div className="flex-1 p-8 overflow-hidden relative">
                    <div className="max-w-4xl mx-auto mt-12 flex flex-col items-center gap-8">
                        {/* Logo / Text */}
                        <div className="w-24 h-24 rounded-2xl bg-white/5 animate-pulse mb-4"></div>
                        <div className="h-4 w-64 bg-white/5 rounded animate-pulse"></div>

                        {/* Input Area */}
                        <div className="w-full max-w-2xl h-16 rounded-2xl bg-white/5 animate-pulse mt-8"></div>

                        {/* Action Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-8">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse border border-white/5" style={{ animationDelay: `${i * 150}ms` }}></div>
                            ))}
                        </div>
                    </div>

                    {/* Loading Text Overlay */}
                    <div className="absolute bottom-12 left-0 right-0 flex justify-center">
                        <LoadingStream initialText="Authenticating Scholar..." />
                    </div>
                </div>
            </div>
        </div>
    );
};
