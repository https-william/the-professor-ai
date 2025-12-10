
import React from 'react';
import { AmbientTheme } from '../types';

interface AmbientBackgroundProps {
  theme: AmbientTheme;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = () => {
  // Forced Theme: Deep Space
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
       {/* Visual Effects */}
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/30 via-black to-black animate-pulse-slow"></div>
       <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
    </div>
  );
};
