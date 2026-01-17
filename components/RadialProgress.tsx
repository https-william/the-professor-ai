
import React from 'react';

interface RadialProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export const RadialProgress: React.FC<RadialProgressProps> = ({ 
  percentage, 
  size = 40, 
  strokeWidth = 3, 
  color = "text-accent" 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          className="text-gray-800"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${color} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className="absolute text-[8px] font-bold font-mono text-text-pri">{Math.round(percentage)}%</span>
    </div>
  );
};
