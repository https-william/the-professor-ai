
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
    // Dark mode only - no theme toggle needed

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // --- CUSTOM SVG ASSETS ---

    // SECTION 1: "The Noise" - A messy stack of papers representing information overload
    const StackOverflowSVG = () => (
        <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" stroke="currentColor">
            {/* Background blobs for depth */}
            <circle cx="100" cy="100" r="60" className="fill-blue-500/5 dark:fill-blue-500/10 animate-pulse-slow" stroke="none" />

            {/* Paper Stack Group */}
            <g className="animate-float" style={{ animationDuration: '6s' }}>
                {/* Bottom Paper (Tilted Left) */}
                <rect x="60" y="80" width="80" height="100" rx="4" transform="rotate(-15 100 130)" className="fill-white dark:fill-gray-800 stroke-gray-300 dark:stroke-gray-600" strokeWidth="2" />
                <line x1="70" y1="100" x2="110" y2="100" transform="rotate(-15 100 130)" className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="2" />
                <line x1="70" y1="110" x2="120" y2="110" transform="rotate(-15 100 130)" className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="2" />

                {/* Middle Paper (Tilted Right) */}
                <rect x="70" y="70" width="80" height="100" rx="4" transform="rotate(10 110 120)" className="fill-white dark:fill-gray-800 stroke-gray-300 dark:stroke-gray-600" strokeWidth="2" />
                <line x1="85" y1="90" x2="135" y2="90" transform="rotate(10 110 120)" className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="2" />
                <line x1="85" y1="100" x2="125" y2="100" transform="rotate(10 110 120)" className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="2" />

                {/* Top Paper (Center) */}
                <rect x="60" y="50" width="80" height="100" rx="4" className="fill-white dark:fill-gray-900 stroke-blue-500/50 dark:stroke-blue-400" strokeWidth="2" />
                {/* Content lines on top paper */}
                <line x1="75" y1="70" x2="125" y2="70" className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="2" />
                <line x1="75" y1="80" x2="115" y2="80" className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="2" />
                <line x1="75" y1="90" x2="125" y2="90" className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="2" />

                {/* Red Notification / Alert Bubble */}
                <circle cx="135" cy="50" r="12" className="fill-red-500 stroke-none animate-bounce" />
                <text x="135" y="54" textAnchor="middle" className="fill-white text-[14px] font-bold">!</text>
            </g>

            {/* Scattered debris */}
            <rect x="40" y="140" width="20" height="25" rx="2" transform="rotate(-30 50 152)" className="fill-white/50 dark:fill-white/10 stroke-gray-300 dark:stroke-gray-700 animate-float" style={{ animationDelay: '1s' }} />
            <rect x="150" y="120" width="25" height="30" rx="2" transform="rotate(20 162 135)" className="fill-white/50 dark:fill-white/10 stroke-gray-300 dark:stroke-gray-700 animate-float" style={{ animationDelay: '2s' }} />
        </svg>
    );

    // SECTION 2: "The Prism" - Transforming light (chaos) into order
    const PrismSVG = () => (
        <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" stroke="currentColor">
            <defs>
                <linearGradient id="prismGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
            </defs>
            {/* Beam Input */}
            <path d="M0 100 L 80 100" className="stroke-gray-400 dark:stroke-white/20" strokeWidth="1" strokeDasharray="4 2" />
            {/* The Prism */}
            <path d="M100 40 L160 160 H40 Z" stroke="url(#prismGrad)" strokeWidth="3" fill="rgba(59,130,246,0.05)" className="drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            {/* Refracted Outputs */}
            <path d="M130 100 L 200 60" stroke="#3b82f6" strokeWidth="2" className="animate-pulse" />
            <path d="M130 100 L 200 100" stroke="#a855f7" strokeWidth="2" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
            <path d="M130 100 L 200 140" stroke="#f59e0b" strokeWidth="2" className="animate-pulse" style={{ animationDelay: '1s' }} />
        </svg>
    );

    // SECTION 3: "The Arena" - Competitive Glory
    const ArenaSVG = () => (
        <svg viewBox="0 0 200 200" className="w-full h-full text-amber-500" fill="none" stroke="currentColor">
            <defs>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="80" className="stroke-gray-300 dark:stroke-white/10" strokeWidth="1" />
            <path d="M100 20 L 120 180 M 100 20 L 80 180" className="stroke-gray-300 dark:stroke-white/10" />

            {/* Center Emblem */}
            <path d="M100 40 L 140 80 L 100 160 L 60 80 Z" fill="url(#goldGrad)" className="drop-shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-float" />

            {/* Orbiting Elements */}
            <circle cx="100" cy="100" r="50" strokeWidth="1" strokeDasharray="10 10" className="animate-[spin_20s_linear_infinite] opacity-50 stroke-amber-600" />
        </svg>
    );

    const FAQItem = ({ question, answer }: { question: string, answer: string }) => (
        <div className="border border-black/5 dark:border-white/5 rounded-2xl p-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <h3 className="font-bold text-lg mb-2 text-text-pri">{question}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{answer}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-core text-text-pri relative overflow-x-hidden font-sans selection:bg-accent/30 transition-colors duration-700">

            <LegalModal isOpen={showLegal} onClose={() => setShowLegal(false)} />

            {/* BACKGROUND MESH */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30 dark:opacity-80 transition-opacity duration-700">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-blue-600/10 blur-[120px] mix-blend-screen animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-[30%] left-[40%] w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-[100px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
            </div>

            {/* Navigation - Enhanced Frosted Glass Effect */}
            <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
                <CountdownTimer />
                <nav
                    className={`w-full transition-all duration-500 ${scrolled
                        ? 'bg-[var(--bg-panel)] backdrop-blur-xl border-b border-[var(--border-main)] py-3 shadow-[var(--glass-shadow)]'
                        : 'bg-transparent border-transparent py-6'
                        }`}
                >
                    <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10">
                                <BrandLogo className="w-full h-full text-text-pri" />
                            </div>
                            <span className="font-bold text-lg tracking-tight font-serif text-text-pri hidden sm:block">The Professor</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={onEnter} className="text-xs font-bold uppercase tracking-widest text-text-sec hover:text-text-pri transition-colors">Log In</button>
                            <button onClick={onEnter} className="bg-text-pri text-core px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-black/10 dark:shadow-white/10">Get Started Free</button>
                        </div>
                    </div>
                </nav>
            </div>

            {/* Hero Section - The XYZ Branding */}
            <section className="relative pt-48 pb-32 px-6 min-h-[90vh] flex flex-col justify-center items-center text-center z-10">
                <div className="max-w-6xl mx-auto">

                    <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-md cursor-default shadow-sm animate-slide-in">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        <span className="text-[10px] font-mono text-gray-600 dark:text-gray-300 uppercase tracking-widest">Protocol v3.0 Online</span>
                    </div>

                    {/* THE HEADLINE */}
                    <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-medium tracking-tight leading-[1.1] text-text-pri mb-10 drop-shadow-sm">
                        Learning is as <br className="hidden md:block" /> simple as

                        {/* Strikethrough ABC */}
                        <span className="relative inline-block mx-4 md:mx-6 text-gray-400 dark:text-gray-700 select-none">
                            ABC
                            <svg className="absolute inset-0 w-full h-full text-red-500/90 -rotate-3 scale-125" viewBox="0 0 100 60" preserveAspectRatio="none" style={{ filter: 'drop-shadow(0 0 5px rgba(239,68,68,0.5))' }}>
                                <path d="M-10 30 Q 50 10 110 30" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round" />
                            </svg>
                        </span>

                        {/* Glowing XYZ */}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-amber-500 dark:from-blue-400 dark:via-purple-400 dark:to-amber-400 font-bold animate-pulse-slow">
                            XYZ.
                        </span>
                    </h1>

                    {/* THE XYZ DEFINITION PUN */}
                    <div className="flex flex-wrap justify-center gap-4 md:gap-12 mb-16 animate-slide-up-fade" style={{ animationDelay: '0.2s' }}>
                        <div className="group flex flex-col items-center cursor-default">
                            <span className="text-4xl md:text-5xl font-bold text-blue-500 mb-1 group-hover:-translate-y-1 transition-transform">X</span>
                            <span className="text-[10px] md:text-xs font-mono uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400 group-hover:text-text-pri transition-colors">e<span className="text-blue-500 font-bold">X</span>amine</span>
                        </div>
                        <div className="w-px h-12 bg-black/10 dark:bg-white/10 rotate-12 hidden md:block"></div>
                        <div className="group flex flex-col items-center cursor-default">
                            <span className="text-4xl md:text-5xl font-bold text-purple-500 mb-1 group-hover:-translate-y-1 transition-transform">Y</span>
                            <span className="text-[10px] md:text-xs font-mono uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400 group-hover:text-text-pri transition-colors"><span className="text-purple-500 font-bold">Y</span>ield</span>
                        </div>
                        <div className="w-px h-12 bg-black/10 dark:bg-white/10 rotate-12 hidden md:block"></div>
                        <div className="group flex flex-col items-center cursor-default">
                            <span className="text-4xl md:text-5xl font-bold text-amber-500 mb-1 group-hover:-translate-y-1 transition-transform">Z</span>
                            <span className="text-[10px] md:text-xs font-mono uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400 group-hover:text-text-pri transition-colors"><span className="text-amber-500 font-bold">Z</span>ero Doubt</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-5 justify-center items-center animate-slide-up-fade" style={{ animationDelay: '0.4s' }}>
                        <button onClick={onEnter} className="px-12 py-5 bg-text-pri text-core rounded-full font-bold text-xs uppercase tracking-[0.2em] w-full sm:w-auto min-w-[220px] hover:bg-opacity-90 transition-colors shadow-2xl hover:shadow-xl hover:scale-105 transform duration-200">
                            Start Session
                        </button>
                        <button onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })} className="px-10 py-5 rounded-full border border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-[0.2em] hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-pri transition-all w-full sm:w-auto">
                            The Protocol
                        </button>
                    </div>
                </div>
            </section>

            {/* STORY SECTION 1: THE PROBLEM (Light: bg-gray-50, Dark: bg-black/20) */}
            <section id="story" className="py-32 px-6 relative z-10 border-t border-black/5 dark:border-white/5 bg-gray-50 dark:bg-black/20">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20">
                    <div className="flex-1 text-left order-2 md:order-1">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-blue-600 dark:text-blue-500 font-bold font-mono text-4xl">01</span>
                            <div className="h-px bg-blue-500/50 flex-1"></div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">The Noise</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-serif font-bold text-text-pri mb-8 leading-tight">
                            You are drowning in <br /><span className="text-gray-400 dark:text-gray-600 line-through decoration-blue-500/50">data.</span>
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8 font-light">
                            PDFs. PowerPoints. Handouts. The modern student isn't lacking information; they are suffocating in it.
                            Passive reading is a lie. Highlighting is a placebo. You spend hours "studying" but retain nothing.
                        </p>
                        <p className="text-blue-600/80 dark:text-blue-400/80 border-l-2 border-blue-500/30 pl-6 italic font-serif text-xl">
                            "It's not about how much you read. It's about how much you decode."
                        </p>
                    </div>
                    <div className="flex-1 w-full max-w-lg aspect-square relative order-1 md:order-2">
                        <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full"></div>
                        <div className="relative z-10 w-full h-full border border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/40 rounded-[2rem] p-10 backdrop-blur-md shadow-2xl flex items-center justify-center">
                            <StackOverflowSVG />
                        </div>
                    </div>
                </div>
            </section>

            {/* STORY SECTION 2: THE SOLUTION (Light: bg-white, Dark: bg-black/40) */}
            <section className="py-32 px-6 relative z-10 bg-white dark:bg-black/40">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20">
                    <div className="flex-1 w-full max-w-lg aspect-square relative">
                        <div className="absolute inset-0 bg-purple-500/10 blur-[100px] rounded-full"></div>
                        <div className="relative z-10 w-full h-full border border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-black/40 rounded-[2rem] p-10 backdrop-blur-md shadow-2xl flex items-center justify-center">
                            <PrismSVG />
                        </div>
                    </div>
                    <div className="flex-1 text-left">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-purple-600 dark:text-purple-500 font-bold font-mono text-4xl">02</span>
                            <div className="h-px bg-purple-500/50 flex-1"></div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">The Prism</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-serif font-bold text-text-pri mb-8 leading-tight">
                            Enter The <br /><span className="text-purple-600 dark:text-purple-400">Professor.</span>
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8 font-light">
                            Our Neural Ingestion Engine acts as a prism for your coursework. Drag and drop your chaos.
                            We extract the signal from the noise, generating structured <strong>Exams</strong>, <strong>Flashcards</strong>, and <strong>Feynman Lectures</strong> instantly.
                        </p>
                        <ul className="space-y-4 text-gray-600 dark:text-gray-300 font-mono text-sm">
                            <li className="flex items-center gap-4 p-4 border border-black/5 dark:border-white/5 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                <span className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_10px_purple]"></span>
                                <span>Context-Aware Questioning</span>
                            </li>
                            <li className="flex items-center gap-4 p-4 border border-black/5 dark:border-white/5 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                <span className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_10px_purple]"></span>
                                <span>Adaptive Difficulty Curves</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* STORY SECTION 3: THE OUTCOME (Light: bg-gray-50, Dark: bg-black/20) */}
            <section className="py-32 px-6 relative z-10 border-b border-black/5 dark:border-white/5 bg-gray-50 dark:bg-black/20">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20">
                    <div className="flex-1 text-left order-2 md:order-1">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-amber-600 dark:text-amber-500 font-bold font-mono text-4xl">03</span>
                            <div className="h-px bg-amber-500/50 flex-1"></div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">The Glory</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-serif font-bold text-text-pri mb-8 leading-tight">
                            Academic <br /><span className="text-amber-600 dark:text-amber-400">Immortality.</span>
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8 font-light">
                            Stop guessing what's on the test. <span className="text-text-pri font-bold">The Arena</span> lets you wager XP against peers in real-time battles.
                            Turn your study session into a competitive sport.
                        </p>
                        <button onClick={onEnter} className="px-10 py-4 bg-amber-600/10 text-amber-700 dark:text-amber-500 border border-amber-500/30 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-amber-600 hover:text-black transition-all flex items-center gap-3 group">
                            Enter The Arena
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                    </div>
                    <div className="flex-1 w-full max-w-lg aspect-square relative order-1 md:order-2">
                        <div className="absolute inset-0 bg-amber-500/5 blur-[100px] rounded-full"></div>
                        <div className="relative z-10 w-full h-full border border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/40 rounded-[2rem] p-10 backdrop-blur-md shadow-2xl flex items-center justify-center">
                            <ArenaSVG />
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ SECTION */}
            <section className="py-32 px-6 relative z-10 bg-white/50 dark:bg-black/20 border-t border-black/5 dark:border-white/5">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-blue-600 dark:text-blue-500 font-bold font-mono text-xs uppercase tracking-widest mb-2 block">Inquiries</span>
                        <h2 className="text-4xl font-serif font-bold text-text-pri">Common Questions</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FAQItem
                            question="Is it actually free?"
                            answer="The 'Fresher' tier is completely free. It includes limited daily generations. For unlimited power and The Oracle, you can upgrade to Scholar or Excellentia."
                        />
                        <FAQItem
                            question="What files can I upload?"
                            answer="We support PDF, DOCX, PPTX, TXT, and even Images (via OCR). You can also paste raw notes directly into the terminal."
                        />
                        <FAQItem
                            question="How does The Arena work?"
                            answer="You create a lobby with a specific topic or file. You get a code to share with friends. Everyone takes the same exam simultaneously. Winner gets XP."
                        />
                        <FAQItem
                            question="What is 'Nightmare' difficulty?"
                            answer="An experimental mode that generates questions designed to test deep conceptual understanding rather than rote memorization. Not for the faint of heart."
                        />
                    </div>
                </div>
            </section>

            <footer className="py-12 text-center text-gray-600 text-xs border-t border-black/5 dark:border-white/5 bg-white dark:bg-black">
                <div className="flex justify-center items-center gap-2 mb-6">
                    <div className="w-6 h-6 text-gray-700 dark:text-gray-500"><BrandLogo /></div>
                    <span className="font-serif font-bold text-gray-500">THE PROFESSOR</span>
                </div>
                <p className="font-mono uppercase tracking-widest mb-6 opacity-50">Built by Vexis Automations.</p>
                <div className="flex justify-center gap-8">
                    <button onClick={() => setShowLegal(true)} className="hover:text-text-pri transition-colors uppercase tracking-wider font-bold">Legal Protocol</button>
                    <a href="mailto:vexis.automations@gmail.com" className="hover:text-text-pri transition-colors uppercase tracking-wider font-bold">Support Line</a>
                </div>
            </footer>
        </div>
    );
};
