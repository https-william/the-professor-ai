
import React from 'react';

export const BrandLogo: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' style={{stopColor:'#3b82f6', stopOpacity:1}} />
        <stop offset='100%' style={{stopColor:'#8b5cf6', stopOpacity:1}} />
      </linearGradient>
    </defs>
    <path d='M15 45 L50 25 L85 45 L50 65 Z' fill='url(#grad)' stroke='#ffffff' strokeWidth='2'/>
    <path d='M85 45 V70' stroke='#f59e0b' strokeWidth='3' strokeLinecap='round'/>
    <circle cx='85' cy='75' r='5' fill='#f59e0b'/>
    <path d='M30 55 V75 C30 85 70 85 70 75 V55' fill='none' stroke='white' strokeWidth='2'/>
    <circle cx='50' cy='45' r='5' fill='#fff'/>
  </svg>
);
