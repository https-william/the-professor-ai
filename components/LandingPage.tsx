
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

  // Optimized Scroll Handler using requestAnimationFrame for smoothness
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
      
      {/* Seamless Background Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Light Mode: Soft White/Blue/Violet Mist */}
          <div className={`absolute inset-0 transition-opacity duration-1000 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
              <div className="absolute top-[-20%] right-[-10%] w-[80vw] h-[80vw] rounded-full bg-blue-100/50 blur-[120px]"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-100/60 blur-[100px]"></div>
              <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] rounded-full bg-white blur-[80px] mix-blend-overlay"></div>
          </div>

          {/* Dark Mode: Deep Space Orbs - Subtle Movement */}
          <div className={`absolute inset-0 transition-opacity duration-1000 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full blur-[100px] opacity-20 animate-mesh-drift bg-blue-900"></div>
              <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-20 animate-mesh-drift bg-indigo-900" style={{ animationDirection: 'reverse', animationDuration: '25s' }}></div>
          </div>
      </div>

      {/* Navigation - No Hard Border */}
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
        <CountdownTimer />
        <nav className={`w-full transition-all duration-500 ${scrolled ? 'bg-panel/80 backdrop-blur-xl border-b border-border-main/50 py-3 shadow-sm' : 'bg-transparent border-transparent py-4 sm:py-6'}`}>
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

      {/* Hero Section - Restored XYZ Pun */}
      <section className="relative pt-32 sm:pt-48 pb-20 px-4 sm:px-6 min-h-[90vh] flex flex-col justify-center items-center text-center z-10">
        <div className="max-w-5xl mx-auto">
          
          <div className="mb-8 animate-slide-in flex justify-center" style={{ animationFillMode: 'backwards', animationDelay: '0.2s' }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel cursor-default shadow-sm border border-border-main">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
              <span className="text-[10px] font-mono text-text-sec uppercase tracking-widest"><DecryptedText text="NEURAL LINK ESTABLISHED" delay={500} /></span>
            </div>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif font-medium tracking-tight leading-[1.1] text-text-pri mb-8">
             Learning is as<br />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-text-sec via-text-pri to-text-sec">simple as</span>
             
             <div className="block sm:inline-block sm:ml-6 mt-4 sm:mt-0">
                <div className="relative inline-flex items-center justify-center align-middle">
                    {/* The Crossed Out ABC - Stays Monochromatic */}
                    <div className="relative mr-5 opacity-40 rotate-[-6deg] select-none group-hover:opacity-60 transition-opacity blur-[1px]">
                        <span className="text-4xl sm:text-6xl font-mono text-text-sec font-bold relative inline-block decoration-red-500 line-through decoration-4">
                            ABC
                        </span>
                    </div>

                    {/* The Hero XYZ - Premium Gradient */}
                    <div className="relative group cursor-default rotate-[2deg] transform transition-transform hover:scale-105 duration-300">
                        <span className="text-6xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 drop-shadow-2xl filter brightness-110">
                            XYZ.
                        </span>
                        <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-60 blur-sm"></div>
                    </div>
                </div>
             </div>
          </h1>
          
          <div className="mb-12 animate-fade-in max-w-xl mx-auto" style={{ animationFillMode: 'backwards', animationDelay: '0.8s' }}>
              <p className="text-text-sec text-lg sm:text-xl leading-relaxed font-light tracking-wide">
                  Stop reading. <span className="text-text-pri font-medium border-b border-accent/30 pb-0.5">Start mastering.</span> <br/>
                  Transform your materials into interactive exams instantly.
              </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center animate-slide-up-fade" style={{ animationDelay: '0.3s' }}>
             {/* Liquid Button for CTA */}
             <button onClick={onEnter} className="btn-liquid px-10 py-4 rounded-full font-bold text-xs uppercase tracking-[0.15em] w-full sm:w-auto min-w-[200px]">
                Start Session
             </button>
             
             <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 rounded-full border border-border-main text-text-sec font-bold text-xs uppercase tracking-[0.15em] hover:bg-panel hover:text-text-pri transition-all w-full sm:w-auto">
                How It Works
             </button>
          </div>
        </div>
      </section>

      {/* The Problem / Chaos - Seamlessly integrated (Glass Card) */}
      <section className="py-24 relative z-10">
          <div className="max-w-6xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                  <div className="order-2 md:order-1">
                      <div className="glass-panel p-8 rounded-3xl border border-red-500/10 relative overflow-hidden group hover:border-red-500/30">
                          {/* Subtle "Glitch" Background */}
                          <div className="absolute inset-0 bg-red-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                          
                          <div className="relative z-10">
                              <h3 className="text-2xl font-serif font-bold text-text-pri mb-4">The Cramming Crisis</h3>
                              <p className="text-text-sec leading-relaxed mb-6">
                                  You have 400 pages of PDF notes. The exam is in 12 hours. 
                                  Traditional study methods—highlighting, re-reading—are scientifically inefficient.
                              </p>
                              
                              <div className="flex gap-4">
                                  <div className="p-4 rounded-xl bg-core/50 border border-border-main flex-1 text-center">
                                      <div className="mb-2 flex justify-center text-text-sec">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                      </div>
                                      <div className="text-[10px] text-text-sec uppercase font-bold tracking-wider">Info Overload</div>
                                  </div>
                                  <div className="p-4 rounded-xl bg-core/50 border border-border-main flex-1 text-center">
                                      <div className="mb-2 flex justify-center text-text-sec">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                      </div>
                                      <div className="text-[10px] text-text-sec uppercase font-bold tracking-wider">Zero Time</div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
                  
                  <div className="order-1 md:order-2 text-center md:text-left">
                      <h2 className="text-4xl md:text-5xl font-bold font-serif mb-6 text-text-pri">Order from <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Chaos</span></h2>
                      <p className="text-lg text-text-sec font-light leading-relaxed">
                          The Professor doesn't just summarize. It ingests your chaos and outputs pure, crystallized knowledge. 
                          <br/><br/>
                          We turn "I hope I pass" into <span className="text-text-pri font-medium">"I am ready."</span>
                      </p>
                  </div>
              </div>
          </div>
      </section>

      {/* Features - Seamless Flow */}
      <section id="features" className="py-24 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4 text-text-pri">Complete Academic Suite</h2>
                  <p className="text-text-sec max-w-2xl mx-auto text-sm tracking-wide">Everything you need to master your coursework.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Feature 1 */}
                  <div className="p-8 rounded-3xl glass-panel hover:border-accent/30 transition-all group duration-500 hover:shadow-lg">
                      <div className="text-4xl mb-6 text-accent group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-text-pri">Practice Exams</h3>
                      <p className="text-text-sec text-sm leading-relaxed">
                          Upload your notes and generate instant mock exams. Identify gaps in your knowledge and get grading feedback before the real test.
                      </p>
                  </div>

                  {/* Feature 2 */}
                  <div className="p-8 rounded-3xl glass-panel hover:border-blue-500/30 transition-all group duration-500 hover:shadow-lg">
                      <div className="text-4xl mb-6 text-blue-500 group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-text-pri">Intelligent Tutoring</h3>
                      <p className="text-text-sec text-sm leading-relaxed">
                          Stuck on a concept? The AI Professor explains complex topics simply, tailored to your learning style (Feynman Technique).
                      </p>
                  </div>

                  {/* Feature 3 */}
                  <div className="p-8 rounded-3xl glass-panel hover:border-purple-500/30 transition-all group duration-500 hover:shadow-lg">
                      <div className="text-4xl mb-6 text-purple-500 group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-text-pri">Collaborative Hub</h3>
                      <p className="text-text-sec text-sm leading-relaxed">
                          Create study rooms and invite friends. Share notes, chat, and learn together in synchronized sessions.
                      </p>
                  </div>
              </div>
          </div>
      </section>
      
      {/* Footer - Seamless (No Top Border) */}
      <footer className="py-12 bg-transparent text-center text-text-sec text-xs relative z-10">
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
