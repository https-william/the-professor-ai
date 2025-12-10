
import React, { useState, useEffect, useRef } from 'react';
import { CountdownTimer } from './CountdownTimer';

interface LandingPageProps {
  onEnter: () => void;
}

// Spotlight Effect Component
const SpotlightCard = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-10"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.06), transparent 40%)`,
        }}
      />
      {children}
    </div>
  );
};

// Decrypted Text for Headlines
const DecryptedText = ({ text, className = "", delay = 0 }: { text: string, className?: string, delay?: number }) => {
    const [displayText, setDisplayText] = useState(text.split('').map(() => "0").join(''));
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  
    useEffect(() => {
      let interval: any;
      let iteration = 0;
      
      const startScramble = () => {
        interval = setInterval(() => {
          setDisplayText(prev => 
            text
              .split("")
              .map((letter, index) => {
                if (index < iteration) {
                  return text[index];
                }
                return chars[Math.floor(Math.random() * chars.length)];
              })
              .join("")
          );
    
          if (iteration >= text.length) {
            clearInterval(interval);
          }
          
          iteration += 1 / 2; // Speed of decryption
        }, 30);
      };
      
      const timeout = setTimeout(startScramble, delay);
  
      return () => {
          clearInterval(interval);
          clearTimeout(timeout);
      }
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
      
      {/* Fixed Header: Timer + Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
        {/* Doomsday Timer (Banner) */}
        <CountdownTimer />

        {/* Navigation Bar */}
        <nav className={`w-full transition-all duration-300 ${scrolled > 20 ? 'bg-black/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-4 sm:py-6'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-gray-400 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                <span className="text-sm">🎓</span>
              </div>
              <span className="font-bold text-lg tracking-tight font-serif text-white hidden sm:block">The Professor</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={onEnter} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">Log In</button>
              <button 
                onClick={onEnter}
                className="px-5 py-2 rounded-full bg-white text-black font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                Get Started
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
         {/* Neural Grid */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] sm:bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]"></div>
         
         {/* Floating Glows */}
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-float"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-amber-600/5 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Hero Section - Added padding-top to clear the fixed header */}
      <section className="relative pt-48 sm:pt-60 pb-20 sm:pb-32 px-4 sm:px-6 overflow-hidden min-h-[90vh] flex flex-col justify-center">
        <div className="max-w-7xl mx-auto w-full relative z-10">
          
          {/* The Hook */}
          <div className="mb-8 animate-slide-in opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}>
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all cursor-default group hover:border-blue-500/30">
              <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              <span className="text-xs font-mono text-blue-300 uppercase tracking-widest group-hover:text-blue-200 transition-colors">
                  <DecryptedText text="NEURAL LINK :: ESTABLISHED" delay={500} />
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-8">
            <h1 className="text-5xl sm:text-7xl md:text-9xl font-serif font-bold tracking-tighter leading-[0.9] text-white mix-blend-difference">
               ACADEMIC
               <br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-600">
                  <DecryptedText text="WEAPON." delay={800} />
               </span>
            </h1>
            <div className="mb-2 md:mb-8 animate-fade-in opacity-0 w-full md:w-auto" style={{ animationFillMode: 'forwards', animationDelay: '1.2s' }}>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-mono text-green-400 uppercase">System Online</span>
                </div>
                <p className="max-w-md text-gray-400 text-sm leading-relaxed border-l border-white/20 pl-4">
                    Transform passive reading into active mastery. 
                    The Professor dissects your materials and reconstructs them into high-yield exams.
                </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-slide-up-fade" style={{ animationDelay: '0.3s' }}>
             <button 
               onClick={onEnter}
               className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-sm uppercase tracking-widest overflow-hidden transition-transform active:scale-95 w-full sm:w-auto text-center"
             >
                <span className="relative z-10 group-hover:text-white transition-colors">Start Session</span>
                <div className="absolute inset-0 bg-blue-600 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
             </button>
             
             <div className="flex items-center justify-center gap-4 px-6 py-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm w-full sm:w-auto">
                <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full bg-gray-700 border border-black ring-1 ring-white/10"></div>
                    ))}
                </div>
                <span className="text-xs text-gray-400 font-mono"><DecryptedText text="2,400+ Students Active" delay={1500} /></span>
             </div>
          </div>

        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 relative z-10 bg-[#050505] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 sm:mb-16">
            <span className="text-blue-500 font-mono text-xs uppercase tracking-widest mb-2 block">Capabilities</span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold">Neural Architecture</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 auto-rows-[250px]">
            
            {/* Feature 1: Upload (Large) */}
            <SpotlightCard className="md:col-span-3 lg:col-span-8 glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-white/5 to-transparent border-white/10 group">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500">
                    📄
                </div>
                <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Universal Ingestion</h3>
                    <p className="text-gray-400 text-sm sm:text-base max-w-md">PDFs, DOCX, Images, or raw text. The Professor consumes it all and structures chaos into curriculum.</p>
                </div>
                <div className="absolute right-0 top-0 w-64 h-full bg-grid opacity-20 mask-image-l-to-r"></div>
            </SpotlightCard>

            {/* Feature 2: Oracle (Tall) */}
            <SpotlightCard className="md:col-span-3 lg:col-span-4 row-span-2 glass-panel rounded-3xl p-6 sm:p-8 bg-amber-900/5 border-amber-500/10 flex flex-col relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center text-3xl mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                        🔮
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-amber-100 mb-4">The Oracle</h3>
                    <p className="text-amber-500/60 text-sm sm:text-base leading-relaxed mb-8">
                        Predictive algorithms analyze your content to forecast probable exam questions. It's not magic, it's pattern recognition at scale.
                    </p>
                    <div className="space-y-3">
                        {['Lateral Thinking', 'Pattern Matching', 'Historical Context'].map((tag) => (
                            <div key={tag} className="flex items-center gap-3 text-xs font-mono text-amber-300/50 uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                {tag}
                            </div>
                        ))}
                    </div>
                </div>
            </SpotlightCard>

            {/* Feature 3: Nightmare Mode */}
            <SpotlightCard className="md:col-span-3 lg:col-span-4 glass-panel rounded-3xl p-6 sm:p-8 bg-gradient-to-tr from-red-900/10 to-transparent border-red-500/10 hover:border-red-500/30 transition-colors">
                <div className="flex justify-between items-start mb-auto">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-2xl">💀</div>
                    <span className="bg-red-500/20 text-red-400 text-[10px] font-bold uppercase px-2 py-1 rounded">Extreme</span>
                </div>
                <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Nightmare Mode</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">Edge cases and trap answers designed to break you.</p>
                </div>
            </SpotlightCard>

            {/* Feature 4: Professor Mode */}
            <SpotlightCard className="md:col-span-3 lg:col-span-4 glass-panel rounded-3xl p-6 sm:p-8 bg-gradient-to-tr from-green-900/10 to-transparent border-green-500/10 hover:border-green-500/30 transition-colors">
                 <div className="flex justify-between items-start mb-auto">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-2xl">👨‍🏫</div>
                    <span className="bg-green-500/20 text-green-400 text-[10px] font-bold uppercase px-2 py-1 rounded">Tutor</span>
                </div>
                <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Feynman Tutor</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">Simplification engine using analogies from Pop Culture to Engineering.</p>
                </div>
            </SpotlightCard>
            
            {/* Feature 5: Voice */}
             <SpotlightCard className="md:col-span-6 lg:col-span-4 glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-center items-center text-center bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl mb-4 animate-pulse">
                    🎙️
                </div>
                <h3 className="text-lg font-bold">Audio Lectures</h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">Text-to-Speech Enabled</p>
             </SpotlightCard>

          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 relative z-10 bg-black">
        <div className="max-w-7xl mx-auto">
           <div className="flex flex-col md:flex-row justify-between items-end mb-12 sm:mb-16 gap-8">
             <div>
                 <span className="text-blue-500 font-mono text-xs uppercase tracking-widest mb-2 block">FIRST MONTH FREE</span>
                 <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white">Full Access. Zero Cost.</h2>
             </div>
             <p className="text-gray-400 max-w-xs text-right hidden md:block">
                 All tiers unlocked until Jan 10. No credit card required.
             </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch">
             {/* The Fresher */}
             <div className="glass-panel p-6 sm:p-8 rounded-3xl border-gray-800 bg-gray-900/20 flex flex-col hover:border-gray-600 transition-colors duration-300 opacity-60 grayscale">
                <h3 className="text-xl font-bold mb-2 text-gray-300">The Fresher</h3>
                <div className="text-4xl font-mono font-bold mb-4 text-white">Free</div>
                <ul className="space-y-4 mb-8 flex-1">
                   <li className="flex gap-3 text-sm text-gray-400"><span className="text-white">✓</span> 3 Quizzes / Day</li>
                   <li className="flex gap-3 text-sm text-gray-400"><span className="text-white">✓</span> Text Paste Only</li>
                </ul>
                <button disabled className="w-full py-4 rounded-xl border border-white/10 text-gray-500 font-bold text-xs uppercase tracking-widest cursor-not-allowed">Standard</button>
             </div>

             {/* The Scholar */}
             <div className="glass-panel p-6 sm:p-8 rounded-3xl border-blue-500/50 bg-blue-900/10 relative transform md:-translate-y-4">
                <div className="absolute top-0 right-0 p-4">
                    <span className="bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">Unlocked</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-blue-300">The Scholar</h3>
                <div className="text-4xl font-mono font-bold mb-1 text-white">FREE</div>
                <div className="text-xs text-gray-500 mb-6 uppercase tracking-widest line-through decoration-red-500">₦2,000 / Mo</div>
                <ul className="space-y-4 mb-8 flex-1">
                   <li className="flex gap-3 text-sm text-gray-300"><span className="text-blue-400">✓</span> Unlimited Quizzes</li>
                   <li className="flex gap-3 text-sm text-gray-300"><span className="text-blue-400">✓</span> PDF Uploads</li>
                   <li className="flex gap-3 text-sm text-gray-300"><span className="text-blue-400">✓</span> Chat with Notes</li>
                </ul>
                <button onClick={onEnter} className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]">Enter Now</button>
             </div>

             {/* Excellentia Supreme */}
             <div className="glass-panel p-6 sm:p-8 rounded-3xl border-amber-500/30 bg-amber-900/10 flex flex-col relative overflow-hidden group hover:border-amber-500/60 transition-colors">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/20 blur-3xl rounded-full pointer-events-none group-hover:bg-amber-500/30 transition-colors"></div>
                <div className="absolute top-0 right-0 p-4 z-20">
                    <span className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded animate-pulse">Free</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-amber-200 flex items-center gap-2">
                   Excellentia
                   <span className="text-[10px] border border-amber-500 text-amber-500 px-1.5 rounded uppercase">Supreme</span>
                </h3>
                <div className="text-4xl font-mono font-bold mb-1 text-white">FREE</div>
                <div className="text-xs text-gray-500 mb-6 uppercase tracking-widest line-through decoration-red-500">₦5,000 / Mo</div>
                <ul className="space-y-4 mb-8 flex-1 relative z-10">
                   <li className="flex gap-3 text-sm text-amber-100/80"><span className="text-amber-500">✦</span> The Oracle AI</li>
                   <li className="flex gap-3 text-sm text-amber-100/80"><span className="text-amber-500">✦</span> Weakness Destroyer</li>
                   <li className="flex gap-3 text-sm text-amber-100/80"><span className="text-amber-500">✦</span> Voice Mode</li>
                </ul>
                <button onClick={onEnter} className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-700 to-orange-700 hover:brightness-110 text-white font-bold text-xs uppercase tracking-widest transition-all relative z-10">Claim God Mode</button>
             </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center">
         <p className="text-gray-600 text-xs font-mono">
            &copy; {new Date().getFullYear()} THE PROFESSOR AI. SYSTEM VERSION 2.0.
         </p>
      </footer>
    </div>
  );
};
