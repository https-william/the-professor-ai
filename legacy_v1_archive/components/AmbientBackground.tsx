
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

      {/* Texture Overlay - Using inline noise pattern instead of external URL */}
      <div className={`absolute top-0 left-0 w-full h-full opacity-5 mix-blend-overlay`} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }}></div>
    </div>
  );
};
