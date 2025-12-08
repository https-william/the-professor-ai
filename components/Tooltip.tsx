import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      <div 
        className={`absolute z-50 px-3 py-2 text-xs font-medium text-white bg-gray-900 border border-gray-700 rounded-lg shadow-xl whitespace-nowrap transition-all duration-200 pointer-events-none ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } ${
          position === 'top' 
            ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' 
            : 'top-full left-1/2 -translate-x-1/2 mt-2'
        }`}
      >
        {content}
        {/* Arrow */}
        <div 
          className={`absolute w-2 h-2 bg-gray-900 border-gray-700 transform rotate-45 left-1/2 -translate-x-1/2 ${
            position === 'top' 
              ? 'bottom-[-5px] border-b border-r' 
              : 'top-[-5px] border-t border-l'
          }`}
        ></div>
      </div>
    </div>
  );
};