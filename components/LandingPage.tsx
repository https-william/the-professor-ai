
import React, { useState, useEffect } from 'react';
import { CountdownTimer } from './CountdownTimer';
import { BrandLogo } from './BrandLogo';
import { useTheme } from '../contexts/ThemeContext';

interface LandingPageProps {
  onEnter: () => void;
  onPricing: () => void;
}

const DecryptedText = ({ text, className = "", delay = 0 }: { text: string, className?: string, delay?: number }) => {
    const [displayText, setDisplayText] = useState(text.split('').map(() => "0").join(''));
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    useEffect(() => {
      let interval: any;
      let iteration = 0;
      const startScramble = () => {
        interval = setInterval(() => {
          setDisplayText(prev => text.split("").map((letter, index) => index < iteration ? text[index] : chars[Math.floor(Math.random() * chars.length)]).join(""));
          if (iteration >= text.length) clearInterval(interval);
          iteration += 1 / 3;
        }, 30);
      };
      const timeout = setTimeout(startScramble, delay);
      return () => { clearInterval(interval); clearTimeout(timeout); }
    }, [text, delay]);
    return <span className={`font-mono ${className}`}>{displayText}</span>;
};

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onPricing }) => {
  const [scrolled, setScrolled] = useState(false);
  const { isDark, setTheme } = useTheme();

  // Optimized Scroll Handler
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                setScrolled(window.scrollY > 20);
                ticking = false;
            });
            ticking = true;
        }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
      setTheme(isDark ? 'Light' : 'Dark');
  };

  return (
    <div className="min-h-screen bg-core text-text-pri relative overflow-x-hidden font-sans selection:bg-accent/30 transition-colors duration-700">
      
      {/* Continuous Background Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className={`absolute inset-0 transition-opacity duration-1000 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
              <div className="absolute top-[-20%] right-[-10%] w-[80vw] h-[80vw] rounded-full bg-blue-100/50 blur-[120px]"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-100/60 blur-[100px]"></div>
          </div>

          <div className={`absolute inset-0 transition-opacity duration-1000 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full blur-[100px] opacity-20 bg-blue-900"></div>
              <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-20 bg-indigo-900"></div>
          </div>
      </div>

      {/* Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
        <CountdownTimer />
        <nav className={`w-full transition-all duration-500 ${scrolled ? 'bg-core/80 backdrop-blur-md shadow-sm border-b border-border-main/50 py-3' : 'bg-transparent py-6'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 transition-transform hover:scale-110 duration-300">
                <BrandLogo className="w-full h-full text-text-pri" />
              </div>
              <span className="font-bold text-lg tracking-tight font-serif text-text-pri hidden sm:block">The Professor</span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-text-sec hover:text-text-pri"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                  {isDark ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                  )}
              </button>
              <button onClick={onPricing} className="text-xs font-bold uppercase tracking-widest text-accent hover:opacity-80 transition-colors hidden sm:block">Tuition</button>
              <button onClick={onEnter} className="text-xs font-bold uppercase tracking-widest text-text-sec hover:text-text-pri transition-colors">Log In</button>
              
              <button onClick={onEnter} className="btn-liquid px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest">Get Started</button>
            </div>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-40 pb-32 px-4 sm:px-6 flex flex-col justify-center items-center text-center z-10">
        <div className="max-w-5xl mx-auto">
          
          <div className="mb-8 animate-slide-in flex justify-center" style={{ animationFillMode: 'backwards', animationDelay: '0.2s' }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel cursor-default shadow-sm border border-border-main">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
              <span className="text-[10px] font-mono text-text-sec uppercase tracking-widest"><DecryptedText text="NEURAL LINK ESTABLISHED" delay={500} /></span>
            </div>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif font-medium tracking-tight leading-[1.1] text-text-pri mb-12">
             Learning is as <br className="hidden md:block"/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-text-sec via-text-pri to-text-sec">simple as</span>
             
             <div className="block sm:inline-block sm:ml-6 mt-6 sm:mt-0">
                <div className="relative inline-flex items-center justify-center align-middle">
                    {/* The Crossed Out ABC - Smaller & Stylized */}
                    <div className="relative mr-6 opacity-40 rotate-[-8deg] select-none hover:opacity-60 transition-opacity">
                        <span className="text-4xl sm:text-5xl md:text-6xl font-mono text-text-sec font-bold relative inline-block decoration-red-600 line-through decoration-[6px]">
                            ABC
                        </span>
                    </div>

                    {/* The Hero XYZ - Popped Out & Underlined */}
                    <div className="relative group cursor-default rotate-[3deg] transform transition-transform hover:scale-105 duration-300 z-10">
                        <span className="text-7xl sm:text-8xl md:text-9xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 drop-shadow-2xl filter brightness-110">
                            XYZ.
                        </span>
                        {/* Custom Underline */}
                        <div className="absolute -bottom-2 left-2 right-2 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-accent rounded-full opacity-90 shadow-[0_0_20px_rgba(59,130,246,0.6)] transform -rotate-1"></div>
                    </div>
                </div>
             </div>
          </h1>
          
          <div className="mb-12 animate-fade-in max-w-xl mx-auto" style={{ animationFillMode: 'backwards', animationDelay: '0.8s' }}>
              <p className="text-text-sec text-lg sm:text-xl leading-relaxed font-light tracking-wide">
                  The AI Study Tool that doesn't just summarize. <br/>It teaches, tests, and relentlessly drills you until you master the material.
              </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center animate-slide-up-fade" style={{ animationDelay: '0.3s' }}>
             <button onClick={onEnter} className="btn-liquid px-10 py-4 rounded-full font-bold text-xs uppercase tracking-[0.15em] w-full sm:w-auto min-w-[200px]">
                Start Session
             </button>
             
             <button onClick={() => document.getElementById('problem-box')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 rounded-full border border-border-main text-text-sec font-bold text-xs uppercase tracking-[0.15em] hover:bg-panel hover:text-text-pri transition-all w-full sm:w-auto">
                How It Works
             </button>
          </div>
        </div>
      </section>

      {/* The Problem Box - "Pop Out" Effect */}
      <section id="problem-box" className="relative z-20 px-6 -mt-10 mb-24">
          <div className="max-w-6xl mx-auto bg-[#0a0a0c] dark:bg-[#030712] border border-red-500/20 rounded-[2rem] p-8 md:p-16 shadow-[0_0_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-red-500/40 transition-colors duration-500">
              
              {/* Subtle Red Pulse Background */}
              <div className="absolute -top-[50%] -right-[10%] w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[100px] pointer-events-none"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
                  <div>
                      <div className="inline-block px-3 py-1 rounded bg-red-950/30 border border-red-500/30 text-red-500 text-[10px] font-bold uppercase tracking-widest mb-6">
                          Status: Critical
                      </div>
                      <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6">
                          The Cramming <span className="text-red-500 italic">Crisis</span>
                      </h2>
                      <p className="text-gray-400 text-lg leading-relaxed mb-8">
                          You have 400 pages of PDF notes. The exam is in 12 hours. 
                          Traditional study methods—highlighting, re-reading—are scientifically proven to be inefficient.
                          <br/><br/>
                          The result? <span className="text-white font-medium">Brain fog, panic, and mediocrity.</span>
                      </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      {/* Chaos Card 1 */}
                      <div className="bg-red-950/10 border border-red-500/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-4 hover:bg-red-950/20 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                          <span className="text-xs font-bold text-red-200 uppercase tracking-wider">Info Overload</span>
                      </div>
                      
                      {/* Chaos Card 2 */}
                      <div className="bg-red-950/10 border border-red-500/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-4 hover:bg-red-950/20 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span className="text-xs font-bold text-red-200 uppercase tracking-wider">Zero Time</span>
                      </div>

                      {/* Chaos Card 3 */}
                      <div className="col-span-2 bg-red-950/10 border border-red-500/10 p-6 rounded-2xl flex items-center justify-center gap-4 hover:bg-red-950/20 transition-colors">
                          <span className="text-3xl font-mono text-red-500 font-bold">F-</span>
                          <span className="text-xs font-bold text-red-200 uppercase tracking-wider">Academic Risk</span>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* The Solution - Seamless Flow */}
      <section className="py-24 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-20">
                  <h2 className="text-4xl md:text-5xl font-bold font-serif mb-6 text-text-pri">Order from <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Chaos</span></h2>
                  <p className="text-lg text-text-sec font-light leading-relaxed max-w-2xl mx-auto">
                      The Professor ingests your chaos and outputs pure, crystallized knowledge. 
                      <br/>We turn "I hope I pass" into <span className="text-text-pri font-medium">"I am ready."</span>
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Feature 1 */}
                  <div className="p-8 rounded-3xl glass-panel hover:border-accent/30 transition-all group duration-500 hover:-translate-y-2">
                      <div className="text-4xl mb-6 text-accent group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-text-pri">Instant Exams</h3>
                      <p className="text-text-sec text-sm leading-relaxed">
                          We don't just quiz you. We generate "Nightmare Mode" exams designed to find your weak spots before the real test does.
                      </p>
                  </div>

                  {/* Feature 2 */}
                  <div className="p-8 rounded-3xl glass-panel hover:border-blue-500/30 transition-all group duration-500 hover:-translate-y-2">
                      <div className="text-4xl mb-6 text-blue-500 group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-text-pri">Feynman Tutor</h3>
                      <p className="text-text-sec text-sm leading-relaxed">
                          Stuck on Quantum Mechanics? The AI explains it using analogies from Fortnite, Cooking, or Football. Whatever clicks for you.
                      </p>
                  </div>

                  {/* Feature 3 */}
                  <div className="p-8 rounded-3xl glass-panel hover:border-purple-500/30 transition-all group duration-500 hover:-translate-y-2">
                      <div className="text-4xl mb-6 text-purple-500 group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-text-pri">Voice Mode</h3>
                      <p className="text-text-sec text-sm leading-relaxed">
                          Turn your commute into a lecture. The Professor reads your notes back to you in a natural, neural voice.
                      </p>
                  </div>
              </div>
          </div>
      </section>

      {/* Demo Section */}
      <section className="py-20 relative z-10">
          <div className="max-w-5xl mx-auto px-6">
              <div className="glass-panel p-1 rounded-3xl border border-border-main shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-purple-500 to-accent animate-[shimmer_2s_infinite]"></div>
                  
                  <div className="bg-core/50 backdrop-blur-xl rounded-[20px] p-8 md:p-16 text-center">
                      <h3 className="text-3xl font-bold text-text-pri mb-6">Ready to upgrade your brain?</h3>
                      
                      <div className="flex justify-center gap-4">
                          <button onClick={onEnter} className="btn-liquid px-12 py-4 rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg hover:shadow-xl transition-all">
                              Start Session
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 bg-transparent text-center text-text-sec text-xs relative z-10 border-t border-border-main/50">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-2">
                 <div className="w-6 h-6 grayscale opacity-50">
                    <BrandLogo className="w-full h-full text-text-pri" />
                 </div>
                 <span className="font-bold text-text-sec">The Professor</span>
             </div>
             
             <div className="flex flex-col items-center md:items-end gap-1">
                 <p className="font-mono uppercase tracking-widest text-accent/50">Copyright The Professor</p>
                 <p className="opacity-50">A sub system of Vexis Automations.</p>
                 <div className="flex gap-4 mt-2">
                     <a href="mailto:vexis.automations@gmail.com" className="hover:text-text-pri transition-colors">Support Email</a>
                     <span className="text-border-main">|</span>
                     <span className="hover:text-text-pri transition-colors cursor-default">+234 707 170 3030 (Telegram)</span>
                 </div>
             </div>
         </div>
      </footer>
    </div>
  );
};
