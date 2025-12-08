
import React, { useState, useEffect } from 'react';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [scrolled, setScrolled] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-noise opacity-[0.05]"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled > 50 ? 'bg-black/80 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-white/10">
              <span className="text-xl">🎓</span>
            </div>
            <span className="font-bold text-xl tracking-tight">The Professor</span>
          </div>
          <button 
            onClick={onEnter}
            className="px-6 py-2.5 rounded-full bg-white/10 border border-white/10 hover:bg-white hover:text-black transition-all font-bold text-xs uppercase tracking-widest backdrop-blur-sm"
          >
            Student Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm animate-fade-in">
             <span className="text-blue-400 font-mono text-xs uppercase tracking-wider">AI-Powered Academic Acceleration</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-bold tracking-tight mb-8 leading-[0.9]">
            <span className="block animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>The Syllabus</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-gray-200 via-white to-gray-400 animate-slide-up-fade" style={{ animationDelay: '0.2s' }}>Has Changed.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-xl text-gray-400 font-light leading-relaxed mb-12 animate-slide-up-fade" style={{ animationDelay: '0.3s' }}>
            Turn your messy notes into perfect exams. <br />
            <span className="text-white font-medium">Study smarter, not harder.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-slide-up-fade" style={{ animationDelay: '0.4s' }}>
            <button 
              onClick={onEnter}
              className="px-10 py-5 bg-white text-black rounded-full font-bold text-sm uppercase tracking-widest hover:scale-105 hover:bg-gray-100 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            >
              Begin Acceleration
            </button>
            <button className="px-10 py-5 rounded-full font-bold text-sm uppercase tracking-widest border border-white/20 hover:bg-white/5 transition-all">
              View Demo
            </button>
          </div>
        </div>

        {/* Abstract Visual */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-b from-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none z-0"></div>
      </section>

      {/* Feature Grid */}
      <section className="py-32 px-6 relative z-10 bg-black/50 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-panel p-8 rounded-3xl hover:border-blue-500/30 transition-colors group">
              <div className="w-12 h-12 bg-blue-900/20 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">⚡</div>
              <h3 className="text-xl font-bold mb-3">Instant Quizzes</h3>
              <p className="text-gray-400 leading-relaxed">
                Upload any PDF or DOCX. In seconds, receive a comprehensive exam tailored to your difficulty level.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-panel p-8 rounded-3xl hover:border-amber-500/30 transition-colors group">
              <div className="w-12 h-12 bg-amber-900/20 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">👨‍🏫</div>
              <h3 className="text-xl font-bold mb-3">Professor Mode</h3>
              <p className="text-gray-400 leading-relaxed">
                Confused? The AI Professor explains complex topics using the Feynman Technique and analogies you actually get.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-panel p-8 rounded-3xl hover:border-purple-500/30 transition-colors group">
              <div className="w-12 h-12 bg-purple-900/20 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">💀</div>
              <h3 className="text-xl font-bold mb-3">Nightmare Difficulty</h3>
              <p className="text-gray-400 leading-relaxed">
                Prepare for the worst. Our edge-case engine generates questions designed to break your confidence (and then build it back up).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats / Social Proof */}
      <section className="py-20 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-around text-center gap-12">
           <div>
             <div className="text-4xl md:text-5xl font-mono font-bold mb-2">10k+</div>
             <div className="text-gray-500 text-xs uppercase tracking-widest">Exams Generated</div>
           </div>
           <div>
             <div className="text-4xl md:text-5xl font-mono font-bold mb-2">98%</div>
             <div className="text-gray-500 text-xs uppercase tracking-widest">Pass Rate</div>
           </div>
           <div>
             <div className="text-4xl md:text-5xl font-mono font-bold mb-2">24/7</div>
             <div className="text-gray-500 text-xs uppercase tracking-widest">AI Availability</div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 text-center text-gray-600 text-sm">
        <div className="flex justify-center gap-6 mb-8">
           <a href="#" className="hover:text-white transition-colors">Terms</a>
           <a href="#" className="hover:text-white transition-colors">Privacy</a>
           <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
        <p>&copy; {new Date().getFullYear()} The Professor AI. All rights reserved.</p>
      </footer>
    </div>
  );
};
