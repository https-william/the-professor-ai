
import React, { useState } from 'react';
import { ProfessorState } from '../types';
import { MermaidDiagram } from './MermaidDiagram';

interface ProfessorViewProps {
  state: ProfessorState;
  onExit: () => void;
  timeRemaining: number | null;
}

export const ProfessorView: React.FC<ProfessorViewProps> = ({ state, onExit }) => {
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const section = state.sections[currentSectionIdx];

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4">
       <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <span className="text-3xl">👨‍🏫</span>
             <h2 className="text-xl font-bold text-gray-200">The Professor</h2>
          </div>
          <button onClick={onExit} className="text-xs font-bold uppercase text-gray-400 hover:text-white">Exit Class</button>
       </div>

       <div className="h-1 w-full bg-white/10 rounded-full mb-8">
          <div className="h-full bg-amber-500 transition-all" style={{ width: `${((currentSectionIdx + 1) / state.sections.length) * 100}%` }}></div>
       </div>

       <div className="glass-panel rounded-3xl p-8 md:p-12 animate-slide-up-fade">
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-8">{section.title}</h1>
          
          <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed mb-8">
             {section.content}
          </div>

          {/* Mermaid Diagram Render */}
          {section.diagram_markdown && (
             <div className="mb-8">
                <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Visual Concept</h4>
                <MermaidDiagram chart={section.diagram_markdown} />
             </div>
          )}

          <div className="bg-amber-900/20 p-6 rounded-2xl border border-amber-500/20 mb-6">
             <h4 className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">Analogy</h4>
             <p className="text-amber-100 italic text-lg">"{section.analogy}"</p>
          </div>

          <div className="flex justify-between items-center mt-8">
             <button 
               onClick={() => setCurrentSectionIdx(Math.max(0, currentSectionIdx - 1))} 
               disabled={currentSectionIdx === 0} 
               className="text-gray-400 hover:text-white disabled:opacity-30"
             >
               ← Previous
             </button>
             <button 
               onClick={() => {
                 if (currentSectionIdx < state.sections.length - 1) setCurrentSectionIdx(currentSectionIdx + 1);
                 else onExit();
               }}
               className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-full font-bold uppercase shadow-lg"
             >
               {currentSectionIdx === state.sections.length - 1 ? 'Finish' : 'Next Concept'}
             </button>
          </div>
       </div>
    </div>
  );
};
