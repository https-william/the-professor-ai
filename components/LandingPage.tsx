
import React, { useState, useEffect } from 'react';
import { CountdownTimer } from './CountdownTimer';
import { BrandLogo } from './BrandLogo';

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
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden font-sans selection:bg-blue-500/30">
      
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-900/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
        <CountdownTimer />
        <nav className={`w-full transition-all duration-300 ${scrolled > 20 ? 'bg-black/80 backdrop-blur-xl border-b border-white/5 py-3' : 'bg-transparent py-4 sm:py-6'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10">
                <BrandLogo />
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
      <section className="relative pt-40 sm:pt-48 pb-20 px-4 sm:px-6 min-h-[90vh] flex flex-col justify-center items-center text-center z-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 animate-slide-in opacity-0 flex justify-center" style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}>
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all cursor-default group hover:border-blue-500/30">
              <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>
              <span className="text-xs font-mono text-blue-300 uppercase tracking-widest group-hover:text-blue-200 transition-colors"><DecryptedText text="SYSTEM ONLINE :: READY" delay={500} /></span>
            </div>
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-9xl font-serif font-bold tracking-tighter leading-[0.9] text-white mix-blend-difference mb-8">
             Learning is<br />
             <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mt-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500">Simple as</span>
                
                <div className="relative inline-flex items-center group">
                    {/* The Crossed Out ABC */}
                    <div className="relative mr-4 sm:mr-6 transform rotate-[-6deg] opacity-40 group-hover:opacity-60 transition-opacity">
                        <span className="text-4xl sm:text-6xl font-mono text-gray-500 line-through decoration-red-600 decoration-[4px]">ABC</span>
                    </div>

                    {/* The Hero XYZ */}
                    <span className="text-blue-500 relative inline-block transform group-hover:scale-110 transition-transform duration-500">
                        XYZ.
                        {/* Glowing Underline */}
                        <div className="absolute -bottom-1 sm:-bottom-4 left-0 w-full h-1 sm:h-2 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.8)]"></div>
                    </span>
                </div>
             </div>
          </h1>
          
          <div className="mb-10 animate-fade-in opacity-0 max-w-2xl mx-auto" style={{ animationFillMode: 'forwards', animationDelay: '1.2s' }}>
              <p className="text-gray-400 text-lg sm:text-xl leading-relaxed">
                  Stop reading passive notes. Start learning actively. Upload your files and let the AI build your personal tutor and examiner.
              </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up-fade" style={{ animationDelay: '0.3s' }}>
             <button onClick={onEnter} className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-sm uppercase tracking-widest overflow-hidden transition-transform active:scale-95 w-full sm:w-auto text-center min-w-[200px]">
                <span className="relative z-10 group-hover:text-white transition-colors">Start Session</span>
                <div className="absolute inset-0 bg-blue-600 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
             </button>
             <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 rounded-full border border-white/20 text-white font-bold text-sm uppercase tracking-widest hover:bg-white/5 transition-all w-full sm:w-auto">
                How It Works
             </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 relative z-10 border-t border-white/5 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-20">
                  <h2 className="text-4xl md:text-5xl font-bold font-serif mb-4">Learn Faster. Remember Longer.</h2>
                  <p className="text-gray-400 max-w-2xl mx-auto">We use proven study techniques to hack your brain's memory.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-amber-500/30 transition-all group">
                      <div className="text-4xl mb-6 text-amber-500 group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-white">Hard Mode Exams</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">The AI generates questions that trick you on purpose. If you can pass this, you can pass the real thing.</p>
                  </div>
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all group">
                      <div className="text-4xl mb-6 text-blue-500 group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-white">Simple Explanations</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">Confused? The Professor explains complex topics using analogies from sports, movies, or games.</p>
                  </div>
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all group">
                      <div className="text-4xl mb-6 text-purple-500 group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-white">Battle Your Friends</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">Don't study alone. Challenge your classmates to a quiz duel. Winner takes the glory.</p>
                  </div>
              </div>
          </div>
      </section>

      {/* Philosophy / About Section */}
      <section className="py-32 relative z-10 border-t border-white/5 bg-black overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold font-serif mb-8 text-white">The Unfair Advantage.</h2>
              <div className="prose prose-invert prose-lg mx-auto text-gray-400 leading-relaxed space-y-6">
                  <p>
                      Your textbooks are static. Your exams are dynamic. <span className="text-white font-bold">The Professor</span> bridges the gap.
                  </p>
                  <p>
                      We don't just highlight text; we transform it into a relentless training ground. 
                      By simulating the pressure of a real exam environment, we force your brain to engage in <span className="text-blue-400">Active Recall</span> rather than passive reading.
                  </p>
                  <p>
                      Identify weak points. Strengthen neural pathways. Walk into the exam hall knowing you've already won.
                  </p>
              </div>
              
              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-colors">
                      <div className="text-xl font-mono font-bold text-white mb-1">Active Recall</div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-500">Core Protocol</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-colors">
                      <div className="text-xl font-mono font-bold text-blue-400 mb-1">Detected</div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-500">Knowledge Gaps</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-amber-500/30 transition-colors">
                      <div className="text-xl font-mono font-bold text-amber-500 mb-1">Maximized</div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-500">Retention Rate</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-colors">
                      <div className="text-xl font-mono font-bold text-purple-400 mb-1">Operational</div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-500">System Status</div>
                  </div>
              </div>
          </div>
      </section>

      {/* Pricing / Access */}
      <section className="py-32 relative z-10 border-t border-white/5 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-6 text-center">
              <h2 className="text-4xl md:text-5xl font-bold font-serif mb-16">Simple Pricing</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                  {/* Fresher Tier */}
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/5 flex flex-col hover:border-gray-500/50 transition-colors">
                      <h3 className="text-lg font-bold text-gray-400 uppercase tracking-widest mb-4">Fresher</h3>
                      <div className="text-4xl font-bold text-white mb-6">Free</div>
                      <ul className="text-sm text-gray-400 space-y-3 mb-8 text-left mx-auto max-w-[220px] flex-1">
                          <li>• 3 Quizzes / Day</li>
                          <li>• 2 Duels / Day</li>
                          <li>• 1 PDF, 2 Images / Day</li>
                          <li>• Standard Speed (Queue)</li>
                          <li>• 1 Lock-In Session</li>
                      </ul>
                      <button onClick={onEnter} className="w-full py-3 rounded-xl border border-white/20 text-white font-bold text-xs uppercase hover:bg-white/10 transition-all">Start Free</button>
                  </div>

                  {/* Scholar Tier */}
                  <div className="p-10 rounded-3xl bg-blue-900/10 border border-blue-500/50 relative transform md:scale-105 shadow-[0_0_30px_rgba(37,99,235,0.2)] flex flex-col z-10">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">Popular</div>
                      <h3 className="text-lg font-bold text-blue-400 uppercase tracking-widest mb-4">Scholar</h3>
                      <div className="text-5xl font-bold text-white mb-2">₦2,000</div>
                      <div className="text-xs text-gray-500 mb-6">/ month</div>
                      <ul className="text-sm text-gray-300 space-y-3 mb-8 text-left mx-auto max-w-[220px] flex-1">
                          <li className="flex items-center gap-2"><span className="text-blue-500">✓</span> 10 Exams / Day</li>
                          <li className="flex items-center gap-2"><span className="text-blue-500">✓</span> 10 Files Upload / Day</li>
                          <li className="flex items-center gap-2"><span className="text-blue-500">✓</span> War Room (Lock-In)</li>
                          <li className="flex items-center gap-2"><span className="text-blue-500">✓</span> Unlimited Duels</li>
                      </ul>
                      <button onClick={onEnter} className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase hover:bg-blue-500 transition-all shadow-lg">Select Plan</button>
                  </div>

                  {/* Excellentia Tier - Rebranded from Supreme */}
                  <div className="p-8 rounded-3xl bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#2a2a2a] via-[#0f0f0f] to-black border border-[#D4AF37]/50 flex flex-col hover:border-[#D4AF37] transition-all duration-500 shadow-[0_0_20px_rgba(212,175,55,0.1)] group">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#D4AF37] to-[#B59410] text-black text-[10px] font-bold uppercase px-4 py-1 rounded-full shadow-lg">VIP Access</div>
                      <h3 className="text-2xl font-black text-[#D4AF37] uppercase tracking-widest mb-4 font-serif">Excellentia</h3>
                      <div className="text-4xl font-bold text-white mb-6">₦5,000</div>
                      <ul className="text-sm text-gray-400 space-y-3 mb-8 text-left mx-auto max-w-[220px] flex-1">
                          <li className="flex items-center gap-2"><span className="text-[#D4AF37]">★</span> Unlimited Everything</li>
                          <li className="flex items-center gap-2"><span className="text-[#D4AF37]">★</span> Nightmare Difficulty</li>
                          <li className="flex items-center gap-2"><span className="text-[#D4AF37]">★</span> The Oracle (Predictive)</li>
                          <li className="flex items-center gap-2"><span className="text-[#D4AF37]">★</span> Priority Access (No Queue)</li>
                      </ul>
                      <button onClick={onEnter} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#8C7323] text-black font-bold text-xs uppercase hover:scale-[1.02] transition-all shadow-lg shadow-[#D4AF37]/20">Go Supreme</button>
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
                 <span className="font-bold text-gray-500">The Professor AI</span>
             </div>
             
             <div className="flex flex-col items-center md:items-end gap-1">
                 <p className="font-mono uppercase tracking-widest text-amber-500/50">Copyright The Professor AI</p>
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
