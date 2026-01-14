
import React from 'react';
import { AmbientTheme } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface AmbientBackgroundProps {
  theme: AmbientTheme;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = () => {
  const { isDark } = useTheme();

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-core transition-colors duration-500">
       {/* Liquid Orbs */}
       <div className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] animate-liquid-blob opacity-40 transition-colors duration-1000 ${isDark ? 'bg-indigo-900' : 'bg-blue-200'}`}></div>
       <div className={`absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] animate-liquid-blob opacity-30 transition-colors duration-1000 ${isDark ? 'bg-amber-900' : 'bg-amber-200'}`} style={{ animationDelay: '2s', animationDirection: 'reverse' }}></div>
       
       {/* Texture Overlay */}
       <div className={`absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay`}></div>
    </div>
  );
};
