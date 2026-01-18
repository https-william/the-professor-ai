
import React, { useState, useEffect } from 'react';
import { CountdownTimer } from './CountdownTimer';
import { BrandLogo } from './BrandLogo';
import { useTheme } from '../contexts/ThemeContext';
import { LegalModal } from './LegalModal';

interface LandingPageProps {
  onEnter: () => void;
  onPricing: () => void;
  onLegal?: () => void;
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

// --- SVG ICONS ---
const Icons = {
    Brain: (props: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
        </svg>
    ),
    Swords: (props: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="m13 19 6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/><path d="m21 3-6.5 6.5"/><path d="m5 11 6 6"/><path d="m2 19 2 2"/><path d="m9 22 2-2"/>
        </svg>
    ),
    Cap: (props: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
    ),
    Bolt: (props: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    ),
    DNA: (props: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><path d="m17 6-2.5-2.5"/><path d="m14 8-1-1"/><path d="m7 18 2.5 2.5"/><path d="m3.5 14.5.5.5"/><path d="m20 9 .5.5"/><path d="m6.5 12.5 1 1"/><path d="m16.5 10.5 1 1"/><path d="m10 16 1.5 1.5"/>
        </svg>
    )
};

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onPricing }) => {
  const [scrolled, setScrolled] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const { isDark, setTheme } = useTheme();

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

  const FeatureCard = ({ icon, title, desc, delay }: any) => (
      <div className="p-8 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden" style={{ animationDelay: delay }}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform">
              {icon}
          </div>
          <h3 className="text-xl font-bold text-text-pri mb-3 font-display">{title}</h3>
          <p className="text-sm text-text-sec leading-relaxed">{desc}</p>
      </div>
  );

  return (
    <div className="min-h-screen bg-core text-text-pri relative overflow-x-hidden font-sans selection:bg-accent/30 transition-colors duration-700">
      
      <LegalModal isOpen={showLegal} onClose={() => setShowLegal(false)} />

      {/* Seamless Background Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className={`absolute inset-0 transition-opacity duration-1000 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
              <div className="absolute -top-[10%] -left-[10%] w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-blue-200 via-sky-100 to-transparent blur-[120px] opacity-80"></div>
              <div className="absolute top-[20%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-bl from-purple-200 via-pink-100 to-transparent blur-[100px] opacity-70"></div>
              <div className="absolute bottom-0 left-[20%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-t from-amber-100 to-transparent blur-[120px] opacity-60"></div>
          </div>

          <div className={`absolute inset-0 transition-opacity duration-1000 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full blur-[100px] opacity-40 animate-mesh-drift bg-gradient-to-br from-blue-900 to-violet-900"></div>
              <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-30 animate-mesh-drift bg-gradient-to-tl from-indigo-900 to-black" style={{ animationDirection: 'reverse', animationDuration: '25s' }}></div>
              <div className="absolute top-[40%] left-[40%] w-[30vw] h-[30vw] rounded-full blur-[80px] opacity-20 bg-blue-600 mix-blend-screen animate-pulse-slow"></div>
          </div>
      </div>

      {/* Navigation */}
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

      {/* Hero Section */}
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
                    <div className="relative mr-5 opacity-40 rotate-[-6deg] select-none group-hover:opacity-60 transition-opacity blur-[1px]">
                        <span className="text-4xl sm:text-6xl font-mono text-text-sec font-bold relative inline-block decoration-red-500 line-through decoration-4">
                            ABC
                        </span>
                    </div>

                    <div className="relative group cursor-default rotate-[2deg] transform transition-transform hover:scale-105 duration-300">
                        <span className="text-6xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 drop-shadow-2xl filter brightness-110 relative z-10">
                            XYZ.
                        </span>
                        <div className="absolute -bottom-1 left-0 w-full h-2 bg-amber-500 rounded-full shadow-[0_0_15px_#f59e0b] opacity-90 blur-[1px]"></div>
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
             <button onClick={onEnter} className="btn-liquid px-10 py-4 rounded-full font-bold text-xs uppercase tracking-[0.15em] w-full sm:w-auto min-w-[200px]">
                Start Session
             </button>
             
             <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 rounded-full border border-border-main text-text-sec font-bold text-xs uppercase tracking-[0.15em] hover:bg-panel hover:text-text-pri transition-all w-full sm:w-auto">
                How It Works
             </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative z-10 bg-panel/50 border-t border-b border-border-main backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                  <span className="text-accent font-bold text-xs uppercase tracking-[0.2em] mb-4 block">The Architecture</span>
                  <h2 className="text-4xl md:text-5xl font-display font-medium text-text-pri">Engineered for <span className="italic text-text-sec">Retention</span></h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <FeatureCard 
                      icon={<Icons.Brain className="w-6 h-6" />}
                      title="Neural Ingestion" 
                      desc="Upload PDFs, PPTXs, or messy notes. The Professor extracts the core concepts and builds a knowledge graph in seconds."
                      delay="0.1s"
                  />
                  <FeatureCard 
                      icon={<Icons.Swords className="w-6 h-6" />} 
                      title="The Arena" 
                      desc="Multiplayer academic combat. Wager XP against peers in real-time battles generated from your shared materials."
                      delay="0.2s"
                  />
                  <FeatureCard 
                      icon={<Icons.Cap className="w-6 h-6" />}
                      title="Feynman Tutor" 
                      desc="Confused? The AI explains complex topics using analogies from gaming, sports, or pop culture until you get it."
                      delay="0.3s"
                  />
                  <FeatureCard 
                      icon={<Icons.Bolt className="w-6 h-6" />}
                      title="Flash Recall" 
                      desc="Spaced repetition flashcards generated instantly. Master the definitions before tackling the complex logic."
                      delay="0.4s"
                  />
              </div>
          </div>
      </section>

      {/* How It Works */}
      <section className="py-32 px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                  <div className="space-y-12">
                      <div className="relative pl-8 border-l-2 border-border-main group">
                          <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-core border-2 border-text-sec group-hover:border-accent transition-colors"></span>
                          <h3 className="text-2xl font-bold text-text-pri mb-2">1. Ingest Data</h3>
                          <p className="text-text-sec">Drag and drop your lecture slides or textbook chapters. We handle the chaos.</p>
                      </div>
                      <div className="relative pl-8 border-l-2 border-border-main group">
                          <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-core border-2 border-text-sec group-hover:border-accent transition-colors"></span>
                          <h3 className="text-2xl font-bold text-text-pri mb-2">2. Configure Protocol</h3>
                          <p className="text-text-sec">Choose 'Exam Mode' for drilling, 'Professor' for explaining, or 'Arena' for fighting.</p>
                      </div>
                      <div className="relative pl-8 border-l-2 border-border-main group">
                          <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-core border-2 border-text-sec group-hover:border-accent transition-colors"></span>
                          <h3 className="text-2xl font-bold text-text-pri mb-2">3. Achieve Mastery</h3>
                          <p className="text-text-sec">Receive instant grading, 'Verdict' feedback, and track your XP progression over time.</p>
                      </div>
                  </div>
                  
                  <div className="relative aspect-square md:aspect-auto md:h-[500px] bg-panel rounded-3xl border border-border-main shadow-2xl p-8 flex flex-col items-center justify-center text-center overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 to-transparent opacity-50"></div>
                      <div className="mb-6 transform group-hover:scale-110 transition-transform duration-500 text-text-pri">
                          <Icons.DNA className="w-24 h-24" />
                      </div>
                      <div className="font-mono text-xs text-accent uppercase tracking-widest mb-2">System Ready</div>
                      <h4 className="text-3xl font-display font-bold text-text-pri">Transform Chaos into Order.</h4>
                  </div>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-transparent text-center text-text-sec text-xs relative z-10 border-t border-border-main/30">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-2">
                 <div className="w-6 h-6 grayscale opacity-50">
                    <BrandLogo className="w-full h-full text-text-pri" />
                 </div>
                 <span className="font-bold text-text-sec">The Professor</span>
             </div>
             
             <div className="flex flex-col items-center md:items-end gap-2">
                 <div className="flex gap-4 mb-2">
                     <button onClick={() => setShowLegal(true)} className="hover:text-text-pri transition-colors">Legal & Terms</button>
                     <a href="mailto:vexis.automations@gmail.com" className="hover:text-text-pri transition-colors">Support</a>
                 </div>
                 <p className="font-mono uppercase tracking-widest text-accent/50">Copyright The Professor</p>
                 <p className="opacity-50">A sub system of Vexis Automations.</p>
             </div>
         </div>
      </footer>
    </div>
  );
};
