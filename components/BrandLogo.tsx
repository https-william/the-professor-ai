
import React from 'react';

export const BrandLogo: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor">
    {/* 1. The Cap Top (Diamond) */}
    <path 
      d="M50 25 L85 45 L50 65 L15 45 Z" 
      strokeWidth="4" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="text-text-pri fill-black/20"
    />
    
    {/* 2. The Cap Base */}
    <path 
      d="M25 52 V70 C25 80 75 80 75 70 V52" 
      strokeWidth="3" 
      strokeLinecap="round" 
      className="text-text-pri opacity-50"
    />
    
    {/* 3. The Tassel Button */}
    <circle cx="50" cy="45" r="3" fill="#fbbf24" stroke="none" />
    
    {/* 4. The Iconic Tassel (Hanging right) */}
    <path 
      d="M50 45 C55 45 75 48 85 65" 
      strokeWidth="2" 
      stroke="#f59e0b"
      strokeLinecap="round"
      className="drop-shadow-md"
    />
    {/* Tassel Fringe */}
    <path 
        d="M85 65 L82 75 M85 65 L85 78 M85 65 L88 75"
        strokeWidth="1.5"
        stroke="#f59e0b"
    />
    
    {/* 5. Neural Core Glow (Subtle Center) */}
    <circle cx="50" cy="45" r="10" className="animate-pulse-slow stroke-blue-500 opacity-30" strokeWidth="1" />
  </svg>
);
