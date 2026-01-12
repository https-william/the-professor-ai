
import React, { useState, useEffect } from 'react';
import { CountdownTimer } from './CountdownTimer';
import { BrandLogo } from './BrandLogo';

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
  const [scrolled, setScrolled] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-x-hidden font-sans selection:bg-amber-500/30">
      
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-950/20 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-950/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay"></div>
      </div>

      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
        <CountdownTimer />
        <nav className={`w-full transition-all duration-500 ${scrolled > 20 ? 'bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 py-3' : 'bg-transparent py-4 sm:py-6'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10">
                <BrandLogo />
              </div>
              <span className="font-bold text-lg tracking-tight font-serif text-gray-200 hidden sm:block">The Professor</span>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={onPricing} className="text-xs font-bold uppercase tracking-widest text-amber-500 hover:text-amber-300 transition-colors">Tuition</button>
              <button onClick={onEnter} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">Log In</button>
              <button onClick={onEnter} className="px-6 py-2 rounded-full bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]">Get Started</button>
            </div>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-48 pb-20 px-4 sm:px-6 min-h-[90vh] flex flex-col justify-center items-center text-center z-10">
        <div className="max-w-5xl mx-auto">
          
          <div className="mb-8 animate-slide-in flex justify-center" style={{ animationFillMode: 'backwards', animationDelay: '0.2s' }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md cursor-default">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest"><DecryptedText text="ACADEMIC WEAPON DETECTED" delay={500} /></span>
            </div>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif font-medium tracking-tight leading-[1.1] text-gray-100 mb-8">
             Learning is as<br />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 via-gray-200 to-gray-400">simple as</span>
             
             <div className="block sm:inline-block sm:ml-6 mt-4 sm:mt-0">
                <div className="relative inline-flex items-center justify-center align-middle">
                    {/* The Crossed Out ABC */}
                    <div className="relative mr-5 opacity-50 rotate-[-6deg] select-none group-hover:opacity-70 transition-opacity">
                        <span className="text-4xl sm:text-6xl font-mono text-gray-600 font-bold relative inline-block">
                            ABC
                            {/* Custom SVG Red Strike */}
                            <svg className="absolute top-1/2 left-[-10%] w-[120%] h-[20%] -translate-y-1/2 text-red-600 opacity-90 pointer-events-none overflow-visible" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 2" stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="none" />
                            </svg>
                        </span>
                    </div>

                    {/* The Hero XYZ - Dark Academia Gradient */}
                    <div className="relative group cursor-default rotate-[2deg] transform transition-transform hover:scale-105 duration-300">
                        <span className="text-6xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 via-purple-300 to-amber-200 drop-shadow-2xl filter brightness-110">
                            XYZ.
                        </span>
                        {/* Glowing Underline - Subtle */}
                        <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-amber-600 rounded-full shadow-[0_0_25px_rgba(79,70,229,0.4)] animate-pulse-slow"></div>
                    </div>
                </div>
             </div>
          </h1>
          
          <div className="mb-12 animate-fade-in max-w-xl mx-auto" style={{ animationFillMode: 'backwards', animationDelay: '0.8s' }}>
              <p className="text-gray-400 text-lg sm:text-xl leading-relaxed font-light tracking-wide">
                  Stop reading. <span className="text-gray-200 font-medium border-b border-amber-500/30 pb-0.5">Start mastering.</span> <br/>
                  Upload materials and dominate your exams with your personal Professor.
              </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center animate-slide-up-fade" style={{ animationDelay: '0.3s' }}>
             <button onClick={onEnter} className="group relative px-10 py-4 bg-gray-100 text-black rounded-full font-bold text-xs uppercase tracking-[0.15em] overflow-hidden transition-transform active:scale-95 w-full sm:w-auto text-center min-w-[200px] shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                <span className="relative z-10 group-hover:text-white transition-colors">Start Session</span>
                <div className="absolute inset-0 bg-[#0f0f10] transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out border border-white/10"></div>
             </button>
             <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 rounded-full border border-white/10 text-gray-400 font-bold text-xs uppercase tracking-[0.15em] hover:bg-white/5 hover:text-white transition-all w-full sm:w-auto">
                How It Works
             </button>
          </div>
        </div>
      </section>

      {/* Expanded Feature Explanations */}
      <section id="features" className="py-24 relative z-10 border-t border-white/5 bg-[#080808]">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4 text-gray-200">Complete Academic Suite</h2>
                  <p className="text-gray-500 max-w-2xl mx-auto text-sm tracking-wide">Everything you need to master your coursework, from exams to group study.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Feature 1 */}
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-amber-500/20 transition-all group">
                      <div className="text-4xl mb-6 text-amber-600 group-hover:text-amber-500 group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-gray-200">Practice Exams</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">
                          Upload your notes and generate instant mock exams. Identify gaps in your knowledge and get grading feedback before the real test.
                      </p>
                  </div>

                  {/* Feature 2 */}
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/20 transition-all group">
                      <div className="text-4xl mb-6 text-blue-600 group-hover:text-blue-500 group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-gray-200">Intelligent Tutoring</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">
                          Stuck on a concept? The AI Professor explains complex topics simply, tailored to your learning style, ensuring you truly understand the material.
                      </p>
                  </div>

                  {/* Feature 3 */}
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-purple-500/20 transition-all group">
                      <div className="text-4xl mb-6 text-purple-600 group-hover:text-purple-500 group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-gray-200">Collaborative Hub</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">
                          Create study rooms and invite friends. Share notes, chat, and learn together in synchronized sessions with built-in voice notes.
                      </p>
                  </div>
              </div>
          </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-black text-center text-gray-600 text-xs">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-2">
                 <div className="w-6 h-6 grayscale opacity-50">
                    <BrandLogo />
                 </div>
                 <span className="font-bold text-gray-500">The Professor</span>
             </div>
             
             <div className="flex flex-col items-center md:items-end gap-1">
                 <p className="font-mono uppercase tracking-widest text-amber-500/50">Copyright The Professor</p>
                 <p className="opacity-30">A sub system of Vexis Automations.</p>
                 <div className="flex gap-4 mt-2">
                     <a href="mailto:vexis.automations@gmail.com" className="hover:text-white transition-colors">Support Email</a>
                     <span className="text-gray-800">|</span>
                     <span className="hover:text-white transition-colors cursor-default">+234 707 170 3030 (Telegram)</span>
                 </div>
             </div>
         </div>
      </footer>
    </div>
  );
};
