
import React from 'react';

interface RadarChartProps {
  stats: {
    memory: number;
    logic: number;
    speed: number;
    focus: number;
    stamina: number;
  };
}

export const RadarChart: React.FC<RadarChartProps> = ({ stats }) => {
  const size = 300;
  const center = size / 2;
  const radius = 100;
  
  // Normalize stats 0-100
  const keys = Object.keys(stats) as Array<keyof typeof stats>;
  const totalPoints = keys.length;
  const angleStep = (Math.PI * 2) / totalPoints;

  const getCoordinates = (value: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2; // Start from top
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return [x, y];
  };

  const points = keys.map((key, i) => getCoordinates(stats[key], i)).map(p => p.join(',')).join(' ');
  const fullPoints = keys.map((_, i) => getCoordinates(100, i)).map(p => p.join(',')).join(' ');

  return (
    <div className="relative w-full max-w-[300px] mx-auto aspect-square">
       <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">
          {/* Background Grid */}
          <polygon points={fullPoints} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />
          {keys.map((_, i) => {
             const [x, y] = getCoordinates(100, i);
             return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="rgba(255,255,255,0.1)" />;
          })}
          
          {/* Data Polygon */}
          <polygon points={points} fill="rgba(59, 130, 246, 0.4)" stroke="#3b82f6" strokeWidth="2" className="drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-fade-in" />
          
          {/* Labels */}
          {keys.map((key, i) => {
             const [x, y] = getCoordinates(120, i);
             return (
               <text 
                 key={key} 
                 x={x} 
                 y={y} 
                 textAnchor="middle" 
                 dominantBaseline="middle" 
                 fill="white" 
                 className="text-[10px] uppercase font-bold tracking-widest opacity-80"
               >
                 {key}
               </text>
             );
          })}
       </svg>
    </div>
  );
};
