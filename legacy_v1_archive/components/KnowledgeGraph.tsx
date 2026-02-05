
import React from 'react';

interface KnowledgeGraphProps {
  topics: { id: number; title: string }[];
  currentId: number;
  onSelect: (id: number) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ topics, currentId, onSelect }) => {
  // Simple force-directed layout simulation for visual effect
  const centerX = 150;
  const centerY = 100;
  const radius = 60;

  return (
    <div className="w-full h-[200px] bg-[#0f0f11] rounded-2xl border border-white/5 relative overflow-hidden mb-6">
      <div className="absolute top-2 left-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Neural Lattice</div>
      
      <svg className="w-full h-full" viewBox="0 0 300 200">
        {/* Connections */}
        {topics.map((t, i) => {
           const angle = (i / topics.length) * Math.PI * 2;
           const x = centerX + Math.cos(angle) * radius;
           const y = centerY + Math.sin(angle) * radius;
           return (
             <line 
                key={`link-${i}`} 
                x1={centerX} 
                y1={centerY} 
                x2={x} 
                y2={y} 
                stroke={currentId === t.id ? "#f59e0b" : "#333"} 
                strokeWidth={currentId === t.id ? 2 : 1}
                className="transition-all duration-500"
             />
           );
        })}

        {/* Central Node (Core Concept) */}
        <circle cx={centerX} cy={centerY} r="8" fill="#333" stroke="#555" />

        {/* Topic Nodes */}
        {topics.map((t, i) => {
           const angle = (i / topics.length) * Math.PI * 2;
           const x = centerX + Math.cos(angle) * radius;
           const y = centerY + Math.sin(angle) * radius;
           const isActive = currentId === t.id;

           return (
             <g key={t.id} onClick={() => onSelect(t.id)} className="cursor-pointer hover:opacity-80 transition-opacity">
                <circle 
                  cx={x} 
                  cy={y} 
                  r={isActive ? 12 : 6} 
                  fill={isActive ? "#f59e0b" : "#1a1a1a"} 
                  stroke={isActive ? "#fbbf24" : "#555"}
                  strokeWidth="2"
                  className="transition-all duration-300"
                />
                {isActive && (
                  <text x={x} y={y + 24} textAnchor="middle" fill="white" fontSize="10" className="font-mono uppercase">
                    {t.title.length > 10 ? t.title.substring(0, 10) + '..' : t.title}
                  </text>
                )}
             </g>
           );
        })}
      </svg>
    </div>
  );
};
