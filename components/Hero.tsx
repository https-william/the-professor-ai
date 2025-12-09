import React, { useEffect, useState } from 'react';

export const Hero: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="text-center py-16 px-4 sm:px-6 lg:px-8 relative z-10 animate-fade-in overflow-hidden">
      
      {/* Parallax Background Elements */}
      <div 
        className="absolute top-0 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none transition-transform duration-75 ease-out will-change-transform"
        style={{ transform: `translateY(${scrollY * 0.2}px)` }}
      ></div>
      <div 
        className="absolute bottom-20 right-10 w-48 h-48 bg-amber-500/5 rounded-full blur-[50px] pointer-events-none transition-transform duration-75 ease-out will-change-transform"
        style={{ transform: `translateY(-${scrollY * 0.3}px)` }}
      ></div>

      <div className="inline-flex items-center justify-center p-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md micro-interact cursor-default">
        <span className="px-3 py-1 text-xs font-bold text-blue-300 uppercase tracking-widest">AI Academic Accelerator</span>
      </div>
      
      <h1 className="text-6xl sm:text-8xl font-bold tracking-tight text-white mb-6 font-serif tracking-tight relative z-10">
        The
        <span className="relative inline-block mx-4">
          <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-white to-blue-300 animate-shimmer bg-[length:200%_auto]">
            Professor
          </span>
          <div className="absolute -inset-2 bg-blue-500/20 blur-xl rounded-full opacity-50 z-0"></div>
        </span>
      </h1>
      
      <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-400 leading-relaxed font-light relative z-10">
        Transform static materials into <span className="text-white font-medium">mastery</span>. 
        <br className="hidden sm:block"/>
        Upload content. Get drilled. Learn faster.
      </p>
    </div>
  );
};