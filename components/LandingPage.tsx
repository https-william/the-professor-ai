
import React, { useState, useEffect } from 'react';
import { CountdownTimer } from './CountdownTimer';
import { BrandLogo } from './BrandLogo';
import { LegalModal } from './LegalModal';

interface LandingPageProps {
    onEnter: () => void;
    onPricing: () => void;
    onLegal?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onPricing }) => {
    const [scrolled, setScrolled] = useState(false);
    const [showLegal, setShowLegal] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // --- NEURAL ASSETS ---

    const NeuralCore = () => (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Core Glow */}
            <div className="absolute w-[300px] h-[300px] bg-white/5 blur-[100px] rounded-full animate-pulse-slow"></div>

            {/* Rotating Rings */}
            <div className="absolute w-[400px] h-[400px] border border-white/10 rounded-full animate-[spin_20s_linear_infinite]"></div>
            <div className="absolute w-[500px] h-[500px] border border-white/5 rounded-full animate-[spin_30s_linear_infinite_reverse]"></div>

            {/* Central Brain Logic (Abstract) */}
            <svg viewBox="0 0 200 200" className="w-[300px] h-[300px] drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                <path d="M100 50 C 130 50 150 70 150 100 C 150 130 130 150 100 150 C 70 150 50 130 50 100 C 50 70 70 50 100 50"
                    fill="none" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="5 5" className="animate-[spin_40s_linear_infinite]" opacity="0.3" />

                {/* Nodes */}
                <circle cx="100" cy="50" r="2" fill="#FFFFFF" className="animate-ping" opacity="0.5" />
                <circle cx="150" cy="100" r="2" fill="#FFFFFF" className="animate-ping" style={{ animationDelay: '1s' }} opacity="0.5" />
                <circle cx="100" cy="150" r="2" fill="#FFFFFF" className="animate-ping" style={{ animationDelay: '2s' }} opacity="0.5" />
                <circle cx="50" cy="100" r="2" fill="#FFFFFF" className="animate-ping" style={{ animationDelay: '3s' }} opacity="0.5" />

                {/* Connecting Lines */}
                <path d="M100 50 L 150 100 L 100 150 L 50 100 Z" stroke="#FFFFFF" strokeWidth="0.2" fill="rgba(255, 255, 255, 0.02)" />
            </svg>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white relative overflow-x-hidden font-sans selection:bg-white/20">
            <LegalModal isOpen={showLegal} onClose={() => setShowLegal(false)} />

            {/* BACKGROUND MATRIX */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900/20 via-[#050505] to-[#050505]"></div>
            </div>

            {/* NAV */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'glass-panel border-b border-white/5 py-4' : 'py-8'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <BrandLogo className="w-8 h-8 text-white" />
                        <span className="font-cinzel font-bold text-lg tracking-widest text-white">THE PROFESSOR</span>
                    </div>
                    <div className="flex gap-6 items-center">
                        <button onClick={onEnter} className="text-xs font-serif italic tracking-wide text-gray-500 hover:text-white transition-colors">
                            Log In
                        </button>
                        <button onClick={onEnter} className="px-6 py-2 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all rounded-sm">
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* HERO */}
            <section className="relative pt-32 pb-20 min-h-screen flex items-center">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">

                    {/* LEFT: TEXT */}
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-8">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Academic Operating System</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-cinzel font-bold leading-tight mb-8">
                            Knowledge <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                                Architected.
                            </span>
                        </h1>

                        <p className="text-gray-400 text-lg mb-10 leading-relaxed font-serif italic max-w-xl">
                            The intelligent platform that transforms raw information into structured mastery.
                            Upload materials. Extract insight.
                        </p>

                        <div className="flex gap-6">
                            <button onClick={onEnter} className="px-8 py-4 bg-white text-black font-bold text-xs uppercase tracking-[0.2em] hover:bg-gray-200 transition-all flex items-center gap-2 group rounded-sm">
                                Enter Library
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                            <button onClick={onEnter} className="px-8 py-4 border border-white/20 text-gray-400 hover:text-white hover:border-white/40 rounded-sm font-mono text-xs uppercase tracking-widest transition-all">
                                View Methodology
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: VISUAL */}
                    <div className="h-[500px] w-full relative">
                        <NeuralCore />
                        {/* Status Card Overlay */}
                        <div className="absolute bottom-10 right-10 glass-panel p-6 rounded-lg max-w-xs animate-slide-up-fade" style={{ animationDelay: '1s' }}>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-mono text-gray-500 uppercase">System Status</span>
                                <span className="text-[10px] font-mono text-emerald-500">Optimized</span>
                            </div>
                            <div className="space-y-2">
                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-white w-2/3 opacity-50"></div>
                                </div>
                                <div className="flex justify-between text-[10px] font-mono text-gray-500">
                                    <span>Analysis</span>
                                    <span>100%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* FOOTER (Simple) */}
            <footer className="border-t border-white/5 py-12 text-center">
                <p className="text-gray-700 font-mono text-xs uppercase tracking-widest">
                    &copy; 2026 The Professor. Neural Sanctum.
                </p>
            </footer>
        </div>
    );
};
