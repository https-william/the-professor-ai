
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

// The Brand Logo Component - Free Floating (No Background Rect)
const BrandLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
    <defs>
      <linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' style={{stopColor:'#3b82f6', stopOpacity:1}} />
        <stop offset='100%' style={{stopColor:'#8b5cf6', stopOpacity:1}} />
      </linearGradient>
    </defs>
    {/* Removed Background Rect */}
    <path d='M15 45 L50 25 L85 45 L50 65 Z' fill='url(#grad)' stroke='#ffffff' strokeWidth='2'/>
    <path d='M85 45 V70' stroke='#f59e0b' strokeWidth='3' strokeLinecap='round'/>
    <circle cx='85' cy='75' r='5' fill='#f59e0b'/>
    <path d='M30 55 V75 C30 85 70 85 70 75 V55' fill='none' stroke='white' strokeWidth='2'/>
    <circle cx='50' cy='45' r='5' fill='#fff'/>
  </svg>
);

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
              <span className="text-xs font-mono text-blue-300 uppercase tracking-widest group-hover:text-blue-200 transition-colors"><DecryptedText text="NEURAL LINK :: ESTABLISHED" delay={500} /></span>
            </div>
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-9xl font-serif font-bold tracking-tighter leading-[0.9] text-white mix-blend-difference mb-8">
             ACADEMIC<br />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500"><DecryptedText text="WEAPON." delay={800} /></span>
          </h1>
          
          <div className="mb-10 animate-fade-in opacity-0 max-w-2xl mx-auto" style={{ animationFillMode: 'forwards', animationDelay: '1.2s' }}>
              <p className="text-gray-400 text-lg sm:text-xl leading-relaxed">
                  Stop reading. Start accelerating. The Professor transforms static lecture notes into interactive mastery using military-grade active recall.
              </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up-fade" style={{ animationDelay: '0.3s' }}>
             <button onClick={onEnter} className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-sm uppercase tracking-widest overflow-hidden transition-transform active:scale-95 w-full sm:w-auto text-center min-w-[200px]">
                <span className="relative z-10 group-hover:text-white transition-colors">Start Session</span>
                <div className="absolute inset-0 bg-blue-600 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
             </button>
             <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 rounded-full border border-white/20 text-white font-bold text-sm uppercase tracking-widest hover:bg-white/5 transition-all w-full sm:w-auto">
                Explore Logic
             </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 relative z-10 border-t border-white/5 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-20">
                  <h2 className="text-4xl md:text-5xl font-bold font-serif mb-4">Architect Your Mind</h2>
                  <p className="text-gray-400 max-w-2xl mx-auto">Standard studying is passive. We make it aggressive.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-amber-500/30 transition-all group">
                      <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">🔥</div>
                      <h3 className="text-xl font-bold mb-3 text-white">Nightmare Difficulty</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">Most apps test if you remember. We test if you understand. Our AI generates distractors so convincing they'll make you second-guess your own name.</p>
                  </div>
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all group">
                      <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">⚛️</div>
                      <h3 className="text-xl font-bold mb-3 text-white">Feynman Protocol</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">Complexity is the enemy. The Professor explains advanced concepts using analogies from gaming, sports, or pop culture until it clicks.</p>
                  </div>
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all group">
                      <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">⚔️</div>
                      <h3 className="text-xl font-bold mb-3 text-white">The Arena</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">Studying is lonely. War is not. Challenge peers to real-time academic duels. Wager XP. Winner takes all.</p>
                  </div>
              </div>
          </div>
      </section>

      {/* How It Works */}
      <section className="py-32 relative z-10 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                  <div>
                      <h2 className="text-4xl md:text-5xl font-bold font-serif mb-8 leading-tight">From Chaos to <span className="text-blue-500">Curriculum</span>.</h2>
                      <div className="space-y-8">
                          <div className="flex gap-4">
                              <div className="w-10 h-10 rounded-full bg-blue-900/20 border border-blue-500/20 flex items-center justify-center font-mono font-bold text-blue-400">01</div>
                              <div>
                                  <h4 className="text-lg font-bold text-white mb-2">Upload Intel</h4>
                                  <p className="text-gray-400 text-sm">Drag and drop PDFs, slides, or raw notes. Our vision models scan diagrams and handwriting instantly.</p>
                              </div>
                          </div>
                          <div className="flex gap-4">
                              <div className="w-10 h-10 rounded-full bg-amber-900/20 border border-amber-500/20 flex items-center justify-center font-mono font-bold text-amber-400">02</div>
                              <div>
                                  <h4 className="text-lg font-bold text-white mb-2">Configure Protocol</h4>
                                  <p className="text-gray-400 text-sm">Select your pain tolerance. Cram Mode for speed, Deep Dive for retention, or Lock-In for pure focus.</p>
                              </div>
                          </div>
                          <div className="flex gap-4">
                              <div className="w-10 h-10 rounded-full bg-green-900/20 border border-green-500/20 flex items-center justify-center font-mono font-bold text-green-400">03</div>
                              <div>
                                  <h4 className="text-lg font-bold text-white mb-2">Execute</h4>
                                  <p className="text-gray-400 text-sm">Engage with generated exams, flashcards, and Socratic tutoring. Track your dominance on the leaderboard.</p>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-[100px] opacity-20"></div>
                      <div className="bg-black/40 border border-white/10 backdrop-blur-xl rounded-3xl p-8 relative">
                          <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          </div>
                          <div className="space-y-4 font-mono text-sm">
                              <div className="text-gray-500">> Initiating Neural Scan...</div>
                              <div className="text-blue-400">> parsing_vector_space: 100%</div>
                              <div className="text-gray-300">
                                  <span className="text-purple-400">user:</span> Explain Quantum Entanglement like I'm 5.
                              </div>
                              <div className="text-gray-300">
                                  <span className="text-amber-400">professor:</span> Imagine two magic dice. No matter how far apart they are—even across the galaxy—if you roll a 6 on one, the other INSTANTLY shows a 6. They are spooky soulmates.
                              </div>
                              <div className="h-4 w-2 bg-blue-500 animate-pulse"></div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Pricing / Access */}
      <section className="py-32 relative z-10 border-t border-white/5 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-6 text-center">
              <h2 className="text-4xl md:text-5xl font-bold font-serif mb-16">Tuition Fees</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                  {/* Free Tier */}
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
                      <h3 className="text-lg font-bold text-gray-400 uppercase tracking-widest mb-4">Fresher</h3>
                      <div className="text-4xl font-bold text-white mb-6">Free</div>
                      <ul className="text-sm text-gray-400 space-y-3 mb-8 text-left mx-auto max-w-[200px]">
                          <li>• 3 Quizzes / Day</li>
                          <li>• Standard Speed</li>
                          <li>• Text Upload Only</li>
                      </ul>
                      <button onClick={onEnter} className="w-full py-3 rounded-xl border border-white/20 text-white font-bold text-xs uppercase hover:bg-white/10 transition-all">Audit Class</button>
                  </div>

                  {/* Pro Tier - Highlighted */}
                  <div className="p-10 rounded-3xl bg-blue-900/10 border border-blue-500/50 relative transform md:scale-110 shadow-2xl">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Most Popular</div>
                      <h3 className="text-lg font-bold text-blue-400 uppercase tracking-widest mb-4">Scholar</h3>
                      <div className="text-5xl font-bold text-white mb-2">₦2,000</div>
                      <div className="text-xs text-gray-500 mb-6">/ month</div>
                      <ul className="text-sm text-gray-300 space-y-3 mb-8 text-left mx-auto max-w-[200px]">
                          <li>• Unlimited Generation</li>
                          <li>• PDF & Image Analysis</li>
                          <li>• War Room Access</li>
                          <li>• Priority Processing</li>
                      </ul>
                      <button onClick={onEnter} className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase hover:bg-blue-500 transition-all shadow-lg">Enlist Now</button>
                  </div>

                  {/* Elite Tier */}
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
                      <h3 className="text-lg font-bold text-amber-500 uppercase tracking-widest mb-4">Supreme</h3>
                      <div className="text-4xl font-bold text-white mb-6">₦5,000</div>
                      <ul className="text-sm text-gray-400 space-y-3 mb-8 text-left mx-auto max-w-[200px]">
                          <li>• God Mode (Nightmare)</li>
                          <li>• The Oracle AI</li>
                          <li>• Voice Interface</li>
                          <li>• 1-on-1 Tutoring</li>
                      </ul>
                      <button onClick={onEnter} className="w-full py-3 rounded-xl border border-white/20 text-white font-bold text-xs uppercase hover:bg-white/10 transition-all">Apply</button>
                  </div>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-black text-center text-gray-600 text-xs">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
             <div className="flex items-center gap-2 mb-4 md:mb-0">
                 <div className="w-6 h-6 grayscale opacity-50">
                    <BrandLogo />
                 </div>
                 <span className="font-bold text-gray-500">The Professor</span>
             </div>
             <div className="flex flex-col items-center md:items-end">
                 <p className="font-mono uppercase tracking-widest text-amber-500/50">Vexis Automations © 2025</p>
                 <p className="mt-1 opacity-30">Part of the Vexis Portfolio.</p>
             </div>
         </div>
      </footer>
    </div>
  );
};
