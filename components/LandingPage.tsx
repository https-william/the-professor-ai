
import React, { useState, useEffect } from 'react';
import { CountdownTimer } from './CountdownTimer';
import { BrandLogo } from './BrandLogo';
import { LegalModal } from './LegalModal';
import { GlassWindow } from './ui/GlassWindow';

interface LandingPageProps {
    onEnter: () => void;
    onPricing: () => void;
    onLegal?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onPricing }) => {
    const [scrolled, setScrolled] = useState(false);
    const [showLegal, setShowLegal] = useState(false);
    const [activeFeature, setActiveFeature] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        // Auto-rotate features
        const interval = setInterval(() => setActiveFeature(p => (p + 1) % 3), 4000);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearInterval(interval);
        };
    }, []);

    const features = [
        {
            title: "Study Assistant",
            desc: "Upload any document. PDF, PPTX, or messy notes. The Professor reads it in seconds.",
            icon: "⚡",
            color: "text-cyan-400"
        },
        {
            title: "Exam Assessment",
            desc: "Generate rigorous exams from your content. Multiple choice, true/false, or sudden death.",
            icon: "📝",
            color: "text-amber-400"
        },
        {
            title: "Your Library",
            desc: "A centralized hub for your studies. Track progress, review past sessions, and sync knowledge.",
            icon: "📚",
            color: "text-emerald-400"
        }
    ];

    // --- COMPONENTS ---

    const MarqueeItem = ({ text }: { text: string }) => (
        <span className="mx-8 text-xs font-mono text-gray-500 uppercase tracking-widest opacity-70 hover:opacity-100 hover:text-white transition-opacity cursor-default">
            {text}
        </span>
    );

    const Marquee = () => (
        <div className="w-full bg-white/[0.02] border-y border-white/5 py-4 overflow-hidden flex relative z-10 backdrop-blur-sm">
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-10"></div>
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-10"></div>

            <div className="animate-marquee whitespace-nowrap flex">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex">
                        <MarqueeItem text="10,000+ CONCEPTS MASTERED" />
                        <MarqueeItem text="•" />
                        <MarqueeItem text="INFINITE STUDY HOURS SAVED" />
                        <MarqueeItem text="•" />
                        <MarqueeItem text="ACADEMIC CLARITY ACHIEVED" />
                        <MarqueeItem text="•" />
                        <MarqueeItem text="THE A TO .XYZ OF LEARNING" />
                        <MarqueeItem text="•" />
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white relative overflow-x-hidden font-sans selection:bg-cyan-500/30">
            <LegalModal isOpen={showLegal} onClose={() => setShowLegal(false)} />

            {/* DEEP SPACE BACKGROUND */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-20"></div>

                {/* Aurora Blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03]"></div>
            </div>

            {/* NAV */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 py-4' : 'py-8'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
                        <div className="relative">
                            <BrandLogo className="w-8 h-8 text-white relative z-10" />
                            <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-0 group-hover:opacity-50 transition-opacity"></div>
                        </div>
                        <span className="font-display font-bold text-lg tracking-widest text-white group-hover:text-cyan-400 transition-colors">THE PROFESSOR</span>
                    </div>
                    <div className="flex gap-6 items-center">
                        <button onClick={onEnter} className="hidden md:block text-xs font-serif italic tracking-wide text-gray-400 hover:text-white transition-colors">
                            Resume Session
                        </button>
                        <button onClick={onEnter} className="px-6 py-2 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-cyan-400 transition-all rounded-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]">
                            Launch OS
                        </button>
                    </div>
                </div>
            </nav>

            {/* HERO */}
            <section className="relative pt-40 pb-20 min-h-screen flex flex-col justify-center">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10 mb-20">

                    {/* LEFT: COPY */}
                    <div className="animate-slide-up-fade">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-8 hover:bg-white/10 transition-colors cursor-default">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            <span className="text-xs font-medium text-cyan-400 tracking-wide">The Professor 2.0</span>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-display font-bold leading-[0.9] mb-8 tracking-tighter">
                            The A to <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400 font-serif italic pr-4">
                                .XYZ
                            </span>
                            <br />
                            of Learning.
                        </h1>

                        <p className="text-gray-400 text-lg md:text-xl mb-10 leading-relaxed font-light max-w-xl border-l-2 border-white/10 pl-6">
                            Your personal academic operating system. Turn chaotic lecture notes into structured mastery with the power of a neural network.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={onEnter} className="px-8 py-4 bg-white text-black font-bold text-sm hover:bg-cyan-400 hover:scale-105 transition-all flex items-center justify-center gap-2 group rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                Start Learning
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                            <button onClick={onPricing} className="px-8 py-4 border border-white/10 text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5 rounded-full font-medium text-sm transition-all">
                                View Upgrades
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: INTERACTIVE DEMO (Floating Window) */}
                    <div className="h-[600px] w-full relative flex items-center justify-center perspective-[2000px]">

                        {/* 3D Tilted Container */}
                        <div className="relative w-full max-w-md transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out">

                            {/* Main Window */}
                            <div className="glass-panel-heavy rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 relative z-20 bg-[#0A0A0C]/90">
                                {/* Window Header */}
                                <div className="h-8 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                                    <div className="ml-4 px-2 py-0.5 bg-black/50 rounded text-[8px] font-mono text-gray-500 uppercase tracking-widest">
                                        Term_v2.exe
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 font-mono text-xs space-y-4">
                                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                                        <span className="text-cyan-500">➜</span>
                                        <span className="text-gray-400">upload_file</span>
                                        <span className="text-amber-300">"Linear_Algebra_Lec01.pdf"</span>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-gray-500 text-[10px] uppercase">
                                            <span>Processing</span>
                                            <span className="animate-pulse text-cyan-500">Active</span>
                                        </div>
                                        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-cyan-500 w-[78%] animate-[shimmer_2s_infinite]"></div>
                                        </div>
                                    </div>

                                    <div className="bg-black/50 p-4 rounded border border-white/5 text-gray-300 leading-relaxed font-sans">
                                        <span className="text-cyan-500 font-mono text-[10px] block mb-2 uppercase">Analysis Result:</span>
                                        "Eigenvalues determine the scaling factor of the transformation. For matrix A, if Av = λv, then v is an eigenvector..."
                                    </div>

                                    <button className="w-full py-2 bg-cyan-900/20 border border-cyan-500/30 text-cyan-400 rounded uppercase tracking-widest hover:bg-cyan-900/40 transition-colors">
                                        Generate Quiz (10)
                                    </button>
                                </div>
                            </div>

                            {/* Floating Elements Behind */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 blur-xl rounded-full z-0 animate-pulse-slow"></div>

                            {/* Floating Cards */}
                            <div className="absolute top-20 -left-12 glass-panel p-4 rounded-lg border border-white/10 z-30 animate-[float_4s_ease-in-out_infinite] shadow-xl bg-[#050505]/80 backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-emerald-900/30 flex items-center justify-center text-emerald-400">A+</div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase">Projected Grade</p>
                                        <p className="text-sm font-bold text-white">98.5%</p>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -bottom-6 -right-6 glass-panel p-4 rounded-lg border border-white/10 z-30 animate-[float_5s_ease-in-out_infinite] shadow-xl bg-[#050505]/80 backdrop-blur-md" style={{ animationDelay: '1s' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-amber-900/30 flex items-center justify-center text-amber-400">⚡</div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase">Study Velocity</p>
                                        <p className="text-sm font-bold text-white">3.5x Faster</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>

                <Marquee />

                {/* FEATURE GRID */}
                <div className="max-w-7xl mx-auto px-6 mt-32">
                    <div className="text-center mb-16">
                        <span className="text-sm font-medium text-cyan-500 uppercase tracking-wide mb-4 block">Platform Features</span>
                        <h2 className="text-4xl font-display font-bold text-white">Everything you need to excel</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((f, i) => (
                            <div
                                key={i}
                                className={`group p-8 rounded-2xl border transition-all duration-500 cursor-pointer ${activeFeature === i ? 'bg-white/[0.03] border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)]' : 'bg-transparent border-white/5 hover:border-white/10'}`}
                                onMouseEnter={() => setActiveFeature(i)}
                            >
                                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform ${f.color}`}>
                                    {f.icon}
                                </div>
                                <h3 className="text-xl font-bold font-serif text-white mb-3">{f.title}</h3>
                                <p className="text-gray-400 leading-relaxed text-sm">
                                    {f.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-white/5 py-12 text-center bg-[#050505] relative z-20">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                        <BrandLogo className="w-6 h-6 text-white" />
                        <span className="font-cinzel font-bold text-sm tracking-widest text-white">THE PROFESSOR</span>
                    </div>

                    <p className="text-gray-600 font-mono text-[10px] uppercase tracking-widest">
                        &copy; 2026 The Professor. GlassOS v2.0
                    </p>

                    <button onClick={() => setShowLegal(true)} className="text-[10px] font-mono text-gray-600 uppercase tracking-widest hover:text-white transition-colors">
                        Legal Protocols
                    </button>
                </div>
            </footer>
        </div>
    );
};
