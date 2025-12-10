
import React, { useState, useEffect, useRef } from 'react';
import { CountdownTimer } from './CountdownTimer';

interface LandingPageProps {
  onEnter: () => void;
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
          iteration += 1 / 2;
        }, 30);
      };
      const timeout = setTimeout(startScramble, delay);
      return () => { clearInterval(interval); clearTimeout(timeout); }
    }, [text, delay]);
    return <span className={`font-mono ${className}`}>{displayText}</span>;
};

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [scrolled, setScrolled] = useState(0);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
        <CountdownTimer />
        <nav className={`w-full transition-all duration-300 ${scrolled > 20 ? 'bg-black/90 backdrop-blur-xl border-b border-white/5 py-3' : 'bg-transparent py-4 sm:py-6'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-gray-400 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              </div>
              <span className="font-bold text-lg tracking-tight font-serif text-white hidden sm:block">The Professor</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={onEnter} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">Log In</button>
              <button onClick={onEnter} className="px-5 py-2 rounded-full bg-white text-black font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">Get Started</button>
            </div>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="relative pt-48 sm:pt-60 pb-20 px-4 sm:px-6 overflow-hidden min-h-[90vh] flex flex-col justify-center">
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="mb-8 animate-slide-in opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}>
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all cursor-default group hover:border-blue-500/30">
              <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>
              <span className="text-xs font-mono text-blue-300 uppercase tracking-widest group-hover:text-blue-200 transition-colors"><DecryptedText text="NEURAL LINK :: ESTABLISHED" delay={500} /></span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-8">
            <h1 className="text-5xl sm:text-7xl md:text-9xl font-serif font-bold tracking-tighter leading-[0.9] text-white mix-blend-difference">
               ACADEMIC<br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-600"><DecryptedText text="WEAPON." delay={800} /></span>
            </h1>
            <div className="mb-2 md:mb-8 animate-fade-in opacity-0 w-full md:w-auto" style={{ animationFillMode: 'forwards', animationDelay: '1.2s' }}>
                <p className="max-w-md text-gray-400 text-sm leading-relaxed border-l border-white/20 pl-4">Transform passive reading into active mastery. The Professor dissects your materials and reconstructs them into high-yield exams.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-slide-up-fade" style={{ animationDelay: '0.3s' }}>
             <button onClick={onEnter} className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-sm uppercase tracking-widest overflow-hidden transition-transform active:scale-95 w-full sm:w-auto text-center">
                <span className="relative z-10 group-hover:text-white transition-colors">Start Session</span>
                <div className="absolute inset-0 bg-blue-600 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
             </button>
             <div className="flex items-center justify-center gap-4 px-6 py-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm w-full sm:w-auto">
                <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 border border-black flex items-center justify-center text-[10px] text-white">AI</div>
                </div>
                <span className="text-xs text-gray-400 font-mono"><DecryptedText text="Plan: Free Access" delay={1500} /></span>
             </div>
          </div>
        </div>
      </section>

      {/* Features Grid (Bento) */}
      <section className="py-24 px-4 bg-black relative z-10">
         <div className="max-w-7xl mx-auto">
            <div className="mb-16">
               <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">Architecture of Mind</h2>
               <div className="h-1 w-20 bg-blue-500"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Large Feature */}
                <div className="md:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                   <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                      <svg className="w-48 h-48 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                   </div>
                   <div className="relative z-10">
                      <div className="w-12 h-12 bg-blue-900/20 rounded-xl flex items-center justify-center mb-6 border border-blue-500/20 text-blue-400">
                         <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      </div>
                      <h3 className="text-2xl font-bold mb-3">Universal Ingestion</h3>
                      <p className="text-gray-400 leading-relaxed max-w-md">PDFs, DOCX, Images, or raw text. The Professor consumes it all and structures chaos into curriculum.</p>
                   </div>
                </div>

                {/* Tall Feature */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                   <div className="absolute top-4 right-4 text-[10px] font-bold uppercase bg-amber-900/30 text-amber-500 px-2 py-1 rounded border border-amber-500/20">The Oracle</div>
                   <div className="mt-8">
                      <div className="w-12 h-12 bg-amber-900/20 rounded-xl flex items-center justify-center mb-6 border border-amber-500/20 text-amber-400">
                         <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </div>
                      <h3 className="text-xl font-bold mb-3">Predictive AI</h3>
                      <p className="text-gray-400 text-sm">Forecasting exam questions based on high-level pattern recognition.</p>
                   </div>
                </div>

                {/* Wide Feature */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-red-500/30 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-red-900/20 rounded-xl flex items-center justify-center border border-red-500/20 text-red-400 shrink-0">
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                       </div>
                       <div>
                          <h3 className="text-lg font-bold">Nightmare Mode</h3>
                          <p className="text-gray-400 text-xs mt-1">Edge cases designed to break you.</p>
                       </div>
                    </div>
                </div>

                {/* Wide Feature */}
                <div className="md:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-green-500/30 transition-colors">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 bg-green-900/20 rounded-xl flex items-center justify-center border border-green-500/20 text-green-400 shrink-0">
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                       </div>
                       <div>
                          <h3 className="text-lg font-bold">Audio Lectures</h3>
                          <p className="text-gray-400 text-sm mt-1">Text-to-speech enabled synthesis for auditory learners.</p>
                       </div>
                    </div>
                </div>
            </div>
         </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4 bg-[#050505] relative border-t border-white/5">
          <div className="max-w-7xl mx-auto">
             <div className="text-center mb-16">
                 <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">Tuition Plans</h2>
                 <p className="text-gray-400">Launch Special: Full access granted to all new enrollments.</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Free Tier */}
                 <div className="p-8 rounded-3xl border border-white/5 bg-white/5 grayscale opacity-60">
                     <h3 className="text-xl font-bold mb-2">Fresher</h3>
                     <div className="text-2xl font-mono mb-6">Free</div>
                     <ul className="space-y-2 text-sm text-gray-400 mb-8">
                         <li>• 3 Quizzes / Day</li>
                         <li>• Text Paste Only</li>
                         <li>• Standard Speed</li>
                     </ul>
                 </div>
                 
                 {/* Scholar Tier */}
                 <div className="p-8 rounded-3xl border border-blue-500/30 bg-blue-900/5 relative">
                     <h3 className="text-xl font-bold mb-2 text-blue-400">Scholar</h3>
                     <div className="text-2xl font-mono mb-6">₦2,000</div>
                     <ul className="space-y-2 text-sm text-gray-300 mb-8">
                         <li>• Unlimited Quizzes</li>
                         <li>• PDF Uploads</li>
                         <li>• Detailed Explanations</li>
                     </ul>
                     <div className="absolute top-4 right-4 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded">POPULAR</div>
                 </div>

                 {/* Supreme Tier */}
                 <div className="p-8 rounded-3xl border border-amber-500/50 bg-amber-900/10 relative overflow-hidden transform md:scale-105 shadow-2xl">
                     <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none"></div>
                     <h3 className="text-xl font-bold mb-2 text-amber-500 flex items-center gap-2">Supreme <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/></svg></h3>
                     <div className="flex items-baseline gap-2 mb-6">
                         <span className="text-2xl font-mono font-bold text-white">FREE</span>
                         <span className="text-sm line-through text-gray-500">₦5,000</span>
                     </div>
                     <p className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-6">First Month Access</p>
                     <ul className="space-y-3 text-sm text-gray-300 mb-8">
                         <li className="flex gap-2"><svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg> Nightmare Mode</li>
                         <li className="flex gap-2"><svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg> The Oracle AI</li>
                         <li className="flex gap-2"><svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg> Weakness Destroyer</li>
                     </ul>
                     <button onClick={onEnter} className="w-full py-3 bg-white text-black font-bold uppercase text-xs rounded-xl hover:bg-gray-200">Claim Access</button>
                 </div>
             </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-black text-center text-gray-600 text-xs">
         <p className="font-mono">THE PROFESSOR AI © 2024</p>
         <p className="mt-2 opacity-50">Designed for the academically obsessed.</p>
      </footer>
    </div>
  );
};
