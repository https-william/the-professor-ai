
import React from 'react';

export const BrandLogo: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor">
    {/* The Synapse Cap - Isometric Design */}
    
    {/* 1. The Mortarboard (Diamond Structure) */}
    {/* Thick confident strokes, no fill to emphasize structure */}
    <path 
      d="M50 20 L90 45 L50 70 L10 45 Z" 
      strokeWidth="4" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="text-text-pri"
    />
    
    {/* 2. The Neural Core (Center Intelligence) */}
    {/* A hexagon representing the AI chip inside the cap */}
    <path 
      d="M50 35 L60 40 L60 50 L50 55 L40 50 L40 40 Z" 
      fill="currentColor" 
      className="text-accent animate-pulse-slow"
      fillOpacity="0.8"
    />
    
    {/* 3. The Cap Base (Structure underneath) */}
    <path 
      d="M25 55 V75 C25 85 75 85 75 75 V55" 
      strokeWidth="3" 
      strokeLinecap="round" 
      className="text-text-pri opacity-50"
    />
    
    {/* 4. The Neural Tassel (Data Stream) */}
    {/* Instead of a string, it's a circuit line connecting to a node */}
    <path 
      d="M50 45 C70 45 80 55 85 75" 
      strokeWidth="2" 
      strokeDasharray="4 2"
      className="text-accent opacity-80"
    />
    <circle cx="85" cy="75" r="4" fill="currentColor" className="text-accent" />
    
  </svg>
);
