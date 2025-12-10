
import React from 'react';
import { AmbientTheme } from '../types';

interface AmbientBackgroundProps {
  theme: AmbientTheme;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ theme }) => {
  if (!theme || theme === 'None') return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-1000">
       {/* Overlay Tint */}
       <div className={`absolute inset-0 opacity-60 mix-blend-overlay ${
         theme === 'Rainy Library' ? 'bg-blue-950' :
         theme === 'Cyberpunk Lab' ? 'bg-fuchsia-950' :
         theme === 'Cabin' ? 'bg-orange-950' :
         'bg-black'
       }`}></div>

       {/* Visual Effects */}
       {theme === 'Rainy Library' && (
         <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/t7Qb8655Z1AoQEypIt/giphy.gif')] opacity-10 bg-cover mix-blend-screen pointer-events-none"></div>
       )}
       
       {theme === 'Cyberpunk Lab' && (
         <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-500/50 blur-[4px] animate-[slideIn_5s_linear_infinite]"></div>
            <div className="absolute bottom-0 right-0 w-full h-[2px] bg-magenta-500/50 blur-[4px] animate-[slideIn_7s_linear_infinite_reverse]"></div>
            <div className="absolute inset-0 bg-[linear-gradient(transparent_2px,rgba(0,0,0,0.5)_2px)] bg-[size:100%_4px]"></div>
         </div>
       )}

       {theme === 'Cabin' && (
           <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-orange-500/10 to-transparent animate-pulse-slow"></div>
       )}
       
       {theme === 'Deep Space' && (
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black animate-pulse-slow"></div>
       )}
    </div>
  );
};
